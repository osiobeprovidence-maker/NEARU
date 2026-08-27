import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Verification ledger + state machine.
//
// SECURITY MODEL:
// Critical state transitions (payment confirm, verification success/failure)
// MUST only be invoked from the serverless backend via CONVEX_DEPLOY_KEY.
// Each state-transition mutation requires a `serverSecret` argument that must
// match VERIFICATION_SERVER_SECRET (set in the Convex project env). Without it
// the mutation refuses to run, so a browser cannot fabricate state.
//
// The verificationStatus and paymentStatus are independent states. A payment
// success does NOT mean identity is verified.

function assertServerSecret(provided) {
  const expected = process.env.VERIFICATION_SERVER_SECRET || "";
  if (!expected) {
    throw new Error("VERIFICATION_SERVER_SECRET is not configured");
  }
  if (!provided || provided !== expected) {
    throw new Error("Unauthorized: invalid server secret");
  }
}

// ---------------------------------------------------------------------------
// Mutations (server-only via serverSecret)
// ---------------------------------------------------------------------------

export const createPaymentTransaction = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    provider: v.string(),
    amountKobo: v.number(),
    currency: v.string(),
    customerAmountKobo: v.number(),
    providerCostKobo: v.number(),
    grossMarginKobo: v.number(),
    paymentReference: v.string(),
    ninHash: v.optional(v.string()),
    pendingNin: v.optional(v.string()),
    verifiedFirstName: v.optional(v.string()),
    verifiedLastName: v.optional(v.string()),
    verifiedDob: v.optional(v.string()),
    serverSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);

    // Prevent duplicate verification transactions using the same payment ref.
    const existing = await ctx.db
      .query("verifications")
      .withIndex("by_payment_reference", (q) =>
        q.eq("paymentReference", args.paymentReference)
      )
      .unique();
    if (existing) {
      throw new Error("DUPLICATE_PAYMENT_REFERENCE");
    }

    const now = Date.now();
    return await ctx.db.insert("verifications", {
      userId: args.userId,
      type: args.type,
      provider: args.provider,
      amountKobo: args.amountKobo,
      currency: args.currency,
      customerAmountKobo: args.customerAmountKobo,
      providerCostKobo: args.providerCostKobo,
      grossMarginKobo: args.grossMarginKobo,
      paymentReference: args.paymentReference,
      paymentStatus: "CREATED",
      verificationStatus: "NOT_STARTED",
      ninHash: args.ninHash,
      pendingNin: args.pendingNin,
      verifiedFirstName: args.verifiedFirstName,
      verifiedLastName: args.verifiedLastName,
      verifiedDob: args.verifiedDob,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Called by the serverless layer once Paystack confirms the transaction is
// initialized (amount/currency enforced server-side before this point).
export const markPaymentPending = mutation({
  args: {
    paymentReference: v.string(),
    paystackReference: v.string(),
    serverSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);
    const tx = await ctx.db
      .query("verifications")
      .withIndex("by_payment_reference", (q) =>
        q.eq("paymentReference", args.paymentReference)
      )
      .unique();
    if (!tx) throw new Error("TRANSACTION_NOT_FOUND");
    if (
      tx.paymentStatus === "PAYMENT_SUCCESS" ||
      tx.paymentStatus === "PAYMENT_PENDING"
    ) {
      return tx; // idempotent
    }
    await ctx.db.patch(tx._id, {
      paymentStatus: "PAYMENT_PENDING",
      paystackReference: args.paystackReference,
      updatedAt: Date.now(),
    });
    return tx;
  },
});

// Authoritative payment confirmation (called only after webhook validation).
export const confirmPayment = mutation({
  args: { paymentReference: v.string(), serverSecret: v.string() },
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);
    const tx = await ctx.db
      .query("verifications")
      .withIndex("by_payment_reference", (q) =>
        q.eq("paymentReference", args.paymentReference)
      )
      .unique();
    if (!tx) throw new Error("TRANSACTION_NOT_FOUND");
    const now = Date.now();
    await ctx.db.patch(tx._id, {
      paymentStatus: "PAYMENT_SUCCESS",
      paidAt: tx.paidAt || now,
      updatedAt: now,
    });
    return tx;
  },
});

export const markPaymentFailed = mutation({
  args: { paymentReference: v.string(), failureReason: v.optional(v.string()), serverSecret: v.string() },
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);
    const tx = await ctx.db
      .query("verifications")
      .withIndex("by_payment_reference", (q) =>
        q.eq("paymentReference", args.paymentReference)
      )
      .unique();
    if (!tx) throw new Error("TRANSACTION_NOT_FOUND");
    if (tx.paymentStatus === "PAYMENT_SUCCESS") return tx;
    await ctx.db.patch(tx._id, {
      paymentStatus: "PAYMENT_FAILED",
      failureReason: args.failureReason,
      updatedAt: Date.now(),
    });
    return tx;
  },
});

export const startVerification = mutation({
  args: { txId: v.id("verifications"), serverSecret: v.string() },
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);
    const tx = await ctx.db.get(args.txId);
    if (!tx) throw new Error("TRANSACTION_NOT_FOUND");
    await ctx.db.patch(args.txId, {
      verificationStatus: "VERIFICATION_PENDING",
      updatedAt: Date.now(),
    });
    return tx;
  },
});

export const completeVerification = mutation({
  args: {
    txId: v.id("verifications"),
    ninjaReference: v.optional(v.string()),
    resultData: v.optional(v.any()),
    serverSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);
    const tx = await ctx.db.get(args.txId);
    if (!tx) throw new Error("TRANSACTION_NOT_FOUND");
    // Idempotent: never re-complete an already verified transaction.
    if (tx.verificationStatus === "VERIFIED") return tx;

    const now = Date.now();
    await ctx.db.patch(args.txId, {
      verificationStatus: "VERIFIED",
      ninjaReference: args.ninjaReference || tx.ninjaReference,
      resultData: args.resultData,
      pendingNin: undefined, // scrub raw NIN after verification
      verifiedAt: tx.verifiedAt || now,
      updatedAt: now,
    });

    // Mark the Convex user as verified with a badge.
    await ctx.db.patch(tx.userId, {
      isNINVerified: true,
      nin: undefined, // never store the raw NIN on the public user doc
      birthday: tx.verifiedDob || undefined,
    });
    const user = await ctx.db.get(tx.userId);
    if (user) {
      const badges = user.badges ?? [];
      if (!badges.includes("NIN Verified")) {
        await ctx.db.patch(tx.userId, { badges: [...badges, "NIN Verified"] });
      }
    }

    // Create a verification-notification for the user.
    try {
      await ctx.db.insert("notifications", {
        userId: tx.userId,
        type: "identity_verified",
        title: "Identity Verified",
        body: "Your National Identification Number has been verified.",
        read: false,
        createdAt: now,
      });
    } catch {}

    return tx;
  },
});

export const failVerification = mutation({
  args: {
    txId: v.id("verifications"),
    failureReason: v.optional(v.string()),
    providerError: v.optional(v.boolean()),
    serverSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertServerSecret(args.serverSecret);
    const tx = await ctx.db.get(args.txId);
    if (!tx) throw new Error("TRANSACTION_NOT_FOUND");
    if (
      tx.verificationStatus === "VERIFIED" ||
      tx.verificationStatus === "VERIFICATION_FAILED"
    ) {
      return tx;
    }
    await ctx.db.patch(args.txId, {
      verificationStatus: args.providerError
        ? "PROVIDER_ERROR"
        : "VERIFICATION_FAILED",
      failureReason: args.failureReason,
      pendingNin: undefined, // scrub raw NIN on failure too
      updatedAt: Date.now(),
    });
    return tx;
  },
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// A user's own verification transactions.
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("verifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

export const getById = query({
  args: { txId: v.id("verifications") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.txId);
  },
});

export const getByPaymentReference = query({
  args: { paymentReference: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("verifications")
      .withIndex("by_payment_reference", (q) =>
        q.eq("paymentReference", args.paymentReference)
      )
      .unique();
  },
});

// Admin: list all verification transactions.
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("verifications")
      .order("desc")
      .take(args.limit || 200);
  },
});

// Admin: aggregate financial reporting numbers.
export const adminReport = query({
  args: {},
  handler: async (ctx, args) => {
    const all = await ctx.db.query("verifications").collect();
    const paid = all.filter(
      (t) => t.paymentStatus === "PAYMENT_SUCCESS"
    );
    const verified = all.filter(
      (t) => t.verificationStatus === "VERIFIED"
    );
    const totalRevenue = paid.reduce((s, t) => s + t.customerAmountKobo, 0);
    const totalProviderCost = paid.reduce(
      (s, t) => s + (t.providerCostKobo || 0),
      0
    );
    return {
      totalTransactions: all.length,
      totalSuccessfulPayments: paid.length,
      totalSuccessfulVerifications: verified.length,
      failedVerifications: all.filter(
        (t) => t.verificationStatus === "VERIFICATION_FAILED"
      ).length,
      providerErrors: all.filter(
        (t) => t.verificationStatus === "PROVIDER_ERROR"
      ).length,
      totalRevenueKobo: totalRevenue,
      totalProviderCostKobo: totalProviderCost,
      grossMarginKobo: totalRevenue - totalProviderCost,
    };
  },
});
