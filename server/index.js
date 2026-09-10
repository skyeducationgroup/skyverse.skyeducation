import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';

// ── Constants ──
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'skycrm-dev-fallback-secret-key';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DIST_DIR = join(__dirname, '..', 'dist');

// ── Express App ──
const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── JWT Auth Middleware ──
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
}

// ── Health Check ──
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

  res.json({
    status: 'ok',
    db: dbStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/data', authenticateToken, dataRoutes);

// ── Static files & SPA fallback (production) ──
const isProduction = process.env.NODE_ENV === 'production' || existsSync(DIST_DIR);

if (isProduction && existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));

  // SPA fallback — serve index.html for any non-API route
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'API route not found.' });
    }
    res.sendFile(join(DIST_DIR, 'index.html'));
  });
}

// ── Global 404 for unknown API routes ──
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found.' });
});

// ── Connect to MongoDB & Start Server ──
async function startServer() {
  try {
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI is not set. Please create a .env file (see .env.example).');
      process.exit(1);
    }

    console.log('⏳ Connecting to MongoDB...');

    await mongoose.connect(MONGODB_URI, {
      // Mongoose 8 uses the new driver defaults — no need for deprecated options
    });

    console.log('✅ MongoDB connected successfully.');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

      if (isProduction && existsSync(DIST_DIR)) {
        console.log(`🌐 Serving static files from ${DIST_DIR}`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('📴 MongoDB connection closed.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
