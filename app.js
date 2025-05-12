const express = require('express');
const bodyParser = require('body-parser');
const environment = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dbConfig = require('./config/dbConfig');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { saveMessage } = require('./controllers/chatController');
const { processLLMRequest } = require('./utils/llmService');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

environment.config();
dbConfig.run();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);

// Server-side code
io.use((socket, next) => {
    try {
        // Check for token in handshake query or headers
        const token = socket.handshake.query.token ||
                      socket.handshake.headers.authorization;

        if (!token) {
            socket.user = { id: 'anonymous' };
            return next();
        }

        // Verify JWT token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new Error('Authentication error'));
            }

            // Set authenticated user info on socket
            socket.user = {
                id: decoded.id,
                username: decoded.username,
                role: decoded.role
            };
            next();
        });
    } catch (error) {
        console.error('Socket authentication error:', error);
        return next(new Error('Authentication error'));
    }
});
// Socket.IO events
io.on('connection', (socket) => {
    console.log('New client connected: ' + socket.id);
    
    // Handle user message
    socket.on('message', async (data) => {
        try {
            const { content, chatId } = JSON.parse(data);
            console.log('Received message:', data);

            // Validate content exists
            if (!content || content.trim() === '') {
                socket.emit('error', { message: 'Message content cannot be empty' });
                return;
            }

            const userId = socket.user.id;
            
            // If no chatId is provided, create a new one
            const activeChatId = chatId || uuidv4();
            
            // Save user message to database
            const userMessage = {
                role: 'user',
                content,
                timestamp: new Date()
            };
            console.log(userId)
            await saveMessage(userId, activeChatId, userMessage);
            
            // Get chat history
            const Chat = require('./models/chat');
            const chatHistory = await Chat.findOne({ userId, chatId: activeChatId });
            const messages = chatHistory ? chatHistory.messages : [];
            
            // Process with LLM service
            const llmResponse = await processLLMRequest(messages);
            
            // Save LLM response to database
            await saveMessage(userId, activeChatId, llmResponse);
            
            // Send response back to client
            socket.emit('llm-response',  JSON.stringify({
                chatId: activeChatId,
                message: llmResponse
            }));
        } catch (error) {
            console.error('Error processing message:', error);
            socket.emit('error', { message: 'Failed to process message' });
        }
    });
    
    // Join a specific chat room
    socket.on('join-chat', (chatId) => {
        // Optional: You can implement room joining for multi-user chats
        socket.join(chatId);
        console.log(`User ${socket.user.id} joined chat: ${chatId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected: ' + socket.id);
    });
});

server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});