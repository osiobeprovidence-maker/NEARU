// Consolidated GET/POST /api/admin/* router.
//
// Replaces the individual api/admin/* serverless functions with a single
// catch-all so the deployment stays within the Hobby plan's serverless
// function limit. Paths are identical to the previous routes; the Admin frontend
// is unchanged.

import { adminContext } from "../_lib/adminAuth.js";
import { callConvexQuery, callConvexMutation } from "../_lib/convexClient.js";
import { requireSuperAdmin } from "../_lib/auth.js";
import { serverSecret } from "../_lib/config.js";
import { ok, sendError } from "../_lib/errors.js";

const STATUS_MAP = { activate: "ACTIVE", suspend: "SUSPENDED", ban: "BANNED" };
const ALLOWED_ROLES = ["admin", "moderator", "user"];
const MODERATION_ACTIONS = ["APPROVE", "HIDE", "REMOVE", "FLAG"];
const REPORT_ACTIONS = ["resolve", "dismiss", "escalate", "assign", "note"];
const AUDIENCES = ["ALL", "VERIFIED", "PLUS", "SPECIFIC"];

function methodNotAllowed(req, res) {
  return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
}

function notFound(res) {
  return res.status(404).json({ error: "Not found", code: "NOT_FOUND" });
}

function maskNin(ninHash) {
  if (!ninHash) return null;
  return `nin:${ninHash.slice(0, 10)}…`;
}

function sanitizeVerification(tx) {
  return {
    transactionId: tx._id,
    userId: tx.userId,
    type: tx.type,
    provider: tx.provider,
    amount: tx.customerAmountKobo,
    currency: tx.currency,
    paymentStatus: tx.paymentStatus,
    verificationStatus: tx.verificationStatus,
    paymentReference: tx.paymentReference,
    paystackReference: tx.paystackReference || null,
    ninjaReference: tx.ninjaReference || null,
    ninHashMasked: maskNin(tx.ninHash),
    failureReason: tx.failureReason || null,
    createdAt: tx.createdAt,
    paidAt: tx.paidAt || null,
    verifiedAt: tx.verifiedAt || null,
  };
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const segments = url.pathname.split("/").filter(Boolean); // ["api", "admin", ...]
    const rest = segments.slice(2);
    const [head, id, sub] = rest;
    const q = url.searchParams;
    const method = req.method;

    // -------- GET /api/admin/stats --------
    if (head === "stats" && method === "GET") {
      const stats = await callConvexQuery("admin:getDashboardStats", await adminContext(req));
      return ok(res, { stats });
    }

    // -------- GET /api/admin/analytics --------
    if (head === "analytics" && method === "GET") {
      const analytics = await callConvexQuery("admin:getAnalytics", await adminContext(req));
      return ok(res, { analytics });
    }

    // -------- GET /api/admin/audit --------
    if (head === "audit" && method === "GET") {
      const ctx = await adminContext(req);
      const logs = await callConvexQuery("admin:listAuditLogs", {
        ...ctx,
        limit: Number(q.get("limit")) || 100,
      });
      return ok(res, { logs });
    }

    // -------- GET/POST /api/admin/settings --------
    if (head === "settings") {
      const ctx = await adminContext(req);
      if (method === "GET") {
        const settings = await callConvexQuery("admin:getSystemSettings", ctx);
        return ok(res, { settings });
      }
      if (method === "POST") {
        const body = req.body || {};
        const allowed = [
          "platformName",
          "defaultRadiusKm",
          "supportedCities",
          "autoApproveRallies",
          "requireEmailVerification",
          "autoVerifyPhone",
          "maintenanceMode",
        ];
        const args = { ...ctx };
        for (const key of allowed) {
          if (body[key] !== undefined) args[key] = body[key];
        }
        const result = await callConvexMutation("admin:updateSystemSettings", args);
        return ok(res, result);
      }
      return methodNotAllowed(req, res);
    }

    // -------- /api/admin/users* --------
    if (head === "users") {
      const ctx = await adminContext(req);
      if (method === "GET" && !id) {
        const args = { ...ctx, limit: Number(q.get("limit")) || 200 };
        if (q.get("q")) args.query = String(q.get("q"));
        if (q.get("status")) args.status = String(q.get("status"));
        if (q.get("accountType")) args.accountType = String(q.get("accountType"));
        const users = await callConvexQuery("admin:listUsers", args);
        return ok(res, { users });
      }
      if (method === "GET" && id && sub === "detail") {
        const user = await callConvexQuery("admin:getUserDetail", {
          ...ctx,
          userId: id,
        });
        if (!user) return notFound(res);
        return ok(res, { user });
      }
      if (method === "POST" && id && sub === "status") {
        const { action, reason } = req.body || {};
        const status = STATUS_MAP[action];
        if (!status) {
          return res.status(400).json({ error: "Invalid action", code: "VALIDATION_ERROR" });
        }
        const result = await callConvexMutation("admin:setUserStatus", {
          ...ctx,
          userId: id,
          status,
          reason: reason || undefined,
        });
        return ok(res, result);
      }
      if (method === "POST" && id && sub === "role") {
        const { role } = req.body || {};
        if (!ALLOWED_ROLES.includes(role)) {
          return res.status(400).json({ error: "Invalid role", code: "VALIDATION_ERROR" });
        }
        const result = await callConvexMutation("admin:setUserRole", {
          ...ctx,
          userId: id,
          role,
        });
        return ok(res, result);
      }
      return notFound(res);
    }

    // -------- /api/admin/rallies* --------
    if (head === "rallies") {
      const ctx = await adminContext(req);
      if (method === "GET" && !id) {
        const args = { ...ctx, limit: Number(q.get("limit")) || 200 };
        if (q.get("q")) args.query = String(q.get("q"));
        if (q.get("status")) args.status = String(q.get("status"));
        if (q.get("type")) args.type = String(q.get("type"));
        const rallies = await callConvexQuery("admin:listRallies", args);
        return ok(res, { rallies });
      }
      if (method === "POST" && id && sub === "moderation") {
        const { action, reason } = req.body || {};
        if (!MODERATION_ACTIONS.includes(action)) {
          return res.status(400).json({ error: "Invalid action", code: "VALIDATION_ERROR" });
        }
        const result = await callConvexMutation("admin:setRallyModeration", {
          ...ctx,
          rallyId: id,
          action,
          reason: reason || undefined,
        });
        return ok(res, result);
      }
      return notFound(res);
    }

    // -------- /api/admin/reports* --------
    if (head === "reports") {
      const ctx = await adminContext(req);
      if (method === "GET" && !id) {
        const args = { ...ctx, limit: Number(q.get("limit")) || 200 };
        if (q.get("status")) args.status = String(q.get("status"));
        const reports = await callConvexQuery("admin:listReports", args);
        return ok(res, { reports });
      }
      if (method === "POST" && id && sub === "act") {
        const { action, assigneeId, note } = req.body || {};
        if (!REPORT_ACTIONS.includes(action)) {
          return res.status(400).json({ error: "Invalid action", code: "VALIDATION_ERROR" });
        }
        const result = await callConvexMutation("admin:actOnReport", {
          ...ctx,
          reportId: id,
          action,
          assigneeId: assigneeId || undefined,
          note: note || undefined,
        });
        return ok(res, result);
      }
      return notFound(res);
    }

    // -------- /api/admin/notifications* --------
    if (head === "notifications") {
      const ctx = await adminContext(req);
      if (method === "GET" && !id) {
        const broadcasts = await callConvexQuery("admin:listBroadcasts", {
          ...ctx,
          limit: Number(q.get("limit")) || 100,
        });
        return ok(res, { broadcasts });
      }
      if (method === "GET" && id === "audience-counts") {
        const counts = await callConvexQuery("admin:getAudienceCounts", ctx);
        return ok(res, { counts });
      }
      if (method === "POST" && id === "broadcast") {
        const body = req.body || {};
        const audience = (body.audience || "ALL").toUpperCase();
        if (!AUDIENCES.includes(audience)) {
          return res.status(400).json({ error: "Invalid audience", code: "VALIDATION_ERROR" });
        }
        const result = await callConvexMutation("admin:sendBroadcast", {
          ...ctx,
          title: String(body.title || ""),
          body: String(body.body || ""),
          type: body.type || undefined,
          audience,
          targetUserIds:
            audience === "SPECIFIC" && Array.isArray(body.targetUserIds)
              ? body.targetUserIds
              : undefined,
        });
        return ok(res, result);
      }
      return notFound(res);
    }

    // -------- /api/admin/verifications* --------
    if (head === "verifications") {
      if (method !== "GET") return methodNotAllowed(req, res);
      const { convexUser } = await requireSuperAdmin(req);
      if (id === "report") {
        const report = await callConvexQuery("verifications:adminReport", {
          requestingAdminId: convexUser._id,
          serverSecret: serverSecret(),
        });
        return ok(res, {
          report: {
            totalTransactions: report.totalTransactions,
            totalSuccessfulPayments: report.totalSuccessfulPayments,
            totalSuccessfulVerifications: report.totalSuccessfulVerifications,
            failedVerifications: report.failedVerifications,
            providerErrors: report.providerErrors,
            totalRevenue: report.totalRevenueKobo / 100,
            totalProviderCost: report.totalProviderCostKobo / 100,
            grossMargin: report.grossMarginKobo / 100,
            unit: "NGN",
            note: "Gross margin is not net profit (payments fees, refunds, taxes and operational costs may apply).",
          },
        });
      }
      if (!id) {
        const limit = Number(q.get("limit")) || 200;
        const list = await callConvexQuery("verifications:listAll", {
          limit,
          requestingAdminId: convexUser._id,
          serverSecret: serverSecret(),
        });
        return ok(res, { verifications: (list || []).map(sanitizeVerification) });
      }
      return notFound(res);
    }

    return notFound(res);
  } catch (err) {
    return sendError(res, err);
  }
}