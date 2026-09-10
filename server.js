import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Base32 Decode
function base32Decode(base32Str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanStr = base32Str.toUpperCase().replace(/=+$/, '');
  let length = cleanStr.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));

  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(cleanStr[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      buffer[index++] = (value >> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buffer;
}

// Generate TOTP
function generateTOTP(secretBase32, timeOffsetSteps = 0) {
  try {
    const key = base32Decode(secretBase32);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = BigInt(Math.floor(epoch / 30) + timeOffsetSteps);

    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(counter);

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return String(otp).padStart(6, '0');
  } catch (err) {
    return '';
  }
}

// Verify TOTP
function verifyTOTP(token, secretBase32) {
  const cleanToken = String(token).trim();
  if (cleanToken.length !== 6 || isNaN(Number(cleanToken))) return false;
  
  for (let offset = -1; offset <= 1; offset++) {
    if (generateTOTP(secretBase32, offset) === cleanToken) {
      return true;
    }
  }
  return false;
}

// Generate Random Base32 Secret
function generateBase32Secret() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return secret;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const ADMISSIONS_FILE = path.join(__dirname, 'data', 'admissions.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const APPROVALS_FILE = path.join(__dirname, 'data', 'approvals.json');
const INCENTIVE_REQUESTS_FILE = path.join(__dirname, 'data', 'incentive_requests.json');
const LOGIN_HISTORY_FILE = path.join(__dirname, 'data', 'login_history.json');

// Ensure database files are present on the mounted volume (restored from data_backup if missing)
async function ensureDatabaseFiles() {
  const dataDir = path.join(__dirname, 'data');
  const backupDir = path.join(__dirname, 'data_backup');
  
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (e) {}

  const files = [
    { name: 'settings.json', default: '{}' },
    { name: 'admissions.json', default: '[]' },
    { name: 'approvals.json', default: '[]' },
    { name: 'incentive_requests.json', default: '[]' },
    { name: 'login_history.json', default: '[]' }
  ];

  for (const file of files) {
    const filePath = path.join(dataDir, file.name);
    const backupPath = path.join(backupDir, file.name);
    
    try {
      await fs.access(filePath);
    } catch (err) {
      console.log(`[Database Init] File ${file.name} not found. Restoring from data_backup...`);
      try {
        await fs.copyFile(backupPath, filePath);
        console.log(`[Database Init] Successfully restored ${file.name} to volume.`);
      } catch (copyErr) {
        console.error(`[Database Init] Failed to copy backup for ${file.name}:`, copyErr.message);
        await fs.writeFile(filePath, file.default, 'utf8');
      }
    }
  }
}

await ensureDatabaseFiles();

// Helper functions for reading/writing local JSON databases
let admissionsCache = null;
let isWritingAdmissions = false;
const admissionsWriteQueue = [];

async function processAdmissionsWriteQueue() {
  if (isWritingAdmissions || admissionsWriteQueue.length === 0) return;
  isWritingAdmissions = true;
  
  const { data, resolve, reject } = admissionsWriteQueue.shift();
  try {
    await fs.writeFile(ADMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
    resolve();
  } catch (err) {
    reject(err);
  } finally {
    isWritingAdmissions = false;
    processAdmissionsWriteQueue();
  }
}

async function safeWriteAdmissions(data) {
  return new Promise((resolve, reject) => {
    admissionsWriteQueue.push({ data, resolve, reject });
    processAdmissionsWriteQueue();
  });
}

// Helper functions for reading/writing local JSON databases
async function readAdmissions() {
  if (admissionsCache) {
    return admissionsCache;
  }
  try {
    const data = await fs.readFile(ADMISSIONS_FILE, 'utf8');
    admissionsCache = JSON.parse(data);
    return admissionsCache;
  } catch (error) {
    admissionsCache = [];
    return admissionsCache;
  }
}

async function writeAdmissions(admissions) {
  admissionsCache = admissions;
  await safeWriteAdmissions(admissions);
}

let approvalsCache = null;
let isWritingApprovals = false;
const approvalsWriteQueue = [];

async function processApprovalsWriteQueue() {
  if (isWritingApprovals || approvalsWriteQueue.length === 0) return;
  isWritingApprovals = true;
  
  const { data, resolve, reject } = approvalsWriteQueue.shift();
  try {
    await fs.writeFile(APPROVALS_FILE, JSON.stringify(data, null, 2), 'utf8');
    resolve();
  } catch (err) {
    reject(err);
  } finally {
    isWritingApprovals = false;
    processApprovalsWriteQueue();
  }
}

async function safeWriteApprovals(data) {
  return new Promise((resolve, reject) => {
    approvalsWriteQueue.push({ data, resolve, reject });
    processApprovalsWriteQueue();
  });
}

async function readApprovals() {
  if (approvalsCache) {
    return approvalsCache;
  }
  try {
    const data = await fs.readFile(APPROVALS_FILE, 'utf8');
    approvalsCache = JSON.parse(data);
    return approvalsCache;
  } catch (error) {
    approvalsCache = [];
    return approvalsCache;
  }
}

async function writeApprovals(approvals) {
  approvalsCache = approvals;
  await safeWriteApprovals(approvals);
}

async function readSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.adminTotpSecret) {
      parsed.adminTotpSecret = generateBase32Secret();
      await fs.writeFile(SETTINGS_FILE, JSON.stringify(parsed, null, 2), 'utf8');
    }
    return parsed;
  } catch (error) {
    return {};
  }
}

async function writeSettings(settings) {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

let incentiveRequestsCache = null;
let isWritingIncentiveRequests = false;
const incentiveRequestsWriteQueue = [];

async function processIncentiveRequestsWriteQueue() {
  if (isWritingIncentiveRequests || incentiveRequestsWriteQueue.length === 0) return;
  isWritingIncentiveRequests = true;
  
  const { data, resolve, reject } = incentiveRequestsWriteQueue.shift();
  try {
    await fs.writeFile(INCENTIVE_REQUESTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    resolve();
  } catch (err) {
    reject(err);
  } finally {
    isWritingIncentiveRequests = false;
    processIncentiveRequestsWriteQueue();
  }
}

async function safeWriteIncentiveRequests(data) {
  return new Promise((resolve, reject) => {
    incentiveRequestsWriteQueue.push({ data, resolve, reject });
    processIncentiveRequestsWriteQueue();
  });
}

async function readIncentiveRequests() {
  if (incentiveRequestsCache) {
    return incentiveRequestsCache;
  }
  try {
    const data = await fs.readFile(INCENTIVE_REQUESTS_FILE, 'utf8');
    incentiveRequestsCache = JSON.parse(data);
    return incentiveRequestsCache;
  } catch (error) {
    incentiveRequestsCache = [];
    return incentiveRequestsCache;
  }
}

async function writeIncentiveRequests(requests) {
  incentiveRequestsCache = requests;
  await safeWriteIncentiveRequests(requests);
}

let loginHistoryCache = null;

async function readLoginHistory() {
  if (loginHistoryCache) {
    return loginHistoryCache;
  }
  try {
    const data = await fs.readFile(LOGIN_HISTORY_FILE, 'utf8');
    loginHistoryCache = JSON.parse(data);
    return loginHistoryCache;
  } catch (error) {
    loginHistoryCache = [];
    return loginHistoryCache;
  }
}

async function writeLoginHistory(history) {
  loginHistoryCache = history;
  await fs.writeFile(LOGIN_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
}

async function logLoginEvent(username, name, role, action, req) {
  try {
    const history = await readLoginHistory();
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    
    // Convert current datetime to formatted string
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    const timestampStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const entry = {
      id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      username,
      name,
      role,
      action, // 'login' or 'logout'
      timestamp: timestampStr,
      ip: clientIp
    };
    history.unshift(entry);
    await writeLoginHistory(history.slice(0, 1000)); // Cap logs at 1000 entries
  } catch (e) {
    console.error('Failed to log login/logout event:', e.message);
  }
}

// Helper: Format today's date & time
function getCurrentDateTime() {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, '0');
  
  const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  return { dateStr, timeStr };
}

// Robust date parser supporting YYYY-MM-DD, DD/MM/YYYY, and Excel serial dates
function parseDate(dateVal) {
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (dateVal === null || dateVal === undefined) return null;
  const str = String(dateVal).trim();
  if (!str) return null;

  // 1. Check if it is an Excel serial date number
  if (/^\d+(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    const dateMs = (serial - 25569) * 86400 * 1000;
    const date = new Date(dateMs);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // 2. Check YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.substring(0, 10).split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // 3. Check DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const parts = str.substring(0, 10).split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Fallback to standard JS Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

// Convert any date to YYYY-MM-DD format for DB consistency
function formatDateToYYYYMMDD(date) {
  if (!date) return '';
  const d = parseDate(date);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


// Google Sheets Sync Helper
async function syncToGoogleSheets(record, isUpdate = false) {
  const settings = await readSettings();
  if (!settings.googleSheets || !settings.googleSheets.enabled || !settings.googleSheets.webhookUrl) {
    return { status: 'disabled', message: 'Google Sheets sync is disabled' };
  }

  try {
    const response = await fetch(settings.googleSheets.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: isUpdate ? 'update' : 'create',
        data: record
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { status: 'success', details: result };
  } catch (error) {
    console.error('Google Sheets sync error:', error);
    return { status: 'failed', error: error.message };
  }
}

// Google Sheets Delete Sync Helper
async function deleteFromGoogleSheets(sNo) {
  const settings = await readSettings();
  if (!settings.googleSheets || !settings.googleSheets.enabled || !settings.googleSheets.webhookUrl) {
    return { status: 'disabled', message: 'Google Sheets sync is disabled' };
  }

  try {
    const response = await fetch(settings.googleSheets.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'delete',
        data: { sNo }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { status: 'success', details: result };
  } catch (error) {
    console.error('Google Sheets delete error:', error);
    return { status: 'failed', error: error.message };
  }
}

// Twilio WhatsApp Dispatch Helper
async function sendWhatsAppNotification(record) {
  const settings = await readSettings();
  const config = settings.whatsapp;
  
  if (!config || !config.enabled || !config.twilioAccountSid || !config.twilioAuthToken || !config.twilioFromNumber) {
    // If not configured, we simulate it
    return { 
      status: 'simulated', 
      message: 'WhatsApp sent in Simulation Mode',
      recipient: config?.targetNumber || '9289062707',
      payload: formatWhatsAppMessage(record) 
    };
  }

  try {
    const sid = config.twilioAccountSid;
    const token = config.twilioAuthToken;
    const from = config.twilioFromNumber.startsWith('whatsapp:') ? config.twilioFromNumber : `whatsapp:${config.twilioFromNumber}`;
    const toRaw = config.targetNumber || '9289062707';
    // Format recipient with +91 if 10 digits without prefix (assuming Indian numbers)
    const formattedTo = toRaw.length === 10 ? `+91${toRaw}` : toRaw.startsWith('+') ? toRaw : `+${toRaw}`;
    const to = `whatsapp:${formattedTo}`;

    const messageBody = formatWhatsAppMessage(record);
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const basicAuth = Buffer.from(`${sid}:${token}`).toString('base64');

    const params = new URLSearchParams();
    params.append('From', from);
    params.append('To', to);
    params.append('Body', messageBody);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Twilio API Error: ${response.status} - ${errText}`);
    }

    const result = await response.json();
    return { status: 'success', sid: result.sid };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { status: 'failed', error: error.message };
  }
}

function formatWhatsAppMessage(record) {
  let statusTitle = record.status || 'Admission Done';
  if (!statusTitle.toLowerCase().endsWith('done')) {
    statusTitle = `${statusTitle} Done`;
  }
  return `*Sky Education Group - ${statusTitle}*

*Session:* ${record.session}
*Student Name:* ${record.studentName}
*Mobile Number:* ${record.mobileNumber}

*University:* ${record.universityName}
*Course:* ${record.course}

*Fees Type:* ${record.feesType}
*Payment Mode:* ${record.paymentMode}
*Amount Paid:* Rs. ${Number(record.amountPaid).toLocaleString('en-IN')}

*Date of Admission:* ${record.dateOfAdmission}
*Handled By:* ${record.counsellorName}
*Lead Source:* ${record.leadSource}
*Remark:* ${record.remarks || 'N/A'}

*Status:* ${record.status}`;
}

// Auto Lead Tagging Logic
function autoTagLead(record, admissionsList) {
  const tags = [];
  
  // Tag 1: Duplicate check
  const isDuplicate = admissionsList.some(
    item => item.mobileNumber === record.mobileNumber && item.sNo !== record.sNo
  );
  if (isDuplicate) {
    tags.push('Duplicate Contact');
  }

  // Tag 2: High Value check (Amount Paid > Rs. 50,000)
  if (Number(record.amountPaid) >= 50000) {
    tags.push('High Value');
  }

  // Tag 3: Lead Source tagging
  if (record.leadSource === 'Old Lead') {
    tags.push('Re-engagement');
  } else if (record.leadSource === 'Reference') {
    tags.push('Referral');
  } else {
    tags.push(`${record.leadSource} Lead`);
  }

  // Tag 4: Status-based tracking tag
  if (record.status === 'Follow-up' || record.status === 'Pending') {
    tags.push('Action Required');
  }

  return tags;
}

// Helper to compile a unique list of counsellor names belonging to a TL's team
function getTlTeamCounsellorNames(tlUser, allUsers) {
  const names = [];
  if (tlUser.name) {
    names.push(tlUser.name.trim());
  }
  if (tlUser.counsellors && Array.isArray(tlUser.counsellors)) {
    tlUser.counsellors.forEach(cUsername => {
      const cUser = allUsers.find(u => u.username.toLowerCase() === cUsername.toLowerCase());
      if (cUser && cUser.name) {
        names.push(cUser.name.trim());
      }
    });
  }
  return [...new Set(names)];
}

// ----------------- ROUTES -----------------

// Authentication API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, role, otpCode } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const settings = await readSettings();
    const cleanUsername = username.trim().toLowerCase();
    
    const matchedUser = settings.users.find(u => u.username.toLowerCase() === cleanUsername);

    if (matchedUser) {
      // Check password and role match
      const passwordMatch = matchedUser.password === password;
      const roleMatch = !role || matchedUser.role.toLowerCase() === role.toLowerCase();

      if (passwordMatch && roleMatch) {
        if (matchedUser.status === 'deactivated') {
          return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact IT / Admin.' });
        }

        if (matchedUser.twoFactorEnabled) {
          if (!otpCode) {
            return res.json({
              success: true,
              requires2FA: true
            });
          }
          
          if (!verifyTOTP(otpCode, matchedUser.twoFactorSecret)) {
            return res.status(401).json({ success: false, message: 'Invalid 2FA Verification Code' });
          }
        }
        
        // Successful login: reset failed attempts
        if (matchedUser.failedAttempts && matchedUser.failedAttempts > 0) {
          matchedUser.failedAttempts = 0;
          await writeSettings(settings);
        }

        // Log successful login event
        await logLoginEvent(matchedUser.username, matchedUser.name, matchedUser.role, 'login', req);

        return res.json({
          success: true,
          user: {
            username: matchedUser.username,
            name: matchedUser.name,
            role: matchedUser.role,
            twoFactorEnabled: !!matchedUser.twoFactorEnabled,
            twoFactorSecret: matchedUser.twoFactorSecret || ''
          }
        });
      } else {
        // Password or role mismatch
        if (!passwordMatch) {
          matchedUser.failedAttempts = (matchedUser.failedAttempts || 0) + 1;
          
          if (matchedUser.failedAttempts >= 3 && matchedUser.username.toLowerCase() !== 'admin') {
            matchedUser.status = 'deactivated';
            matchedUser.lastWorkingDate = new Date().toISOString().split('T')[0];
            await writeSettings(settings);
            
            // Log automatic deactivation event
            await logLoginEvent(matchedUser.username, matchedUser.name, matchedUser.role, 'deactivated_by_system', req);

            return res.status(403).json({ 
              success: false, 
              message: 'Your account has been deactivated due to 3 consecutive failed login attempts. Please contact IT / Admin.' 
            });
          } else {
            await writeSettings(settings);
            return res.status(401).json({ 
              success: false, 
              message: `Invalid username or password. Attempts remaining: ${Math.max(0, 3 - (matchedUser.failedAttempts || 0))}` 
            });
          }
        } else {
          return res.status(401).json({ success: false, message: 'Invalid role selected for this account' });
        }
      }
    } else {
      return res.status(401).json({ success: false, message: 'Invalid username or password for selected role' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Login/Logout History Logs (Admin/IT only)
app.get('/api/login-history', async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin' && userRole !== 'it') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const history = await readLoginHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log Logout Event
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { username, name, role } = req.body;
    if (username) {
      await logLoginEvent(username, name || username, role || 'counsellor', 'logout', req);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check Duplicate Mobile Number
app.get('/api/admissions/check-duplicate', async (req, res) => {
  const { mobile } = req.query;
  if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

  const admissions = await readAdmissions();
  const match = admissions.find(item => item.mobileNumber === mobile);

  if (match) {
    res.json({ 
      isDuplicate: true, 
      studentName: match.studentName,
      counsellorName: match.counsellorName,
      date: match.dateOfAdmission,
      status: match.status
    });
  } else {
    res.json({ isDuplicate: false });
  }
});

// Get Dropdowns and Public Settings
app.get('/api/settings', async (req, res) => {
  const settings = await readSettings();
  res.json(settings);
});

// Update Settings
app.put('/api/settings', async (req, res) => {
  try {
    const updatedSettings = req.body;
    const currentSettings = await readSettings();
    
    const currentAdmin = currentSettings.users.find(u => u.isPrimaryAdmin || u.username === 'admin');
    const updatedAdmin = updatedSettings.users.find(u => u.isPrimaryAdmin || (currentAdmin && u.username === currentAdmin.username));
    
    // Ensure the updated admin retains the isPrimaryAdmin flag
    if (updatedAdmin) {
      updatedAdmin.isPrimaryAdmin = true;
    }

    const passwordChanged = currentAdmin && updatedAdmin && currentAdmin.password !== updatedAdmin.password;
    const usernameChanged = currentAdmin && updatedAdmin && currentAdmin.username !== updatedAdmin.username;

    if (passwordChanged || usernameChanged) {
      const totpCode = req.headers['x-admin-totp'] || updatedSettings.adminTotpCode;
      if (!totpCode || !verifyTOTP(totpCode, currentSettings.adminTotpSecret)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Google Authenticator verification failed. Please enter the correct 6-digit verification code.' 
        });
      }
    }
    
    // Auto-generate twoFactorSecret for any user who has 2FA enabled but no secret key
    if (updatedSettings.users && Array.isArray(updatedSettings.users)) {
      updatedSettings.users = updatedSettings.users.map(u => {
        if (u.twoFactorEnabled) {
          if (!u.twoFactorSecret) {
            u.twoFactorSecret = generateBase32Secret();
          }
        }
        return u;
      });
    }

    // Strip temporary fields before writing
    delete updatedSettings.adminTotpCode;
    
    // Preserve secret key in file
    updatedSettings.adminTotpSecret = currentSettings.adminTotpSecret;
    
    await writeSettings(updatedSettings);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Pending Approvals (Admin/IT only)
app.get('/api/approvals', async (req, res) => {
  try {
    const approvals = await readApprovals();
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approve a Pending Admission (Admin/IT only)
app.post('/api/approvals/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const approvals = await readApprovals();
    const admissions = await readAdmissions();
    
    const index = approvals.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Pending approval record not found' });
    }
    
    const pendingRecord = approvals[index];
    
    // Check if this is an upgrade/update of an existing record
    const existingIndex = admissions.findIndex(item => 
      (pendingRecord.isUpdateOfSNo && item.sNo === pendingRecord.isUpdateOfSNo) ||
      (!pendingRecord.isUpdateOfSNo && item.mobileNumber === pendingRecord.mobileNumber)
    );
    
    let record;
    const isUpdate = existingIndex !== -1;
    
    if (isUpdate) {
      const existing = admissions[existingIndex];
      record = {
        ...existing,
        session: pendingRecord.session,
        studentName: pendingRecord.studentName,
        universityName: pendingRecord.universityName,
        course: pendingRecord.course,
        feesType: pendingRecord.feesType,
        paymentMode: pendingRecord.paymentMode,
        amountPaid: Number(pendingRecord.amountPaid) || 0,
        dateOfAdmission: pendingRecord.dateOfAdmission || existing.dateOfAdmission,
        counsellorName: pendingRecord.counsellorName,
        leadSource: pendingRecord.leadSource,
        remarks: pendingRecord.remarks,
        status: pendingRecord.status,
        tags: pendingRecord.tags || []
      };
      
      // Update primary 'date' to match the new 'dateOfAdmission' if provided
      if (record.dateOfAdmission) {
        const parsed = parseDate(record.dateOfAdmission);
        if (parsed) {
          const pad = (num) => String(num).padStart(2, '0');
          record.date = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
        }
      }
    } else {
      // Generate S.No automatically for new entries
      let nextSNo = 1;
      if (admissions.length > 0) {
        nextSNo = Math.max(...admissions.map(item => item.sNo || 0)) + 1;
      }
      record = {
        sNo: nextSNo,
        date: pendingRecord.date,
        time: pendingRecord.time,
        session: pendingRecord.session,
        studentName: pendingRecord.studentName,
        mobileNumber: pendingRecord.mobileNumber,
        universityName: pendingRecord.universityName,
        course: pendingRecord.course,
        feesType: pendingRecord.feesType,
        paymentMode: pendingRecord.paymentMode,
        amountPaid: Number(pendingRecord.amountPaid) || 0,
        dateOfAdmission: pendingRecord.dateOfAdmission,
        counsellorName: pendingRecord.counsellorName,
        leadSource: pendingRecord.leadSource,
        remarks: pendingRecord.remarks,
        status: pendingRecord.status,
        tags: pendingRecord.tags || []
      };
    }
    
    // Auto-tag lead
    record.tags = autoTagLead(record, admissions);
    
    // Save/update admissions ledger
    if (isUpdate) {
      admissions[existingIndex] = record;
    } else {
      admissions.push(record);
    }
    await writeAdmissions(admissions);
    
    // Trigger Integrations in the background
    const sheetSyncPromise = syncToGoogleSheets(record, isUpdate);
    const whatsappPromise = sendWhatsAppNotification(record);
    
    const [sheetResult, whatsappResult] = await Promise.all([sheetSyncPromise, whatsappPromise]);
    
    // Store sync results in local record for monitoring
    record.syncStatus = {
      googleSheets: sheetResult.status,
      whatsapp: whatsappResult.status,
      whatsappMessage: whatsappResult.payload || null,
      lastSyncTime: new Date().toISOString(),
      sheetsError: sheetResult.error || null,
      whatsappError: whatsappResult.error || null
    };
    
    // Save with sync statuses
    const recIndex = admissions.findIndex(item => item.sNo === record.sNo);
    if (recIndex !== -1) {
      admissions[recIndex] = record;
      await writeAdmissions(admissions);
    }
    
    // Remove from approvals
    approvals.splice(index, 1);
    await writeApprovals(approvals);
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject a Pending Admission (Admin/IT only)
app.delete('/api/approvals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const approvals = await readApprovals();
    
    const index = approvals.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Pending approval record not found' });
    }
    
    approvals.splice(index, 1);
    await writeApprovals(approvals);
    
    res.json({
      success: true,
      message: 'Pending approval record rejected successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get All Admissions (Admin only - client should verify role)
app.get('/api/admissions', async (req, res) => {
  const { counsellorName, tlUsername } = req.query;
  let admissions = await readAdmissions();

  if (counsellorName) {
    admissions = admissions.filter(item => 
      item.counsellorName && item.counsellorName.trim().toLowerCase() === counsellorName.trim().toLowerCase()
    );
  } else if (tlUsername) {
    const settings = await readSettings();
    const tlUser = settings.users?.find(u => u.username.toLowerCase() === tlUsername.toLowerCase());
    if (tlUser && tlUser.role === 'tl') {
      const teamNames = getTlTeamCounsellorNames(tlUser, settings.users || []);
      admissions = admissions.filter(item => 
        item.counsellorName && teamNames.includes(item.counsellorName)
      );
    }
  }

  res.json(admissions);
});

// Create New Admission Entry
app.post('/api/admissions', async (req, res) => {
  try {
    const newEntry = req.body;
    const { dateStr, timeStr } = getCurrentDateTime();

    const admissions = await readAdmissions();
    const settings = await readSettings();

    // Check if duplicate student mobile exists in the ledger
    const existingRecord = admissions.find(item => item.mobileNumber === newEntry.mobileNumber);
    if (existingRecord) {
      // Validate edit/update permission for this record using submitterRole and submitterUsername
      const subRole = (newEntry.submitterRole || '').toLowerCase();
      const subUsername = (newEntry.submitterUsername || '').toLowerCase();
      
      const currentUserObj = settings.users?.find(u => u.username.toLowerCase() === subUsername);
      let isAllowed = false;
      
      if (subRole === 'admin' || subRole === 'it') {
        isAllowed = true;
      } else if (subRole === 'counsellor' && currentUserObj) {
        isAllowed = existingRecord.counsellorName && existingRecord.counsellorName.trim().toLowerCase() === currentUserObj.name?.trim().toLowerCase();
      } else if (subRole === 'tl' && currentUserObj) {
        const teamNames = getTlTeamCounsellorNames(currentUserObj, settings.users || []).map(n => n.toLowerCase());
        isAllowed = existingRecord.counsellorName && teamNames.includes(existingRecord.counsellorName.trim().toLowerCase());
      }

      if (!isAllowed) {
        return res.status(403).json({ success: false, message: 'You do not have permission to upgrade/convert this existing record' });
      }

      // If submitter is counsellor or TL, create a pending approval request with isUpdateOfSNo
      if (newEntry.submitterRole === 'counsellor' || newEntry.submitterRole === 'tl') {
        const approvals = await readApprovals();
        const approvalRecord = {
          id: 'app_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          date: dateStr,
          time: timeStr,
          session: newEntry.session,
          studentName: newEntry.studentName,
          mobileNumber: newEntry.mobileNumber,
          universityName: newEntry.universityName,
          course: newEntry.course,
          feesType: newEntry.feesType,
          paymentMode: newEntry.paymentMode,
          amountPaid: Number(newEntry.amountPaid) || 0,
          dateOfAdmission: formatDateToYYYYMMDD(newEntry.dateOfAdmission) || formatDateToYYYYMMDD(new Date()),
          counsellorName: newEntry.counsellorName,
          leadSource: newEntry.leadSource,
          remarks: newEntry.remarks || '',
          status: newEntry.status || 'Pending',
          tags: [],
          submitterRole: newEntry.submitterRole,
          submitterUsername: newEntry.submitterUsername,
          isUpdateOfSNo: existingRecord.sNo
        };
        
        approvalRecord.tags = autoTagLead(approvalRecord, admissions);
        approvals.push(approvalRecord);
        await writeApprovals(approvals);

        return res.status(201).json({
          success: true,
          pendingApproval: true,
          data: approvalRecord
        });
      }

      // If submitter is Admin or IT, update the existing record directly
      const index = admissions.findIndex(item => item.sNo === existingRecord.sNo);
      if (index !== -1) {
        const record = {
          ...existingRecord,
          session: newEntry.session,
          studentName: newEntry.studentName,
          universityName: newEntry.universityName,
          course: newEntry.course,
          feesType: newEntry.feesType,
          paymentMode: newEntry.paymentMode,
          amountPaid: Number(newEntry.amountPaid) || 0,
          dateOfAdmission: formatDateToYYYYMMDD(newEntry.dateOfAdmission) || existingRecord.dateOfAdmission,
          counsellorName: newEntry.counsellorName,
          leadSource: newEntry.leadSource,
          remarks: newEntry.remarks || '',
          status: newEntry.status || existingRecord.status
        };

        // Update primary 'date' to match the new 'dateOfAdmission' if provided
        if (record.dateOfAdmission) {
          const parsed = parseDate(record.dateOfAdmission);
          if (parsed) {
            const pad = (num) => String(num).padStart(2, '0');
            record.date = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
          }
        }

        record.tags = autoTagLead(record, admissions);

        // Trigger Integrations in the background
        const sheetSyncPromise = syncToGoogleSheets(record, true);
        const whatsappPromise = sendWhatsAppNotification(record);
        const [sheetResult, whatsappResult] = await Promise.all([sheetSyncPromise, whatsappPromise]);

        record.syncStatus = {
          googleSheets: sheetResult.status,
          whatsapp: whatsappResult.status,
          whatsappMessage: whatsappResult.payload || null,
          lastSyncTime: new Date().toISOString(),
          sheetsError: sheetResult.error || null,
          whatsappError: whatsappResult.error || null
        };

        admissions[index] = record;
        await writeAdmissions(admissions);

        return res.status(201).json({
          success: true,
          data: record
        });
      }
    }

    if (newEntry.submitterRole === 'counsellor' || newEntry.submitterRole === 'tl') {
      const approvals = await readApprovals();
      const approvalRecord = {
        id: 'app_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        date: dateStr,            // Submission Date
        time: timeStr,            // Submission Time
        session: newEntry.session,
        studentName: newEntry.studentName,
        mobileNumber: newEntry.mobileNumber,
        universityName: newEntry.universityName,
        course: newEntry.course,
        feesType: newEntry.feesType,
        paymentMode: newEntry.paymentMode,
        amountPaid: Number(newEntry.amountPaid) || 0,
        dateOfAdmission: formatDateToYYYYMMDD(newEntry.dateOfAdmission) || formatDateToYYYYMMDD(new Date()),
        counsellorName: newEntry.counsellorName,
        leadSource: newEntry.leadSource,
        remarks: newEntry.remarks || '',
        status: newEntry.status || 'Pending',
        tags: [],
        submitterRole: newEntry.submitterRole,
        submitterUsername: newEntry.submitterUsername
      };

      approvalRecord.tags = autoTagLead(approvalRecord, admissions);

      approvals.push(approvalRecord);
      await writeApprovals(approvals);

      return res.status(201).json({
        success: true,
        pendingApproval: true,
        data: approvalRecord
      });
    }

    // Generate S.No automatically
    let nextSNo = 1;
    if (admissions.length > 0) {
      nextSNo = Math.max(...admissions.map(item => item.sNo || 0)) + 1;
    }

    const record = {
      sNo: nextSNo,
      date: dateStr,            // Submission Date
      time: timeStr,            // Submission Time
      session: newEntry.session,
      studentName: newEntry.studentName,
      mobileNumber: newEntry.mobileNumber,
      universityName: newEntry.universityName,
      course: newEntry.course,
      feesType: newEntry.feesType,
      paymentMode: newEntry.paymentMode,
      amountPaid: Number(newEntry.amountPaid) || 0,
      dateOfAdmission: formatDateToYYYYMMDD(newEntry.dateOfAdmission) || formatDateToYYYYMMDD(new Date()),
      counsellorName: newEntry.counsellorName,
      leadSource: newEntry.leadSource,
      remarks: newEntry.remarks || '',
      status: newEntry.status || 'Pending',
      tags: []
    };

    // Auto-tag lead
    record.tags = autoTagLead(record, admissions);

    // Add to local list
    admissions.push(record);
    await writeAdmissions(admissions);

    // Trigger Integrations in the background
    const sheetSyncPromise = syncToGoogleSheets(record, false);
    const whatsappPromise = sendWhatsAppNotification(record);

    const [sheetResult, whatsappResult] = await Promise.all([sheetSyncPromise, whatsappPromise]);

    // Store sync results in local record for monitoring
    record.syncStatus = {
      googleSheets: sheetResult.status,
      whatsapp: whatsappResult.status,
      whatsappMessage: whatsappResult.payload || null, // Display simulated output in UI
      lastSyncTime: new Date().toISOString(),
      sheetsError: sheetResult.error || null,
      whatsappError: whatsappResult.error || null
    };

    // Save with sync statuses
    const index = admissions.findIndex(item => item.sNo === record.sNo);
    if (index !== -1) {
      admissions[index] = record;
      await writeAdmissions(admissions);
    }

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Existing Admission Entry
app.put('/api/admissions/:sNo', async (req, res) => {
  try {
    const sNo = parseInt(req.params.sNo);
    const updatedEntry = req.body;
    const admissions = await readAdmissions();

    const index = admissions.findIndex(item => item.sNo === sNo);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Admission record not found' });
    }

    const existing = admissions[index];

    // Enforce role-based edit permission
    const userRole = (req.headers['x-user-role'] || '').toLowerCase();
    const userUsername = (req.headers['x-user-username'] || '').toLowerCase();

    // If headers are provided, we validate them (or always on non-test environment)
    if (userRole || process.env.NODE_ENV !== 'test') {
      const settings = await readSettings();
      const currentUserObj = settings.users?.find(u => u.username.toLowerCase() === userUsername);
      let isAllowed = false;

      if (userRole === 'admin' || userRole === 'it') {
        isAllowed = true;
      } else if (userRole === 'counsellor' && currentUserObj) {
        isAllowed = existing.counsellorName && existing.counsellorName.trim().toLowerCase() === currentUserObj.name?.trim().toLowerCase();
      } else if (userRole === 'tl' && currentUserObj) {
        const teamNames = getTlTeamCounsellorNames(currentUserObj, settings.users || []).map(n => n.toLowerCase());
        isAllowed = existing.counsellorName && teamNames.includes(existing.counsellorName.trim().toLowerCase());
      }

      if (!isAllowed) {
        return res.status(403).json({ success: false, message: 'You do not have permission to edit this record' });
      }
    }

    // Merge record
    const statusChanged = updatedEntry.status !== undefined && updatedEntry.status !== existing.status;
    let finalDateOfAdmission = existing.dateOfAdmission;
    
    if (updatedEntry.dateOfAdmission !== undefined) {
      finalDateOfAdmission = formatDateToYYYYMMDD(updatedEntry.dateOfAdmission) || existing.dateOfAdmission;
    } else if (statusChanged && (updatedEntry.status === 'Admission Done' || updatedEntry.status === 'Part Payment' || updatedEntry.status === 'Registration')) {
      // Auto-update to today's date on status upgrades if no date is specified
      const { dateStr } = getCurrentDateTime();
      const parts = dateStr.split('/');
      finalDateOfAdmission = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const record = {
      ...existing,
      session: updatedEntry.session ?? existing.session,
      studentName: updatedEntry.studentName ?? existing.studentName,
      mobileNumber: updatedEntry.mobileNumber ?? existing.mobileNumber,
      universityName: updatedEntry.universityName ?? existing.universityName,
      course: updatedEntry.course ?? existing.course,
      feesType: updatedEntry.feesType ?? existing.feesType,
      paymentMode: updatedEntry.paymentMode ?? existing.paymentMode,
      amountPaid: updatedEntry.amountPaid !== undefined ? Number(updatedEntry.amountPaid) : existing.amountPaid,
      dateOfAdmission: finalDateOfAdmission,
      counsellorName: updatedEntry.counsellorName ?? existing.counsellorName,
      leadSource: updatedEntry.leadSource ?? existing.leadSource,
      remarks: updatedEntry.remarks ?? existing.remarks,
      status: updatedEntry.status ?? existing.status,
    };

    // Update primary 'date' to match 'dateOfAdmission' if provided
    if (record.dateOfAdmission) {
      const parsed = parseDate(record.dateOfAdmission);
      if (parsed) {
        const pad = (num) => String(num).padStart(2, '0');
        record.date = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
      }
    }

    // Re-evaluate tags
    record.tags = autoTagLead(record, admissions);

    // Trigger Google Sheets sync update in background
    const sheetSyncResult = await syncToGoogleSheets(record, true);
    
    // Trigger WhatsApp notification if status changed
    let whatsappResult = { status: 'skipped' };
    if (record.status !== existing.status) {
      whatsappResult = await sendWhatsAppNotification(record);
    }

    record.syncStatus = {
      googleSheets: sheetSyncResult.status,
      whatsapp: whatsappResult.status === 'skipped' ? (existing.syncStatus?.whatsapp || 'skipped') : whatsappResult.status,
      whatsappMessage: whatsappResult.payload || existing.syncStatus?.whatsappMessage || null,
      lastSyncTime: new Date().toISOString(),
      sheetsError: sheetSyncResult.error || null,
      whatsappError: whatsappResult.error || null
    };

    admissions[index] = record;
    await writeAdmissions(admissions);

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete Admission Entry
app.delete('/api/admissions/:sNo', async (req, res) => {
  try {
    const sNo = parseInt(req.params.sNo);
    const admissions = await readAdmissions();

    const index = admissions.findIndex(item => item.sNo === sNo);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Admission record not found' });
    }

    admissions.splice(index, 1);
    await writeAdmissions(admissions);

    // Sync deletion to Google Sheets in background
    deleteFromGoogleSheets(sNo);

    res.json({ success: true, message: 'Admission record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual Re-sync for a failed record
app.post('/api/admissions/:sNo/sync', async (req, res) => {
  try {
    const sNo = parseInt(req.params.sNo);
    const admissions = await readAdmissions();

    const index = admissions.findIndex(item => item.sNo === sNo);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    const record = admissions[index];

    const sheetSyncPromise = syncToGoogleSheets(record, true);
    const whatsappPromise = sendWhatsAppNotification(record);

    const [sheetResult, whatsappResult] = await Promise.all([sheetSyncPromise, whatsappPromise]);

    record.syncStatus = {
      googleSheets: sheetResult.status,
      whatsapp: whatsappResult.status,
      whatsappMessage: whatsappResult.payload || null,
      lastSyncTime: new Date().toISOString(),
      sheetsError: sheetResult.error || null,
      whatsappError: whatsappResult.error || null
    };

    admissions[index] = record;
    await writeAdmissions(admissions);

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk Create Admissions Entries (Excel/CSV Imports)
app.post('/api/admissions/bulk', async (req, res) => {
  try {
    const newEntries = req.body;
    if (!Array.isArray(newEntries)) {
      return res.status(400).json({ success: false, error: 'Request body must be an array of records' });
    }

    const admissions = await readAdmissions();
    const { dateStr, timeStr } = getCurrentDateTime();
    const importedRecords = [];

    // Find starting S.No
    let nextSNo = 1;
    if (admissions.length > 0) {
      nextSNo = Math.max(...admissions.map(item => item.sNo || 0)) + 1;
    }

    for (const entry of newEntries) {
      // Validate minimal fields
      if (!entry.studentName || !entry.mobileNumber) {
        continue;
      }

      // Check duplicates inside the DB + currently importing list
      const isDuplicate = admissions.some(
        item => item.mobileNumber === entry.mobileNumber
      );

      const record = {
        sNo: nextSNo++,
        date: entry.date || dateStr,
        time: entry.time || timeStr,
        session: entry.session || 'July 2026',
        studentName: entry.studentName,
        mobileNumber: entry.mobileNumber,
        universityName: entry.universityName || 'N/A',
        course: entry.course || 'N/A',
        feesType: entry.feesType || 'Registration',
        paymentMode: entry.paymentMode || 'UPI',
        amountPaid: Number(entry.amountPaid) || 0,
        dateOfAdmission: formatDateToYYYYMMDD(entry.dateOfAdmission) || formatDateToYYYYMMDD(dateStr) || formatDateToYYYYMMDD(new Date()),
        counsellorName: entry.counsellorName || 'N/A',
        leadSource: entry.leadSource || 'Website',
        remarks: entry.remarks || '',
        status: entry.status || 'Admission Done',
        tags: []
      };

      // Auto-tag lead
      record.tags = autoTagLead(record, admissions);

      // Trigger Integrations asynchronously (in the background)
      const sheetSyncPromise = syncToGoogleSheets(record, false);
      const whatsappPromise = sendWhatsAppNotification(record);

      // Attach mock/sync results
      record.syncStatus = {
        googleSheets: 'pending',
        whatsapp: 'pending',
        lastSyncTime: new Date().toISOString()
      };

      // Resolve promises and update local sync states asynchronously
      Promise.all([sheetSyncPromise, whatsappPromise]).then(async ([sheetResult, whatsappResult]) => {
        const currentAdmissions = await readAdmissions();
        const recIndex = currentAdmissions.findIndex(item => item.sNo === record.sNo);
        if (recIndex !== -1) {
          currentAdmissions[recIndex].syncStatus = {
            googleSheets: sheetResult.status,
            whatsapp: whatsappResult.status,
            whatsappMessage: whatsappResult.payload || null,
            lastSyncTime: new Date().toISOString(),
            sheetsError: sheetResult.error || null,
            whatsappError: whatsappResult.error || null
          };
          await writeAdmissions(currentAdmissions);
        }
      });

      admissions.push(record);
      importedRecords.push(record);
    }

    await writeAdmissions(admissions);

    res.status(201).json({
      success: true,
      importedCount: importedRecords.length,
      data: importedRecords
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync and pull all records from Google Sheets
// Reusable helper to pull and sync all database records from Google Sheets
async function pullSyncFromGoogleSheets() {
  const settings = await readSettings();
  if (!settings.googleSheets || !settings.googleSheets.enabled || !settings.googleSheets.webhookUrl) {
    throw new Error('Google Sheets sync is disabled or webhook URL is not configured');
  }

  const response = await fetch(settings.googleSheets.webhookUrl);
  if (!response.ok) {
    throw new Error(`Google Sheets Web App returned status ${response.status}`);
  }

  const sheetRecords = await response.json();
  if (sheetRecords.error) {
    throw new Error(sheetRecords.error);
  }

  if (!Array.isArray(sheetRecords)) {
    throw new Error('The Google Sheets Web App returned invalid data (not an array).');
  }

  const admissions = await readAdmissions();
  const originalCount = admissions.length;

  // Collect all valid sNo values from sheetRecords
  const sheetSNoSet = new Set(
    sheetRecords
      .map(r => parseInt(r.sNo))
      .filter(s => !isNaN(s) && s > 0)
  );

  // Remove local admissions that have a sNo which is NOT in the fetched sheets
  const keptAdmissions = admissions.filter(item => {
    if (!item.sNo) return true; // Keep any items without sNo just in case
    return sheetSNoSet.has(item.sNo);
  });

  const deletedCount = originalCount - keptAdmissions.length;
  let insertedCount = 0;
  let updatedCount = 0;

  for (const record of sheetRecords) {
    // Normalize imported values
    const studentName = record.studentName ? record.studentName.trim() : '';
    let mobileNumber = record.mobileNumber ? String(record.mobileNumber).replace(/\D/g, '') : '';
    if (mobileNumber.length === 12 && mobileNumber.startsWith('91')) {
      mobileNumber = mobileNumber.substring(2);
    } else if (mobileNumber.length === 11 && mobileNumber.startsWith('0')) {
      mobileNumber = mobileNumber.substring(1);
    }

    if (!studentName || !mobileNumber) continue;

    const dateOfAdmission = formatDateToYYYYMMDD(record.dateOfAdmission) || formatDateToYYYYMMDD(new Date());
    const amountPaid = Number(record.amountPaid) || 0;
    const sNo = parseInt(record.sNo) || null;

    // Try to find matching record by S.No first, then by mobile number in keptAdmissions
    let existingIndex = -1;
    if (sNo) {
      existingIndex = keptAdmissions.findIndex(item => item.sNo === sNo);
    }
    if (existingIndex === -1) {
      existingIndex = keptAdmissions.findIndex(item => item.mobileNumber === mobileNumber);
    }

    // Auto-align 'date' with 'dateOfAdmission' if dateOfAdmission is present
    let finalDate = record.date || keptAdmissions[existingIndex]?.date || getCurrentDateTime().dateStr;
    if (dateOfAdmission) {
      const parsed = parseDate(dateOfAdmission);
      if (parsed) {
        const pad = (num) => String(num).padStart(2, '0');
        finalDate = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
      }
    }

    const mergedRecord = {
      sNo: sNo || (existingIndex !== -1 ? keptAdmissions[existingIndex].sNo : Math.max(...keptAdmissions.map(item => item.sNo || 0), 0) + 1),
      date: finalDate,
      time: record.time || keptAdmissions[existingIndex]?.time || getCurrentDateTime().timeStr,
      session: record.session || keptAdmissions[existingIndex]?.session || 'July 2026',
      studentName,
      mobileNumber,
      universityName: record.universityName || keptAdmissions[existingIndex]?.universityName || 'N/A',
      course: record.course || keptAdmissions[existingIndex]?.course || 'N/A',
      feesType: record.feesType || keptAdmissions[existingIndex]?.feesType || 'Registration',
      paymentMode: record.paymentMode || keptAdmissions[existingIndex]?.paymentMode || 'UPI',
      amountPaid,
      dateOfAdmission,
      counsellorName: record.counsellorName || keptAdmissions[existingIndex]?.counsellorName || 'N/A',
      leadSource: record.leadSource || keptAdmissions[existingIndex]?.leadSource || 'Website',
      remarks: record.remarks || keptAdmissions[existingIndex]?.remarks || '',
      status: record.status || keptAdmissions[existingIndex]?.status || 'Admission Done',
      tags: []
    };

    // Auto-tag lead
    mergedRecord.tags = autoTagLead(mergedRecord, keptAdmissions);

    if (existingIndex !== -1) {
      // Retain sync status metadata if present
      mergedRecord.syncStatus = keptAdmissions[existingIndex].syncStatus || {
        googleSheets: 'success',
        whatsapp: 'skipped'
      };
      keptAdmissions[existingIndex] = mergedRecord;
      updatedCount++;
    } else {
      mergedRecord.syncStatus = {
        googleSheets: 'success',
        whatsapp: 'skipped'
      };
      keptAdmissions.push(mergedRecord);
      insertedCount++;
    }
  }

  await writeAdmissions(keptAdmissions);

  return {
    insertedCount,
    updatedCount,
    deletedCount,
    totalCount: sheetRecords.length
  };
}

// Sync and pull all records from Google Sheets
app.post('/api/admissions/sync-pull', async (req, res) => {
  try {
    const result = await pullSyncFromGoogleSheets();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper to get active monthly target for a counsellor by date
function getCounsellorMonthlyTarget(settings, counsellorName, refDate = new Date()) {
  const defaultTarget = settings.incentiveConfig?.monthlyTarget || 250000;
  if (!counsellorName || !settings.counsellorTargets || !Array.isArray(settings.counsellorTargets)) {
    return defaultTarget;
  }
  
  const dateObj = typeof refDate === 'string' ? parseDate(refDate) : refDate;
  if (!dateObj) return defaultTarget;

  // Check dateOfJoining & lastWorkingDate eligibility
  const userObj = settings.users?.find(u => u.name && u.name.trim().toLowerCase() === counsellorName.trim().toLowerCase());
  if (userObj) {
    if (userObj.dateOfJoining) {
      const doj = parseDate(userObj.dateOfJoining);
      if (doj && doj > dateObj) return 0;
    }
    if (userObj.status === 'deactivated' && userObj.lastWorkingDate) {
      const lwd = parseDate(userObj.lastWorkingDate);
      if (lwd && lwd < dateObj) return 0;
    }
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  const match = settings.counsellorTargets.find(t => 
    t.counsellorName && 
    t.counsellorName.trim().toLowerCase() === counsellorName.trim().toLowerCase() &&
    dateStr >= t.startDate &&
    dateStr <= t.endDate
  );
  
  return match ? Number(match.targetAmount) : defaultTarget;
}

// Helper to calculate target metrics for a specific counsellor
function getCounsellorTargetMetrics(admissions, counsellorName, settings = {}, options = {}) {
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  
  const calculationStartDateStr = options.calculationStartDate || settings.incentiveConfig?.calculationStartDate || '2026-04-01';
  const calculationStartDate = new Date(calculationStartDateStr);
  calculationStartDate.setHours(0, 0, 0, 0);
  
  const cycleStartMonth = calculationStartDate.getMonth();
  
  // Helper to resolve year of any month relative to the cycle starting month
  const getYearForMonth = (monthIdx, startYear, cycleStart) => {
    return monthIdx < cycleStart ? startYear + 1 : startYear;
  };
  
  // 1. Resolve Monthly range
  let mStart = new Date(currentYear, currentMonth, 1);
  let mEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

  if (options.selectedMonth) {
    const p = options.selectedMonth.split('-');
    if (p.length === 2) {
      const yr = Number(p[0]);
      const mth = Number(p[1]) - 1;
      mStart = new Date(yr, mth, 1);
      mEnd = new Date(yr, mth + 1, 0, 23, 59, 59, 999);
    }
  } else if (options.startDate && options.endDate) {
    const parseDateStr = (dStr) => {
      const p = dStr.split('-');
      if (p.length === 3) {
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
      }
      return null;
    };
    const s = parseDateStr(options.startDate);
    const e = parseDateStr(options.endDate);
    if (s && e) {
      const startYear = s.getFullYear();
      const startMonth = s.getMonth();
      const endYear = e.getFullYear();
      const endMonth = e.getMonth();
      
      if (startYear === endYear && startMonth === endMonth) {
        // Spans a single month, we can use this specific month
        mStart = new Date(startYear, startMonth, 1);
        mEnd = new Date(startYear, startMonth + 1, 0, 23, 59, 59, 999);
      } else {
        // Spans multiple months (e.g. custom period of 5 months)
        // If current system date is within the range, use current month
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        
        const compareStart = new Date(s);
        compareStart.setHours(0, 0, 0, 0);
        const compareEnd = new Date(e);
        compareEnd.setHours(23, 59, 59, 999);
        
        if (today >= compareStart && today <= compareEnd) {
          mStart = new Date(currentYear, currentMonth, 1);
          mEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        } else {
          mStart = new Date(endYear, endMonth, 1);
          mEnd = new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999);
        }
      }
    }
  }
  
  // 2. Resolve Quarterly range
  const adjustedMonth = (currentMonth - cycleStartMonth + 12) % 12;
  const currentQIdx = Math.floor(adjustedMonth / 3); // 0, 1, 2, 3
  
  const qIdx = (options.selectedQuarter !== undefined && options.selectedQuarter !== null && options.selectedQuarter !== '')
    ? (Number(options.selectedQuarter) - 1)
    : currentQIdx;
  
  const fiscalYearStart = currentMonth >= cycleStartMonth ? currentYear : currentYear - 1;
  
  const qStartMonthIdx = (cycleStartMonth + qIdx * 3) % 12;
  const qEndMonthIdx = (qStartMonthIdx + 2) % 12;
  
  const qStartYear = getYearForMonth(qStartMonthIdx, fiscalYearStart, cycleStartMonth);
  const qEndYear = getYearForMonth(qEndMonthIdx, fiscalYearStart, cycleStartMonth);
  
  const qStart = new Date(qStartYear, qStartMonthIdx, 1);
  const qEnd = new Date(qEndYear, qEndMonthIdx + 1, 0, 23, 59, 59, 999);
  
  // 3. Resolve Half-Yearly range
  const currentHIdx = Math.floor(adjustedMonth / 6); // 0, 1
  
  const hIdx = (options.selectedHalfYear !== undefined && options.selectedHalfYear !== null && options.selectedHalfYear !== '')
    ? (Number(options.selectedHalfYear) - 1)
    : currentHIdx;
  
  const hStartMonthIdx = (cycleStartMonth + hIdx * 6) % 12;
  const hEndMonthIdx = (hStartMonthIdx + 5) % 12;
  
  const hStartYear = getYearForMonth(hStartMonthIdx, fiscalYearStart, cycleStartMonth);
  const hEndYear = getYearForMonth(hEndMonthIdx, fiscalYearStart, cycleStartMonth);
  
  const hStart = new Date(hStartYear, hStartMonthIdx, 1);
  const hEnd = new Date(hEndYear, hEndMonthIdx + 1, 0, 23, 59, 59, 999);
  
  // 4. Resolve Annual range
  const yStart = new Date(fiscalYearStart, cycleStartMonth, 1);
  const yEnd = new Date(fiscalYearStart + 1, cycleStartMonth, 0, 23, 59, 59, 999);
  
  let monthlyRevenue = 0;
  let quarterlyRevenue = 0;
  let halfYearlyRevenue = 0;
  let annualRevenue = 0;
  
  // Filter for counsellor and status === 'Admission Done'
  const counsellorAdmissions = admissions.filter(item => 
    item.status === 'Admission Done' &&
    (!counsellorName || (item.counsellorName && item.counsellorName.trim().toLowerCase() === counsellorName.trim().toLowerCase()))
  );
  
  counsellorAdmissions.forEach(item => {
    const parsedDate = parseDate(item.dateOfAdmission);
    if (!parsedDate) return;
    
    // Create copy for comparison
    const compareDate = new Date(parsedDate);
    compareDate.setHours(12, 0, 0, 0);
    
    // Strict cutoff date check
    if (compareDate < calculationStartDate) return;
    
    const amount = Number(item.amountPaid) || 0;
    
    // Monthly
    if (compareDate >= mStart && compareDate <= mEnd) {
      monthlyRevenue += amount;
    }
    
    // Quarterly
    if (compareDate >= qStart && compareDate <= qEnd) {
      quarterlyRevenue += amount;
    }
    
    // Half-Yearly
    if (compareDate >= hStart && compareDate <= hEnd) {
      halfYearlyRevenue += amount;
    }
    
    // Annual
    if (compareDate >= yStart && compareDate <= yEnd) {
      annualRevenue += amount;
    }
  });
  
  const pad = (num) => String(num).padStart(2, '0');
  const formatDateRange = (start, end) => {
    const sStr = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}/${start.getFullYear()}`;
    const eStr = `${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`;
    return `${sStr} - ${eStr}`;
  };

  return {
    monthlyRevenue,
    quarterlyRevenue,
    halfYearlyRevenue,
    annualRevenue,
    currentQuarter: currentQIdx + 1,
    currentHalfYear: currentHIdx + 1,
    currentMonthStr: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, '0')}`,
    ranges: {
      monthly: formatDateRange(mStart, mEnd),
      quarterly: formatDateRange(qStart, qEnd),
      halfYearly: formatDateRange(hStart, hEnd),
      annual: formatDateRange(yStart, yEnd)
    }
  };
}

// Advanced Stats API
app.get('/api/stats', async (req, res) => {
  const { startDate, endDate, counsellorName, selectedQuarter, selectedHalfYear, selectedMonth, calculationStartDate, tlUsername } = req.query;
  const allAdmissions = await readAdmissions();
  const settings = await readSettings();
  
  // Resolve TL team if tlUsername provided
  let teamCounsellorNames = null;
  if (tlUsername) {
    const tlUser = settings.users?.find(u => u.username.toLowerCase() === tlUsername.toLowerCase());
    if (tlUser && tlUser.role === 'tl') {
      teamCounsellorNames = getTlTeamCounsellorNames(tlUser, settings.users || []);
    }
  }

  // Calculate target metrics (filtered by TL team if active, and no specific counselor filter is selected)
  let targetAdmissions = allAdmissions;
  if (teamCounsellorNames && !counsellorName) {
    targetAdmissions = allAdmissions.filter(item => 
      item.counsellorName && teamCounsellorNames.includes(item.counsellorName)
    );
  }
  const targetMetrics = getCounsellorTargetMetrics(targetAdmissions, counsellorName, settings, {
    selectedQuarter,
    selectedHalfYear,
    selectedMonth,
    calculationStartDate,
    startDate,
    endDate
  });

  const incentiveConfig = settings.incentiveConfig || null;
  const tDateObj = new Date();
  const tYear = tDateObj.getFullYear();
  const tMonth = String(tDateObj.getMonth() + 1).padStart(2, '0');
  const tDay = String(tDateObj.getDate()).padStart(2, '0');
  const tDateStr = `${tYear}-${tMonth}-${tDay}`;
  
  const refDateStr = startDate || tDateStr;

  let activeMonthlyTarget = 0;
  if (counsellorName) {
    activeMonthlyTarget = getCounsellorMonthlyTarget(settings, counsellorName, refDateStr);
  } else {
    let counsellorsList = settings.dropdowns?.counsellors || [];
    if (teamCounsellorNames) {
      counsellorsList = teamCounsellorNames;
    }
    
    const pStart = parseDate(startDate || tDateStr);
    const pEnd = parseDate(endDate || tDateStr);

    activeMonthlyTarget = counsellorsList.reduce((sum, name) => {
      const userObj = settings.users?.find(u => u.name && u.name.trim().toLowerCase() === name.trim().toLowerCase());
      
      if (userObj) {
        if (userObj.dateOfJoining && pEnd) {
          const doj = parseDate(userObj.dateOfJoining);
          if (doj && doj > pEnd) return sum; // Not joined yet
        }
        if (userObj.status === 'deactivated' && userObj.lastWorkingDate && pStart) {
          const lwd = parseDate(userObj.lastWorkingDate);
          if (lwd && lwd < pStart) return sum; // Already left
        }
      }

      const match = (settings.counsellorTargets || []).find(t => 
        t.counsellorName && 
        t.counsellorName.trim().toLowerCase() === name.trim().toLowerCase() &&
        refDateStr >= t.startDate &&
        refDateStr <= t.endDate
      );
      return sum + (match ? Number(match.targetAmount) : 0);
    }, 0);
  }

  // 1. Calculate Leaderboard using ALL admissions (Global)
  let leaderboardAdmissions = [...allAdmissions];
  if (startDate || endDate) {
    leaderboardAdmissions = leaderboardAdmissions.filter(item => {
      if (!item.dateOfAdmission) return false;
      const recordDate = parseDate(item.dateOfAdmission);
      if (!recordDate) return false;
      if (startDate) {
        const start = parseDate(startDate);
        if (start) {
          start.setHours(0, 0, 0, 0);
          if (recordDate < start) return false;
        }
      }
      if (endDate) {
        const end = parseDate(endDate);
        if (end) {
          end.setHours(23, 59, 59, 999);
          if (recordDate > end) return false;
        }
      }
      return true;
    });
  }

  const counsellorStats = {};
  
  if (settings.users && Array.isArray(settings.users)) {
    settings.users.forEach(u => {
      if (u.status !== 'deactivated' && (u.role === 'counsellor' || u.role === 'tl')) {
        const cleanName = (u.name || '').trim();
        if (cleanName) {
          const key = cleanName.toLowerCase();
          counsellorStats[key] = {
            name: cleanName,
            admissions: 0,
            registrations: 0,
            partPayments: 0,
            refunds: 0,
            revenue: 0
          };
        }
      }
    });
  }

  leaderboardAdmissions.forEach(item => {
    const rawName = item.counsellorName;
    if (!rawName || rawName === 'N/A' || rawName.trim() === '') return;
    
    const cleanName = rawName.trim();
    const key = cleanName.toLowerCase();
    
    // Check if this counsellor is deactivated in settings
    const userMatch = settings.users?.find(u => u.name && u.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (userMatch && userMatch.status === 'deactivated') {
      return; // Skip deactivated user
    }
    
    if (!counsellorStats[key]) {
      counsellorStats[key] = { name: cleanName, admissions: 0, registrations: 0, partPayments: 0, refunds: 0, revenue: 0 };
    }
    if (item.status === 'Admission Done') {
      counsellorStats[key].admissions += 1;
    }
    if (item.status === 'Registration') {
      counsellorStats[key].registrations += 1;
    }
    if (item.status === 'Part Payment') {
      counsellorStats[key].partPayments += 1;
    }
    if (item.status === 'Refund' || item.status === 'Refund ProcessStarted') {
      counsellorStats[key].refunds += 1;
    }
    counsellorStats[key].revenue += Number(item.amountPaid) || 0;
  });

  Object.keys(counsellorStats).forEach(key => {
    const cleanName = counsellorStats[key].name;
    const userMatch = settings.users?.find(u => u.name && u.name.trim().toLowerCase() === cleanName.toLowerCase());
    counsellorStats[key].achievements = userMatch?.achievements || {
      doubleStrike: 0,
      hattrickHero: 0,
      skyStorm: 0,
      skyTsunami: 0,
      consistencyChampion: 0,
      skyStriker: false,
      skyWarrior: false,
      skyCommander: false,
      skyRatna: false
    };
  });

  const leaderboard = Object.values(counsellorStats).sort((a, b) => b.revenue - a.revenue);

  // 2. Now filter remaining stats to TL team (or overall)
  let admissions = [...allAdmissions];
  if (teamCounsellorNames) {
    admissions = admissions.filter(item => 
      item.counsellorName && teamCounsellorNames.includes(item.counsellorName)
    );
  }

  // Apply date range filtering on the filtered team admissions list
  if (startDate || endDate) {
    admissions = admissions.filter(item => {
      if (!item.dateOfAdmission) return false;
      
      const recordDate = parseDate(item.dateOfAdmission);
      if (!recordDate) return false; // Exclude invalid dates when filter is active
      
      if (startDate) {
        const start = parseDate(startDate);
        if (start) {
          start.setHours(0, 0, 0, 0);
          if (recordDate < start) return false;
        }
      }
      if (endDate) {
        const end = parseDate(endDate);
        if (end) {
          end.setHours(23, 59, 59, 999);
          if (recordDate > end) return false;
        }
      }
      return true;
    });
  }

  // Now filter admissions for counsellor specific stats if query param is set
  let filteredAdmissions = admissions;
  if (counsellorName) {
    filteredAdmissions = admissions.filter(item => 
      item.counsellorName && item.counsellorName.trim().toLowerCase() === counsellorName.trim().toLowerCase()
    );
  }
  
  // Total stats (based on filteredAdmissions)
  const totalAdmissions = filteredAdmissions.filter(item => item.status === 'Admission Done').length;

  const registrationRecords = filteredAdmissions.filter(item => item.status === 'Registration');
  const totalRegistrations = registrationRecords.length;
  const totalRegistrationsAmount = registrationRecords.reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0);

  const partPaymentRecords = filteredAdmissions.filter(item => item.status === 'Part Payment');
  const totalPartPayments = partPaymentRecords.length;
  const totalPartPaymentsAmount = partPaymentRecords.reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0);

  const refundRecords = filteredAdmissions.filter(item => item.status === 'Refund' || item.status === 'Refund ProcessStarted');
  const totalRefunds = refundRecords.length;
  const totalRefundedAmount = refundRecords.reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0);

  const totalRevenue = filteredAdmissions
    .filter(item => item.status === 'Admission Done')
    .reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0);
  
  const dateObj = new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const todayYYYYMMDD = `${year}-${month}-${day}`;

  const todaysAdmissions = filteredAdmissions.filter(item => 
    item.dateOfAdmission === todayYYYYMMDD && 
    (item.status === 'Admission Done' || item.status === 'Registration' || item.status === 'Part Payment')
  ).length;
  const pendingFollowups = filteredAdmissions.filter(item => item.status === 'Pending' || item.status === 'Follow-up').length;

  // University-wise Stats (based on filteredAdmissions)
  const universityStats = {};
  filteredAdmissions.forEach(item => {
    const uni = item.universityName;
    if (!universityStats[uni]) {
      universityStats[uni] = { admissions: 0, registrations: 0 };
    }
    if (item.status === 'Admission Done') {
      universityStats[uni].admissions += 1;
    }
    if (item.status === 'Registration') {
      universityStats[uni].registrations += 1;
    }
  });

  // Course-wise Stats (based on filteredAdmissions)
  const courseStats = {};
  filteredAdmissions.forEach(item => {
    const course = item.course;
    if (!courseStats[course]) {
      courseStats[course] = { admissions: 0, registrations: 0 };
    }
    if (item.status === 'Admission Done') {
      courseStats[course].admissions += 1;
    }
    if (item.status === 'Registration') {
      courseStats[course].registrations += 1;
    }
  });

  // Revenue Trends (based on filteredAdmissions)
  const revenueTrends = {
    daily: {},
    monthly: {}
  };

  filteredAdmissions.forEach(item => {
    const parsed = parseDate(item.dateOfAdmission);
    if (!parsed) return;
    
    const pad = (num) => String(num).padStart(2, '0');
    const displayDate = `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthKey = `${months[parsed.getMonth()]} ${parsed.getFullYear()}`;

    const amount = Number(item.amountPaid) || 0;
    
    revenueTrends.daily[displayDate] = (revenueTrends.daily[displayDate] || 0) + amount;
    revenueTrends.monthly[monthKey] = (revenueTrends.monthly[monthKey] || 0) + amount;
  });

  let achievements = null;
  if (counsellorName) {
    const userMatch = settings.users?.find(u => u.name && u.name.trim().toLowerCase() === counsellorName.trim().toLowerCase());
    achievements = userMatch?.achievements || {
      doubleStrike: 0,
      hattrickHero: 0,
      skyStorm: 0,
      skyTsunami: 0,
      consistencyChampion: 0,
      skyStriker: false,
      skyWarrior: false,
      skyCommander: false,
      skyRatna: false
    };
  }

  res.json({
    summary: {
      totalAdmissions,
      totalRegistrations,
      totalRegistrationsAmount,
      totalPartPayments,
      totalPartPaymentsAmount,
      totalRefunds,
      totalRefundedAmount,
      totalRevenue,
      todaysAdmissions,
      pendingFollowups
    },
    universityStats: Object.entries(universityStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => a.admissions - b.admissions || a.name.localeCompare(b.name)),
    courseStats: Object.entries(courseStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => a.admissions - b.admissions || a.name.localeCompare(b.name)),
    counsellorStats: Object.values(counsellorStats),
    leaderboard,
    trends: {
      daily: Object.entries(revenueTrends.daily).map(([date, amount]) => ({ date, amount })).slice(-10), // Last 10 days
      monthly: Object.entries(revenueTrends.monthly).map(([month, amount]) => ({ month, amount }))
    },
    targetMetrics,
    incentiveConfig,
    activeMonthlyTarget,
    achievements
  });
});

// Incentive Requests APIs
app.get('/api/incentive-requests', async (req, res) => {
  try {
    const { counsellorName, username } = req.query;
    const requests = await readIncentiveRequests();
    
    // Filter logic
    if (counsellorName || username) {
      const filtered = requests.filter(r => {
        const nameMatch = counsellorName && r.counsellorName && r.counsellorName.trim().toLowerCase() === counsellorName.trim().toLowerCase();
        const userMatch = username && r.counsellorUsername && r.counsellorUsername.trim().toLowerCase() === username.trim().toLowerCase();
        return nameMatch || userMatch;
      });
      return res.json(filtered);
    }
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve incentive requests' });
  }
});

app.post('/api/incentive-requests', async (req, res) => {
  try {
    const { counsellorName, counsellorUsername, periodId, range, target, revenue, percentage, amount } = req.body;
    
    if (!counsellorName || !periodId || !range || target === undefined || revenue === undefined || amount === undefined) {
      return res.status(400).json({ error: 'Missing required request parameters' });
    }

    const requests = await readIncentiveRequests();

    // Check if there is an existing pending or approved request for this counselor, period, and range
    const duplicate = requests.find(r => 
      r.counsellorName.trim().toLowerCase() === counsellorName.trim().toLowerCase() &&
      r.periodId === periodId &&
      r.range === range &&
      (r.status === 'pending' || r.status === 'approved')
    );

    if (duplicate) {
      return res.status(400).json({ error: `An incentive request for ${periodId} (${range}) has already been submitted or approved.` });
    }

    // Check if there is an existing rejected request to reuse/re-submit
    const rejectedMatch = requests.find(r => 
      r.counsellorName.trim().toLowerCase() === counsellorName.trim().toLowerCase() &&
      r.periodId === periodId &&
      r.range === range &&
      r.status === 'rejected'
    );

    if (rejectedMatch) {
      rejectedMatch.status = 'pending';
      rejectedMatch.comment = '';
      rejectedMatch.target = Number(target);
      rejectedMatch.revenue = Number(revenue);
      rejectedMatch.percentage = Number(percentage);
      rejectedMatch.amount = Number(amount);
      rejectedMatch.requestedAt = new Date().toISOString();
      await writeIncentiveRequests(requests);
      return res.status(201).json({ success: true, request: rejectedMatch });
    }

    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      counsellorName,
      counsellorUsername,
      periodId,
      range,
      target: Number(target),
      revenue: Number(revenue),
      percentage: Number(percentage),
      amount: Number(amount),
      status: 'pending',
      comment: '',
      requestedAt: new Date().toISOString()
    };

    requests.push(newRequest);
    await writeIncentiveRequests(requests);

    res.status(201).json({ success: true, request: newRequest });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create incentive request' });
  }
});

app.post('/api/incentive-requests/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment, processedBy } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid or missing request status' });
    }

    const requests = await readIncentiveRequests();
    const index = requests.findIndex(r => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Incentive request not found' });
    }

    requests[index].status = status;
    requests[index].comment = comment || '';
    requests[index].processedAt = new Date().toISOString();
    requests[index].processedBy = processedBy || 'admin';

    await writeIncentiveRequests(requests);

    res.json({ success: true, request: requests[index] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process incentive request' });
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*splat', (req, res, next) => {
  // If it's an API route that didn't match, return 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  // Otherwise serve React index.html
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Automatically pull sync on startup to restore databases on ephemeral disks (like Render)
  if (process.env.NODE_ENV !== 'test') {
    pullSyncFromGoogleSheets()
      .then(result => {
        console.log(`[Startup Sync] Successful. Inserted: ${result.insertedCount}, Updated: ${result.updatedCount}, Deleted: ${result.deletedCount}`);
      })
      .catch(err => {
        console.warn(`[Startup Sync] Skipped/Failed on boot: ${err.message}`);
      });
  }
});
