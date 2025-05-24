const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');
const { apiResponse } = require('../utils/apiResponse');

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Connect to Redis
(async () => {
  await redisClient.connect();
})();

// Default rate limiter
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  handler: (req, res) => {
    res.status(429).json(
      apiResponse(false, null, {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      })
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:default:'
  })
});

// Auth rate limiter (stricter for auth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json(
      apiResponse(false, null, {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later'
      })
    );
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  })
});

// API rate limiter (for authenticated users)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each user to 60 requests per minute
  keyGenerator: (req) => {
    // Use user ID instead of IP for authenticated requests
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res) => {
    res.status(429).json(
      apiResponse(false, null, {
        code: 'API_RATE_LIMIT_EXCEEDED',
        message: 'API rate limit exceeded, please slow down'
      })
    );
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:'
  })
});

// Message rate limiter (for AI messages)
const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 messages per minute
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res) => {
    res.status(429).json(
      apiResponse(false, null, {
        code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
        message: 'Message rate limit exceeded, please wait before sending more messages'
      })
    );
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:message:'
  })
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each user to 50 uploads per hour
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  handler: (req, res) => {
    res.status(429).json(
      apiResponse(false, null, {
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        message: 'Upload rate limit exceeded, please try again later'
      })
    );
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:upload:'
  })
});

// Dynamic rate limiter based on user subscription
const dynamicLimiter = (req, res, next) => {
  if (!req.user) {
    return defaultLimiter(req, res, next);
  }

  const limits = {
    free: { windowMs: 60000, max: 30 },
    pro: { windowMs: 60000, max: 100 },
    business: { windowMs: 60000, max: 300 }
  };

  const userPlan = req.user.subscription.plan || 'free';
  const limit = limits[userPlan];

  const limiter = rateLimit({
    windowMs: limit.windowMs,
    max: limit.max,
    keyGenerator: (req) => req.user._id.toString(),
    handler: (req, res) => {
      res.status(429).json(
        apiResponse(false, null, {
          code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded for ${userPlan} plan. Upgrade for higher limits.`
        })
      );
    },
    store: new RedisStore({
      client: redisClient,
      prefix: `rl:${userPlan}:`
    })
  });

  limiter(req, res, next);
};

module.exports = {
  defaultLimiter,
  authLimiter,
  apiLimiter,
  messageLimiter,
  uploadLimiter,
  dynamicLimiter
};