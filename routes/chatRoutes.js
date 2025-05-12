const express = require('express');
const router = express.Router();
const { 
    getAllChats, 
    createChat, 
    getChatHistory, 
    updateChatTitle,
    deleteChat
} = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/chats', getAllChats);
router.post('/chats', createChat);
router.get('/chats/:chatId', getChatHistory);
router.patch('/chats/:chatId', updateChatTitle);
router.delete('/chats/:chatId', deleteChat);

module.exports = router; 