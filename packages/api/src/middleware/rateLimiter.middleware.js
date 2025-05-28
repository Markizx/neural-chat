const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getRedisClient } = require('../config/redis');
const { apiResponse } = require('../utils/apiResponse');

// Функция для создания store (Redis или memory)
const createStore = (prefix) => {
  const redisClient = getRedisClient();
  
  if (redisClient && process.env.DISABLE_REDIS !== 'true') {
    try {
      return new RedisStore({
        client: redisClient,
        prefix: prefix
      });
    } catch (error) {
      console.warn(`Failed to create Redis store for ${prefix}, using memory store:`, error.message);
      return undefined; // Используем memory store по умолчанию
    }
  }
  
  // Возвращаем undefined для использования memory store
  return undefined;
};

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
  store: createStore('rl:default:')
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
  store: createStore('rl:auth:')
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
  store: createStore('rl:api:')
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
  store: createStore('rl:message:')
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
  store: createStore('rl:upload:')
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
    store: createStore(`rl:${userPlan}:`)
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