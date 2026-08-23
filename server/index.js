require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const initSocket = require("./src/config/socket");

const PORT = process.env.PORT || 4000;

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = initSocket(server);

// Make io accessible if needed elsewhere
app.set("io", io);

server.listen(PORT, () => {
  console.log(`\n🚀 Coderaxo Connect API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});
