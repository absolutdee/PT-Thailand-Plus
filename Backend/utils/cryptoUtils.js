// utils/cryptoUtils.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const cryptoUtils = {
  // Encryption/Decryption configuration
  algorithm: process.env.CRYPTO_ALGORITHM || 'aes-256-gcm',
  secretKey: process.env.CRYPTO_SECRET_KEY || crypto.randomBytes(32).toString('hex'),
  
  // Generate secure random values
  random: {
    // Generate random bytes
    bytes: (size = 32) => {
      return crypto.randomBytes(size);
    },

    // Generate random hex string
    hex: (size = 32) => {
      return crypto.randomBytes(size).toString('hex');
    },

    // Generate random base64 string
    base64: (size = 32) => {
      return crypto.randomBytes(size).toString('base64');
    },

    // Generate random base64url string
    base64url: (size = 32) => {
      return crypto.randomBytes(size)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    },

    // Generate random integer
    int: (min = 0, max = Number.MAX_SAFE_INTEGER) => {
      const range = max - min;
      const bytesNeeded = Math.ceil(Math.log2(range) / 8);
      const randomBytes = crypto.randomBytes(bytesNeeded);
      const randomValue = randomBytes.readUIntBE(0, bytesNeeded);
      return min + (randomValue % range);
    },

    // Generate UUID v4
    uuid: () => {
      return crypto.randomUUID();
    },

    // Generate secure token
    token: (length = 32) => {
      return crypto.randomBytes(length).toString('base64url');
    }
  },

  // Hashing functions
  hash: {
    // Create hash
    create: (data, algorithm = 'sha256') => {
      return crypto.createHash(algorithm).update(data).digest('hex');
    },

    // Create HMAC
    hmac: (data, key = cryptoUtils.secretKey, algorithm = 'sha256') => {
      return crypto.createHmac(algorithm, key).update(data).digest('hex');
    },

    // Verify hash
    verify: (data, hash, algorithm = 'sha256') => {
      const dataHash = cryptoUtils.hash.create(data, algorithm);
      return crypto.timingSafeEqual(
        Buffer.from(dataHash),
        Buffer.from(hash)
      );
    },

    // Verify HMAC
    verifyHmac: (data, hmac, key = cryptoUtils.secretKey, algorithm = 'sha256') => {
      const dataHmac = cryptoUtils.hash.hmac(data, key, algorithm);
      return crypto.timingSafeEqual(
        Buffer.from(dataHmac),
        Buffer.from(hmac)
      );
    },

    // Password hashing
    password: async (password, rounds = 10) => {
      return await bcrypt.hash(password, rounds);
    },

    // Verify password
    passwordVerify: async (password, hash) => {
      return await bcrypt.compare(password, hash);
    }
  },

  // Symmetric encryption
  encrypt: {
    // Encrypt data
    data: (text, key = cryptoUtils.secretKey) => {
      const iv = crypto.randomBytes(16);
      const salt = crypto.randomBytes(64);
      const keyBuffer = crypto.pbkdf2Sync(key, salt, 10000, 32, 'sha256');
      
      const cipher = crypto.createCipheriv(cryptoUtils.algorithm, keyBuffer, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    },

    // Encrypt to single string
    string: (text, key = cryptoUtils.secretKey) => {
      const result = cryptoUtils.encrypt.data(text, key);
      return `${result.salt}:${result.iv}:${result.authTag}:${result.encrypted}`;
    },

    // Encrypt object
    object: (obj, key = cryptoUtils.secretKey) => {
      const json = JSON.stringify(obj);
      return cryptoUtils.encrypt.string(json, key);
    },

    // Encrypt file
    file: async (inputPath, outputPath, key = cryptoUtils.secretKey) => {
      const fs = require('fs').promises;
      const data = await fs.readFile(inputPath);
      const encrypted = cryptoUtils.encrypt.data(data.toString('base64'), key);
      await fs.writeFile(outputPath, JSON.stringify(encrypted));
      return true;
    }
  },

  // Symmetric decryption
  decrypt: {
    // Decrypt data
    data: (encryptedData, key = cryptoUtils.secretKey) => {
      const { encrypted, salt, iv, authTag } = encryptedData;
      
      const keyBuffer = crypto.pbkdf2Sync(
        key,
        Buffer.from(salt, 'hex'),
        10000,
        32,
        'sha256'
      );
      
      const decipher = crypto.createDecipheriv(
        cryptoUtils.algorithm,
        keyBuffer,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    },

    // Decrypt from single string
    string: (encryptedString, key = cryptoUtils.secretKey) => {
      const [salt, iv, authTag, encrypted] = encryptedString.split(':');
      return cryptoUtils.decrypt.data({ encrypted, salt, iv, authTag }, key);
    },

    // Decrypt object
    object: (encryptedString, key = cryptoUtils.secretKey) => {
      const json = cryptoUtils.decrypt.string(encryptedString, key);
      return JSON.parse(json);
    },

    // Decrypt file
    file: async (inputPath, outputPath, key = cryptoUtils.secretKey) => {
      const fs = require('fs').promises;
      const encryptedData = JSON.parse(await fs.readFile(inputPath, 'utf8'));
      const decrypted = cryptoUtils.decrypt.data(encryptedData, key);
      await fs.writeFile(outputPath, Buffer.from(decrypted, 'base64'));
      return true;
    }
  },

  // Asymmetric encryption
  rsa: {
    // Generate key pair
    generateKeyPair: () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      
      return { publicKey, privateKey };
    },

    // Encrypt with public key
    encrypt: (text, publicKey) => {
      const buffer = Buffer.from(text, 'utf8');
      const encrypted = crypto.publicEncrypt(publicKey, buffer);
      return encrypted.toString('base64');
    },

    // Decrypt with private key
    decrypt: (encrypted, privateKey) => {
      const buffer = Buffer.from(encrypted, 'base64');
      const decrypted = crypto.privateDecrypt(privateKey, buffer);
      return decrypted.toString('utf8');
    },

    // Sign data
    sign: (data, privateKey) => {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(data);
      return sign.sign(privateKey, 'base64');
    },

    // Verify signature
    verify: (data, signature, publicKey) => {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(data);
      return verify.verify(publicKey, signature, 'base64');
    }
  },

  // JWT operations
  jwt: {
    // Generate JWT token
    sign: (payload, options = {}) => {
      const defaultOptions = {
        expiresIn: '7d',
        algorithm: 'HS256'
      };
      
      return jwt.sign(
        payload,
        process.env.JWT_SECRET || cryptoUtils.secretKey,
        { ...defaultOptions, ...options }
      );
    },

    // Verify JWT token
    verify: (token, options = {}) => {
      try {
        return jwt.verify(
          token,
          process.env.JWT_SECRET || cryptoUtils.secretKey,
          options
        );
      } catch (error) {
        throw error;
      }
    },

    // Decode JWT without verification
    decode: (token) => {
      return jwt.decode(token);
    },

    // Generate refresh token
    generateRefreshToken: () => {
      return cryptoUtils.random.base64url(64);
    }
  },

  // API key management
  apiKey: {
    // Generate API key
    generate: (prefix = 'key') => {
      const timestamp = Date.now().toString(36);
      const randomPart = cryptoUtils.random.base64url(32);
      return `${prefix}_${timestamp}_${randomPart}`;
    },

    // Hash API key for storage
    hash: (apiKey) => {
      return cryptoUtils.hash.create(apiKey, 'sha256');
    },

    // Verify API key
    verify: (apiKey, hashedKey) => {
      const keyHash = cryptoUtils.hash.create(apiKey, 'sha256');
      return crypto.timingSafeEqual(
        Buffer.from(keyHash),
        Buffer.from(hashedKey)
      );
    }
  },

  // TOTP (Time-based One-Time Password)
  totp: {
    // Generate secret
    generateSecret: () => {
      return cryptoUtils.random.base64(32);
    },

    // Generate TOTP code
    generate: (secret, window = 0) => {
      const time = Math.floor(Date.now() / 30000) + window;
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeUInt32BE(time, 4);
      
      const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64'));
      hmac.update(timeBuffer);
      const hash = hmac.digest();
      
      const offset = hash[hash.length - 1] & 0xf;
      const code = (
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff)
      ) % 1000000;
      
      return code.toString().padStart(6, '0');
    },

    // Verify TOTP code
    verify: (token, secret, window = 1) => {
      for (let i = -window; i <= window; i++) {
        const expectedToken = cryptoUtils.totp.generate(secret, i);
        if (crypto.timingSafeEqual(
          Buffer.from(token),
          Buffer.from(expectedToken)
        )) {
          return true;
        }
      }
      return false;
    },

    // Generate QR code URL
    generateQRCodeUrl: (secret, label, issuer = 'FitnessApp') => {
      const base32 = require('base32.js');
      const encoder = new base32.Encoder();
      const encodedSecret = encoder.write(Buffer.from(secret, 'base64')).finalize();
      
      return `otpauth://totp/${issuer}:${label}?secret=${encodedSecret}&issuer=${issuer}`;
    }
  },

  // Secure comparison
  compare: {
    // Timing-safe string comparison
    strings: (a, b) => {
      if (a.length !== b.length) {
        return false;
      }
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    },

    // Timing-safe buffer comparison
    buffers: (a, b) => {
      if (a.length !== b.length) {
        return false;
      }
      return crypto.timingSafeEqual(a, b);
    }
  },

  // Key derivation
  derive: {
    // PBKDF2
    pbkdf2: (password, salt, iterations = 10000, keylen = 32, digest = 'sha256') => {
      return crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
    },

    // Scrypt
    scrypt: (password, salt, keylen = 32) => {
      return crypto.scryptSync(password, salt, keylen);
    }
  },

  // Certificate operations
  certificate: {
    // Generate self-signed certificate
    generateSelfSigned: () => {
      const forge = require('node-forge');
      const pki = forge.pki;
      
      // Generate key pair
      const keys = pki.rsa.generateKeyPair(2048);
      
      // Create certificate
      const cert = pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
      
      const attrs = [{
        name: 'commonName',
        value: 'localhost'
      }, {
        name: 'countryName',
        value: 'TH'
      }, {
        name: 'organizationName',
        value: 'FitnessApp'
      }];
      
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      
      // Sign certificate
      cert.sign(keys.privateKey);
      
      return {
        certificate: pki.certificateToPem(cert),
        privateKey: pki.privateKeyToPem(keys.privateKey),
        publicKey: pki.publicKeyToPem(keys.publicKey)
      };
    }
  },

  // Sanitization
  sanitize: {
    // Remove sensitive data from object
    object: (obj, sensitiveFields = ['password', 'token', 'secret', 'key']) => {
      const sanitized = { ...obj };
      
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      // Recursively sanitize nested objects
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          sanitized[key] = cryptoUtils.sanitize.object(sanitized[key], sensitiveFields);
        }
      });
      
      return sanitized;
    },

    // Mask sensitive string
    maskString: (str, showFirst = 4, showLast = 4) => {
      if (str.length <= showFirst + showLast) {
        return '*'.repeat(str.length);
      }
      
      const first = str.substring(0, showFirst);
      const last = str.substring(str.length - showLast);
      const masked = '*'.repeat(str.length - showFirst - showLast);
      
      return `${first}${masked}${last}`;
    }
  },

  // Security headers
  securityHeaders: () => {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }
};

module.exports = cryptoUtils;
