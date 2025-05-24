const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Too many retries');
          }
          // Reconnect after
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis Client Reconnecting');
    });

    await redisClient.connect();

    // Test the connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

// Cache utilities
const cache = {
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  set: async (key, value, expireSeconds = 3600) => {
    try {
      await redisClient.setEx(
        key,
        expireSeconds,
        JSON.stringify(value)
      );
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  },

  del: async (key) => {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis delete error:', error);
      return false;
    }
  },

  exists: async (key) => {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  },

  expire: async (key, seconds) => {
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', error);
      return false;
    }
  },

  // Pattern operations
  keys: async (pattern) => {
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      return [];
    }
  },

  // Clear cache by pattern
  clearPattern: async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.error('Redis clear pattern error:', error);
      return 0;
    }
  },

  // Increment
  incr: async (key) => {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error('Redis incr error:', error);
      return null;
    }
  },

  // Hash operations
  hSet: async (key, field, value) => {
    try {
      await redisClient.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis hSet error:', error);
      return false;
    }
  },

  hGet: async (key, field) => {
    try {
      const value = await redisClient.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis hGet error:', error);
      return null;
    }
  },

  hGetAll: async (key) => {
    try {
      const data = await redisClient.hGetAll(key);
      const result = {};
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error('Redis hGetAll error:', error);
      return {};
    }
  },

  // List operations
  lPush: async (key, value) => {
    try {
      await redisClient.lPush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis lPush error:', error);
      return false;
    }
  },

  lRange: async (key, start, stop) => {
    try {
      const values = await redisClient.lRange(key, start, stop);
      return values.map(v => JSON.parse(v));
    } catch (error) {
      logger.error('Redis lRange error:', error);
      return [];
    }
  }
};

module.exports = { 
  connectRedis, 
  getRedisClient,
  cache 
};