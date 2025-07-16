// redis.js - Redis configuration and connection

import Redis from 'ioredis';
import { logger } from '../utils/errorUtils';

class RedisConfig {
    constructor() {
        this.client = null;
        this.subscriber = null;
        this.publisher = null;
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 10;
        
        // Configuration options
        this.options = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            db: parseInt(process.env.REDIS_DB) || 0,
            keyPrefix: process.env.REDIS_KEY_PREFIX || 'fitness:',
            retryStrategy: (times) => this.retryStrategy(times),
            enableOfflineQueue: true,
            maxRetriesPerRequest: 3,
            connectTimeout: 10000,
            lazyConnect: true,
        };

        // Cluster configuration (if using Redis Cluster)
        this.clusterOptions = {
            clusterRetryStrategy: (times) => this.retryStrategy(times),
            enableOfflineQueue: true,
            enableReadyCheck: true,
            scaleReads: 'slave',
            redisOptions: {
                password: process.env.REDIS_PASSWORD,
            },
        };
    }

    // Initialize Redis connections
    async initialize() {
        try {
            // Check if using Redis Cluster
            if (process.env.REDIS_CLUSTER === 'true') {
                await this.initializeCluster();
            } else {
                await this.initializeSingle();
            }

            // Setup pub/sub if needed
            if (process.env.REDIS_PUBSUB === 'true') {
                await this.initializePubSub();
            }

            logger.info('Redis initialized successfully');
        } catch (error) {
            logger.error('Redis initialization error:', error);
            throw error;
        }
    }

    // Initialize single Redis instance
    async initializeSingle() {
        // Create main client
        this.client = new Redis(this.options);
        
        // Setup event listeners
        this.setupEventListeners(this.client, 'main');
        
        // Connect
        await this.client.connect();
        
        // Test connection
        await this.client.ping();
        
        this.isConnected = true;
        logger.info('Connected to Redis');
    }

    // Initialize Redis Cluster
    async initializeCluster() {
        const nodes = process.env.REDIS_CLUSTER_NODES?.split(',').map(node => {
            const [host, port] = node.split(':');
            return { host, port: parseInt(port) || 6379 };
        }) || [{ host: 'localhost', port: 6379 }];

        this.client = new Redis.Cluster(nodes, this.clusterOptions);
        
        // Setup event listeners
        this.setupEventListeners(this.client, 'cluster');
        
        // Test connection
        await this.client.ping();
        
        this.isConnected = true;
        logger.info('Connected to Redis Cluster');
    }

    // Initialize Pub/Sub
    async initializePubSub() {
        // Create subscriber client
        this.subscriber = this.client.duplicate();
        await this.subscriber.connect();
        this.setupEventListeners(this.subscriber, 'subscriber');
        
        // Create publisher client
        this.publisher = this.client.duplicate();
        await this.publisher.connect();
        this.setupEventListeners(this.publisher, 'publisher');
        
        logger.info('Redis Pub/Sub initialized');
    }

    // Setup event listeners
    setupEventListeners(client, name) {
        client.on('connect', () => {
            logger.info(`Redis ${name} connected`);
            this.connectionRetries = 0;
        });

        client.on('ready', () => {
            logger.info(`Redis ${name} ready`);
        });

        client.on('error', (err) => {
            logger.error(`Redis ${name} error:`, err);
        });

        client.on('close', () => {
            logger.warn(`Redis ${name} connection closed`);
            this.isConnected = false;
        });

        client.on('reconnecting', (delay) => {
            logger.info(`Redis ${name} reconnecting in ${delay}ms`);
        });

        client.on('end', () => {
            logger.info(`Redis ${name} connection ended`);
            this.isConnected = false;
        });
    }

    // Retry strategy
    retryStrategy(times) {
        if (times > this.maxRetries) {
            logger.error('Redis max retries reached');
            return null; // Stop retrying
        }

        const delay = Math.min(times * 1000, 30000);
        logger.info(`Retrying Redis connection in ${delay}ms (attempt ${times})`);
        return delay;
    }

    // Get client
    getClient() {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return this.client;
    }

    // Cache operations
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Redis get error for key ${key}:`, error);
            return null;
        }
    }

    async set(key, value, ttl = null) {
        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await this.client.setex(key, ttl, serialized);
            } else {
                await this.client.set(key, serialized);
            }
            return true;
        } catch (error) {
            logger.error(`Redis set error for key ${key}:`, error);
            return false;
        }
    }

    async del(key) {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error(`Redis delete error for key ${key}:`, error);
            return false;
        }
    }

    async exists(key) {
        try {
            const exists = await this.client.exists(key);
            return exists === 1;
        } catch (error) {
            logger.error(`Redis exists error for key ${key}:`, error);
            return false;
        }
    }

    async expire(key, seconds) {
        try {
            await this.client.expire(key, seconds);
            return true;
        } catch (error) {
            logger.error(`Redis expire error for key ${key}:`, error);
            return false;
        }
    }

    async ttl(key) {
        try {
            return await this.client.ttl(key);
        } catch (error) {
            logger.error(`Redis TTL error for key ${key}:`, error);
            return -1;
        }
    }

    // List operations
    async lpush(key, ...values) {
        try {
            const serialized = values.map(v => JSON.stringify(v));
            return await this.client.lpush(key, ...serialized);
        } catch (error) {
            logger.error(`Redis lpush error for key ${key}:`, error);
            return 0;
        }
    }

    async rpush(key, ...values) {
        try {
            const serialized = values.map(v => JSON.stringify(v));
            return await this.client.rpush(key, ...serialized);
        } catch (error) {
            logger.error(`Redis rpush error for key ${key}:`, error);
            return 0;
        }
    }

    async lrange(key, start, stop) {
        try {
            const values = await this.client.lrange(key, start, stop);
            return values.map(v => JSON.parse(v));
        } catch (error) {
            logger.error(`Redis lrange error for key ${key}:`, error);
            return [];
        }
    }

    // Set operations
    async sadd(key, ...members) {
        try {
            return await this.client.sadd(key, ...members);
        } catch (error) {
            logger.error(`Redis sadd error for key ${key}:`, error);
            return 0;
        }
    }

    async smembers(key) {
        try {
            return await this.client.smembers(key);
        } catch (error) {
            logger.error(`Redis smembers error for key ${key}:`, error);
            return [];
        }
    }

    async sismember(key, member) {
        try {
            const result = await this.client.sismember(key, member);
            return result === 1;
        } catch (error) {
            logger.error(`Redis sismember error for key ${key}:`, error);
            return false;
        }
    }

    // Hash operations
    async hset(key, field, value) {
        try {
            const serialized = JSON.stringify(value);
            await this.client.hset(key, field, serialized);
            return true;
        } catch (error) {
            logger.error(`Redis hset error for key ${key}:`, error);
            return false;
        }
    }

    async hget(key, field) {
        try {
            const value = await this.client.hget(key, field);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Redis hget error for key ${key}:`, error);
            return null;
        }
    }

    async hgetall(key) {
        try {
            const hash = await this.client.hgetall(key);
            const result = {};
            for (const [field, value] of Object.entries(hash)) {
                result[field] = JSON.parse(value);
            }
            return result;
        } catch (error) {
            logger.error(`Redis hgetall error for key ${key}:`, error);
            return {};
        }
    }

    // Sorted set operations
    async zadd(key, score, member) {
        try {
            return await this.client.zadd(key, score, member);
        } catch (error) {
            logger.error(`Redis zadd error for key ${key}:`, error);
            return 0;
        }
    }

    async zrange(key, start, stop, withScores = false) {
        try {
            if (withScores) {
                return await this.client.zrange(key, start, stop, 'WITHSCORES');
            }
            return await this.client.zrange(key, start, stop);
        } catch (error) {
            logger.error(`Redis zrange error for key ${key}:`, error);
            return [];
        }
    }

    // Pub/Sub operations
    async publish(channel, message) {
        try {
            if (!this.publisher) {
                throw new Error('Publisher not initialized');
            }
            const serialized = JSON.stringify(message);
            return await this.publisher.publish(channel, serialized);
        } catch (error) {
            logger.error(`Redis publish error for channel ${channel}:`, error);
            return 0;
        }
    }

    async subscribe(channel, callback) {
        try {
            if (!this.subscriber) {
                throw new Error('Subscriber not initialized');
            }
            
            await this.subscriber.subscribe(channel);
            
            this.subscriber.on('message', (receivedChannel, message) => {
                if (receivedChannel === channel) {
                    try {
                        const parsed = JSON.parse(message);
                        callback(parsed);
                    } catch (error) {
                        logger.error('Error parsing message:', error);
                    }
                }
            });
            
            return true;
        } catch (error) {
            logger.error(`Redis subscribe error for channel ${channel}:`, error);
            return false;
        }
    }

    async unsubscribe(channel) {
        try {
            if (!this.subscriber) {
                throw new Error('Subscriber not initialized');
            }
            await this.subscriber.unsubscribe(channel);
            return true;
        } catch (error) {
            logger.error(`Redis unsubscribe error for channel ${channel}:`, error);
            return false;
        }
    }

    // Pattern operations
    async keys(pattern) {
        try {
            return await this.client.keys(pattern);
        } catch (error) {
            logger.error(`Redis keys error for pattern ${pattern}:`, error);
            return [];
        }
    }

    async scan(cursor, pattern, count = 10) {
        try {
            return await this.client.scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                count
            );
        } catch (error) {
            logger.error(`Redis scan error:`, error);
            return ['0', []];
        }
    }

    // Transaction operations
    multi() {
        return this.client.multi();
    }

    // Lock operations (for distributed locking)
    async acquireLock(resource, ttl = 10000, retries = 3) {
        const lockKey = `lock:${resource}`;
        const lockValue = `${Date.now()}:${Math.random()}`;

        for (let i = 0; i < retries; i++) {
            const result = await this.client.set(
                lockKey,
                lockValue,
                'PX',
                ttl,
                'NX'
            );

            if (result === 'OK') {
                return { lockKey, lockValue };
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return null;
    }

    async releaseLock(lockKey, lockValue) {
        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;

        try {
            const result = await this.client.eval(script, 1, lockKey, lockValue);
            return result === 1;
        } catch (error) {
            logger.error('Redis release lock error:', error);
            return false;
        }
    }

    // Cache invalidation patterns
    async invalidatePattern(pattern) {
        try {
            const keys = await this.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
            return keys.length;
        } catch (error) {
            logger.error(`Redis invalidate pattern error:`, error);
            return 0;
        }
    }

    // Monitoring and stats
    async getInfo(section = 'all') {
        try {
            const info = await this.client.info(section);
            return this.parseInfo(info);
        } catch (error) {
            logger.error('Redis info error:', error);
            return {};
        }
    }

    parseInfo(info) {
        const lines = info.split('\r\n');
        const data = {};
        let section = 'general';

        lines.forEach(line => {
            if (line.startsWith('#')) {
                section = line.substring(2).toLowerCase();
                data[section] = {};
            } else if (line.includes(':')) {
                const [key, value] = line.split(':');
                if (section && data[section]) {
                    data[section][key] = value;
                }
            }
        });

        return data;
    }

    async getMemoryUsage(key) {
        try {
            return await this.client.memory('USAGE', key);
        } catch (error) {
            logger.error(`Redis memory usage error for key ${key}:`, error);
            return 0;
        }
    }

    // Cleanup
    async flushdb() {
        try {
            await this.client.flushdb();
            logger.info('Redis database flushed');
            return true;
        } catch (error) {
            logger.error('Redis flushdb error:', error);
            return false;
        }
    }

    async disconnect() {
        try {
            if (this.subscriber) {
                await this.subscriber.quit();
            }
            if (this.publisher) {
                await this.publisher.quit();
            }
            if (this.client) {
                await this.client.quit();
            }
            
            this.isConnected = false;
            logger.info('Disconnected from Redis');
        } catch (error) {
            logger.error('Redis disconnect error:', error);
        }
    }

    // Health check
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return {
                    status: 'disconnected',
                    message: 'Redis is not connected',
                };
            }

            const start = Date.now();
            await this.client.ping();
            const latency = Date.now() - start;

            const info = await this.getInfo('server');

            return {
                status: 'healthy',
                message: 'Redis is connected and responding',
                latency,
                version: info.server?.redis_version,
                uptime: parseInt(info.server?.uptime_in_seconds) || 0,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: error.message,
            };
        }
    }
}

// Create and export singleton instance
const redisConfig = new RedisConfig();
export default redisConfig;

// Export common operations
export const {
    get,
    set,
    del,
    exists,
    expire,
    ttl,
    lpush,
    rpush,
    lrange,
    sadd,
    smembers,
    sismember,
    hset,
    hget,
    hgetall,
    zadd,
    zrange,
    publish,
    subscribe,
    unsubscribe,
    keys,
    scan,
    multi,
    acquireLock,
    releaseLock,
    invalidatePattern,
    getInfo,
    healthCheck,
} = redisConfig;
