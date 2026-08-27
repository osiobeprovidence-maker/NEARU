// Centralized error handling for RALLY API routes.
// Differentiates high-level error categories and never leaks stack traces to clients.

export class ApiError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "ApiError";
  }
}

export const ERRORS = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  PAYMENT_ERROR: "PAYMENT_ERROR",
  PAYMENT_NOT_CONFIRMED: "PAYMENT_NOT_CONFIRMED",
  WEBHOOK_ERROR: "WEBHOOK_ERROR",
  NIN_VERIFICATION_FAILED: "NIN_VERIFICATION_FAILED",
  NIN_PROVIDER_ERROR: "NIN_PROVIDER_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  DUPLICATE_REQUEST: "DUPLICATE_REQUEST",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
};

export function validationError(message) {
  return new ApiError(ERRORS.VALIDATION_ERROR, message, 400);
}

export function authError(message = "Authentication required") {
  return new ApiError(ERRORS.AUTHENTICATION_ERROR, message, 401);
}

export function notFound(message = "Not found") {
  return new ApiError("NOT_FOUND", message, 404);
}

/**
 * Send a safe, client-facing error response.
 * Logs full diagnostics server-side but only returns a clean message + code.
 */
export function sendError(res, err) {
  const code = err.code || ERRORS.INTERNAL_ERROR;
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[api:error] ${code}`, err.message, err.stack);
  } else {
    console.warn(`[api:error] ${code}`, err.message);
  }

  // Sanitized message for the client. Full details stay server-side.
  let message = err.message || "Something went wrong. Please try again.";
  if (statusCode >= 500) {
    message = "Something went wrong on our end. Please try again.";
  }

  return res.status(statusCode).json({ error: message, code });
}

export function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}
