# Chat Application Backend

This is the backend for a chat application that integrates with an LLM (Large Language Model) and stores chat history in MongoDB. It supports multiple chats per user.

## Features

- RESTful API for user and admin management
- Multiple chats support for each user
- Socket.IO integration for real-time chat
- LLM integration for AI-powered responses
- MongoDB storage for chat history
- JWT authentication

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   PORT=3000
   DB_CONFIG=mongodb://localhost:27017/chatbot
   JWT_SECRET=your_jwt_secret
   # Add your LLM API keys here (e.g., OPENAI_API_KEY)
   ```

3. Start the server:
   ```
   node app.js
   ```

## API Endpoints

### Chat API
- `GET /api/chat/chats` - Get all chats for the authenticated user
- `POST /api/chat/chats` - Create a new chat
- `GET /api/chat/chats/:chatId` - Get chat history for a specific chat
- `PATCH /api/chat/chats/:chatId` - Update chat title
- `DELETE /api/chat/chats/:chatId/clear` - Clear chat history for a specific chat
- `DELETE /api/chat/chats/:chatId` - Delete a chat

## Socket.IO Events

### Client to Server
- `message` - Send a message to the LLM
  ```javascript
  // To continue an existing chat
  socket.emit('message', { 
    content: 'Hello, how can you help me today?',
    chatId: 'existing-chat-id'
  });
  
  // To start a new chat (chatId will be generated automatically)
  socket.emit('message', { 
    content: 'Hello, how can you help me today?'
  });
  ```

- `join-chat` - Join a specific chat room (for potential multi-user functionality)
  ```javascript
  socket.emit('join-chat', 'chat-id');
  ```

### Server to Client
- `llm-response` - Receive a response from the LLM
  ```javascript
  // Response includes the chatId and message
  {
    chatId: 'chat-id',
    message: {
      role: 'assistant',
      content: 'Hello! How can I assist you today?',
      timestamp: '2023-10-12T14:30:00.000Z'
    }
  }
  ```
- `error` - Receive an error message

## Client Connection Example

```javascript
// Connect to the socket with authentication
const socket = io('http://localhost:3000', {
  query: {
    token: 'your_jwt_token'
  }
});

// Start a new chat
socket.emit('message', { content: 'Hello!' });

// Continue an existing chat
socket.emit('message', { 
  chatId: 'existing-chat-id',
  content: 'What were we talking about?' 
});

// Listen for responses
socket.on('llm-response', (response) => {
  console.log(`Chat ID: ${response.chatId}`);
  console.log('LLM response:', response.message.content);
});

// Handle errors
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

## Managing Chats with the API

### Create a new chat
```javascript
const response = await fetch('http://localhost:3000/api/chat/chats', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    title: 'Travel Planning'
  })
});
const newChat = await response.json();
```

### List all user's chats
```javascript
const response = await fetch('http://localhost:3000/api/chat/chats', {
  headers: {
    'Authorization': 'Bearer your_jwt_token'
  }
});
const { chats } = await response.json();
```

## LLM Integration

To integrate with your specific LLM provider:

1. Edit the `utils/llmService.js` file to replace the placeholder with your actual LLM API integration
2. Add your API key to the `.env` file

## License

ISC 