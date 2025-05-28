const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    // Проверяем, нужен ли Redis (для локальной разработки можно отключить)
    if (process.env.DISABLE_REDIS === 'true') {
      logger.info('Redis disabled for local development');
      return null;
    }

    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000, // Уменьшаем таймаут
        reconnectStrategy: (retries) => {
          if (retries > 3) { // Уменьшаем количество попыток
            logger.warn('Redis reconnection failed after 3 attempts, continuing without Redis');
            return false; // Прекращаем попытки
          }
          return Math.min(retries * 100, 1000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.warn('Redis Client Error (continuing without Redis):', err.message);
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
    logger.info('Redis connection successful');
    
    return redisClient;
  } catch (error) {
    logger.warn('Redis connection failed, continuing without Redis:', error.message);
    redisClient = null;
    return null; // Возвращаем null вместо выброса ошибки
  }
};

const getRedisClient = () => {
  return redisClient; // Может быть null, что нормально
};

// Cache utilities с проверкой наличия Redis
const cache = {
  get: async (key) => {
    if (!redisClient) return null;
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  set: async (key, value, expireSeconds = 3600) => {
    if (!redisClient) return false;
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
    if (!redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis delete error:', error);
      return false;
    }
  },

  exists: async (key) => {
    if (!redisClient) return false;
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  },

  expire: async (key, seconds) => {
    if (!redisClient) return false;
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
    if (!redisClient) return [];
    try {
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error('Redis keys error:', error);
      return [];
    }
  },

  // Clear cache by pattern
  clearPattern: async (pattern) => {
    if (!redisClient) return 0;
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
    if (!redisClient) return null;
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error('Redis incr error:', error);
      return null;
    }
  },

  // Hash operations
  hSet: async (key, field, value) => {
    if (!redisClient) return false;
    try {
      await redisClient.hSet(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis hSet error:', error);
      return false;
    }
  },

  hGet: async (key, field) => {
    if (!redisClient) return null;
    try {
      const value = await redisClient.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis hGet error:', error);
      return null;
    }
  },

  hGetAll: async (key) => {
    if (!redisClient) return {};
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
    if (!redisClient) return false;
    try {
      await redisClient.lPush(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis lPush error:', error);
      return false;
    }
  },

  lRange: async (key, start, stop) => {
    if (!redisClient) return [];
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