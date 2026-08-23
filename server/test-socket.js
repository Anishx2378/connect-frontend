const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3NjQzMmRjMC0zZGRhLTRjYWYtODM4OC02ZjUwMWQ2NWVjZWMiLCJpYXQiOjE3ODMwNjAzMjR9.V4yS0SI8NpEHU-TFcNHoo9sHSqydgqCa-AZs3t6CMGY"

const socket = io('http://localhost:4000', {
  auth: { token }
});

socket.on('connect', () => {
  console.log('Connected to socket', socket.id);
  // Send DM to some conversation ID (let's create a fake one, or use a known one)
  socket.emit('send_dm', {
    conversationId: 'test-conversation-id',
    content: 'Hello World',
    localId: 'test-local-id'
  });
});

socket.on('receive_dm', (msg) => {
  console.log('Received DM:', msg);
  process.exit(0);
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 5000);
