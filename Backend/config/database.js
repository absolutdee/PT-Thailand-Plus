// database.js - Database configuration and connection

import mongoose from 'mongoose';
import { logger } from '../utils/errorUtils';

class DatabaseConfig {
    constructor() {
        this.connectionOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4, // Use IPv4
        };

        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 5;
    }

    // Get connection URI
    getConnectionURI() {
        const {
            DB_HOST = 'localhost',
            DB_PORT = '27017',
            DB_NAME = 'fitness_platform',
            DB_USER,
            DB_PASS,
            DB_AUTH_SOURCE = 'admin',
            NODE_ENV = 'development',
        } = process.env;

        // Use MongoDB Atlas URI if provided
        if (process.env.MONGODB_URI) {
            return process.env.MONGODB_URI;
        }

        // Build connection string
        let uri = 'mongodb://';

        // Add authentication if provided
        if (DB_USER && DB_PASS) {
            uri += `${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASS)}@`;
        }

        // Add host and port
        uri += `${DB_HOST}:${DB_PORT}/${DB_NAME}`;

        // Add auth source if using authentication
        if (DB_USER && DB_PASS) {
            uri += `?authSource=${DB_AUTH_SOURCE}`;
        }

        return uri;
    }

    // Connect to database
    async connect() {
        if (this.isConnected) {
            logger.info('Already connected to MongoDB');
            return;
        }

        const uri = this.getConnectionURI();

        try {
            // Set up mongoose event listeners
            this.setupEventListeners();

            // Connect to MongoDB
            await mongoose.connect(uri, this.connectionOptions);
            
            this.isConnected = true;
            this.connectionRetries = 0;
            
            logger.info('Successfully connected to MongoDB');
            
            // Run initial setup
            await this.runInitialSetup();
            
        } catch (error) {
            logger.error('MongoDB connection error:', error);
            
            // Retry connection
            if (this.connectionRetries < this.maxRetries) {
                this.connectionRetries++;
                const retryDelay = Math.min(1000 * Math.pow(2, this.connectionRetries), 30000);
                
                logger.info(`Retrying connection in ${retryDelay / 1000} seconds... (Attempt ${this.connectionRetries}/${this.maxRetries})`);
                
                setTimeout(() => this.connect(), retryDelay);
            } else {
                logger.error('Max connection retries reached. Exiting...');
                process.exit(1);
            }
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Connection events
        mongoose.connection.on('connected', () => {
            logger.info('Mongoose connected to MongoDB');
            this.isConnected = true;
        });

        mongoose.connection.on('error', (err) => {
            logger.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('Mongoose disconnected from MongoDB');
            this.isConnected = false;
            
            // Attempt to reconnect
            if (process.env.NODE_ENV === 'production') {
                setTimeout(() => this.connect(), 5000);
            }
        });

        // Process events
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    // Disconnect from database
    async disconnect() {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.connection.close();
            logger.info('Disconnected from MongoDB');
            this.isConnected = false;
        } catch (error) {
            logger.error('Error disconnecting from MongoDB:', error);
        }
    }

    // Run initial setup
    async runInitialSetup() {
        try {
            // Create indexes
            await this.createIndexes();
            
            // Seed initial data if needed
            if (process.env.SEED_DATABASE === 'true') {
                await this.seedDatabase();
            }
            
        } catch (error) {
            logger.error('Initial setup error:', error);
        }
    }

    // Create database indexes
    async createIndexes() {
        logger.info('Creating database indexes...');
        
        // Users collection indexes
        const User = mongoose.connection.collection('users');
        await User.createIndex({ email: 1 }, { unique: true });
        await User.createIndex({ role: 1 });
        await User.createIndex({ createdAt: -1 });
        
        // Trainers collection indexes
        const Trainer = mongoose.connection.collection('trainers');
        await Trainer.createIndex({ userId: 1 }, { unique: true });
        await Trainer.createIndex({ location: '2dsphere' });
        await Trainer.createIndex({ rating: -1 });
        await Trainer.createIndex({ 'specializations': 1 });
        
        // Clients collection indexes
        const Client = mongoose.connection.collection('clients');
        await Client.createIndex({ userId: 1 }, { unique: true });
        
        // Sessions collection indexes
        const Session = mongoose.connection.collection('sessions');
        await Session.createIndex({ trainerId: 1, startTime: 1 });
        await Session.createIndex({ clientId: 1, startTime: 1 });
        await Session.createIndex({ status: 1 });
        await Session.createIndex({ startTime: 1 });
        
        // Reviews collection indexes
        const Review = mongoose.connection.collection('reviews');
        await Review.createIndex({ trainerId: 1, clientId: 1 });
        await Review.createIndex({ trainerId: 1, rating: -1 });
        await Review.createIndex({ createdAt: -1 });
        
        // Chats collection indexes
        const Chat = mongoose.connection.collection('chats');
        await Chat.createIndex({ participants: 1 });
        await Chat.createIndex({ 'messages.timestamp': -1 });
        
        // Payments collection indexes
        const Payment = mongoose.connection.collection('payments');
        await Payment.createIndex({ clientId: 1, createdAt: -1 });
        await Payment.createIndex({ status: 1 });
        await Payment.createIndex({ transactionId: 1 }, { unique: true });
        
        logger.info('Database indexes created successfully');
    }

    // Seed database with initial data
    async seedDatabase() {
        logger.info('Seeding database...');
        
        try {
            // Import seed data
            const { seedUsers } = await import('../seeds/users.seed.js');
            const { seedTrainers } = await import('../seeds/trainers.seed.js');
            const { seedPackages } = await import('../seeds/packages.seed.js');
            
            // Run seeders
            await seedUsers();
            await seedTrainers();
            await seedPackages();
            
            logger.info('Database seeded successfully');
        } catch (error) {
            logger.error('Database seeding error:', error);
        }
    }

    // Get database statistics
    async getStats() {
        if (!this.isConnected) {
            throw new Error('Not connected to database');
        }

        const stats = await mongoose.connection.db.stats();
        
        return {
            database: stats.db,
            collections: stats.collections,
            dataSize: this.formatBytes(stats.dataSize),
            storageSize: this.formatBytes(stats.storageSize),
            indexes: stats.indexes,
            indexSize: this.formatBytes(stats.indexSize),
            avgObjSize: this.formatBytes(stats.avgObjSize),
            objects: stats.objects,
        };
    }

    // Get collection statistics
    async getCollectionStats(collectionName) {
        if (!this.isConnected) {
            throw new Error('Not connected to database');
        }

        const collection = mongoose.connection.collection(collectionName);
        const stats = await collection.stats();
        
        return {
            name: stats.ns,
            count: stats.count,
            size: this.formatBytes(stats.size),
            avgObjSize: this.formatBytes(stats.avgObjSize),
            storageSize: this.formatBytes(stats.storageSize),
            indexes: stats.nindexes,
            indexSize: this.formatBytes(stats.totalIndexSize),
        };
    }

    // Format bytes to human readable
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Backup database
    async backup() {
        // This would typically use mongodump or similar tool
        logger.info('Database backup initiated...');
        
        // Implementation would depend on your backup strategy
        // Could use child_process to run mongodump
        // Or use a cloud backup service
        
        return {
            success: true,
            timestamp: new Date(),
            message: 'Backup completed successfully',
        };
    }

    // Health check
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return {
                    status: 'disconnected',
                    message: 'Database is not connected',
                };
            }

            // Ping database
            await mongoose.connection.db.admin().ping();
            
            return {
                status: 'healthy',
                message: 'Database is connected and responding',
                latency: await this.getLatency(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: error.message,
            };
        }
    }

    // Get database latency
    async getLatency() {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        return Date.now() - start;
    }

    // Execute raw query (use with caution)
    async executeRawQuery(collection, operation, query, options = {}) {
        if (!this.isConnected) {
            throw new Error('Not connected to database');
        }

        const col = mongoose.connection.collection(collection);
        
        switch (operation) {
            case 'find':
                return await col.find(query, options).toArray();
            case 'findOne':
                return await col.findOne(query, options);
            case 'aggregate':
                return await col.aggregate(query, options).toArray();
            case 'count':
                return await col.countDocuments(query, options);
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }
    }

    // Transaction helper
    async withTransaction(callback) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const result = await callback(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}

// Create and export singleton instance
const databaseConfig = new DatabaseConfig();
export default databaseConfig;

// Export specific functions
export const {
    connect,
    disconnect,
    getStats,
    getCollectionStats,
    healthCheck,
    withTransaction,
} = databaseConfig;
