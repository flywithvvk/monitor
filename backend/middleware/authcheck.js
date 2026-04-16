import dotenv from 'dotenv';
import { isKnownSafeIP } from '../utils/threatscore.js';

dotenv.config();

/**
 * Verify request authenticity
 * Checks internal token for API-to-API calls
 * Allows known safe IPs to bypass certain checks
 */
export function authCheckMiddleware(req, res, next) {
  const internalToken = req.headers['x-internal-token'];
  const expectedToken = process.env.INTERNAL_TOKEN;

  // If internal token matches, allow through
  if (expectedToken && internalToken === expectedToken) {
    req.isInternal = true;
    return next();
  }

  // Check if IP is in known safe list
  const ip = req.ip || req.connection?.remoteAddress;
  if (ip && isKnownSafeIP(ip)) {
    req.isKnownSafe = true;
  }

  next();
}

/**
 * Require internal token for sensitive endpoints
 */
export function requireInternalToken(req, res, next) {
  if (req.isInternal) {
    return next();
  }

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Internal token required'
  });
}

export default {
  authCheckMiddleware,
  requireInternalToken
};
