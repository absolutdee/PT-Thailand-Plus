// utils/authUtils.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');

const authUtils = {
  // Generate JWT Token
  generateToken: (payload, expiresIn = '7d') => {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn }
    );
  },

  // Generate Refresh Token
  generateRefreshToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  // Verify JWT Token
  verifyToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  },

  // Hash Password
  hashPassword: async (password) => {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    return await bcrypt.hash(password, saltRounds);
  },

  // Compare Password
  comparePassword: async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
  },

  // Generate Random Password
  generateRandomPassword: (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  },

  // Generate OTP
  generateOTP: (length = 6) => {
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  },

  // Save OTP to Database
  saveOTP: async (userId, otp, type = 'email_verification', expiresIn = 10) => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresIn);

    await db.execute(`
      INSERT INTO otp_codes (user_id, code, type, expires_at, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [userId, otp, type, expiresAt]);

    return true;
  },

  // Verify OTP
  verifyOTP: async (userId, otp, type = 'email_verification') => {
    const [result] = await db.execute(`
      SELECT * FROM otp_codes 
      WHERE user_id = ? AND code = ? AND type = ? 
        AND expires_at > NOW() AND used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId, otp, type]);

    if (result.length === 0) {
      return false;
    }

    // Mark OTP as used
    await db.execute(
      'UPDATE otp_codes SET used = 1, used_at = NOW() WHERE id = ?',
      [result[0].id]
    );

    return true;
  },

  // Generate Reset Password Token
  generateResetToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  // Save Reset Token
  saveResetToken: async (userId, token, expiresIn = 60) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresIn);

    await db.execute(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, NOW())
    `, [userId, hashedToken, expiresAt]);

    return token;
  },

  // Verify Reset Token
  verifyResetToken: async (token) => {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const [result] = await db.execute(`
      SELECT * FROM password_reset_tokens
      WHERE token = ? AND expires_at > NOW() AND used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `, [hashedToken]);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  },

  // Check User Permissions
  checkPermission: async (userId, resource, action) => {
    const [user] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (user.length === 0) {
      return false;
    }

    const userRole = user[0].role;

    // Admin has all permissions
    if (userRole === 'admin') {
      return true;
    }

    // Check role-based permissions
    const permissions = {
      trainer: {
        clients: ['view', 'create', 'update'],
        workouts: ['view', 'create', 'update', 'delete'],
        nutrition: ['view', 'create', 'update', 'delete'],
        packages: ['view', 'create', 'update'],
        schedule: ['view', 'create', 'update', 'delete'],
        reports: ['view'],
        profile: ['view', 'update']
      },
      customer: {
        workouts: ['view'],
        nutrition: ['view'],
        schedule: ['view', 'update'],
        bookings: ['view', 'create', 'update'],
        reviews: ['view', 'create'],
        profile: ['view', 'update']
      }
    };

    if (permissions[userRole] && permissions[userRole][resource]) {
      return permissions[userRole][resource].includes(action);
    }

    return false;
  },

  // Validate Session
  validateSession: async (sessionId) => {
    const [session] = await db.execute(`
      SELECT s.*, u.id as user_id, u.role, u.status as user_status
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_id = ? AND s.expires_at > NOW()
    `, [sessionId]);

    if (session.length === 0) {
      return null;
    }

    // Update last activity
    await db.execute(
      'UPDATE sessions SET last_activity = NOW() WHERE session_id = ?',
      [sessionId]
    );

    return session[0];
  },

  // Create Session
  createSession: async (userId, deviceInfo = {}) => {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDays(expiresAt.getDate() + 30);

    await db.execute(`
      INSERT INTO sessions (
        session_id, user_id, device_info, 
        expires_at, created_at, last_activity
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [sessionId, userId, JSON.stringify(deviceInfo), expiresAt]);

    return sessionId;
  },

  // Revoke Session
  revokeSession: async (sessionId) => {
    await db.execute(
      'UPDATE sessions SET revoked = 1, revoked_at = NOW() WHERE session_id = ?',
      [sessionId]
    );
  },

  // Clean Expired Sessions
  cleanExpiredSessions: async () => {
    const [result] = await db.execute(
      'DELETE FROM sessions WHERE expires_at < NOW() OR revoked = 1'
    );
    return result.affectedRows;
  },

  // Rate Limiting Check
  checkRateLimit: async (identifier, action, maxAttempts = 5, windowMinutes = 15) => {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

    const [attempts] = await db.execute(`
      SELECT COUNT(*) as count FROM rate_limit_attempts
      WHERE identifier = ? AND action = ? AND created_at > ?
    `, [identifier, action, windowStart]);

    if (attempts[0].count >= maxAttempts) {
      return false;
    }

    // Record attempt
    await db.execute(`
      INSERT INTO rate_limit_attempts (identifier, action, created_at)
      VALUES (?, ?, NOW())
    `, [identifier, action]);

    return true;
  },

  // Two-Factor Authentication
  generate2FASecret: () => {
    const secret = crypto.randomBytes(16).toString('hex');
    return {
      secret,
      qrCode: `otpauth://totp/FitnessApp:user?secret=${secret}&issuer=FitnessApp`
    };
  },

  // Verify 2FA Token
  verify2FAToken: (secret, token) => {
    // Simplified TOTP verification (in production, use a library like speakeasy)
    const time = Math.floor(Date.now() / 30000);
    const expectedToken = crypto
      .createHmac('sha1', secret)
      .update(Buffer.from([0, 0, 0, 0, time]))
      .digest('hex')
      .substr(-6, 6);
    
    return token === expectedToken;
  }
};

module.exports = authUtils;
