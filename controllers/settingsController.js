// controllers/settingsController.js
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const SystemSettings = require('../models/SystemSettings');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utils/email');
const { validatePassword } = require('../utils/validation');

class SettingsController {
  // ==================== USER SETTINGS ====================
  
  // Get all user settings
  async getUserSettings(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;

      const user = await User.findById(userId)
        .select('-password')
        .populate(userRole === 'trainer' ? 'trainerProfile' : 'clientProfile');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      const settings = {
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          profilePicture: user.profilePicture,
          address: user.address
        },
        account: {
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        notifications: user.notificationSettings || this.getDefaultNotificationSettings(),
        privacy: user.privacySettings || this.getDefaultPrivacySettings(),
        preferences: user.preferences || this.getDefaultPreferences()
      };

      // Add role-specific settings
      if (userRole === 'trainer' && user.trainerProfile) {
        settings.trainer = {
          workingHours: user.trainerProfile.workingHours,
          autoAcceptBookings: user.trainerProfile.autoAcceptBookings,
          instantBooking: user.trainerProfile.instantBooking,
          cancellationPolicy: user.trainerProfile.cancellationPolicy,
          paymentSettings: user.trainerProfile.paymentSettings
        };
      } else if (userRole === 'client' && user.clientProfile) {
        settings.client = {
          goals: user.clientProfile.goals,
          preferences: user.clientProfile.preferences,
          reminderSettings: user.clientProfile.reminderSettings
        };
      }

      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      console.error('Get user settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า'
      });
    }
  }

  // Update profile settings
  async updateProfileSettings(req, res) {
    try {
      const userId = req.user.userId;
      const allowedUpdates = [
        'firstName', 'lastName', 'phone', 
        'dateOfBirth', 'gender', 'address'
      ];

      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});

      const user = await User.findByIdAndUpdate(
        userId,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'อัพเดทข้อมูลส่วนตัวสำเร็จ',
        data: user
      });

    } catch (error) {
      console.error('Update profile settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล'
      });
    }
  }

  // Update email
  async updateEmail(req, res) {
    try {
      const userId = req.user.userId;
      const { newEmail, password } = req.body;

      // Verify password
      const user = await User.findById(userId).select('+password');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'รหัสผ่านไม่ถูกต้อง'
        });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'อีเมลนี้ถูกใช้งานแล้ว'
        });
      }

      // Generate verification token
      const verificationToken = Math.random().toString(36).substring(2, 15);
      
      // Save new email and token
      user.pendingEmail = newEmail;
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // Send verification email
      await sendEmail({
        to: newEmail,
        subject: 'ยืนยันอีเมลใหม่ของคุณ',
        template: 'emailChange',
        data: {
          name: user.firstName,
          verificationLink: `${process.env.CLIENT_URL}/verify-email-change?token=${verificationToken}`
        }
      });

      res.json({
        success: true,
        message: 'ส่งลิงก์ยืนยันไปยังอีเมลใหม่แล้ว'
      });

    } catch (error) {
      console.error('Update email error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเปลี่ยนอีเมล'
      });
    }
  }

  // Update password
  async updatePassword(req, res) {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message
        });
      }

      // Verify current password
      const user = await User.findById(userId).select('+password');
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
        });
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      await user.save();

      // Send notification email
      await sendEmail({
        to: user.email,
        subject: 'รหัสผ่านของคุณถูกเปลี่ยนแล้ว',
        template: 'passwordChanged',
        data: {
          name: user.firstName,
          changedAt: new Date().toLocaleString('th-TH')
        }
      });

      res.json({
        success: true,
        message: 'เปลี่ยนรหัสผ่านสำเร็จ'
      });

    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'
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

  // Enable/disable two-factor authentication
  async toggleTwoFactor(req, res) {
    try {
      const userId = req.user.userId;
      const { enable, password } = req.body;

      // Verify password
      const user = await User.findById(userId).select('+password');
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'รหัสผ่านไม่ถูกต้อง'
        });
      }

      if (enable) {
        // Generate 2FA secret
        const speakeasy = require('speakeasy');
        const secret = speakeasy.generateSecret({
          name: `FitConnect (${user.email})`
        });

        user.twoFactorSecret = secret.base32;
        user.twoFactorEnabled = false; // Will be enabled after verification
        await user.save();

        res.json({
          success: true,
          message: 'กรุณาสแกน QR Code เพื่อตั้งค่า 2FA',
          data: {
            secret: secret.base32,
            qrCode: secret.otpauth_url
          }
        });
      } else {
        // Disable 2FA
        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        await user.save();

        res.json({
          success: true,
          message: 'ปิดการใช้งาน 2FA สำเร็จ'
        });
      }

    } catch (error) {
      console.error('Toggle two factor error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการตั้งค่า 2FA'
      });
    }
  }

  // ==================== TRAINER SETTINGS ====================

  // Update trainer working hours
  async updateWorkingHours(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { workingHours } = req.body;

      const trainer = await Trainer.findByIdAndUpdate(
        trainerId,
        { workingHours },
        { new: true }
      );

      res.json({
        success: true,
        message: 'อัพเดทเวลาทำงานสำเร็จ',
        data: trainer.workingHours
      });

    } catch (error) {
      console.error('Update working hours error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทเวลาทำงาน'
      });
    }
  }

  // Update trainer booking settings
  async updateBookingSettings(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const {
        autoAcceptBookings,
        instantBooking,
        cancellationPolicy,
        advanceBookingDays,
        minBookingNotice,
        maxBookingsPerDay
      } = req.body;

      const trainer = await Trainer.findByIdAndUpdate(
        trainerId,
        {
          autoAcceptBookings,
          instantBooking,
          cancellationPolicy,
          advanceBookingDays,
          minBookingNotice,
          maxBookingsPerDay
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'อัพเดทการตั้งค่าการจองสำเร็จ',
        data: {
          autoAcceptBookings: trainer.autoAcceptBookings,
          instantBooking: trainer.instantBooking,
          cancellationPolicy: trainer.cancellationPolicy,
          advanceBookingDays: trainer.advanceBookingDays,
          minBookingNotice: trainer.minBookingNotice,
          maxBookingsPerDay: trainer.maxBookingsPerDay
        }
      });

    } catch (error) {
      console.error('Update booking settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า'
      });
    }
  }

  // Update trainer payment settings
  async updatePaymentSettings(req, res) {
    try {
      const trainerId = req.user.trainerId;
      const { bankAccount, promptPay, paypalEmail } = req.body;

      const trainer = await Trainer.findByIdAndUpdate(
        trainerId,
        {
          paymentSettings: {
            bankAccount,
            promptPay,
            paypalEmail,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'อัพเดทข้อมูลการชำระเงินสำเร็จ',
        data: trainer.paymentSettings
      });

    } catch (error) {
      console.error('Update payment settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลการชำระเงิน'
      });
    }
  }

  // ==================== CLIENT SETTINGS ====================

  // Update client goals
  async updateClientGoals(req, res) {
    try {
      const clientId = req.user.clientId;
      const { goals, targetWeight, targetDate } = req.body;

      const client = await Client.findByIdAndUpdate(
        clientId,
        {
          goals,
          targetWeight,
          targetDate,
          updatedAt: new Date()
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'อัพเดทเป้าหมายสำเร็จ',
        data: {
          goals: client.goals,
          targetWeight: client.targetWeight,
          targetDate: client.targetDate
        }
      });

    } catch (error) {
      console.error('Update client goals error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทเป้าหมาย'
      });
    }
  }

  // Update client preferences
  async updateClientPreferences(req, res) {
    try {
      const clientId = req.user.clientId;
      const {
        preferredWorkoutTime,
        preferredTrainerGender,
        workoutLocation,
        equipment,
        interests
      } = req.body;

      const client = await Client.findByIdAndUpdate(
        clientId,
        {
          preferences: {
            preferredWorkoutTime,
            preferredTrainerGender,
            workoutLocation,
            equipment,
            interests
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'อัพเดทความชอบสำเร็จ',
        data: client.preferences
      });

    } catch (error) {
      console.error('Update client preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทความชอบ'
      });
    }
  }

  // Update reminder settings
  async updateReminderSettings(req, res) {
    try {
      const clientId = req.user.clientId;
      const {
        workoutReminder,
        mealReminder,
        waterReminder,
        progressReminder,
        reminderTimes
      } = req.body;

      const client = await Client.findByIdAndUpdate(
        clientId,
        {
          reminderSettings: {
            workoutReminder,
            mealReminder,
            waterReminder,
            progressReminder,
            reminderTimes
          }
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'อัพเดทการตั้งค่าการเตือนสำเร็จ',
        data: client.reminderSettings
      });

    } catch (error) {
      console.error('Update reminder settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า'
      });
    }
  }

  // ==================== SYSTEM SETTINGS (Admin) ====================

  // Get system settings
  async getSystemSettings(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์เข้าถึง'
        });
      }

      const settings = await SystemSettings.findOne() || this.getDefaultSystemSettings();

      res.json({
        success: true,
        data: settings
      });

    } catch (error) {
      console.error('Get system settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่าระบบ'
      });
    }
  }

  // Update system settings
  async updateSystemSettings(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'ไม่มีสิทธิ์เข้าถึง'
        });
      }

      const updates = req.body;
      
      let settings = await SystemSettings.findOne();
      if (!settings) {
        settings = await SystemSettings.create(updates);
      } else {
        Object.assign(settings, updates);
        settings.updatedAt = new Date();
        settings.updatedBy = req.user.userId;
        await settings.save();
      }

      res.json({
        success: true,
        message: 'อัพเดทการตั้งค่าระบบสำเร็จ',
        data: settings
      });

    } catch (error) {
      console.error('Update system settings error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่าระบบ'
      });
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  // Get default notification settings
  getDefaultNotificationSettings() {
    return {
      email: {
        bookings: true,
        messages: true,
        reminders: true,
        marketing: false,
        updates: true
      },
      push: {
        bookings: true,
        messages: true,
        reminders: true,
        marketing: false,
        updates: true
      },
      sms: {
        bookings: true,
        reminders: true,
        urgent: true
      }
    };
  }

  // Get default privacy settings
  getDefaultPrivacySettings() {
    return {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showProgress: false,
      allowMessages: 'all',
      searchable: true
    };
  }

  // Get default preferences
  getDefaultPreferences() {
    return {
      language: 'th',
      timezone: 'Asia/Bangkok',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      currency: 'THB',
      measurementUnit: 'metric'
    };
  }

  // Get default system settings
  getDefaultSystemSettings() {
    return {
      platform: {
        name: 'FitConnect',
        logo: null,
        favicon: null,
        primaryColor: '#232956',
        secondaryColor: '#df2528'
      },
      commission: {
        rate: 0.20,
        minPayout: 1000,
        payoutSchedule: 'weekly'
      },
      booking: {
        minAdvanceBooking: 1, // hours
        maxAdvanceBooking: 30, // days
        cancellationWindow: 24, // hours
        rescheduleWindow: 24, // hours
        maxReschedules: 3
      },
      trainer: {
        maxPackages: 3,
        maxGalleryImages: 12,
        requireVerification: true,
        verificationDocuments: ['certificate', 'id']
      },
      client: {
        freeTrialDays: 7,
        referralBonus: 100,
        loyaltyProgram: true
      },
      payment: {
        methods: ['credit_card', 'bank_transfer', 'promptpay'],
        currency: 'THB',
        taxRate: 0.07
      },
      email: {
        fromName: 'FitConnect',
        fromEmail: 'noreply@fitconnect.com',
        supportEmail: 'support@fitconnect.com'
      },
      features: {
        chat: true,
        video: false,
        analytics: true,
        marketplace: true
      }
    };
  }

  // Export user data (GDPR compliance)
  async exportUserData(req, res) {
    try {
      const userId = req.user.userId;
      
      // Collect all user data
      const [
        user,
        bookings,
        payments,
        messages,
        reviews,
        progress
      ] = await Promise.all([
        User.findById(userId).select('-password'),
        Booking.find({ $or: [{ clientId: userId }, { trainerId: userId }] }),
        Payment.find({ $or: [{ clientId: userId }, { trainerId: userId }] }),
        Message.find({ sender: userId }),
        Review.find({ $or: [{ clientId: userId }, { trainerId: userId }] }),
        Progress.find({ clientId: userId })
      ]);

      const exportData = {
        user,
        bookings,
        payments,
        messages,
        reviews,
        progress,
        exportedAt: new Date()
      };

      res.json({
        success: true,
        message: 'ส่งออกข้อมูลสำเร็จ',
        data: exportData
      });

    } catch (error) {
      console.error('Export user data error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งออกข้อมูล'
      });
    }
  }

  // Delete user account
  async deleteAccount(req, res) {
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

      // Soft delete account
      user.isActive = false;
      user.deletedAt = new Date();
      user.deletionReason = reason;
      await user.save();

      // Cancel active bookings
      await Booking.updateMany(
        {
          $or: [{ clientId: userId }, { trainerId: userId }],
          status: { $in: ['pending', 'confirmed'] },
          sessionDate: { $gte: new Date() }
        },
        {
          status: 'cancelled',
          cancellationReason: 'Account deleted',
          cancelledAt: new Date()
        }
      );

      res.json({
        success: true,
        message: 'ลบบัญชีสำเร็จ'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบบัญชี'
      });
    }
  }
}

module.exports = new SettingsController();
