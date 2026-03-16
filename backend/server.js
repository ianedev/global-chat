const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const COUNTRIES = require('./countries');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// ─── Seed all country global rooms on startup ───────────────────────────────
async function seedCountryRooms() {
  console.log('🌍 Seeding global country rooms...');
  let created = 0;
  for (const country of COUNTRIES) {
    const existing = await prisma.room.findFirst({
      where: { type: 'global', country_code: country.code }
    });
    if (!existing) {
      await prisma.room.create({
        data: {
          name: `${country.name} 🌍`,
          type: 'global',
          country_code: country.code,
          lat: country.lat,
          lng: country.lng
        }
      });
      created++;
    } else if (existing.lat === null || existing.lng === null) {
      // Update existing rooms that don't have coordinates yet
      await prisma.room.update({
        where: { id: existing.id },
        data: { lat: country.lat, lng: country.lng, name: `${country.name} 🌍` }
      });
      created++;
    }
  }
  console.log(`✅ Country rooms ready. (${created} rooms created/updated)`);
}

// ─── Socket.io ──────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔌 Connected:', socket.id);

  socket.on('join_room', (roomId) => {
    // Leave previous rooms first
    const rooms = [...socket.rooms];
    rooms.forEach(r => { if (r !== socket.id) socket.leave(r); });
    socket.join(`room_${roomId}`);
    console.log(`➡️  ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    const { room_id, sender_id, content } = data;
    try {
      const message = await prisma.message.create({
        data: {
          room_id: parseInt(room_id),
          sender_id: parseInt(sender_id),
          content
        },
        include: {
          sender: { select: { username: true } }
        }
      });
      io.to(`room_${room_id}`).emit('new_message', message);
    } catch (error) {
      console.error('❌ Error saving message:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected:', socket.id);
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await seedCountryRooms();
  } catch (err) {
    console.error('⚠️ Database seeding failed:', err.message);
  }
});
