# React Frontend Integration Guide for WA-Service

This document provides a guide on how to integrate a React frontend with the `wa-service` NestJS backend. The backend exposes a WebSocket gateway for real-time communication.

## 1. Project Setup

First, create a new React application using your preferred tool, such as Create React App or Vite.

```bash
npx create-react-app wa-frontend
cd wa-frontend
```

Next, you'll need to install the `socket.io-client` library to communicate with the WebSocket server.

```bash
npm install socket.io-client
```

## 2. WebSocket Connection

The backend WebSocket server is running on port 96. You'll need to establish a connection to it from your React application.

Create a new file `src/socket.js` to manage the socket connection centrally.

```javascript
// src/socket.js
import { io } from 'socket.io-client';

// Replace with your server's URL
const URL = 'http://localhost:96';

export const socket = io(URL, {
  autoConnect: false
});
```

## 3. Interacting with the Backend

You can now use the `socket` instance to listen for events from the server and emit events to it.

### 3.1. Initializing the Connection

To start a WhatsApp client session, you need to emit an `init` event with the user's phone number. The user's authentication token should be sent along with the connection request to identify them.

Here's an example of how you might do this in a React component:

```jsx
// src/App.js
import React, { useState, useEffect } from 'react';
import { socket } from './socket';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [qrCode, setQrCode] = useState('');
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    // Assuming you have the user's auth token
    const authToken = 'your-auth-token'; // Replace with the actual token
    socket.auth = { token: authToken };

    socket.connect();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onInit(data) {
      if (data.success) {
        setChats(data.chats);
        setContacts(data.contacts);
      } else {
        console.error('Initialization failed:', data.error);
      }
    }

    function onQr(qr) {
      setQrCode(qr);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('init', onInit);
    socket.on('qr', onQr);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('init', onInit);
      socket.off('qr', onQr);
      socket.disconnect();
    };
  }, []);

  const initializeClient = (phoneNumber) => {
    socket.emit('init', { phone: phoneNumber });
  };

  return (
    <div className="App">
      <h1>WhatsApp Client</h1>
      {/* UI to get phone number and call initializeClient */}
      {qrCode && <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}&size=200x200`} alt="QR Code" />}
      {/* UI to display chats and contacts */}
    </div>
  );
}

export default App;
```

### 3.2. Listening for Server Events

Your React application should listen for various events from the server to update its state. Here are some of the key events:

- **`success_login`**: Fired when the WhatsApp client successfully logs in.
- **`new_message`**: Fired when a new message is received.
- **`listChats`**: Provides the list of chats for the user.
- **`getChatMessages`**: Provides messages for a specific chat.

### 3.3. Emitting Events to the Server

To perform actions, you'll emit events to the server. Here are a few examples:

- **`listChats`**: Request the list of chats for the current user.
- **`getChatMessages`**: Request messages for a specific chat.
- **`sendMessage`**: Send a new message.

```jsx
// Example of sending a message
const sendMessage = (to, message) => {
  socket.emit('sendMessage', { to, message });
};

// Example of fetching chats
const fetchChats = () => {
  socket.emit('listChats');
};
```

## 4. Component Structure

A good way to structure your React application would be to have separate components for different parts of the UI:

- **`ChatList.js`**: Displays the list of chats.
- **`ChatWindow.js`**: Displays the messages for a selected chat and includes an input for sending new messages.
- **`ContactList.js`**: Displays the list of contacts.

This modular approach will make your application easier to manage and scale.

This guide should provide a solid foundation for building your React frontend. If you have any questions or need further clarification, feel free to ask!

## 5. Advanced Features

Here's how to use the more advanced WhatsApp features that have been added to the backend.

### 5.1. Get Contact Info

To get detailed information about a specific contact:

```jsx
// Get contact info
const getContactInfo = (contactId) => {
  socket.emit('getContactById', { contactId });
};

// Listen for the response
socket.on('getContactById', (response) => {
  if (response.success) {
    console.log('Contact Info:', response.contact);
  } else {
    console.error('Failed to get contact info:', response.error);
  }
});
```

### 5.2. Mute/Unmute Chat

To mute or unmute a chat:

```jsx
// Mute a chat
const muteChat = (chatId) => {
  socket.emit('muteChat', { chatId });
};

// Unmute a chat
const unmuteChat = (chatId) => {
  socket.emit('unmuteChat', { chatId });
};

// Listen for responses
socket.on('muteChat', (response) => console.log(response));
socket.on('unmuteChat', (response) => console.log(response));
```

### 5.3. Block/Unblock Contact

To block or unblock a contact:

```jsx
// Block a contact
const blockContact = (contactId) => {
  socket.emit('blockContact', { contactId });
};

// Unblock a contact
const unblockContact = (contactId) => {
  socket.emit('unblockContact', { contactId });
};

// Listen for responses
socket.on('blockContact', (response) => console.log(response));
socket.on('unblockContact', (response) => console.log(response));
```

### 5.4. Mark Chat as Read/Unread

To change the read status of a chat:

```jsx
// Mark as read
const markAsRead = (chatId) => {
  socket.emit('markChatAsRead', { chatId });
};

// Mark as unread
const markAsUnread = (chatId) => {
  socket.emit('markChatAsUnread', { chatId });
};

// Listen for responses
socket.on('markChatAsRead', (response) => console.log(response));
socket.on('markChatAsUnread', (response) => console.log(response));
```

### 5.5. Create a Group

To create a new group with a list of participants:

```jsx
// Create a group
const createGroup = (name, participants) => {
  // participants should be an array of contact IDs, e.g., ['1234567890@c.us', '0987654321@c.us']
  socket.emit('createGroup', { name, participants });
};

// Listen for the response
socket.on('createGroup', (response) => {
  if (response.success) {
    console.log('Group created:', response.group);
  } else {
    console.error('Failed to create group:', response.error);
  }
});
```
