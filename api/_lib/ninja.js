// NinjaVerificationService — the single module that talks to Ninja.
// Encapsulates authentication, request construction, timeout handling,
// HTTP/Ninja error normalization, response validation and retries.
// No other part of the app calls Ninja directly.
//
// Provider mode is switched via NINJA_ENV = "sandbox" | "production".

import { ApiError, ERRORS } from "./errors.js";

const NINJA_BASE = "https://api.ninja.boucloud.io";
const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 2; // retries on transient failures only

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isTransient(err) {
  if (err.type === "network-error" || err.type === "timeout") return true;
  if (typeof err.status === "number" && err.status >= 500 && err.status < 600)
    return true;
  return false;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === "AbortError") {
      const e = new Error("Ninja request timed out");
      e.type = "timeout";
      throw e;
    }
    const e = new Error("Ninja network error");
    e.type = "network-error";
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export class NinjaVerificationService {
  /**
   * @param {string} mode "sandbox" | "production" (from NINJA_ENV)
   */
  constructor(mode) {
    this.env = mode === "production" ? "production" : "sandbox";
    this.clientKey = process.env.NINJA_CLIENT_KEY || "";
    this.clientSecret = process.env.NINJA_CLIENT_SECRET || "";
  }

  get isConfigured() {
    return Boolean(this.clientKey && this.clientSecret);
  }

  async authenticate() {
    const res = await fetchWithTimeout(
      `${NINJA_BASE}/auth/session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          sandbox: this.env === "sandbox",
        }),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error("Ninja authentication failed");
      err.status = res.status;
      err.detail = text;
      throw err;
    }

    const body = await res.json().catch(() => ({}));
    if (!body.token) {
      const err = new Error("Ninja authentication returned no token");
      err.type = "malformed";
      throw err;
    }
    return body.token;
  }

  /**
   * Verify a NIN. Returns a normalized result:
   *   { verified, status, score, recommendation, data }
   * Throws ApiError(NIN_PROVIDER_ERROR) on provider/system failures.
   * Throws ApiError(NIN_VERIFICATION_FAILED) on a legitimate non-match.
   */
  async verify({ nin, firstName, lastName, dateOfBirth }) {
    if (!this.isConfigured) {
      const err = new ApiError(
        ERRORS.NIN_PROVIDER_ERROR,
        "Verification service not configured",
        503
      );
      throw err;
    }

    let token;
    try {
      token = await this.authenticate();
    } catch (err) {
      if (isTransient(err)) {
        throw this._retryAuth();
      }
      throw this._providerError("Failed to authenticate with verification provider.", err);
    }

    let attempt = 0;
    while (true) {
      attempt++;
      try {
        const identifyRes = await fetchWithTimeout(
          `${NINJA_BASE}/api/identity/identify`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              idType: "nin",
              mode: "verify",
              idNumber: nin,
              firstName,
              lastName,
              ...(dateOfBirth ? { dateOfBirth } : {}),
            }),
          },
          REQUEST_TIMEOUT_MS
        );

        if (identifyRes.status === 429) {
          // Rate limited — treat as transient, retry with backoff.
          await sleep(500 * attempt);
          continue;
        }

        if (identifyRes.status >= 500) {
          if (this._shouldRetry(attempt)) {
            await sleep(400 * attempt);
            continue;
          }
          throw this._providerError("Verification provider error.", {
            status: identifyRes.status,
          });
        }

        const body = await identifyRes.json().catch(() => null);
        if (!body) {
          throw this._providerError("Verification provider returned a malformed response.", {
            status: identifyRes.status,
          });
        }

        if (identifyRes.status >= 400 && identifyRes.status < 500) {
          // 4xx (other than rate limit) is a permanent request/validation failure.
          throw new ApiError(
            ERRORS.NIN_VERIFICATION_FAILED,
            "Identity verification failed.",
            422
          );
        }

        const verified = body.verified === true;
        const normalized = {
          verified,
          status: body.status || (verified ? "success" : "failed"),
          score: body.score ?? null,
          recommendation: body.recommendation ?? null,
          data: body.data ?? null,
          ninjaReference: body.id ?? null,
        };

        if (!verified) {
          throw new ApiError(
            ERRORS.NIN_VERIFICATION_FAILED,
            "Identity verification unsuccessful.",
            422
          );
        }

        return normalized;
      } catch (err) {
        if (err instanceof ApiError) throw err;
        if (isTransient(err) && this._shouldRetry(attempt)) {
          await sleep(400 * attempt);
          continue;
        }
        throw this._providerError("Verification temporarily unavailable.", err);
      }
    }
  }

  _shouldRetry(attempt) {
    return attempt < MAX_RETRIES;
  }

  async _retryAuth() {
    // Retry authentication once with backoff, then surface a provider error.
    try {
      await sleep(300);
      const inner = new NinjaVerificationService(this.env);
      return await inner.authenticate();
    } catch {
      throw this._providerError("Verification provider temporarily unavailable.");
    }
  }

  _providerError(message, cause) {
    const err = new ApiError(ERRORS.NIN_PROVIDER_ERROR, message, 503);
    if (cause) err.cause = cause;
    return err;
  }
}

/**
 * Create the provider configured by the environment (NINJA_ENV).
 * Sandbox is the default so test traffic never hits the live registry.
 */
export function getNinVerificationProvider() {
  return new NinjaVerificationService(process.env.NINJA_ENV || "sandbox");
}
