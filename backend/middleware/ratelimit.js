import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter: 20 requests per minute per IP
const rateLimiter = new RateLimiterMemory({
  points: 20, // Number of requests
  duration: 60, // Per 60 seconds (1 minute)
  blockDuration: 300 // Block for 5 minutes if exceeded
});

export async function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  try {
    await rateLimiter.consume(ip);
    next();
  } catch (rejRes) {
    const retrySecs = Math.round(rejRes.msBeforeNext / 1000) || 300;

    res.set('Retry-After', String(retrySecs));
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: retrySecs
    });
  }
}

export default rateLimitMiddleware;
