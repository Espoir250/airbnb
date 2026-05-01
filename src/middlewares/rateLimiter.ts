import rateLimit from "express-rate-limit";

/**
 * General rate limiter: 100 requests per 15 minutes
 * Applied to all routes
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests
  message: {
    error: "Too many requests",
    message: "You have exceeded the 100 requests per 15 minutes limit.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter: 20 requests per 15 minutes
 * Applied to all POST routes
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests
  message: {
    error: "Too many requests",
    message:
      "You have exceeded the 20 requests per 15 minutes limit for POST operations.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default { generalRateLimiter, strictRateLimiter };
