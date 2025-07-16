// utils/cacheUtils.js
const redis = require('redis');
const { promisify } = require('util');

// Create Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Promisify Redis methods
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);
const existsAsync = promisify(redisClient.exists).bind(redisClient);
const keysAsync = promisify(redisClient.keys).bind(redisClient);
const ttlAsync = promisify(redisClient.ttl).bind(redisClient);
const expireAsync = promisify(redisClient.expire).bind(redisClient);
const incrAsync = promisify(redisClient.incr).bind(redisClient);
const decrAsync = promisify(redisClient.decr).bind(redisClient);
const hgetAsync = promisify(redisClient.hget).bind(redisClient);
const hsetAsync = promisify(redisClient.hset).bind(redisClient);
const hgetallAsync = promisify(redisClient.hgetall).bind(redisClient);
const hdelAsync = promisify(redisClient.hdel).bind(redisClient);
const saddAsync = promisify(redisClient.sadd).bind(redisClient);
const smembersAsync = promisify(redisClient.smembers).bind(redisClient);
const sremAsync = promisify(redisClient.srem).bind(redisClient);

// In-memory cache for fallback
const memoryCache = new Map();

const cacheUtils = {
  // Set cache with expiration
  set: async (key, value, ttl = 3600) => {
    try {
      const serialized = JSON.stringify(value);
      
      if (redisClient.connected) {
        await setAsync(key, serialized, 'EX', ttl);
      } else {
        // Fallback to memory cache
        memoryCache.set(key, {
          value: serialized,
          expires: Date.now() + (ttl * 1000)
        });
      }
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  // Get from cache
  get: async (key) => {
    try {
      let cached;
      
      if (redisClient.connected) {
        cached = await getAsync(key);
      } else {
        // Fallback to memory cache
        const memCached = memoryCache.get(key);
        if (memCached && memCached.expires > Date.now()) {
          cached = memCached.value;
        } else {
          memoryCache.delete(key);
        }
      }
      
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  // Delete from cache
  delete: async (key) => {
    try {
      if (redisClient.connected) {
        await delAsync(key);
      } else {
        memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      if (redisClient.connected) {
        return await existsAsync(key) === 1;
      } else {
        const memCached = memoryCache.get(key);
        return memCached && memCached.expires > Date.now();
      }
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },

  // Get all keys matching pattern
  keys: async (pattern) => {
    try {
      if (redisClient.connected) {
        return await keysAsync(pattern);
      } else {
        const keys = [];
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const [key, value] of memoryCache) {
          if (regex.test(key) && value.expires > Date.now()) {
            keys.push(key);
          }
        }
        return keys;
      }
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  },

  // Clear cache by pattern
  clearPattern: async (pattern) => {
    try {
      const keys = await cacheUtils.keys(pattern);
      if (keys.length > 0) {
        if (redisClient.connected) {
          await Promise.all(keys.map(key => delAsync(key)));
        } else {
          keys.forEach(key => memoryCache.delete(key));
        }
      }
      return true;
    } catch (error) {
      console.error('Cache clear pattern error:', error);
      return false;
    }
  },

  // Get remaining TTL
  ttl: async (key) => {
    try {
      if (redisClient.connected) {
        return await ttlAsync(key);
      } else {
        const memCached = memoryCache.get(key);
        if (memCached && memCached.expires > Date.now()) {
          return Math.floor((memCached.expires - Date.now()) / 1000);
        }
        return -1;
      }
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  },

  // Extend expiration
  expire: async (key, ttl) => {
    try {
      if (redisClient.connected) {
        return await expireAsync(key, ttl) === 1;
      } else {
        const memCached = memoryCache.get(key);
        if (memCached) {
          memCached.expires = Date.now() + (ttl * 1000);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  },

  // Increment counter
  increment: async (key, by = 1) => {
    try {
      if (redisClient.connected) {
        return await incrAsync(key);
      } else {
        const current = await cacheUtils.get(key) || 0;
        const newValue = current + by;
        await cacheUtils.set(key, newValue);
        return newValue;
      }
    } catch (error) {
      console.error('Cache increment error:', error);
      return null;
    }
  },

  // Decrement counter
  decrement: async (key, by = 1) => {
    try {
      if (redisClient.connected) {
        return await decrAsync(key);
      } else {
        const current = await cacheUtils.get(key) || 0;
        const newValue = current - by;
        await cacheUtils.set(key, newValue);
        return newValue;
      }
    } catch (error) {
      console.error('Cache decrement error:', error);
      return null;
    }
  },

  // Hash operations
  hash: {
    set: async (key, field, value) => {
      try {
        if (redisClient.connected) {
          await hsetAsync(key, field, JSON.stringify(value));
        } else {
          const hash = memoryCache.get(key) || { value: {} };
          hash.value[field] = value;
          memoryCache.set(key, hash);
        }
        return true;
      } catch (error) {
        console.error('Cache hash set error:', error);
        return false;
      }
    },

    get: async (key, field) => {
      try {
        if (redisClient.connected) {
          const value = await hgetAsync(key, field);
          return value ? JSON.parse(value) : null;
        } else {
          const hash = memoryCache.get(key);
          return hash && hash.value[field] ? hash.value[field] : null;
        }
      } catch (error) {
        console.error('Cache hash get error:', error);
        return null;
      }
    },

    getAll: async (key) => {
      try {
        if (redisClient.connected) {
          const hash = await hgetallAsync(key);
          if (!hash) return null;
          
          const parsed = {};
          for (const field in hash) {
            parsed[field] = JSON.parse(hash[field]);
          }
          return parsed;
        } else {
          const hash = memoryCache.get(key);
          return hash ? hash.value : null;
        }
      } catch (error) {
        console.error('Cache hash getAll error:', error);
        return null;
      }
    },

    delete: async (key, field) => {
      try {
        if (redisClient.connected) {
          await hdelAsync(key, field);
        } else {
          const hash = memoryCache.get(key);
          if (hash && hash.value[field]) {
            delete hash.value[field];
          }
        }
        return true;
      } catch (error) {
        console.error('Cache hash delete error:', error);
        return false;
      }
    }
  },

  // Set operations
  set: {
    add: async (key, member) => {
      try {
        if (redisClient.connected) {
          await saddAsync(key, JSON.stringify(member));
        } else {
          const set = memoryCache.get(key) || { value: new Set() };
          set.value.add(JSON.stringify(member));
          memoryCache.set(key, set);
        }
        return true;
      } catch (error) {
        console.error('Cache set add error:', error);
        return false;
      }
    },

    members: async (key) => {
      try {
        if (redisClient.connected) {
          const members = await smembersAsync(key);
          return members.map(m => JSON.parse(m));
        } else {
          const set = memoryCache.get(key);
          if (!set) return [];
          return Array.from(set.value).map(m => JSON.parse(m));
        }
      } catch (error) {
        console.error('Cache set members error:', error);
        return [];
      }
    },

    remove: async (key, member) => {
      try {
        if (redisClient.connected) {
          await sremAsync(key, JSON.stringify(member));
        } else {
          const set = memoryCache.get(key);
          if (set) {
            set.value.delete(JSON.stringify(member));
          }
        }
        return true;
      } catch (error) {
        console.error('Cache set remove error:', error);
        return false;
      }
    }
  },

  // Cache decorator for functions
  memoize: (fn, keyGenerator, ttl = 3600) => {
    return async (...args) => {
      const key = keyGenerator(...args);
      
      // Try to get from cache
      const cached = await cacheUtils.get(key);
      if (cached !== null) {
        return cached;
      }
      
      // Execute function and cache result
      const result = await fn(...args);
      await cacheUtils.set(key, result, ttl);
      
      return result;
    };
  },

  // Cache middleware for Express
  middleware: (keyGenerator, ttl = 3600) => {
    return async (req, res, next) => {
      const key = keyGenerator(req);
      
      // Try to get from cache
      const cached = await cacheUtils.get(key);
      if (cached !== null) {
        return res.json(cached);
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        cacheUtils.set(key, data, ttl);
        originalJson.call(this, data);
      };
      
      next();
    };
  },

  // Clear all cache
  clearAll: async () => {
    try {
      if (redisClient.connected) {
        await new Promise((resolve, reject) => {
          redisClient.flushdb((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        memoryCache.clear();
      }
      return true;
    } catch (error) {
      console.error('Cache clear all error:', error);
      return false;
    }
  },

  // Cache warming
  warm: async (keys) => {
    const promises = keys.map(async ({ key, loader, ttl }) => {
      try {
        const data = await loader();
        await cacheUtils.set(key, data, ttl);
        return { key, success: true };
      } catch (error) {
        return { key, success: false, error: error.message };
      }
    });
    
    return await Promise.all(promises);
  },

  // Cache tags
  tags: {
    add: async (key, tags) => {
      const promises = tags.map(tag => 
        cacheUtils.set.add(`tag:${tag}`, key)
      );
      await Promise.all(promises);
    },

    invalidate: async (tag) => {
      const keys = await cacheUtils.set.members(`tag:${tag}`);
      const promises = keys.map(key => cacheUtils.delete(key));
      await Promise.all(promises);
      await cacheUtils.delete(`tag:${tag}`);
    }
  },

  // Cache statistics
  stats: async () => {
    try {
      if (redisClient.connected) {
        const info = await new Promise((resolve, reject) => {
          redisClient.info((err, info) => {
            if (err) reject(err);
            else resolve(info);
          });
        });
        
        // Parse Redis info
        const stats = {};
        info.split('\n').forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) {
            stats[key] = value.trim();
          }
        });
        
        return stats;
      } else {
        // Memory cache stats
        let totalSize = 0;
        let validItems = 0;
        const now = Date.now();
        
        for (const [key, value] of memoryCache) {
          if (value.expires > now) {
            validItems++;
            totalSize += JSON.stringify(value).length;
          }
        }
        
        return {
          type: 'memory',
          items: validItems,
          size: totalSize,
          sizeHuman: `${(totalSize / 1024).toFixed(2)} KB`
        };
      }
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  },

  // Clean expired memory cache entries
  cleanMemoryCache: () => {
    const now = Date.now();
    for (const [key, value] of memoryCache) {
      if (value.expires <= now) {
        memoryCache.delete(key);
      }
    }
  }
};

// Clean memory cache periodically
if (!redisClient.connected) {
  setInterval(() => {
    cacheUtils.cleanMemoryCache();
  }, 60000); // Every minute
}

// Redis error handlers
redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis connected');
});

module.exports = cacheUtils;
