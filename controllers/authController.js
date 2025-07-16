// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const { sendEmail } = require('../utils/email');
const { generateOTP } = require('../utils/otp');

class AuthController {
  // Register new user
  async register(req, res) {
    try {
      const { email, password, role, firstName, lastName, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'อีเมลนี้ถูกใช้งานแล้ว'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        role,
        firstName,
        lastName,
        phone,
        isActive: true,
        emailVerified: false
      });

      // Create role-specific profile
      if (role === 'trainer') {
        await Trainer.create({
          userId: user._id,
          bio: '',
          specializations: [],
          certifications: [],
          experience: 0,
          rating: 0,
          totalReviews: 0
        });
      } else if (role === 'client') {
        await Client.create({
          userId: user._id,
          goals: [],
          healthConditions: [],
          fitnessLevel: 'beginner'
        });
      }

      // Generate verification token
      const verificationToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Send verification email
      await sendEmail({
        to: email,
        subject: 'ยืนยันอีเมลของคุณ',
        template: 'emailVerification',
        data: {
          name: firstName,
          verificationLink: `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`
        }
      });

      res.status(201).json({
        success: true,
        message: 'ลงทะเบียนสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี',
        userId: user._id
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลงทะเบียน'
      });
    }
  }

  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user with profile
      const user = await User.findOne({ email })
        .select('+password')
        .populate(user.role === 'trainer' ? 'trainerProfile' : 'clientProfile');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'บัญชีของคุณถูกระงับการใช้งาน'
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
      );

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      res.json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      });
    }
  }

  // Logout
  async logout(req, res) {
    try {
      // In a real application, you might want to blacklist the token
      res.json({
        success: true,
        message: 'ออกจากระบบสำเร็จ'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการออกจากระบบ'
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'ไม่พบ refresh token'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'ผู้ใช้ไม่ถูกต้อง'
        });
      }

      // Generate new access token
      const newAccessToken = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Refresh token ไม่ถูกต้อง'
      });
    }
  }

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบอีเมลนี้ในระบบ'
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send reset email
      await sendEmail({
        to: email,
        subject: 'รีเซ็ตรหัสผ่าน',
        template: 'passwordReset',
        data: {
          name: user.firstName,
          resetLink: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
        }
      });

      res.json({
        success: true,
        message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งอีเมล'
      });
    }
  }

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await User.findByIdAndUpdate(decoded.userId, {
        password: hashedPassword
      });

      res.json({
        success: true,
        message: 'รีเซ็ตรหัสผ่านสำเร็จ'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(400).json({
        success: false,
        message: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ'
      });
    }
  }

  // Verify email
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Update email verification status
      await User.findByIdAndUpdate(decoded.userId, {
        emailVerified: true,
        emailVerifiedAt: new Date()
      });

      res.json({
        success: true,
        message: 'ยืนยันอีเมลสำเร็จ'
      });

    } catch (error) {
      console.error('Verify email error:', error);
      res.status(400).json({
        success: false,
        message: 'ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุ'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      // Find user
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      user.password = hashedPassword;
      await user.save();

      res.json({
        success: true,
        message: 'เปลี่ยนรหัสผ่านสำเร็จ'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'
      });
    }
  }
}

module.exports = new AuthController();
