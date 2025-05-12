const Chat = require('../models/chat');
const { v4: uuidv4 } = require('uuid');

// Get all chats for a user
const getAllChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const chats = await Chat.find({ userId }, 'chatId title createdAt updatedAt');
        
        return res.status(200).json({ chats });
    } catch (error) {
        console.error('Error retrieving chats:', error);
        return res.status(500).json({ message: 'Error retrieving chats' });
    }
};

// Create a new chat
const createChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title } = req.body;
        
        const chat = new Chat({
            userId,
            chatId: uuidv4(),
            title: title || 'New Chat',
            messages: []
        });
        
        await chat.save();
        return res.status(201).json(chat);
    } catch (error) {
        console.error('Error creating chat:', error);
        return res.status(500).json({ message: 'Error creating chat' });
    }
};

// Get chat history for a specific chat
const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        
        const chatHistory = await Chat.findOne({ userId, chatId });
        
        if (!chatHistory) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        
        return res.status(200).json({ 
            chatId: chatHistory.chatId,
            title: chatHistory.title,
            messages: chatHistory.messages 
        });
    } catch (error) {
        console.error('Error retrieving chat history:', error);
        return res.status(500).json({ message: 'Error retrieving chat history' });
    }
};

// Update chat title
const updateChatTitle = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        const { title } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        
        const updatedChat = await Chat.findOneAndUpdate(
            { userId, chatId },
            { $set: { title } },
            { new: true }
        );
        
        if (!updatedChat) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        
        return res.status(200).json({ 
            chatId: updatedChat.chatId,
            title: updatedChat.title
        });
    } catch (error) {
        console.error('Error updating chat title:', error);
        return res.status(500).json({ message: 'Error updating chat title' });
    }
};

// Save a new message to a specific chat
const saveMessage = async (userId, chatId, message) => {
    try {
        let chat = await Chat.findOne({ userId, chatId });
        
        if (!chat) {
            chat = new Chat({
                userId,
                chatId,
                messages: []
            });
        }
        
        chat.messages.push(message);
        await chat.save();
        return chat;
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
};


// Delete a chat
const deleteChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        
        const result = await Chat.findOneAndDelete({ userId, chatId });
        
        if (!result) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        
        return res.status(200).json({ message: 'Chat deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        return res.status(500).json({ message: 'Error deleting chat' });
    }
};

module.exports = {
    getAllChats,
    createChat,
    getChatHistory,
    updateChatTitle,
    saveMessage,
    clearChatHistory,
    deleteChat
}; 