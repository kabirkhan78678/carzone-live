/**
 * In-memory sliding-window rate limiter middleware
 * Prevents brute-force credential attacks and OTP flooding without external store dependencies
 */

import { handleError } from '../utils/responseHandler.js';

export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 10,                   // max requests per window
    message = 'Too many requests from this IP. Please try again later.',
    statusCode = 429
  } = options;

  const hits = new Map();

  // Periodic cleanup of expired window entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of hits.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < windowMs);
      if (validTimestamps.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, validTimestamps);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown-ip';

    const now = Date.now();
    const timestamps = hits.get(ip) || [];
    const validTimestamps = timestamps.filter(t => now - t < windowMs);

    if (validTimestamps.length >= max) {
      res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
      return handleError(res, statusCode, message, []);
    }

    validTimestamps.push(now);
    hits.set(ip, validTimestamps);
    next();
  };
};

// Rate limiter for authentication attempts (Login / Sign In / Password Reset)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // 100 attempts
  message: 'Too many authentication attempts. Please try again in 15 minutes.'
});

// Rate limiter for OTP Generation & Resend (prevents email/SMS spamming)
export const otpRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50,                  // 50 OTP requests
  message: 'Too many OTP requests. Please wait a few minutes before trying again.'
});

// Rate limiter for GET requests (prevents database flooding and rapid scraping)
export const getApiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 60 seconds (1 minute)
  max: 1000,           // 1000 GET requests per 60s per IP
  message: 'Too many GET requests. Please wait a moment before trying again.'
});
