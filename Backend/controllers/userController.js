// controllers/userController.js
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

class UserController {
  // Get current user profile
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId)
        .populate(req.user.role === 'trainer' ? 'trainerProfile' : 'clientProfile')
        .select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        address,
        emergencyContact
      } = req.body;

      const updateData = {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        address,
        emergencyContact,
        updatedAt: new Date()
      };

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'อัพเดทข้อมูลสำเร็จ',
        data: user
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล'
      });
    }
  }

  // Upload profile picture
  async uploadProfilePicture(req, res) {
    try {
      const userId = req.user.userId;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกรูปภาพ'
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      // Delete old profile picture if exists
      if (user.profilePicture && user.profilePicture.publicId) {
        await deleteFromCloudinary(user.profilePicture.publicId);
      }

      // Upload new picture
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'profile-pictures',
        transformation: [
          { width: 400, height: 400, crop: 'fill' }
        ]
      });

      // Update user profile picture
      user.profilePicture = {
        url: result.secure_url,
        publicId: result.public_id
      };
      await user.save();

      res.json({
        success: true,
        message: 'อัพโหลดรูปโปรไฟล์สำเร็จ',
        data: {
          profilePicture: user.profilePicture
        }
      });

    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ'
      });
    }
  }

  // Delete profile picture
  async deleteProfilePicture(req, res) {
    try {
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      if (user.profilePicture && user.profilePicture.publicId) {
        await deleteFromCloudinary(user.profilePicture.publicId);
        user.profilePicture = null;
        await user.save();
      }

      res.json({
        success: true,
        message: 'ลบรูปโปรไฟล์สำเร็จ'
      });

    } catch (error) {
      console.error('Delete profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบรูปภาพ'
      });
    }
  }

  // Update notification settings
  async updateNotificationSettings(req, res) {
    try {
      const userId = req.user.userId;
      const settings = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          notificationSettings: settings,
          updatedAt: new Date()
        },
        { new: true }
      ).select('notificationSettings');

      res.json({
        success: true,
        message: 'อัพเดทการตั้งค่าการแจ้งเตือนสำเร็จ',
        data: user.notificationSettings
      });

    } catch (error) {
      console.error('Update notification settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า'
      });
    }
  }

  // Update privacy settings
  async updatePrivacySettings(req, res) {
    try {
      const userId = req.user.userId;
      const settings = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          privacySettings: settings,
          updatedAt: new Date()
        },
        { new: true }
      ).select('privacySettings');

      res.json({
        success: true,
        message: 'อัพเดทการตั้งค่าความเป็นส่วนตัวสำเร็จ',
        data: user.privacySettings
      });

    } catch (error) {
      console.error('Update privacy settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า'
      });
    }
  }

  // Get user by ID (public profile)
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id)
        .select('firstName lastName profilePicture role createdAt')
        .populate({
          path: 'trainerProfile',
          select: 'bio specializations experience rating totalReviews'
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      // Check privacy settings
      if (user.privacySettings && !user.privacySettings.profileVisibility) {
        return res.status(403).json({
          success: false,
          message: 'โปรไฟล์นี้เป็นส่วนตัว'
        });
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้'
      });
    }
  }

  // Deactivate account
  async deactivateAccount(req, res) {
    try {
      const userId = req.user.userId;
      const { password, reason } = req.body;

      // Verify password
      const user = await User.findById(userId).select('+password');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'รหัสผ่านไม่ถูกต้อง'
        });
      }

      // Deactivate account
      user.isActive = false;
      user.deactivatedAt = new Date();
      user.deactivationReason = reason;
      await user.save();

      res.json({
        success: true,
        message: 'ปิดการใช้งานบัญชีสำเร็จ'
      });

    } catch (error) {
      console.error('Deactivate account error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการปิดการใช้งานบัญชี'
      });
    }
  }

  // Reactivate account
  async reactivateAccount(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'รหัสผ่านไม่ถูกต้อง'
        });
      }

      // Reactivate account
      user.isActive = true;
      user.deactivatedAt = null;
      user.deactivationReason = null;
      await user.save();

      res.json({
        success: true,
        message: 'เปิดใช้งานบัญชีอีกครั้งสำเร็จ'
      });

    } catch (error) {
      console.error('Reactivate account error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเปิดใช้งานบัญชี'
      });
    }
  }
}

module.exports = new UserController();
