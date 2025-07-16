// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Admin = require('../models/Admin');

// Verify JWT Token
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ Token กรุณาเข้าสู่ระบบ'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user based on role
    let user;
    switch (decoded.role) {
      case 'customer':
        user = await User.findById(decoded.id).select('-password');
        break;
      case 'trainer':
        user = await Trainer.findById(decoded.id).select('-password');
        break;
      case 'admin':
        user = await Admin.findById(decoded.id).select('-password');
        break;
      default:
        throw new Error('Invalid role');
    }

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'บัญชีของคุณถูกระงับการใช้งาน'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้อง'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'การยืนยันตัวตนล้มเหลว'
    });
  }
};

// Check if user is authenticated (optional auth)
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      let user;
      switch (decoded.role) {
        case 'customer':
          user = await User.findById(decoded.id).select('-password');
          break;
        case 'trainer':
          user = await Trainer.findById(decoded.id).select('-password');
          break;
        case 'admin':
          user = await Admin.findById(decoded.id).select('-password');
          break;
      }
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = decoded.id;
        req.userRole = decoded.role;
      }
    }
  } catch (error) {
    // Silent fail - user is not authenticated but route is still accessible
  }
  
  next();
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'กรุณาเข้าสู่ระบบ'
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้'
      });
    }

    next();
  };
};

// Check if user owns the resource
const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อมูลที่ร้องขอ'
        });
      }

      // Check ownership based on role
      let isOwner = false;
      
      if (req.userRole === 'admin') {
        isOwner = true; // Admin can access all resources
      } else if (req.userRole === 'trainer' && resource.trainerId) {
        isOwner = resource.trainerId.toString() === req.userId;
      } else if (req.userRole === 'customer' && resource.userId) {
        isOwner = resource.userId.toString() === req.userId;
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์'
      });
    }
  };
};

// Verify email confirmation token
const verifyEmailToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบ Token ยืนยันอีเมล'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET);
    req.emailUserId = decoded.userId;
    req.emailUserRole = decoded.role;
    
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Token ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุ'
    });
  }
};

// Verify password reset token
const verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบ Token รีเซ็ตรหัสผ่าน'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    req.resetUserId = decoded.userId;
    req.resetUserRole = decoded.role;
    
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Token รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ'
    });
  }
};

module.exports = {
  verifyToken,
  isAuthenticated,
  authorize,
  checkOwnership,
  verifyEmailToken,
  verifyResetToken
};
