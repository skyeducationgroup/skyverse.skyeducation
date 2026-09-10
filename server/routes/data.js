import { Router } from 'express';
import Ambassador from '../models/Ambassador.js';
import Referral from '../models/Referral.js';
import Chat from '../models/Chat.js';
import Announcement from '../models/Announcement.js';
import Log from '../models/Log.js';
import Settings from '../models/Settings.js';

const router = Router();

/**
 * Helper: strip _id and __v from lean documents.
 */
function cleanDocs(docs) {
  return docs.map(({ _id, __v, ...rest }) => rest);
}

// ─────────────────────────────────────────────
// GET /api/data — Fetch all data at once
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [ambassadors, referrals, chatDocs, announcements, logs, settingsDoc] =
      await Promise.all([
        Ambassador.find({}).lean(),
        Referral.find({}).lean(),
        Chat.find({}).lean(),
        Announcement.find({}).lean(),
        Log.find({}).sort({ _id: -1 }).limit(200).lean(),
        Settings.findOne({ key: 'referral_settings' }).lean()
      ]);

    // Convert chat array → object keyed by ambassadorId
    const chats = {};
    for (const chat of chatDocs) {
      const { _id, __v, ambassadorId, messages, ...extra } = chat;
      chats[ambassadorId] = (messages || []).map(({ _id: mId, ...m }) => m);
    }

    return res.json({
      ambassadors: cleanDocs(ambassadors),
      referrals: cleanDocs(referrals),
      chats,
      announcements: cleanDocs(announcements),
      logs: cleanDocs(logs),
      settings: settingsDoc ? settingsDoc.value : null
    });
  } catch (error) {
    console.error('[Data] GET /api/data error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch data.'
    });
  }
});

// ─────────────────────────────────────────────
// PUT /api/data/ambassadors — Replace all ambassadors
// ─────────────────────────────────────────────
router.put('/ambassadors', async (req, res) => {
  try {
    const ambassadors = req.body;

    if (!Array.isArray(ambassadors)) {
      return res.status(400).json({
        success: false,
        message: 'Body must be an array of ambassador objects.'
      });
    }

    // SAFETY: Refuse to wipe all ambassadors with empty array
    if (ambassadors.length === 0) {
      const existingCount = await Ambassador.countDocuments();
      if (existingCount > 0) {
        console.warn('[Data] BLOCKED: Refusing to delete', existingCount, 'ambassadors with empty array.');
        return res.json({ success: true, message: 'Skipped: refusing to overwrite existing data with empty array.' });
      }
    }

    await Ambassador.deleteMany({});

    if (ambassadors.length > 0) {
      await Ambassador.insertMany(ambassadors, { ordered: false });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[Data] PUT /ambassadors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ambassadors.'
    });
  }
});

// ─────────────────────────────────────────────
// PUT /api/data/referrals — Replace all referrals
// ─────────────────────────────────────────────
router.put('/referrals', async (req, res) => {
  try {
    const referrals = req.body;

    if (!Array.isArray(referrals)) {
      return res.status(400).json({
        success: false,
        message: 'Body must be an array of referral objects.'
      });
    }

    await Referral.deleteMany({});

    if (referrals.length > 0) {
      await Referral.insertMany(referrals, { ordered: false });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[Data] PUT /referrals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update referrals.'
    });
  }
});

// ─────────────────────────────────────────────
// PUT /api/data/chats — Replace all chats
// ─────────────────────────────────────────────
router.put('/chats', async (req, res) => {
  try {
    const chatsObj = req.body;

    if (typeof chatsObj !== 'object' || Array.isArray(chatsObj)) {
      return res.status(400).json({
        success: false,
        message: 'Body must be an object keyed by ambassadorId.'
      });
    }

    await Chat.deleteMany({});

    const chatDocs = Object.entries(chatsObj).map(([ambassadorId, messages]) => ({
      ambassadorId,
      messages: Array.isArray(messages) ? messages : []
    }));

    if (chatDocs.length > 0) {
      await Chat.insertMany(chatDocs, { ordered: false });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[Data] PUT /chats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update chats.'
    });
  }
});

// ─────────────────────────────────────────────
// PUT /api/data/announcements — Replace all announcements
// ─────────────────────────────────────────────
router.put('/announcements', async (req, res) => {
  try {
    const announcements = req.body;

    if (!Array.isArray(announcements)) {
      return res.status(400).json({
        success: false,
        message: 'Body must be an array of announcement objects.'
      });
    }

    await Announcement.deleteMany({});

    if (announcements.length > 0) {
      await Announcement.insertMany(announcements, { ordered: false });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[Data] PUT /announcements error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update announcements.'
    });
  }
});

// ─────────────────────────────────────────────
// PUT /api/data/logs — Replace logs (keep last 200)
// ─────────────────────────────────────────────
router.put('/logs', async (req, res) => {
  try {
    let logs = req.body;

    if (!Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        message: 'Body must be an array of log objects.'
      });
    }

    // Keep only the last 200 logs
    if (logs.length > 200) {
      logs = logs.slice(-200);
    }

    await Log.deleteMany({});

    if (logs.length > 0) {
      await Log.insertMany(logs, { ordered: false });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('[Data] PUT /logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update logs.'
    });
  }
});

// ─────────────────────────────────────────────
// PUT /api/data/settings — Upsert referral settings
// ─────────────────────────────────────────────
router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;

    await Settings.findOneAndUpdate(
      { key: 'referral_settings' },
      { key: 'referral_settings', value: settings },
      { upsert: true, new: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('[Data] PUT /settings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update settings.'
    });
  }
});

export default router;
