// controllers/chatController.js
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Client = require('../models/Client');
const { sendNotification } = require('../utils/notification');
const { uploadToCloudinary } = require('../utils/cloudinary');

class ChatController {
  // Get or create chat
  async getOrCreateChat(req, res) {
    try {
      const userId = req.user.userId;
      const { participantId } = req.body;

      // Validate participant
      const participant = await User.findById(participantId);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบผู้ใช้'
        });
      }

      // Check if chat already exists
      let chat = await Chat.findOne({
        participants: { $all: [userId, participantId] }
      });

      if (!chat) {
        // Create new chat
        chat = await Chat.create({
          participants: [userId, participantId],
          lastMessage: null,
          lastMessageAt: new Date()
        });
      }

      // Populate participants
      await chat.populate({
        path: 'participants',
        select: 'firstName lastName profilePicture role'
      });

      res.json({
        success: true,
        data: chat
      });

    } catch (error) {
      console.error('Get or create chat error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างแชท'
      });
    }
  }

  // Get user chats
  async getUserChats(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const chats = await Chat.find({
        participants: userId
      })
        .populate({
          path: 'participants',
          select: 'firstName lastName profilePicture role lastSeen'
        })
        .populate({
          path: 'lastMessage',
          select: 'content type createdAt'
        })
        .sort({ lastMessageAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Add unread count for each chat
      const chatsWithUnread = await Promise.all(
        chats.map(async (chat) => {
          const unreadCount = await Message.countDocuments({
            chatId: chat._id,
            sender: { $ne: userId },
            readBy: { $ne: userId }
          });

          return {
            ...chat.toObject(),
            unreadCount
          };
        })
      );

      const totalCount = await Chat.countDocuments({
        participants: userId
      });

      res.json({
        success: true,
        data: {
          chats: chatsWithUnread,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get user chats error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแชท'
      });
    }
  }

  // Get chat messages
  async getChatMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Verify user is participant
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแชทหรือคุณไม่มีสิทธิ์'
        });
      }

      // Get messages
      const messages = await Message.find({ chatId })
        .populate('sender', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Mark messages as read
      await Message.updateMany(
        {
          chatId,
          sender: { $ne: userId },
          readBy: { $ne: userId }
        },
        {
          $addToSet: { readBy: userId },
          $set: { readAt: new Date() }
        }
      );

      const totalCount = await Message.countDocuments({ chatId });

      res.json({
        success: true,
        data: {
          messages: messages.reverse(), // Return in chronological order
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          }
        }
      });

    } catch (error) {
      console.error('Get chat messages error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลข้อความ'
      });
    }
  }

  // Send message
  async sendMessage(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;
      const { content, type = 'text' } = req.body;

      // Verify user is participant
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแชทหรือคุณไม่มีสิทธิ์'
        });
      }

      // Create message
      const message = await Message.create({
        chatId,
        sender: userId,
        content,
        type,
        readBy: [userId]
      });

      // Update chat last message
      chat.lastMessage = message._id;
      chat.lastMessageAt = new Date();
      await chat.save();

      // Populate sender info
      await message.populate('sender', 'firstName lastName profilePicture');

      // Send real-time notification via Socket.io
      const recipientId = chat.participants.find(p => p.toString() !== userId);
      
      // Send push notification
      const sender = await User.findById(userId);
      await sendNotification({
        userId: recipientId,
        title: `ข้อความใหม่จาก ${sender.firstName}`,
        message: type === 'text' ? content : 'ส่งรูปภาพ',
        type: 'new_message',
        relatedId: chatId
      });

      // Emit socket event (if socket.io is implemented)
      if (req.io) {
        req.io.to(recipientId).emit('new_message', {
          chatId,
          message
        });
      }

      res.status(201).json({
        success: true,
        data: message
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งข้อความ'
      });
    }
  }

  // Send image message
  async sendImageMessage(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกรูปภาพ'
        });
      }

      // Verify user is participant
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแชทหรือคุณไม่มีสิทธิ์'
        });
      }

      // Upload image
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'chat-images',
        transformation: [
          { width: 800, height: 800, crop: 'limit' }
        ]
      });

      // Create message
      const message = await Message.create({
        chatId,
        sender: userId,
        content: result.secure_url,
        type: 'image',
        metadata: {
          publicId: result.public_id,
          width: result.width,
          height: result.height
        },
        readBy: [userId]
      });

      // Update chat last message
      chat.lastMessage = message._id;
      chat.lastMessageAt = new Date();
      await chat.save();

      // Populate sender info
      await message.populate('sender', 'firstName lastName profilePicture');

      // Send notifications (similar to text message)
      const recipientId = chat.participants.find(p => p.toString() !== userId);
      const sender = await User.findById(userId);
      
      await sendNotification({
        userId: recipientId,
        title: `ข้อความใหม่จาก ${sender.firstName}`,
        message: 'ส่งรูปภาพ',
        type: 'new_message',
        relatedId: chatId
      });

      res.status(201).json({
        success: true,
        data: message
      });

    } catch (error) {
      console.error('Send image message error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งรูปภาพ'
      });
    }
  }

  // Mark messages as read
  async markAsRead(req, res) {
    try {
      const userId = req.user.userId;
      const { chatId } = req.params;
      const { messageIds } = req.body;

      // Verify user is participant
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบแชทหรือคุณไม่มีสิทธิ์'
        });
      }

      // Update messages
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          chatId,
          sender: { $ne: userId }
        },
        {
          $addToSet: { readBy: userId },
          $set: { readAt: new Date() }
        }
      );

      res.json({
        success: true,
        message: 'อ่านข้อความแล้ว'
      });

    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะการอ่าน'
      });
    }
  }

  // Delete message
  async deleteMessage(req, res) {
    try {
      const userId = req.user.userId;
      const { messageId } = req.params;

      const message = await Message.findOne({
        _id: messageId,
        sender: userId
      });

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบข้อความหรือคุณไม่มีสิทธิ์ลบ'
        });
      }

      // Check if message is not too old (e.g., 24 hours)
      const messageAge = (new Date() - message.createdAt) / (1000 * 60 * 60);
      if (messageAge > 24) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถลบข้อความที่ส่งมานานกว่า 24 ชั่วโมง'
        });
      }

      // Soft delete
      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      res.json({
        success: true,
        message: 'ลบข้อความสำเร็จ'
      });

    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการลบข้อความ'
      });
    }
  }

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;

      const unreadCount = await Message.countDocuments({
        chatId: { 
          $in: await Chat.find({ participants: userId }).distinct('_id') 
        },
        sender: { $ne: userId },
        readBy: { $ne: userId }
      });

      res.json({
        success: true,
        data: {
          unreadCount
        }
      });

    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการนับข้อความที่ยังไม่ได้อ่าน'
      });
    }
  }

  // Search messages
  async searchMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { query, chatId } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุคำค้นหา'
        });
      }

      // Get user's chats
      let chatIds;
      if (chatId) {
        // Verify user is participant
        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId
        });
        if (!chat) {
          return res.status(403).json({
            success: false,
            message: 'คุณไม่มีสิทธิ์ค้นหาในแชทนี้'
          });
        }
        chatIds = [chatId];
      } else {
        chatIds = await Chat.find({ participants: userId }).distinct('_id');
      }

      // Search messages
      const messages = await Message.find({
        chatId: { $in: chatIds },
        content: { $regex: query, $options: 'i' },
        type: 'text',
        isDeleted: { $ne: true }
      })
        .populate('sender', 'firstName lastName profilePicture')
        .populate('chatId', 'participants')
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({
        success: true,
        data: messages
      });

    } catch (error) {
      console.error('Search messages error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการค้นหาข้อความ'
      });
    }
  }
}

module.exports = new ChatController();
