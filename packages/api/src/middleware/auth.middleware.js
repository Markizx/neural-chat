const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { apiResponse } = require('../utils/apiResponse');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'NO_TOKEN',
        message: 'No authentication token provided'
      }));
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found'
      }));
    }

    if (user.status !== 'active') {
      return res.status(403).json(apiResponse(false, null, {
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is not active'
      }));
    }

    // Reset daily usage if needed
    user.resetDailyUsage();
    await user.save();

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json(apiResponse(false, null, {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }));
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(apiResponse(false, null, {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      }));
    }
    
    next(error);
  }
};

// Check if user has required role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }));
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json(apiResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      }));
    }

    next();
  };
};

// Check subscription plan
exports.requireSubscription = (...plans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }));
    }

    if (!plans.includes(req.user.subscription.plan)) {
      return res.status(403).json(apiResponse(false, null, {
        code: 'SUBSCRIPTION_REQUIRED',
        message: `This feature requires ${plans.join(' or ')} subscription`
      }));
    }

    if (req.user.subscription.status !== 'active' && req.user.subscription.status !== 'trialing') {
      return res.status(403).json(apiResponse(false, null, {
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'Your subscription is not active'
      }));
    }

    next();
  };
};

// Check usage limits
exports.checkUsageLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json(apiResponse(false, null, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }));
    }

    if (!req.user.canSendMessage()) {
      return res.status(429).json(apiResponse(false, null, {
        code: 'USAGE_LIMIT_EXCEEDED',
        message: 'Daily message limit exceeded',
        details: {
          limit: req.user.subscription.plan === 'free' ? 10 : 100,
          used: req.user.usage.dailyMessages,
          resetAt: new Date(req.user.usage.resetDate).setHours(24, 0, 0, 0)
        }
      }));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (doesn't fail if no token)
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.status === 'active') {
        req.user = user;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Alias for authenticate (for compatibility)
exports.authenticateToken = exports.authenticate;

// Require admin role
exports.requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(apiResponse(false, null, {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }));
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json(apiResponse(false, null, {
      code: 'FORBIDDEN',
      message: 'Admin access required'
    }));
  }

  next();
};