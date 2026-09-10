import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Ambassador from '../models/Ambassador.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'skycrm-dev-fallback-secret-key';
const JWT_EXPIRY = '7d';

// Admin credentials
const ADMIN_USERNAME = 'skyeducation.co.in';
const ADMIN_PASSWORD = 'skyeducationgroup.co.in.admin';

/**
 * POST /api/auth/login
 * Authenticate admin or ambassador and return a JWT.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required.'
      });
    }

    // ── Admin login ──
    if (role === 'admin') {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = jwt.sign(
          { userId: 'admin', role: 'admin', username },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY }
        );

        return res.json({
          success: true,
          token,
          role: 'admin',
          user: { username, role: 'admin' }
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials.'
      });
    }

    // ── Ambassador login ──
    if (role === 'ambassador') {
      const ambassador = await Ambassador.findOne({
        username: { $regex: new RegExp(`^${escapeRegex(username)}$`, 'i') }
      }).lean();

      if (!ambassador) {
        return res.status(401).json({
          success: false,
          message: 'Ambassador not found. Please check your username.'
        });
      }

      if (ambassador.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password.'
        });
      }

      if (ambassador.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact admin.'
        });
      }

      // Strip internal Mongo fields before sending
      const { _id, __v, ...userPayload } = ambassador;

      const token = jwt.sign(
        { userId: ambassador.id, role: 'ambassador', username: ambassador.username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );

      return res.json({
        success: true,
        token,
        role: 'ambassador',
        user: userPayload
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Invalid role. Must be "admin" or "ambassador".'
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
});

/**
 * GET /api/auth/me
 * Return the currently authenticated user from the JWT.
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.'
      });
    }

    if (decoded.role === 'admin') {
      return res.json({
        success: true,
        role: 'admin',
        user: { username: decoded.username, role: 'admin' }
      });
    }

    if (decoded.role === 'ambassador') {
      const ambassador = await Ambassador.findOne({ id: decoded.userId }).lean();

      if (!ambassador) {
        return res.status(404).json({
          success: false,
          message: 'Ambassador not found.'
        });
      }

      const { _id, __v, ...userPayload } = ambassador;

      return res.json({
        success: true,
        role: 'ambassador',
        user: userPayload
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Unknown role in token.'
    });
  } catch (error) {
    console.error('[Auth] /me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
});

/**
 * Escape special regex characters in user input to prevent ReDoS.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default router;
