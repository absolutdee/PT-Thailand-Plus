// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { authValidation } = require('../validations');

// Public routes
router.post('/register', 
  validate(authValidation.register), 
  authController.register
);

router.post('/login', 
  validate(authValidation.login), 
  authController.login
);

router.post('/forgot-password', 
  validate(authValidation.forgotPassword), 
  authController.forgotPassword
);

router.post('/reset-password', 
  validate(authValidation.resetPassword), 
  authController.resetPassword
);

router.post('/verify-email/:token', 
  authController.verifyEmail
);

router.post('/resend-verification', 
  validate(authValidation.resendVerification), 
  authController.resendVerification
);

// Protected routes
router.post('/logout', 
  authenticate, 
  authController.logout
);

router.post('/refresh-token', 
  authController.refreshToken
);

router.post('/change-password', 
  authenticate, 
  validate(authValidation.changePassword), 
  authController.changePassword
);

router.get('/me', 
  authenticate, 
  authController.getCurrentUser
);

router.put('/update-profile', 
  authenticate, 
  validate(authValidation.updateProfile), 
  authController.updateProfile
);

// Social authentication
router.post('/google', 
  authController.googleAuth
);

router.post('/facebook', 
  authController.facebookAuth
);

// Two-factor authentication
router.post('/2fa/enable', 
  authenticate, 
  authController.enable2FA
);

router.post('/2fa/verify', 
  authenticate, 
  validate(authValidation.verify2FA), 
  authController.verify2FA
);

router.post('/2fa/disable', 
  authenticate, 
  authController.disable2FA
);

module.exports = router;