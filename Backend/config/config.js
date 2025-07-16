// config.js - Main application configuration

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load different .env files based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : process.env.NODE_ENV === 'test' 
    ? '.env.test' 
    : '.env';

dotenv.config({ path: path.join(__dirname, '..', '..', envFile) });

// Application configuration
const config = {
    // Environment
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',

    // Server
    server: {
        port: parseInt(process.env.PORT) || 5000,
        host: process.env.HOST || '0.0.0.0',
        apiPrefix: process.env.API_PREFIX || '/api',
        corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        trustProxy: process.env.TRUST_PROXY === 'true',
        bodyLimit: process.env.BODY_LIMIT || '10mb',
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
    },

    // Database
    database: {
        uri: process.env.MONGODB_URI || `mongodb://localhost:27017/fitness_platform`,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
            serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 5000,
        },
    },

    // Redis
    redis: {
        enabled: process.env.REDIS_ENABLED === 'true',
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0,
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'fitness:',
        ttl: {
            default: 3600, // 1 hour
            session: 86400, // 24 hours
            cache: 300, // 5 minutes
            otp: 600, // 10 minutes
        },
    },

    // Authentication
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
        passwordMinLength: 8,
        maxLoginAttempts: 5,
        lockoutDuration: 30 * 60 * 1000, // 30 minutes
        sessionSecret: process.env.SESSION_SECRET || 'session-secret',
        cookieMaxAge: 24 * 60 * 60 * 1000, // 24 hours
    },

    // Email
    email: {
        enabled: process.env.EMAIL_ENABLED === 'true',
        from: process.env.EMAIL_FROM || 'noreply@fitnessplatform.com',
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        },
        templates: {
            dir: path.join(__dirname, '..', 'templates', 'email'),
        },
    },

    // SMS
    sms: {
        enabled: process.env.SMS_ENABLED === 'true',
        provider: process.env.SMS_PROVIDER || 'twilio',
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        },
        defaultCountryCode: 'TH',
    },

    // File Upload
    upload: {
        path: process.env.UPLOAD_PATH || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        maxFiles: parseInt(process.env.MAX_FILES) || 10,
        allowedImageTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        allowedDocumentTypes: ['pdf', 'doc', 'docx'],
        imageCompression: {
            quality: 85,
            maxWidth: 1920,
            maxHeight: 1080,
        },
        thumbnails: {
            small: { width: 150, height: 150 },
            medium: { width: 400, height: 400 },
            large: { width: 800, height: 800 },
        },
    },

    // Payment
    payment: {
        provider: process.env.PAYMENT_PROVIDER || 'stripe',
        currency: process.env.PAYMENT_CURRENCY || 'THB',
        stripe: {
            secretKey: process.env.STRIPE_SECRET_KEY,
            publicKey: process.env.STRIPE_PUBLIC_KEY,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        },
        omise: {
            secretKey: process.env.OMISE_SECRET_KEY,
            publicKey: process.env.OMISE_PUBLIC_KEY,
        },
        tax: {
            rate: parseFloat(process.env.TAX_RATE) || 0.07, // 7% VAT
            included: process.env.TAX_INCLUDED === 'true',
        },
    },

    // Maps
    maps: {
        provider: 'google',
        google: {
            apiKey: process.env.GOOGLE_MAPS_API_KEY,
            defaultCenter: {
                lat: 13.7563,
                lng: 100.5018, // Bangkok
            },
            defaultZoom: 12,
        },
    },

    // Notifications
    notifications: {
        pushEnabled: process.env.PUSH_NOTIFICATIONS === 'true',
        oneSignal: {
            appId: process.env.ONESIGNAL_APP_ID,
            apiKey: process.env.ONESIGNAL_API_KEY,
        },
        fcm: {
            serverKey: process.env.FCM_SERVER_KEY,
            senderId: process.env.FCM_SENDER_ID,
        },
    },

    // Security
    security: {
        rateLimiting: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP',
        },
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    scriptSrc: ["'self'", "https://maps.googleapis.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                },
            },
        },
        cors: {
            credentials: true,
            maxAge: 86400,
        },
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
        directory: process.env.LOG_DIRECTORY || './logs',
        filename: process.env.LOG_FILENAME || 'app.log',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        sentry: {
            enabled: process.env.SENTRY_ENABLED === 'true',
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV,
        },
    },

    // Analytics
    analytics: {
        googleAnalytics: {
            enabled: process.env.GA_ENABLED === 'true',
            trackingId: process.env.GA_TRACKING_ID,
        },
        mixpanel: {
            enabled: process.env.MIXPANEL_ENABLED === 'true',
            token: process.env.MIXPANEL_TOKEN,
        },
    },

    // Features
    features: {
        registration: process.env.FEATURE_REGISTRATION !== 'false',
        socialLogin: process.env.FEATURE_SOCIAL_LOGIN === 'true',
        chat: process.env.FEATURE_CHAT !== 'false',
        videoCall: process.env.FEATURE_VIDEO_CALL === 'true',
        payment: process.env.FEATURE_PAYMENT !== 'false',
        reviews: process.env.FEATURE_REVIEWS !== 'false',
        notifications: process.env.FEATURE_NOTIFICATIONS !== 'false',
        analytics: process.env.FEATURE_ANALYTICS === 'true',
        maintenance: process.env.MAINTENANCE_MODE === 'true',
    },

    // Third-party integrations
    integrations: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackUrl: process.env.GOOGLE_CALLBACK_URL,
        },
        facebook: {
            appId: process.env.FACEBOOK_APP_ID,
            appSecret: process.env.FACEBOOK_APP_SECRET,
            callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
        },
        line: {
            channelId: process.env.LINE_CHANNEL_ID,
            channelSecret: process.env.LINE_CHANNEL_SECRET,
            callbackUrl: process.env.LINE_CALLBACK_URL,
        },
    },

    // Business rules
    business: {
        maxTrainerPackages: 3,
        maxTrainerImages: 12,
        sessionDuration: 60, // minutes
        bookingAdvanceDays: 90,
        cancellationHours: 24,
        reviewMinSessions: 1,
        commissionRate: parseFloat(process.env.COMMISSION_RATE) || 0.15, // 15%
        currency: {
            code: 'THB',
            symbol: '฿',
            locale: 'th-TH',
        },
        workingHours: {
            start: '06:00',
            end: '22:00',
        },
    },

    // Cache settings
    cache: {
        ttl: {
            user: 3600, // 1 hour
            trainer: 1800, // 30 minutes
            session: 300, // 5 minutes
            search: 600, // 10 minutes
        },
        invalidation: {
            onUpdate: true,
            onDelete: true,
        },
    },

    // API Rate Limits
    apiLimits: {
        search: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 30,
        },
        booking: {
            windowMs: 5 * 60 * 1000, // 5 minutes
            max: 10,
        },
        message: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 60,
        },
        upload: {
            windowMs: 10 * 60 * 1000, // 10 minutes
            max: 20,
        },
    },

    // Development
    development: {
        seedDatabase: process.env.SEED_DATABASE === 'true',
        logQueries: process.env.LOG_QUERIES === 'true',
        debugEmail: process.env.DEBUG_EMAIL === 'true',
        mockPayments: process.env.MOCK_PAYMENTS === 'true',
    },
};

// Validate required configuration
const validateConfig = () => {
    const requiredEnvVars = [
        'JWT_SECRET',
        'MONGODB_URI',
    ];

    const requiredInProduction = [
        'SMTP_USER',
        'SMTP_PASS',
        'GOOGLE_MAPS_API_KEY',
    ];

    const missing = [];

    // Check required variables
    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    // Check production requirements
    if (config.isProduction) {
        requiredInProduction.forEach(varName => {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        });
    }

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

// Validate configuration on load
if (!config.isTest) {
    validateConfig();
}

// Export configuration
export default config;

// Export specific configurations
export const {
    env,
    isDevelopment,
    isProduction,
    isTest,
    server,
    database,
    redis,
    auth,
    email,
    sms,
    upload,
    payment,
    maps,
    notifications,
    security,
    logging,
    analytics,
    features,
    integrations,
    business,
    cache,
    apiLimits,
    development,
} = config;
