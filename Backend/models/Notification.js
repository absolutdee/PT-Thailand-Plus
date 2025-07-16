const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      // Booking related
      'booking-request',
      'booking-confirmed',
      'booking-cancelled',
      'booking-reminder',
      'session-completed',
      'session-rescheduled',
      
      // Payment related
      'payment-received',
      'payment-failed',
      'payment-refunded',
      'invoice-generated',
      
      // Communication
      'new-message',
      'message-read',
      
      // Reviews
      'new-review',
      'review-response',
      
      // System
      'profile-approved',
      'profile-rejected',
      'document-verified',
      'subscription-expiring',
      'subscription-renewed',
      'password-changed',
      'login-new-device',
      
      // Marketing
      'new-offer',
      'event-invitation',
      'newsletter',
      'tips-advice',
      
      // Trainer specific
      'new-client-request',
      'client-progress-update',
      'package-views',
      'earnings-report',
      
      // Client specific
      'workout-reminder',
      'nutrition-update',
      'goal-achieved',
      'trainer-availability',
      
      // Admin
      'system-update',
      'policy-change',
      'verification-required'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    entityType: {
      type: String,
      enum: ['booking', 'user', 'trainer', 'package', 'review', 'chat', 'event', 'article']
    },
    entityId: mongoose.Schema.Types.ObjectId,
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },
  channels: {
    inApp: {
      sent: {
        type: Boolean,
        default: true
      },
      read: {
        type: Boolean,
        default: false
      },
      readAt: Date
    },
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      template: String,
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']
      },
      messageId: String
    },
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed']
      },
      messageId: String,
      cost: Number
    },
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      tokens: [{
        token: String,
        platform: {
          type: String,
          enum: ['ios', 'android', 'web']
        },
        status: String
      }],
      opened: {
        type: Boolean,
        default: false
      },
      openedAt: Date
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['transactional', 'promotional', 'informational', 'reminder'],
    default: 'informational'
  },
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    scheduledFor: Date,
    timezone: {
      type: String,
      default: 'Asia/Bangkok'
    }
  },
  grouping: {
    groupId: String,
    groupType: {
      type: String,
      enum: ['bulk', 'campaign', 'automated']
    },
    totalInGroup: Number
  },
  expiry: {
    expiresAt: Date,
    isExpired: {
      type: Boolean,
      default: false
    }
  },
  actions: [{
    label: String,
    action: {
      type: String,
      enum: ['navigate', 'external-link', 'dismiss', 'custom']
    },
    url: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  delivery: {
    attempts: {
      type: Number,
      default: 0
    },
    lastAttemptAt: Date,
    errors: [{
      channel: String,
      error: String,
      timestamp: Date
    }]
  },
  interaction: {
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: Date,
    dismissed: {
      type: Boolean,
      default: false
    },
    dismissedAt: Date
  },
  preferences: {
    allowEmail: {
      type: Boolean,
      default: true
    },
    allowSms: {
      type: Boolean,
      default: true
    },
    allowPush: {
      type: Boolean,
      default: true
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, 'channels.inApp.read': 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ 'schedule.scheduledFor': 1 });
notificationSchema.index({ 'grouping.groupId': 1 });
notificationSchema.index({ isDeleted: 1 });
notificationSchema.index({ 'expiry.expiresAt': 1, 'expiry.isExpired': 1 });

// Check expiry before save
notificationSchema.pre('save', function(next) {
  if (this.expiry.expiresAt && new Date() > this.expiry.expiresAt) {
    this.expiry.isExpired = true;
  }
  next();
});

// Methods
notificationSchema.methods.markAsRead = async function() {
  if (!this.channels.inApp.read) {
    this.channels.inApp.read = true;
    this.channels.inApp.readAt = new Date();
    await this.save();
    return true;
  }
  return false;
};

notificationSchema.methods.markAsClicked = async function() {
  if (!this.interaction.clicked) {
    this.interaction.clicked = true;
    this.interaction.clickedAt = new Date();
    await this.save();
    return true;
  }
  return false;
};

notificationSchema.methods.markAsDismissed = async function() {
  if (!this.interaction.dismissed) {
    this.interaction.dismissed = true;
    this.interaction.dismissedAt = new Date();
    await this.save();
    return true;
  }
  return false;
};

notificationSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

notificationSchema.methods.sendViaChannel = async function(channel) {
  const now = new Date();
  
  switch (channel) {
    case 'email':
      // Implementation would integrate with email service
      this.channels.email.sent = true;
      this.channels.email.sentAt = now;
      this.channels.email.status = 'sent';
      break;
      
    case 'sms':
      // Implementation would integrate with SMS service
      this.channels.sms.sent = true;
      this.channels.sms.sentAt = now;
      this.channels.sms.status = 'sent';
      break;
      
    case 'push':
      // Implementation would integrate with push notification service
      this.channels.push.sent = true;
      this.channels.push.sentAt = now;
      break;
  }
  
  this.delivery.attempts += 1;
  this.delivery.lastAttemptAt = now;
  
  await this.save();
};

// Statics
notificationSchema.statics.createNotification = async function(data) {
  const {
    recipientId,
    senderId = null,
    type,
    title,
    message,
    entityType = null,
    entityId = null,
    actionUrl = null,
    priority = 'medium',
    category = 'informational',
    channels = ['inApp'],
    schedule = null,
    expiresIn = null
  } = data;
  
  const notification = new this({
    recipient: recipientId,
    sender: senderId,
    type,
    title,
    message,
    priority,
    category,
    data: {
      entityType,
      entityId,
      actionUrl
    }
  });
  
  // Set channel preferences
  if (channels.includes('email')) notification.channels.email.sent = false;
  if (channels.includes('sms')) notification.channels.sms.sent = false;
  if (channels.includes('push')) notification.channels.push.sent = false;
  
  // Set schedule if provided
  if (schedule) {
    notification.schedule.isScheduled = true;
    notification.schedule.scheduledFor = schedule;
  }
  
  // Set expiry if provided
  if (expiresIn) {
    notification.expiry.expiresAt = new Date(Date.now() + expiresIn);
  }
  
  await notification.save();
  return notification;
};

notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipient: userId,
    'channels.inApp.read': false,
    isDeleted: false,
    'expiry.isExpired': false
  });
};

notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    unreadOnly = false,
    type = null,
    category = null
  } = options;
  
  const query = {
    recipient: userId,
    isDeleted: false,
    'expiry.isExpired': false
  };
  
  if (unreadOnly) {
    query['channels.inApp.read'] = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('sender', 'name profileImage');
};

notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      'channels.inApp.read': false,
      isDeleted: false
    },
    {
      $set: {
        'channels.inApp.read': true,
        'channels.inApp.readAt': new Date()
      }
    }
  );
};

notificationSchema.statics.sendBulkNotifications = async function(notifications) {
  const bulkOps = notifications.map(notif => ({
    insertOne: {
      document: {
        ...notif,
        grouping: {
          groupId: new mongoose.Types.ObjectId().toString(),
          groupType: 'bulk',
          totalInGroup: notifications.length
        }
      }
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

notificationSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  
  return this.updateMany(
    {
      'expiry.expiresAt': { $lte: now },
      'expiry.isExpired': false
    },
    {
      $set: { 'expiry.isExpired': true }
    }
  );
};

notificationSchema.statics.getScheduledNotifications = async function() {
  const now = new Date();
  
  return this.find({
    'schedule.isScheduled': true,
    'schedule.scheduledFor': { $lte: now },
    isDeleted: false,
    'channels.inApp.sent': false
  });
};

// Helper method to create common notifications
notificationSchema.statics.notifyBookingConfirmed = async function(booking) {
  return this.createNotification({
    recipientId: booking.client,
    type: 'booking-confirmed',
    title: 'Booking Confirmed',
    message: `Your training session has been confirmed for ${booking.startDate}`,
    entityType: 'booking',
    entityId: booking._id,
    actionUrl: `/bookings/${booking._id}`,
    priority: 'high',
    channels: ['inApp', 'email', 'sms']
  });
};

notificationSchema.statics.notifyNewMessage = async function(chatId, senderId, recipientId, messagePreview) {
  return this.createNotification({
    recipientId: recipientId,
    senderId: senderId,
    type: 'new-message',
    title: 'New Message',
    message: messagePreview.substring(0, 100),
    entityType: 'chat',
    entityId: chatId,
    actionUrl: `/messages/${chatId}`,
    priority: 'medium',
    channels: ['inApp', 'push']
  });
};

module.exports = mongoose.model('Notification', notificationSchema);