// routes/chat.routes.js
const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { chatValidation } = require('../validations');
const upload = require('../middleware/upload');

// Apply authentication to all chat routes
router.use(authenticate);

// Chat List & Conversations
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId', chatController.getConversation);
router.post('/conversations', 
  validate(chatValidation.createConversation), 
  chatController.createConversation
);
router.delete('/conversations/:conversationId', chatController.deleteConversation);
router.put('/conversations/:conversationId/archive', chatController.archiveConversation);
router.put('/conversations/:conversationId/unarchive', chatController.unarchiveConversation);

// Messages
router.get('/conversations/:conversationId/messages', 
  validate(chatValidation.getMessages), 
  chatController.getMessages
);
router.post('/conversations/:conversationId/messages', 
  validate(chatValidation.sendMessage), 
  chatController.sendMessage
);
router.put('/messages/:messageId', 
  validate(chatValidation.updateMessage), 
  chatController.updateMessage
);
router.delete('/messages/:messageId', chatController.deleteMessage);

// Message Status
router.put('/conversations/:conversationId/read', chatController.markAsRead);
router.put('/messages/:messageId/delivered', chatController.markAsDelivered);
router.get('/unread-count', chatController.getUnreadCount);

// Typing Indicators
router.post('/conversations/:conversationId/typing', chatController.setTypingStatus);

// File Attachments
router.post('/conversations/:conversationId/attachments', 
  upload.single('file'), 
  chatController.uploadAttachment
);
router.get('/attachments/:attachmentId', chatController.getAttachment);
router.delete('/attachments/:attachmentId', chatController.deleteAttachment);

// Chat Settings
router.get('/settings', chatController.getChatSettings);
router.put('/settings', 
  validate(chatValidation.updateChatSettings), 
  chatController.updateChatSettings
);

// Block/Unblock Users
router.post('/block', 
  validate(chatValidation.blockUser), 
  chatController.blockUser
);
router.delete('/block/:userId', chatController.unblockUser);
router.get('/blocked-users', chatController.getBlockedUsers);

// Chat Search
router.get('/search', 
  validate(chatValidation.searchChats), 
  chatController.searchChats
);

// Chat Notifications
router.get('/notifications/settings', chatController.getNotificationSettings);
router.put('/notifications/settings', 
  validate(chatValidation.updateNotificationSettings), 
  chatController.updateNotificationSettings
);

// Message Reactions
router.post('/messages/:messageId/reactions', 
  validate(chatValidation.addReaction), 
  chatController.addReaction
);
router.delete('/messages/:messageId/reactions/:reaction', chatController.removeReaction);

// Voice Messages
router.post('/conversations/:conversationId/voice-message', 
  upload.single('audio'), 
  chatController.sendVoiceMessage
);

// Video Call Integration
router.post('/conversations/:conversationId/video-call/start', chatController.startVideoCall);
router.put('/conversations/:conversationId/video-call/end', chatController.endVideoCall);
router.get('/conversations/:conversationId/video-call/token', chatController.getVideoCallToken);

// Chat Reports
router.post('/messages/:messageId/report', 
  validate(chatValidation.reportMessage), 
  chatController.reportMessage
);
router.get('/reports', chatController.getChatReports);

// Export Chat History
router.get('/conversations/:conversationId/export', chatController.exportChatHistory);

module.exports = router;