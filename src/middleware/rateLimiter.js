import redisClient from "../configs/redis.js"; 

export const createCustomLimiter = ({ prefix, windowSize, maxRequests, message, skipAdmin = false }) => {
  return async (req, res, next) => {
    try {
      //  God Mode Bypass: Admins skip the line
      if (skipAdmin && req.session?.user?.role === 'admin') {
        return next();
      }

      const ip = req.ip;
      // Use a prefix so login limits don't overlap with URL creation limits
      const key = `rate:${prefix}:${ip}`; 

      const requests = await redisClient.incr(key);
    
      if (requests === 1) {
        await redisClient.expire(key, windowSize);
      }

      // 🚀 Pro-Tip: Injecting standard headers makes your API professional
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requests));

      if (requests > maxRequests) {
        return res.status(429).json({
          success: false,
          message: message || "System Override: Too many requests."
        });
      }

      next();
    } catch (error) {
      console.error("Redis Limiter Error:", error);
      // If Redis fails, we let the request through (Fail-Open) so the app doesn't crash
      next(); 
    }
  };
};

// 1. URL Creation Limiter (10 per minute)
export const urlLimiter = createCustomLimiter({
    prefix: 'shorten',
    windowSize: 60, // 60 seconds
    maxRequests: 10,
    message: "Network flooded. Please wait 60 seconds before generating new links.",
    skipAdmin: true // Admin can spam links
});

// 2. Login Limiter (5 per 15 minutes)
export const loginLimiter = createCustomLimiter({
    prefix: 'login',
    windowSize: 15 * 60, // 15 minutes in seconds
    maxRequests: 5,
    message: "Security Breach Detected: Too many login attempts. Node locked.",
    skipAdmin: false // Don't bypass login limits!
});