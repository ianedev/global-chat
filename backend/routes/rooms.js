const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ─── Create Local Room ────────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  const { name, lat, lng, password } = req.body;
  if (!name) return res.status(400).json({ error: 'Room name is required' });
  try {
    const room = await prisma.room.create({
      data: {
        name,
        type: 'local',
        lat:  lat  ? parseFloat(lat)  : null,
        lng:  lng  ? parseFloat(lng)  : null,
        password: password || null,
        creator_id: req.user.userId
      }
    });
    res.status(201).json(room);
  } catch (error) {
    console.error('❌ Create room error:', error.message);
    res.status(500).json({ error: 'Could not create room', detail: error.message });
  }
});

// ─── Get All Rooms with coordinates (for map pins) ────────────────────────
router.get('/', async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        lat: { not: null },
        lng: { not: null }
      },
      orderBy: { type: 'asc' }  // global rooms first
    });
    res.json(rooms);
  } catch (error) {
    console.error('❌ Fetch rooms error:', error.message);
    res.status(500).json({ error: 'Could not fetch rooms' });
  }
});

// ─── Get or upsert Global Room for a country code ─────────────────────────
router.get('/global/:countryCode', async (req, res) => {
  const { countryCode } = req.params;
  const code = countryCode.toUpperCase();
  try {
    let room = await prisma.room.findFirst({
      where: { type: 'global', country_code: code }
    });
    if (!room) {
      room = await prisma.room.create({
        data: {
          name: `${code} Global Chat`,
          type: 'global',
          country_code: code
        }
      });
    }
    res.json(room);
  } catch (error) {
    console.error('❌ Global room error:', error.message);
    res.status(500).json({ error: 'Could not get global room' });
  }
});

// ─── Get Messages for a Room ───────────────────────────────────────────────
router.get('/:roomId/messages', async (req, res) => {
  const roomId = parseInt(req.params.roomId);
  if (isNaN(roomId)) return res.status(400).json({ error: 'Invalid room ID' });
  try {
    const messages = await prisma.message.findMany({
      where: { room_id: roomId },
      include: { sender: { select: { username: true } } },
      orderBy: { created_at: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('❌ Fetch messages error:', error.message);
    res.status(500).json({ error: 'Could not fetch messages' });
  }
});

module.exports = router;
