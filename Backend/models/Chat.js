const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['client', 'trainer', 'admin'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeenAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'support'],
    default: 'direct'
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      text: String,
      attachments: [{
        type: {
          type: String,
          enum: ['image', 'video', 'audio', 'document', 'location']
        },
        url: String,
        publicId: String,
        fileName: String,
        fileSize: Number,
        mimeType: String,
        thumbnail: String,
        location: {
          latitude: Number,
          longitude: Number,
          address: String
        }
      }]
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'system'],
      default: 'text'
    },
    status: {
      sent: {
        type: Boolean,
        default: true
      },
      delivered: {
        type: Boolean,
        default: false
      },
      read: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      readAt: Date
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat.messages'
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date,
    type: String
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  settings: {
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    blockedAt: Date,
    isMuted: {
      type: Map,
      of: {
        muted: Boolean,
        mutedUntil: Date
      },
      default: {}
    },
    isArchived: {
      type: Map,
      of: Boolean,
      default: {}
    },
    isPinned: {
      type: Map,
      of: Boolean,
      default: {}
    }
  },
  metadata: {
    platform: {
      type: String,
      enum: ['web', 'mobile', 'admin']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ booking: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ 'messages.timestamp': -1 });
chatSchema.index({ isActive: 1 });

// Update last message on new message
chatSchema.methods.addMessage = async function(senderId, content, type = 'text') {
  const message = {
    sender: senderId,
    content: content,
    type: type,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  
  // Update last message
  this.lastMessage = {
    content: type === 'text' ? content.text : `[${type}]`,
    sender: senderId,
    timestamp: message.timestamp,
    type: type
  };
  
  // Update unread count for all participants except sender
  this.participants.forEach(participant => {
    if (participant.user.toString() !== senderId.toString()) {
      const currentCount = this.unreadCount.get(participant.user.toString()) || 0;
      this.unreadCount.set(participant.user.toString(), currentCount + 1);
    }
  });
  
  await this.save();
  return message;
};

// Mark messages as read
chatSchema.methods.markAsRead = async function(userId) {
  let updated = false;
  
  // Reset unread count for this user
  if (this.unreadCount.has(userId.toString())) {
    this.unreadCount.set(userId.toString(), 0);
    updated = true;
  }
  
  // Mark unread messages as read
  const now = new Date();
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString() && 
        !message.status.read && 
        !message.isDeleted) {
      message.status.read = true;
      message.status.readAt = now;
      updated = true;
    }
  });
  
  // Update participant's last seen
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  if (participant) {
    participant.lastSeenAt = now;
    updated = true;
  }
  
  if (updated) {
    await this.save();
  }
};

// Get conversation between two users
chatSchema.statics.getOrCreateConversation = async function(user1Id, user2Id, bookingId = null) {
  // Find existing conversation
  let conversation = await this.findOne({
    type: 'direct',
    'participants.user': { $all: [user1Id, user2Id] },
    participants: { $size: 2 }
  }).populate('participants.user', 'name profileImage role');
  
  if (!conversation) {
    // Get user details
    const User = require('./User');
    const [user1, user2] = await Promise.all([
      User.findById(user1Id),
      User.findById(user2Id)
    ]);
    
    // Create new conversation
    conversation = new this({
      participants: [
        { user: user1Id, role: user1.role },
        { user: user2Id, role: user2.role }
      ],
      booking: bookingId,
      type: 'direct',
      metadata: {
        createdBy: user1Id
      }
    });
    
    await conversation.save();
    await conversation.populate('participants.user', 'name profileImage role');
  }
  
  return conversation;
};

// Get user's conversations
chatSchema.statics.getUserConversations = async function(userId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    includeArchived = false,
    onlyUnread = false
  } = options;
  
  const query = {
    'participants.user': userId,
    isActive: true
  };
  
  if (!includeArchived) {
    query[`settings.isArchived.${userId}`] = { $ne: true };
  }
  
  const conversations = await this.find(query)
    .sort({ 'lastMessage.timestamp': -1 })
    .limit(limit)
    .skip(skip)
    .populate('participants.user', 'name profileImage role isActive')
    .populate('booking', 'bookingNumber package')
    .populate('lastMessage.sender', 'name');
  
  // Filter by unread if requested
  if (onlyUnread) {
    return conversations.filter(conv => 
      (conv.unreadCount.get(userId.toString()) || 0) > 0
    );
  }
  
  return conversations;
};

// Delete message
chatSchema.methods.deleteMessage = async function(messageId, userId) {
  const message = this.messages.id(messageId);
  
  if (!message) {
    throw new Error('Message not found');
  }
  
  // Only sender can delete their own message
  if (message.sender.toString() !== userId.toString()) {
    throw new Error('Unauthorized to delete this message');
  }
  
  message.isDeleted = true;
  message.deletedAt = new Date();
  message.deletedBy = userId;
  
  await this.save();
  return message;
};

// Block/Unblock conversation
chatSchema.methods.toggleBlock = async function(userId) {
  if (this.settings.isBlocked) {
    // Unblock
    this.settings.isBlocked = false;
    this.settings.blockedBy = undefined;
    this.settings.blockedAt = undefined;
  } else {
    // Block
    this.settings.isBlocked = true;
    this.settings.blockedBy = userId;
    this.settings.blockedAt = new Date();
  }
  
  await this.save();
  return this.settings.isBlocked;
};

// Archive/Unarchive conversation for a user
chatSchema.methods.toggleArchive = async function(userId) {
  const isArchived = this.settings.isArchived.get(userId.toString()) || false;
  this.settings.isArchived.set(userId.toString(), !isArchived);
  
  await this.save();
  return !isArchived;
};

// Pin/Unpin conversation for a user
chatSchema.methods.togglePin = async function(userId) {
  const isPinned = this.settings.isPinned.get(userId.toString()) || false;
  this.settings.isPinned.set(userId.toString(), !isPinned);
  
  await this.save();
  return !isPinned;
};

// Mute notifications for a user
chatSchema.methods.muteNotifications = async function(userId, duration = null) {
  const muteSettings = {
    muted: true,
    mutedUntil: duration ? new Date(Date.now() + duration) : null
  };
  
  this.settings.isMuted.set(userId.toString(), muteSettings);
  await this.save();
};

module.exports = mongoose.model('Chat', chatSchema);