const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("./db");
const uploadService = require("../services/upload.service");
const ogService = require("../services/og.service");

// Map to track active waves: room (e.g., 'channel:123') -> Map of userId -> userData
const activeWaves = new Map();

/**
 * Initialize Socket.IO on the HTTP server.
 * Handles authentication, channel/DM rooms, messaging, typing, and online status.
 */
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
    maxHttpBufferSize: 1e7, // 10 MB limit for file uploads via socket
  });

  // ─── Authentication Middleware ────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication required."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, avatar: true },
      });

      if (!user) {
        return next(new Error("User not found."));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token."));
    }
  });

  // ─── Connection Handler ──────────────────────────────
  io.on("connection", async (socket) => {
    const userId = socket.user.id;
    console.log(`🟢 ${socket.user.name} connected (${userId})`);

    // Join personal room for notifications
    socket.join(`user:${userId}`);

    // Mark user online
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true },
    });

    // Broadcast online status to all connected clients
    io.emit("user_online", { userId, name: socket.user.name });

    // ─── Channel Events ────────────────────────────────

    socket.on("join_channel", (channelId) => {
      socket.join(`channel:${channelId}`);
      console.log(`  📺 ${socket.user.name} joined channel:${channelId}`);
    });

    socket.on("leave_channel", (channelId) => {
      socket.leave(`channel:${channelId}`);
      console.log(`  📺 ${socket.user.name} left channel:${channelId}`);
    });

    socket.on("send_channel_message", async (data) => {
      try {
        const { content, channelId, file, parentId, localId } = data;

        // Save message to database
        const message = await prisma.message.create({
          data: { content, senderId: userId, channelId, parentId },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        // Handle file attachment if present
        if (file && file.buffer) {
          const result = await uploadService.uploadFile({
            buffer: Buffer.from(file.buffer),
            originalname: file.name,
            mimetype: file.type
          });
          
          await prisma.attachment.create({
            data: {
              url: result.secure_url,
              fileName: file.name,
              fileType: file.type,
              messageId: message.id,
            }
          });
        }

        // Fetch OG data if URL exists
        const extractedUrl = ogService.extractUrl(content);
        if (extractedUrl) {
          const ogData = await ogService.fetchOGData(extractedUrl);
          if (ogData) {
            await prisma.linkPreview.create({
              data: {
                url: ogData.url,
                title: ogData.title,
                description: ogData.description,
                image: ogData.image,
                favicon: ogData.favicon,
                siteName: ogData.siteName,
                messageId: message.id,
              }
            });
          }
        }

        // Fetch message again to include attachments and link previews for broadcast
        const fullMessage = await prisma.message.findUnique({
          where: { id: message.id },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
            attachments: true,
            linkPreviews: true,
            reactions: { include: { user: { select: { id: true, name: true } } } },
            _count: { select: { replies: true } },
          },
        });

        // Broadcast to all clients in the channel room
        const broadcastMsg = localId ? { ...fullMessage, localId } : fullMessage;
        if (parentId) {
          io.to(`channel:${channelId}`).emit("receive_reply", broadcastMsg);
        } else {
          io.to(`channel:${channelId}`).emit("receive_channel_message", broadcastMsg);
        }

        // Send notifications to all channel members
        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          include: { members: true },
        });

        // Extract mentions
        const plainText = content.replace(/<[^>]*>?/gm, '');
        const isAllOrChannel = plainText.includes('@all') || plainText.includes('@channel');
        const mentionedUserIds = [...content.matchAll(/data-id="([^"]+)"/g)].map(m => m[1]);

        if (channel) {
          channel.members.forEach((member) => {
            if (member.userId !== userId) {
              // Emit sidebar unread update to each member's personal room
              io.to(`user:${member.userId}`).emit("sidebar_unread", {
                type: "channel",
                channelId: channelId,
                conversationId: null,
                senderId: userId
              });

              const isMentioned = isAllOrChannel || mentionedUserIds.includes(member.userId);
              const title = isMentioned ? `Mentioned in #${channel.name}` : `#${channel.name}`;

              console.log(`[SOCKET] Emitting new_notification to user:${member.userId} for channel message`);
              io.to(`user:${member.userId}`).emit("new_notification", {
                type: "channel",
                title: title,
                body: plainText,
                url: `/channel/${channel.name.replace('#', '')}`,
                senderId: userId,
                senderName: socket.user.name,
                senderAvatar: socket.user.avatar,
                channelName: channel.name
              });
            }
          });
        }
      } catch (err) {
        console.error("Error sending channel message:", err.message);
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    // ─── Direct Message Events ─────────────────────────

    socket.on("join_dm", (conversationId) => {
      socket.join(`dm:${conversationId}`);
      console.log(`  💬 ${socket.user.name} joined dm:${conversationId}`);
    });

    socket.on("leave_dm", (conversationId) => {
      socket.leave(`dm:${conversationId}`);
      console.log(`  💬 ${socket.user.name} left dm:${conversationId}`);
    });

    socket.on("send_dm", async (data) => {
      try {
        const { content, conversationId, file, parentId, localId } = data;

        // Save message to database
        const message = await prisma.message.create({
          data: { content, senderId: userId, conversationId, parentId },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        });

        // Handle file attachment if present
        if (file && file.buffer) {
          const result = await uploadService.uploadFile({
            buffer: Buffer.from(file.buffer),
            originalname: file.name,
            mimetype: file.type
          });
          
          await prisma.attachment.create({
            data: {
              url: result.secure_url,
              fileName: file.name,
              fileType: file.type,
              messageId: message.id,
            }
          });
        }

        // Fetch OG data if URL exists
        const extractedUrl = ogService.extractUrl(content);
        if (extractedUrl) {
          const ogData = await ogService.fetchOGData(extractedUrl);
          if (ogData) {
            await prisma.linkPreview.create({
              data: {
                url: ogData.url,
                title: ogData.title,
                description: ogData.description,
                image: ogData.image,
                favicon: ogData.favicon,
                siteName: ogData.siteName,
                messageId: message.id,
              }
            });
          }
        }

        // Fetch message again to include attachments and link previews for broadcast
        const fullMessage = await prisma.message.findUnique({
          where: { id: message.id },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
            attachments: true,
            linkPreviews: true,
            reactions: { include: { user: { select: { id: true, name: true } } } },
            _count: { select: { replies: true } },
            pinnedBy: { select: { id: true, name: true } },
          },
        });

        // Broadcast to both users in the DM room
        const broadcastMsg = localId ? { ...fullMessage, localId } : fullMessage;
        if (parentId) {
          io.to(`dm:${conversationId}`).emit("receive_reply", broadcastMsg);
        } else {
          io.to(`dm:${conversationId}`).emit("receive_dm", broadcastMsg);
        }

        // Send notification to the other user
        const conversation = await prisma.directConversation.findUnique({
          where: { id: conversationId },
        });

        if (conversation) {
          const recipientId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

          // Emit sidebar unread update to recipient's personal room
          io.to(`user:${recipientId}`).emit("sidebar_unread", {
            type: "dm",
            channelId: null,
            conversationId: conversationId,
            senderId: userId
          });

          console.log(`[SOCKET] Emitting new_notification to user:${recipientId} for DM`);
          io.to(`user:${recipientId}`).emit("new_notification", {
            type: "dm",
            title: `DM from ${socket.user.name}`,
            body: content.replace(/<[^>]*>?/gm, ''),
            url: `/dm/${conversationId}`,
            senderId: userId,
            senderName: socket.user.name,
            senderAvatar: socket.user.avatar
          });
        }
      } catch (err) {
        console.error("Error sending DM:", err.message);
        socket.emit("error", { message: "Failed to send message." });
      }
    });
    // ─── Edit & Delete Messages ────────────────────────

    socket.on("edit_message", async (data) => {
      try {
        const { messageId, newContent } = data;

        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message) {
          return socket.emit("error", { message: "Message not found." });
        }

        if (message.senderId !== userId) {
          return socket.emit("error", { message: "You can only edit your own messages." });
        }

        const timeDiff = Date.now() - new Date(message.createdAt).getTime();
        if (timeDiff > 20 * 60 * 1000) {
          return socket.emit("error", { message: "Messages can only be edited within 20 minutes." });
        }

        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: { content: newContent },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
            attachments: true,
            linkPreviews: true,
            reactions: { include: { user: { select: { id: true, name: true } } } },
          },
        });

        if (message.channelId) {
          io.to(`channel:${message.channelId}`).emit("message_updated", updatedMessage);
        } else if (message.conversationId) {
          io.to(`dm:${message.conversationId}`).emit("message_updated", updatedMessage);
        }
      } catch (err) {
        console.error("Error editing message:", err.message);
        socket.emit("error", { message: "Failed to edit message." });
      }
    });

    socket.on("delete_message", async (data) => {
      try {
        const { messageId } = data;

        const message = await prisma.message.findUnique({
          where: { id: messageId },
        });

        if (!message) {
          return socket.emit("error", { message: "Message not found." });
        }

        if (message.senderId !== userId) {
          return socket.emit("error", { message: "You can only delete your own messages." });
        }

        await prisma.message.delete({
          where: { id: messageId },
        });

        const deletePayload = { id: messageId, channelId: message.channelId, conversationId: message.conversationId };

        if (message.channelId) {
          io.to(`channel:${message.channelId}`).emit("message_deleted", deletePayload);
        } else if (message.conversationId) {
          io.to(`dm:${message.conversationId}`).emit("message_deleted", deletePayload);
        }
      } catch (err) {
        console.error("Error deleting message:", err.message);
        socket.emit("error", { message: "Failed to delete message." });
      }
    });

    socket.on("toggle_pin_message", async (data) => {
      try {
        const { messageId } = data;
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        
        if (!message) {
          return socket.emit("error", { message: "Message not found." });
        }

        const updatedMessage = await prisma.message.update({
          where: { id: messageId },
          data: { 
            isPinned: !message.isPinned, 
            pinnedAt: !message.isPinned ? new Date() : null,
            pinnedById: !message.isPinned ? userId : null
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
            attachments: true,
            linkPreviews: true,
            reactions: { include: { user: { select: { id: true, name: true } } } },
            _count: { select: { replies: true } },
            pinnedBy: { select: { id: true, name: true } },
          },
        });

        if (updatedMessage.channelId) {
          io.to(`channel:${updatedMessage.channelId}`).emit("message_updated", updatedMessage);
        } else if (updatedMessage.conversationId) {
          io.to(`dm:${updatedMessage.conversationId}`).emit("message_updated", updatedMessage);
        }
      } catch (err) {
        console.error("Error toggling pin:", err.message);
      }
    });

    // ─── Reactions ─────────────────────────────────────

    socket.on("add_reaction", async (data) => {
      try {
        const { messageId, emoji } = data;
        const reaction = await prisma.reaction.create({
          data: { messageId, userId, emoji },
          include: { user: { select: { id: true, name: true } } }
        });

        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message) return;

        const payload = { messageId, reaction, channelId: message.channelId, conversationId: message.conversationId };
        if (message.channelId) {
          io.to(`channel:${message.channelId}`).emit("reaction_added", payload);
        } else if (message.conversationId) {
          io.to(`dm:${message.conversationId}`).emit("reaction_added", payload);
        }
      } catch (err) {
        // Typically happens on duplicate unique constraint, just ignore
        console.error("Error adding reaction:", err.message);
      }
    });

    socket.on("remove_reaction", async (data) => {
      try {
        const { messageId, emoji } = data;
        const reaction = await prisma.reaction.findUnique({
          where: { userId_messageId_emoji: { userId, messageId, emoji } }
        });

        if (reaction) {
          await prisma.reaction.delete({
            where: { id: reaction.id }
          });

          const message = await prisma.message.findUnique({ where: { id: messageId } });
          if (!message) return;

          const payload = { messageId, reactionId: reaction.id, emoji, userId, channelId: message.channelId, conversationId: message.conversationId };
          if (message.channelId) {
            io.to(`channel:${message.channelId}`).emit("reaction_removed", payload);
          } else if (message.conversationId) {
            io.to(`dm:${message.conversationId}`).emit("reaction_removed", payload);
          }
        }
      } catch (err) {
        console.error("Error removing reaction:", err.message);
      }
    });

    // ─── Typing Indicators ─────────────────────────────

    socket.on("typing_start", ({ roomId, roomType }) => {
      const room = roomType === "channel" ? `channel:${roomId}` : `dm:${roomId}`;
      socket.to(room).emit("typing_start", {
        userId,
        name: socket.user.name,
        roomId,
      });
    });

    socket.on("typing_stop", ({ roomId, roomType }) => {
      const room = roomType === "channel" ? `channel:${roomId}` : `dm:${roomId}`;
      socket.to(room).emit("typing_stop", {
        userId,
        name: socket.user.name,
        roomId,
      });
    });

    // ─── Wave (Audio Huddle) Events ─────────────────────
    
    socket.on("join_wave", async ({ roomId, roomType }) => {
      const room = roomType === "channel" ? `channel:${roomId}` : `dm:${roomId}`;
      const waveRoom = `wave:${room}`;
      
      socket.join(waveRoom);
      
      let isNewWave = false;
      // Add user to activeWaves tracker
      if (!activeWaves.has(room)) {
        activeWaves.set(room, new Map());
        isNewWave = true;
      }
      const waveUsers = activeWaves.get(room);
      waveUsers.set(userId, { id: userId, name: socket.user.name, avatar: socket.user.avatar });
      
      // Notify everyone in the wave room that the wave state changed
      io.to(waveRoom).emit("wave_updated", {
        roomId,
        roomType,
        participants: Array.from(waveUsers.values())
      });
      
      if (isNewWave) {
        try {
          if (roomType === "channel") {
            const channel = await prisma.channel.findUnique({
              where: { id: roomId },
              include: { members: true },
            });
            console.log(`[WAVE DEBUG] Channel new wave. roomId=${roomId}, channel members=${channel?.members?.length}`);
            if (channel) {
              channel.members.forEach((member) => {
                if (member.userId !== userId) {
                  console.log(`[WAVE DEBUG] Emitting incoming_wave to user:${member.userId}`);
                  io.to(`user:${member.userId}`).emit("incoming_wave", {
                    roomId,
                    roomType,
                    roomName: `#${channel.name}`,
                    callerName: socket.user.name,
                    callerAvatar: socket.user.avatar
                  });
                }
              });
            }
          } else {
            const dm = await prisma.directConversation.findUnique({
              where: { id: roomId },
            });
            console.log(`[WAVE DEBUG] DM new wave. roomId=${roomId}, user1=${dm?.user1Id}, user2=${dm?.user2Id}, callerId=${userId}`);
            if (dm) {
              const recipientId = dm.user1Id === userId ? dm.user2Id : dm.user1Id;
              console.log(`[WAVE DEBUG] Emitting incoming_wave to user:${recipientId}`);
              io.to(`user:${recipientId}`).emit("incoming_wave", {
                roomId,
                roomType,
                roomName: socket.user.name,
                callerName: socket.user.name,
                callerAvatar: socket.user.avatar
              });
            }
          }
        } catch (err) {
          console.error("Failed to notify incoming wave", err);
        }
      }

      console.log(`🌊 ${socket.user.name} joined wave in ${room}`);
    });
    
    socket.on("leave_wave", ({ roomId, roomType }) => {
      const room = roomType === "channel" ? `channel:${roomId}` : `dm:${roomId}`;
      const waveRoom = `wave:${room}`;
      
      socket.leave(waveRoom);
      
      if (activeWaves.has(room)) {
        const waveUsers = activeWaves.get(room);
        waveUsers.delete(userId);
        
        io.to(waveRoom).emit("wave_updated", {
          roomId,
          roomType,
          participants: Array.from(waveUsers.values())
        });
        
        if (waveUsers.size === 0) {
          activeWaves.delete(room);
        }
      }
      
      console.log(`🌊 ${socket.user.name} left wave in ${room}`);
    });
    
    socket.on("wave_signal", ({ targetUserId, signal, roomId, roomType }) => {
      // Forward WebRTC signaling data to the specific user
      io.to(`user:${targetUserId}`).emit("wave_signal", {
        senderId: userId,
        signal
      });
    });
    

    socket.on("invite_to_wave", async ({ targetUserIds, roomId, roomType, roomName }) => {
      try {
        console.log(`[WAVE DEBUG] ${socket.user.name} inviting ${targetUserIds.length} users to wave in ${roomType}:${roomId}`);
        targetUserIds.forEach(targetUserId => {
          io.to(`user:${targetUserId}`).emit("incoming_wave", {
            roomId,
            roomType,
            roomName: roomName || (roomType === 'channel' ? `#${roomId}` : socket.user.name),
            callerName: socket.user.name,
            callerAvatar: socket.user.avatar
          });
        });
      } catch (err) {
        console.error("Failed to invite to wave", err);
      }
    });

    socket.on("check_wave", ({ roomId, roomType }) => {
      const room = roomType === "channel" ? `channel:${roomId}` : `dm:${roomId}`;
      if (activeWaves.has(room)) {
        socket.emit("wave_updated", {
          roomId,
          roomType,
          participants: Array.from(activeWaves.get(room).values())
        });
      } else {
        socket.emit("wave_updated", {
          roomId,
          roomType,
          participants: []
        });
      }
    });

    // ─── Disconnect ────────────────────────────────────

    socket.on("disconnect", async () => {
      console.log(`🔴 ${socket.user.name} disconnected`);

      // Remove user from any active waves they might be in
      for (const [room, waveUsers] of activeWaves.entries()) {
        if (waveUsers.has(userId)) {
          waveUsers.delete(userId);
          
          const [roomTypePrefix, roomId] = room.split(":");
          const roomType = roomTypePrefix === "channel" ? "channel" : "dm";
          
          io.to(room).emit("wave_updated", {
            roomId,
            roomType,
            participants: Array.from(waveUsers.values())
          });
          
          if (waveUsers.size === 0) {
            activeWaves.delete(room);
          }
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() },
      });

      io.emit("user_offline", { userId, name: socket.user.name });
    });
  });

  return io;
};

module.exports = initSocket;
