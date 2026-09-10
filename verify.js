import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Base32 Decode for test validation
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

// Generate TOTP for test validation
function generateTOTP(secretBase32, timeOffsetSteps = 0) {
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
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Import the Express app (we'll adapt server.js slightly if needed, or we can just boot server.js as a subprocess, but launching it as a subprocess is extremely clean!)
import { spawn } from 'child_process';

async function runTests() {
  console.log('🚀 Starting Sky Education CRM Integration Tests...');
  
  // Backup databases to prevent test pollution
  const admissionsPath = path.join(__dirname, 'data', 'admissions.json');
  const approvalsPath = path.join(__dirname, 'data', 'approvals.json');
  const settingsPath = path.join(__dirname, 'data', 'settings.json');
  const incentiveRequestsPath = path.join(__dirname, 'data', 'incentive_requests.json');
  
  let admissionsBackup = null;
  let approvalsBackup = null;
  let settingsBackup = null;
  let incentiveRequestsBackup = null;
  
  try { admissionsBackup = await fs.readFile(admissionsPath, 'utf8'); } catch (e) {}
  try { approvalsBackup = await fs.readFile(approvalsPath, 'utf8'); } catch (e) {}
  try { settingsBackup = await fs.readFile(settingsPath, 'utf8'); } catch (e) {}
  try { incentiveRequestsBackup = await fs.readFile(incentiveRequestsPath, 'utf8'); } catch (e) {}
  
  // Initialize clean database states for testing
  try { await fs.writeFile(incentiveRequestsPath, '[]', 'utf8'); } catch (e) {}
  try { await fs.writeFile(approvalsPath, '[]', 'utf8'); } catch (e) {}

  // 1. Start Server Subprocess
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: TEST_PORT, NODE_ENV: 'test' },
    stdio: 'pipe'
  });

  // Wait for server to start
  await new Promise((resolve) => {
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on port')) {
        resolve();
      }
    });
  });
  console.log(`✅ Server booted successfully on port ${TEST_PORT}`);

  let failedTests = 0;
  const assert = (condition, message) => {
    if (condition) {
      console.log(`   ✅ PASS: ${message}`);
    } else {
      console.log(`   ❌ FAIL: ${message}`);
      failedTests++;
    }
  };

  try {
    // Test 1: User Login
    console.log('\n--- Testing Authentication ---');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Login returns 200 OK');
    assert(loginData.success === true, 'Admin login reports success: true');
    assert(loginData.user.role === 'admin', 'Login returned correct role "admin"');

    // Test 2: Invalid Login
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
    });
    assert(badLoginRes.status === 401, 'Bad credentials return 401 Unauthorized');

    // Test 3: Get Settings
    console.log('\n--- Testing System Settings ---');
    const settingsRes = await fetch(`${BASE_URL}/api/settings`);
    const settingsData = await settingsRes.json();
    assert(settingsRes.status === 200, 'Get settings returns 200 OK');
    assert(Array.isArray(settingsData.dropdowns.courses), 'Courses is returned as an array');
    assert(settingsData.users.length > 0, 'Users credentials list is returned');

    // Test 4: Create Admission
    console.log('\n--- Testing Admission Creation & Auto Tagging ---');
    const newAdmission = {
      session: 'July 2026',
      studentName: 'Test Student',
      mobileNumber: '9999999999',
      universityName: 'MUJ',
      course: 'MBA',
      feesType: 'One Time',
      paymentMode: 'UPI',
      amountPaid: 65000,
      dateOfAdmission: '2026-06-16',
      counsellorName: 'Anshika',
      leadSource: 'Website',
      remarks: 'Verification script entry',
      status: 'Admission Done'
    };

    const createRes = await fetch(`${BASE_URL}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAdmission)
    });
    const createData = await createRes.json();
    
    assert(createRes.status === 201, 'Create admission returns 201 Created');
    assert(createData.success === true, 'Response returns success: true');
    assert(createData.data.sNo > 0, 'Automatically assigned S.No is returned');
    assert(createData.data.tags.includes('High Value'), 'Auto-tagger successfully marked record as "High Value" (Fees >= 50k)');
    assert(createData.data.syncStatus.whatsapp === 'simulated', 'WhatsApp triggered in Simulation Mode correctly');

    // Test 4b: Cutoff Date Exclusion Verification (April 1st, 2026 cutoff)
    console.log('\n--- Testing Cutoff Date Target Exclusions ---');
    const oldAdmission = {
      session: 'January 2026',
      studentName: 'Old Cutoff Student',
      mobileNumber: '9999999990',
      universityName: 'MUJ',
      course: 'MBA',
      feesType: 'One Time',
      paymentMode: 'UPI',
      amountPaid: 100000,
      dateOfAdmission: '2026-03-15',
      counsellorName: 'Anshika',
      leadSource: 'Website',
      remarks: 'Pre cutoff verification entry',
      status: 'Admission Done'
    };
    const createOldRes = await fetch(`${BASE_URL}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(oldAdmission)
    });
    assert(createOldRes.status === 201, 'Create pre-cutoff admission returns 201 Created');

    // Test 5: Check Duplicate Number
    console.log('\n--- Testing Duplicate Mobile Check ---');
    const dupCheckRes = await fetch(`${BASE_URL}/api/admissions/check-duplicate?mobile=9999999999`);
    const dupCheckData = await dupCheckRes.json();
    assert(dupCheckRes.status === 200, 'Duplicate check returns 200 OK');
    assert(dupCheckData.isDuplicate === true, 'Duplicate check flags mobile "9999999999" as duplicate');
    assert(dupCheckData.studentName === 'Test Student', 'Duplicate check returns correct student name');

    // Test 6: Check Non-duplicate Number
    const nodupCheckRes = await fetch(`${BASE_URL}/api/admissions/check-duplicate?mobile=8888888888`);
    const nodupCheckData = await nodupCheckRes.json();
    // Test 6b: Bulk Upload Admissions
    console.log('\n--- Testing Bulk Admissions Import ---');
    const bulkPayload = [
      {
        session: 'July 2026',
        studentName: 'Bulk Student A',
        mobileNumber: '8888888881',
        universityName: 'SMU',
        course: 'MCA',
        feesType: 'Semester',
        paymentMode: 'Cash',
        amountPaid: 30000,
        dateOfAdmission: '2026-06-16',
        counsellorName: 'Deepa Gupta',
        leadSource: 'WhatsApp',
        remarks: 'Bulk import verification A',
        status: 'Admission Done'
      },
      {
        session: 'Batch 2026',
        studentName: 'Bulk Student B',
        mobileNumber: '8888888882',
        universityName: 'GLA',
        course: 'BBA',
        feesType: 'Part Payment',
        paymentMode: 'Credit Card',
        amountPaid: 15000,
        dateOfAdmission: '2026-06-16',
        counsellorName: 'Anshika',
        leadSource: 'Reference',
        remarks: 'Bulk import verification B',
        status: 'Admission Done'
      }
    ];

    const bulkRes = await fetch(`${BASE_URL}/api/admissions/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulkPayload)
    });
    const bulkData = await bulkRes.json();
    assert(bulkRes.status === 201, 'Bulk import returns 201 Created');
    assert(bulkData.success === true, 'Bulk import returns success: true');
    assert(bulkData.importedCount === 2, 'Bulk import correctly registered 2 records');

    // Test 7: Analytics Stats Computation
    console.log('\n--- Testing Analytics Stats ---');
    const statsRes = await fetch(`${BASE_URL}/api/stats?counsellorName=Anshika`);
    const statsData = await statsRes.json();
    
    assert(statsRes.status === 200, 'Stats endpoint returns 200 OK');
    assert(statsData.summary.totalRevenue >= 65000, 'Stats total revenue computation includes new student amount');
    assert(statsData.summary.totalAdmissions >= 1, 'Stats total admissions contains at least 1 record');
    assert(statsData.targetMetrics !== undefined && statsData.targetMetrics !== null, 'Stats returns targetMetrics for counsellor');
    assert(statsData.targetMetrics.monthlyRevenue >= 0, 'targetMetrics contains monthlyRevenue');
    const anshikaStat = statsData.counsellorStats.find(c => c.name === 'Anshika');
    assert(anshikaStat !== undefined, 'Anshika exists in counsellorStats');
    assert(statsData.targetMetrics.annualRevenue <= anshikaStat.revenue - 100000, 'targetMetrics.annualRevenue correctly excludes the 100,000 pre-cutoff admission (dated 2026-03-15)');
    assert(statsData.incentiveConfig !== undefined && statsData.incentiveConfig !== null, 'Stats returns incentiveConfig');
    assert(statsData.incentiveConfig.monthlyTarget === 250000, 'incentiveConfig has correct monthlyTarget default');
    
    // Validate achievements properties returned in stats API response
    assert(statsData.achievements !== undefined && statsData.achievements !== null, 'Stats returns achievements object for counselor');
    assert(typeof statsData.achievements.doubleStrike === 'number', 'achievements object contains doubleStrike count');
    assert(typeof statsData.achievements.skyStriker === 'boolean', 'achievements object contains skyStriker toggle status');
    assert(anshikaStat.achievements !== undefined, 'counsellorStats contains achievements for Anshika');
    assert(statsData.leaderboard.length > 0 && statsData.leaderboard[0].achievements !== undefined, 'leaderboard elements contain achievements object');

    // Test 7b: Stats Date Range Filtering
    console.log('\n--- Testing Stats Date Range Filtering ---');
    const filteredStatsRes = await fetch(`${BASE_URL}/api/stats?startDate=2026-06-15&endDate=2026-06-17`);
    const filteredStatsData = await filteredStatsRes.json();
    assert(filteredStatsRes.status === 200, 'Filtered stats endpoint returns 200 OK');
    assert(filteredStatsData.summary.totalRevenue >= 110000, 'Filtered stats includes revenue of entries inside range');

    const outOfRangeStatsRes = await fetch(`${BASE_URL}/api/stats?startDate=2026-06-25&endDate=2026-06-30`);
    const outOfRangeStatsData = await outOfRangeStatsRes.json();
    assert(outOfRangeStatsData.summary.totalRevenue === 0, 'OutOfRange stats correctly filters out entries (revenue is 0)');

    // Test 7c: Target Overrides & Dynamic Cutoff Date Verification
    console.log('\n--- Testing Target Overrides & Dynamic Cutoff ---');
    const settingsGetRes = await fetch(`${BASE_URL}/api/settings`);
    const settingsGetJson = await settingsGetRes.json();
    
    const originalStartDate = settingsGetJson.incentiveConfig.calculationStartDate;
    settingsGetJson.incentiveConfig.calculationStartDate = '2026-07-01';
    
    const todayStr = new Date().toISOString().split('T')[0];
    settingsGetJson.counsellorTargets = [
      {
        counsellorName: 'Anshika',
        startDate: todayStr,
        endDate: todayStr,
        targetAmount: 123456
      }
    ];
    
    const settingsPutRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsGetJson)
    });
    assert(settingsPutRes.status === 200, 'Settings override update returns 200 OK');
    
    const overrideStatsRes = await fetch(`${BASE_URL}/api/stats?counsellorName=Anshika`);
    const overrideStatsData = await overrideStatsRes.json();
    assert(overrideStatsData.activeMonthlyTarget === 123456, 'overrideStats returned counsellor-specific active monthly target override of 123456');
    assert(overrideStatsData.targetMetrics.annualRevenue === 0, 'annualRevenue falls to 0 because June admissions are now before the dynamic cutoff date (2026-07-01)');
    
    // Cleanup settings: restore original config
    settingsGetJson.incentiveConfig.calculationStartDate = originalStartDate;
    settingsGetJson.counsellorTargets = [];
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsGetJson)
    });

    // Test 7d: Overall Team Targets Verification
    console.log('\n--- Testing Overall Team Targets ---');
    
    // Add overrides to check team target sum
    const settingsForTeamRes = await fetch(`${BASE_URL}/api/settings`);
    const settingsForTeamJson = await settingsForTeamRes.json();
    
    const todayStrStr = new Date().toISOString().split('T')[0];
    settingsForTeamJson.counsellorTargets = [
      {
        counsellorName: 'Anshika',
        startDate: todayStrStr,
        endDate: todayStrStr,
        targetAmount: 300000
      },
      {
        counsellorName: 'Deepa Gupta',
        startDate: todayStrStr,
        endDate: todayStrStr,
        targetAmount: 200000
      }
    ];
    
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForTeamJson)
    });
    
    const overallStatsRes = await fetch(`${BASE_URL}/api/stats`);
    const overallStatsData = await overallStatsRes.json();
    console.log(`Debug info - activeMonthlyTarget: ${overallStatsData.activeMonthlyTarget}`);
    assert(overallStatsData.activeMonthlyTarget === 500000, `overallStats returned combined team monthly target of 500000 (sum of overrides)`);
    assert(overallStatsData.targetMetrics.annualRevenue >= 80000, 'overallStats targetMetrics sums up team-wide revenues');
    
    // Deactivate 'deepa01' (Deepa Gupta) to verify overall target drops
    const deactivatedDeepaUser = settingsForTeamJson.users.find(u => u.username === 'deepa01');
    if (deactivatedDeepaUser) {
      deactivatedDeepaUser.status = 'deactivated';
      await fetch(`${BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForTeamJson)
      });
      
      const statsAfterDeactRes = await fetch(`${BASE_URL}/api/stats`);
      const statsAfterDeactData = await statsAfterDeactRes.json();
      assert(statsAfterDeactData.activeMonthlyTarget === 300000, `activeMonthlyTarget correctly dropped to 300000 (excluding deactivated Deepa Gupta)`);
      
      // Reactivate Deepa
      deactivatedDeepaUser.status = 'active';
      await fetch(`${BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForTeamJson)
      });
    }

    // Restore empty targets
    settingsForTeamJson.counsellorTargets = [];
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForTeamJson)
    });

    // Test 8: TL Role Authentication
    console.log('\n--- Testing TL Role Authentication ---');
    const settingsForTlRes = await fetch(`${BASE_URL}/api/settings`);
    const settingsForTl = await settingsForTlRes.json();
    const originalUsers = [...settingsForTl.users];
    
    settingsForTl.users.push({
      username: 'test_tl',
      password: 'tlpassword123',
      role: 'tl',
      name: 'Test TL User'
    });
    
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForTl)
    });
    
    const tlLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_tl', password: 'tlpassword123', role: 'tl' })
    });
    const tlLoginData = await tlLoginRes.json();
    assert(tlLoginRes.status === 200, 'TL login returns 200 OK');
    assert(tlLoginData.success === true, 'TL login reports success: true');
    assert(tlLoginData.user.role === 'tl', 'TL login returned correct role "tl"');
    
    // Restore users
    settingsForTl.users = originalUsers;
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForTl)
    });

    // Test 9: Admin Password Change with Google Authenticator (2FA TOTP)
    console.log('\n--- Testing Admin Password Change (2FA TOTP Verification) ---');
    const settingsFor2faRes = await fetch(`${BASE_URL}/api/settings`);
    const settingsFor2fa = await settingsFor2faRes.json();
    const originalAdminPassword = settingsFor2fa.users.find(u => u.username === 'admin').password;
    const totpSecret = settingsFor2fa.adminTotpSecret;
    
    // Attempt 1: Try to change password without TOTP code (should fail)
    const settingsBadPayload = JSON.parse(JSON.stringify(settingsFor2fa));
    settingsBadPayload.users.find(u => u.username === 'admin').password = 'hackedpassword';
    
    const bad2faRes1 = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsBadPayload)
    });
    const bad2faData1 = await bad2faRes1.json();
    assert(bad2faRes1.status === 400, 'Bypassing TOTP fails with 400 Bad Request');
    assert(bad2faData1.success === false, 'Response success reports false');
    assert(bad2faData1.error.includes('Google Authenticator verification failed'), 'Error message prompts for code');

    // Attempt 2: Try to change password with invalid TOTP code (should fail)
    settingsBadPayload.adminTotpCode = '000000';
    const bad2faRes2 = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsBadPayload)
    });
    const bad2faData2 = await bad2faRes2.json();
    assert(bad2faRes2.status === 400, 'Invalid TOTP code fails with 400 Bad Request');

    // Attempt 3: Change password with correct TOTP code (should succeed)
    const correctCode = generateTOTP(totpSecret);
    const settingsGoodPayload = JSON.parse(JSON.stringify(settingsFor2fa));
    settingsGoodPayload.users.find(u => u.username === 'admin').password = 'newadminpassword123';
    settingsGoodPayload.adminTotpCode = correctCode;
    
    const good2faRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsGoodPayload)
    });
    const good2faData = await good2faRes.json();
    assert(good2faRes.status === 200, 'Valid TOTP code successfully updates password (returns 200 OK)');
    assert(good2faData.success === true, 'Response success reports true');

    // Restore original password with correct TOTP code
    const restoreCode = generateTOTP(totpSecret);
    const settingsRestorePayload = JSON.parse(JSON.stringify(settingsFor2fa));
    settingsRestorePayload.users.find(u => u.username === 'admin').password = originalAdminPassword;
    settingsRestorePayload.adminTotpCode = restoreCode;
    
    const restoreRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsRestorePayload)
    });
    assert(restoreRes.status === 200, 'Original password successfully restored with valid TOTP code');

    // Test 10: Pending Approvals Workflow
    console.log('\n--- Testing Pending Approvals Workflow ---');
    const pendingAdmission = {
      session: 'July 2026',
      studentName: 'Pending Student',
      mobileNumber: '7777777777',
      universityName: 'MUJ',
      course: 'MCA',
      feesType: 'One Time',
      paymentMode: 'UPI',
      amountPaid: 35000,
      dateOfAdmission: '2026-06-18',
      counsellorName: 'Anshika',
      leadSource: 'Reference',
      remarks: 'Pending test entry',
      status: 'Admission Done',
      submitterRole: 'counsellor',
      submitterUsername: 'anshika'
    };

    const createPendingRes = await fetch(`${BASE_URL}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingAdmission)
    });
    const createPendingData = await createPendingRes.json();
    assert(createPendingRes.status === 201, 'Counselor submission returns 201 Created');
    assert(createPendingData.success === true, 'Response returns success: true');
    assert(createPendingData.pendingApproval === true, 'Response contains pendingApproval: true');
    assert(createPendingData.data.id !== undefined, 'Assigned temporary approval ID is returned');
    const tempApprovalId = createPendingData.data.id;

    // Verify it is NOT in admissions ledger
    const getAdmissionsRes = await fetch(`${BASE_URL}/api/admissions`);
    const admissionsData = await getAdmissionsRes.json();
    const foundInLedger = admissionsData.some(item => item.mobileNumber === '7777777777');
    assert(foundInLedger === false, 'Pending student is NOT in the admissions database ledger');

    // Verify it IS in approvals queue
    const getApprovalsRes = await fetch(`${BASE_URL}/api/approvals`);
    const approvalsData = await getApprovalsRes.json();
    const foundInApprovals = approvalsData.some(item => item.id === tempApprovalId);
    assert(foundInApprovals === true, 'Pending student IS present in the approvals queue');

    // Approve the pending record
    const approveRes = await fetch(`${BASE_URL}/api/approvals/${tempApprovalId}/approve`, {
      method: 'POST'
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, 'Approve pending request returns 200 OK');
    assert(approveData.success === true, 'Approve response reports success: true');
    assert(approveData.data.sNo !== undefined, 'Approved admission has been assigned an sNo');

    // Verify it IS now in admissions ledger
    const getAdmissionsPostRes = await fetch(`${BASE_URL}/api/admissions`);
    const admissionsPostData = await getAdmissionsPostRes.json();
    const foundInLedgerPost = admissionsPostData.some(item => item.mobileNumber === '7777777777');
    assert(foundInLedgerPost === true, 'Approved student is now present in the admissions database ledger');

    // Verify it is NO longer in approvals queue
    const getApprovalsPostRes = await fetch(`${BASE_URL}/api/approvals`);
    const approvalsPostData = await getApprovalsPostRes.json();
    const foundInApprovalsPost = approvalsPostData.some(item => item.id === tempApprovalId);
    assert(foundInApprovalsPost === false, 'Approved student is no longer present in the approvals queue');

    // Test Rejection workflow
    const rejectAdmission = {
      session: 'July 2026',
      studentName: 'Reject Student',
      mobileNumber: '6666666666',
      universityName: 'MUJ',
      course: 'MCA',
      feesType: 'One Time',
      paymentMode: 'UPI',
      amountPaid: 20000,
      dateOfAdmission: '2026-06-18',
      counsellorName: 'Anshika',
      leadSource: 'Reference',
      remarks: 'Reject test entry',
      status: 'Admission Done',
      submitterRole: 'counsellor',
      submitterUsername: 'anshika'
    };
    
    const createRejectRes = await fetch(`${BASE_URL}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rejectAdmission)
    });
    const createRejectData = await createRejectRes.json();
    const rejectId = createRejectData.data.id;
    
    const rejectRes = await fetch(`${BASE_URL}/api/approvals/${rejectId}`, {
      method: 'DELETE'
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200, 'Reject pending request returns 200 OK');
    assert(rejectData.success === true, 'Reject response reports success: true');

    const getApprovalsAfterRejectRes = await fetch(`${BASE_URL}/api/approvals`);
    const approvalsAfterRejectData = await getApprovalsAfterRejectRes.json();
    const foundInApprovalsAfterReject = approvalsAfterRejectData.some(item => item.id === rejectId);
    assert(foundInApprovalsAfterReject === false, 'Rejected student is not present in the approvals queue');

    // Test 11: TL Mapping & Role Restrictions
    console.log('\n--- Testing TL Mapping & Role Restrictions ---');
    const getSettingsRes = await fetch(`${BASE_URL}/api/settings`);
    const settingsObj = await getSettingsRes.json();
    
    const deepaUser = settingsObj.users.find(u => u.username === 'deepa');
    assert(deepaUser !== undefined, 'Deepa exists in user list');
    deepaUser.counsellors = ['anshika05'];
    
    const updateSettingsRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsObj)
    });
    assert(updateSettingsRes.status === 200, 'TL mapping settings updated successfully');

    const tlAdmissionsRes = await fetch(`${BASE_URL}/api/admissions?tlUsername=deepa`);
    const tlAdmissions = await tlAdmissionsRes.json();
    const allRecordsInTeam = tlAdmissions.every(item => 
      item.counsellorName === 'Deepa Gupta' || item.counsellorName === 'Anshika'
    );
    assert(allRecordsInTeam === true, 'TL deepa only sees admissions from her team (herself + Anshika)');

    const tlStatsRes = await fetch(`${BASE_URL}/api/stats?tlUsername=deepa`);
    const tlStats = await tlStatsRes.json();
    
    const dateObj = new Date();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const expectedTarget = ['Deepa Gupta', 'Anshika'].reduce((sum, name) => {
      const match = (settingsObj.counsellorTargets || []).find(t => 
        t.counsellorName && 
        t.counsellorName.trim().toLowerCase() === name.trim().toLowerCase() &&
        dateStr >= t.startDate &&
        dateStr <= t.endDate
      );
      return sum + (match ? Number(match.targetAmount) : 0);
    }, 0);
    
    assert(tlStats.activeMonthlyTarget === expectedTarget, `TL stats return combined team monthly target of ${expectedTarget}`);
    assert(tlStats.leaderboard.length > 0, 'Leaderboard is present in TL stats');

    // Test 12: Per-user Google 2FA (Authenticator)
    console.log('\n--- Testing Per-user Google 2FA (Authenticator) ---');
    // Enable 2FA for anshika05
    const settingsGetRes2 = await fetch(`${BASE_URL}/api/settings`);
    const settingsObj2 = await settingsGetRes2.json();
    const anshikaUserObj = settingsObj2.users.find(u => u.username === 'anshika05');
    assert(anshikaUserObj !== undefined, 'User anshika05 found in settings');
    anshikaUserObj.twoFactorEnabled = true;

    const updateSettingsRes2 = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsObj2)
    });
    assert(updateSettingsRes2.status === 200, 'Settings updated successfully to enable 2FA for anshika05');

    // Retrieve secret from updated settings
    const settingsGetRes3 = await fetch(`${BASE_URL}/api/settings`);
    const settingsObj3 = await settingsGetRes3.json();
    const anshikaUserUpdated = settingsObj3.users.find(u => u.username === 'anshika05');
    assert(anshikaUserUpdated.twoFactorEnabled === true, 'twoFactorEnabled is true for anshika05');
    assert(!!anshikaUserUpdated.twoFactorSecret, 'twoFactorSecret has been auto-generated for anshika05');

    // Attempt login without otpCode
    const loginAttempt1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'anshika05', password: 'SEGanshika@2377', role: 'counsellor' })
    });
    const loginAttempt1Data = await loginAttempt1.json();
    assert(loginAttempt1.status === 200, 'First phase login returns 200 OK');
    assert(loginAttempt1Data.requires2FA === true, 'First phase login correctly requires 2FA');

    // Attempt login with invalid otpCode
    const loginAttempt2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'anshika05', password: 'SEGanshika@2377', role: 'counsellor', otpCode: '123456' })
    });
    assert(loginAttempt2.status === 401, 'Login with invalid OTP returns 401 Unauthorized');

    // Attempt login with valid otpCode
    const validOtp = generateTOTP(anshikaUserUpdated.twoFactorSecret);
    const loginAttempt3 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'anshika05', password: 'SEGanshika@2377', role: 'counsellor', otpCode: validOtp })
    });
    const loginAttempt3Data = await loginAttempt3.json();
    assert(loginAttempt3.status === 200, 'Second phase login with valid OTP returns 200 OK');
    assert(loginAttempt3Data.success === true, 'Successful 2FA login response reports success: true');
    assert(loginAttempt3Data.user.username === 'anshika05', 'Successful 2FA login returns user object');

    // Turn 2FA off again
    anshikaUserUpdated.twoFactorEnabled = false;
    const updateSettingsRes3 = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsObj3)
    });
    assert(updateSettingsRes3.status === 200, 'Settings updated successfully to disable 2FA for anshika05');

    // Verify user can now log in without otpCode
    const loginAttempt4 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'anshika05', password: 'SEGanshika@2377', role: 'counsellor' })
    });
    const loginAttempt4Data = await loginAttempt4.json();
    assert(loginAttempt4.status === 200 && loginAttempt4Data.requires2FA !== true, 'Login succeeds without requiring 2FA after disabling it');

    // --- Testing Incentive Requests Workflow ---
    console.log('\n--- Testing Incentive Requests Workflow ---');
    
    // 1. Fetch incentive requests (should be empty initially)
    const incListRes1 = await fetch(`${BASE_URL}/api/incentive-requests`);
    assert(incListRes1.status === 200, 'GET incentive requests returns 200 OK');
    const incListData1 = await incListRes1.json();
    assert(Array.isArray(incListData1) && incListData1.length === 0, 'Incentive requests list is initially empty');

    // 2. Submit a new incentive request as a counselor
    const incPayload = {
      counsellorName: 'Anshika',
      counsellorUsername: 'anshika05',
      periodId: 'monthly',
      range: '01/06/2026 - 30/06/2026',
      target: 500000,
      revenue: 560000,
      percentage: 112.0,
      amount: 10000
    };
    
    const incCreateRes = await fetch(`${BASE_URL}/api/incentive-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incPayload)
    });
    assert(incCreateRes.status === 201, 'Create incentive request returns 201 Created');
    const incCreateData = await incCreateRes.json();
    assert(incCreateData.success === true && incCreateData.request.status === 'pending', 'Request successfully created with pending status');
    const incRequestId = incCreateData.request.id;

    // 3. Try to submit duplicate request (should fail)
    const incDuplicateRes = await fetch(`${BASE_URL}/api/incentive-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incPayload)
    });
    assert(incDuplicateRes.status === 400, 'Submitting duplicate request fails with 400 Bad Request');

    // 4. Reject the request with a comment
    const incRejectRes = await fetch(`${BASE_URL}/api/incentive-requests/${incRequestId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', comment: 'Duplicate claim detected', processedBy: 'admin' })
    });
    assert(incRejectRes.status === 200, 'Process request to reject returns 200 OK');
    const incRejectData = await incRejectRes.json();
    assert(incRejectData.request.status === 'rejected' && incRejectData.request.comment === 'Duplicate claim detected', 'Request status updated to rejected with correct comment');

    // 5. Submit again (since the previous was rejected, duplicate check should allow re-submitting)
    const incReSubmitRes = await fetch(`${BASE_URL}/api/incentive-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incPayload)
    });
    assert(incReSubmitRes.status === 201, 'Re-submitting previously rejected request returns 201 Created');
    const incReSubmitData = await incReSubmitRes.json();
    const incNewRequestId = incReSubmitData.request.id;

    // 6. Approve the request with a comment
    const incApproveRes = await fetch(`${BASE_URL}/api/incentive-requests/${incNewRequestId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', comment: 'Looks good. Verified.', processedBy: 'admin' })
    });
    assert(incApproveRes.status === 200, 'Process request to approve returns 200 OK');
    const incApproveData = await incApproveRes.json();
    assert(incApproveData.request.status === 'approved' && incApproveData.request.comment === 'Looks good. Verified.', 'Request status updated to approved with correct comment');

    // 7. Verify listing with filter by counselor username
    const incListRes2 = await fetch(`${BASE_URL}/api/incentive-requests?username=anshika05`);
    const incListData2 = await incListRes2.json();
    assert(incListData2.length === 1, 'Filtered request list matches the counsellor entries count (1 reused request, now approved)');
    assert(incListData2.find(r => r.id === incNewRequestId).status === 'approved', 'Finds approved request in filtered list');

    // 8. Submit a new incentive request for a badge claim
    const badgePayload = {
      counsellorName: 'Anshika',
      counsellorUsername: 'anshika05',
      periodId: 'doubleStrike',
      range: 'Occurrence 1',
      target: 0,
      revenue: 0,
      percentage: 100,
      amount: 500
    };

    const badgeCreateRes = await fetch(`${BASE_URL}/api/incentive-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badgePayload)
    });
    assert(badgeCreateRes.status === 201, 'Create badge claim request returns 201 Created');
    const badgeCreateData = await badgeCreateRes.json();
    assert(badgeCreateData.success === true && badgeCreateData.request.status === 'pending', 'Badge claim request successfully created with pending status');
    const badgeRequestId = badgeCreateData.request.id;

    // 9. Try to submit duplicate badge request for same occurrence (should fail)
    const badgeDuplicateRes = await fetch(`${BASE_URL}/api/incentive-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badgePayload)
    });
    assert(badgeDuplicateRes.status === 400, 'Submitting duplicate badge request fails with 400 Bad Request');

    // 10. Approve the badge request
    const badgeApproveRes = await fetch(`${BASE_URL}/api/incentive-requests/${badgeRequestId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved', comment: 'Approved badge', processedBy: 'admin' })
    });
    assert(badgeApproveRes.status === 200, 'Process badge request to approve returns 200 OK');
    const badgeApproveData = await badgeApproveRes.json();
    assert(badgeApproveData.request.status === 'approved', 'Badge request status updated to approved');

    // 11. Verify badge claim listing and that approved badge claims calculation matches
    const incListRes3 = await fetch(`${BASE_URL}/api/incentive-requests?username=anshika05`);
    const incListData3 = await incListRes3.json();
    assert(incListData3.length === 2, 'Filtered request list matches the counsellor entries count (1 approved period + 1 approved badge)');
    
    // Recalculate profile total badge cash (like in App.jsx)
    const badgeKeys = ['doubleStrike', 'hattrickHero', 'skyStorm', 'skyTsunami', 'consistencyChampion'];
    const totalBonusCash = incListData3
      .filter(r => r.status === 'approved' && badgeKeys.includes(r.periodId))
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    assert(totalBonusCash === 500, `Profile 'Incentive Bonus Earned' recalculation is correct (expected 500, got ${totalBonusCash})`);

    // Recalculate period target tracker cash (like in AdminDashboard.jsx)
    const periodKeys = ['monthly', 'quarterly', 'halfYearly', 'annual'];
    const totalPeriodCash = incListData3
      .filter(r => r.status === 'approved' && periodKeys.includes(r.periodId))
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    assert(totalPeriodCash === 10000, `Target tracker 'Total Earned' recalculation is correct (expected 10000, got ${totalPeriodCash})`);

    // --- Testing Lead Auto-Upgrades and Edit Permissions ---
    console.log('\n--- Testing Lead Auto-Upgrades and Edit Permissions ---');

    // 1. Setup a test registration entry for counselor Anshika
    const regPayload = {
      session: 'Batch 2026',
      studentName: 'Duplicate Test Student',
      mobileNumber: '9888877777',
      universityName: 'GLA',
      course: 'MBA',
      feesType: 'Registration',
      paymentMode: 'UPI',
      amountPaid: 1000,
      dateOfAdmission: '2026-06-25',
      counsellorName: 'Anshika',
      leadSource: 'Reference',
      remarks: 'Registration only',
      status: 'Registration',
      submitterRole: 'counsellor',
      submitterUsername: 'anshika05'
    };

    const regRes = await fetch(`${BASE_URL}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regPayload)
    });
    assert(regRes.status === 201, 'Create initial registration returns 201');
    const regData = await regRes.json();
    const isPending = regData.pendingApproval;
    
    // Approve the registration first to place it in the ledger
    if (isPending) {
      const appRes = await fetch(`${BASE_URL}/api/approvals/${regData.data.id}/approve`, { method: 'POST' });
      assert(appRes.status === 200, 'Approve registration returns 200 OK');
    }

    // Fetch the approved entry in ledger to get its S.No
    const ledgerRes1 = await fetch(`${BASE_URL}/api/admissions`);
    const ledger1 = await ledgerRes1.json();
    const regLedgerRecord = ledger1.find(item => item.mobileNumber === '9888877777');
    assert(regLedgerRecord !== undefined, 'Registration record exists in ledger');
    const originalSNo = regLedgerRecord.sNo;

    // 2. Test Edit Permission Check (Counsellor Deepa should not be able to edit Anshika's record)
    const unauthorizedEditRes = await fetch(`${BASE_URL}/api/admissions/${originalSNo}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'counsellor',
        'x-user-username': 'deepa01' // Deepa Gupta
      },
      body: JSON.stringify({ ...regLedgerRecord, studentName: 'Hacked Name' })
    });
    assert(unauthorizedEditRes.status === 403, 'Unauthorized edit returns 403 Forbidden');

    // 3. Test Auto-upgrade of duplicate registration case to admission
    const upgradePayload = {
      ...regPayload,
      status: 'Admission Done',
      amountPaid: 27550,
      remarks: 'Upgraded to Admission Done'
    };

    const upgradeRes = await fetch(`${BASE_URL}/api/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(upgradePayload)
    });
    assert(upgradeRes.status === 201, 'Re-submitting duplicate mobile number returns 201 Created');
    const upgradeData = await upgradeRes.json();
    assert(upgradeData.pendingApproval === true, 'Duplicate submission goes to approvals queue');
    assert(upgradeData.data.isUpdateOfSNo === originalSNo, 'Duplicate submission has correct isUpdateOfSNo reference');

    // Approve the upgrade request
    const approveUpgradeRes = await fetch(`${BASE_URL}/api/approvals/${upgradeData.data.id}/approve`, { method: 'POST' });
    assert(approveUpgradeRes.status === 200, 'Approve upgrade request returns 200 OK');
    const approveUpgradeData = await approveUpgradeRes.json();

    // Verify it updated the existing record in-place instead of creating a new row
    const ledgerRes2 = await fetch(`${BASE_URL}/api/admissions`);
    const ledger2 = await ledgerRes2.json();
    const updatedLedgerRecords = ledger2.filter(item => item.mobileNumber === '9888877777');
    assert(updatedLedgerRecords.length === 1, 'Only one record with the duplicate mobile number exists in the ledger (no duplicate row created)');
    assert(updatedLedgerRecords[0].sNo === originalSNo, 'The record retained its original serial number (#sNo)');
    assert(updatedLedgerRecords[0].status === 'Admission Done', 'The record status was successfully updated to Admission Done');
    assert(updatedLedgerRecords[0].amountPaid === 27550, 'The record amountPaid was successfully updated to 27550');

    // 4. Test Edit Date of Admission
    const editDateRes = await fetch(`${BASE_URL}/api/admissions/${originalSNo}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'counsellor',
        'x-user-username': 'anshika05' // Authorized counsellor
      },
      body: JSON.stringify({ ...updatedLedgerRecords[0], dateOfAdmission: '2026-06-28' })
    });
    assert(editDateRes.status === 200, 'Authorized edit returns 200 OK');
    const editDateData = await editDateRes.json();
    assert(editDateData.data.dateOfAdmission === '2026-06-28', 'Date of admission successfully updated to 2026-06-28');
    assert(editDateData.data.date === '28/06/2026', 'Primary date successfully updated to match dateOfAdmission (28/06/2026)');

    // 5. Test Deactivation / Last Date of Working workflow
    console.log('\n--- Testing Account Deactivation & LWD ---');
    const deactSettingsGetRes = await fetch(`${BASE_URL}/api/settings`);
    const deactSettingsGetJson = await deactSettingsGetRes.json();
    const testCounsellor = deactSettingsGetJson.users.find(u => u.username === 'anshika05');
    assert(testCounsellor !== undefined, 'Counsellor anshika05 exists');
    
    // Deactivate counsellor anshika05
    testCounsellor.status = 'deactivated';
    testCounsellor.lastWorkingDate = '2026-07-29';
    
    const deactSettingsPutRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deactSettingsGetJson)
    });
    assert(deactSettingsPutRes.status === 200, 'Deactivating user in settings returns 200 OK');
    
    // Try to login as deactivated user (should fail with 403)
    const deactLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'anshika05', password: 'SEGanshika@2377', role: 'counsellor' })
    });
    assert(deactLoginRes.status === 403, 'Login as deactivated user returns 403 Forbidden');
    const deactLoginData = await deactLoginRes.json();
    assert(deactLoginData.message.includes('deactivated'), 'Deactivated error message returned');
    
    // Reactivate counsellor anshika05
    const reactSettingsGetRes = await fetch(`${BASE_URL}/api/settings`);
    const reactSettingsGetJson = await reactSettingsGetRes.json();
    const testCounsellor2 = reactSettingsGetJson.users.find(u => u.username === 'anshika05');
    testCounsellor2.status = 'active';
    testCounsellor2.lastWorkingDate = '';
    
    const reactSettingsPutRes = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reactSettingsGetJson)
    });
    assert(reactSettingsPutRes.status === 200, 'Reactivating user in settings returns 200 OK');
    
    // Login should work again
    const reactLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'anshika05', password: 'SEGanshika@2377', role: 'counsellor' })
    });
    assert(reactLoginRes.status === 200, 'Login as reactivated user returns 200 OK');

    // 6. Test Excluding deactivated user from ranking board
    console.log('\n--- Testing Leaderboard Exclusions for Deactivated Users ---');
    // Fetch stats while active
    const statsActiveRes = await fetch(`${BASE_URL}/api/stats`);
    const statsActiveJson = await statsActiveRes.json();
    const activeLeaderboardNames = statsActiveJson.leaderboard.map(c => c.name.toLowerCase());
    
    // Deactivate counsellor anshika05 again
    const deactSettingsGetRes2 = await fetch(`${BASE_URL}/api/settings`);
    const deactSettingsGetJson2 = await deactSettingsGetRes2.json();
    const testCounsellor3 = deactSettingsGetJson2.users.find(u => u.username === 'anshika05');
    testCounsellor3.status = 'deactivated';
    
    const deactSettingsPutRes2 = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deactSettingsGetJson2)
    });
    assert(deactSettingsPutRes2.status === 200, 'Deactivated user in settings successfully');
    
    // Fetch stats while deactivated
    const statsDeactRes = await fetch(`${BASE_URL}/api/stats`);
    const statsDeactJson = await statsDeactRes.json();
    const deactLeaderboardNames = statsDeactJson.leaderboard.map(c => c.name.toLowerCase());
    
    // Asserts
    assert(activeLeaderboardNames.includes('anshika'), 'Active counsellor was in the leaderboard');
    assert(!deactLeaderboardNames.includes('anshika'), 'Deactivated counsellor was successfully excluded from the leaderboard');

    // 7. Test failed login limits (3 wrong attempts -> deactivation)
    console.log('\n--- Testing 3 Failed Login Attempts Lockout ---');
    
    // Reactivate anshika05 for failure tests
    const reactSettingsGetRes3 = await fetch(`${BASE_URL}/api/settings`);
    const reactSettingsGetJson3 = await reactSettingsGetRes3.json();
    const testCounsellor4 = reactSettingsGetJson3.users.find(u => u.username === 'anshika05');
    testCounsellor4.status = 'active';
    testCounsellor4.failedAttempts = 0;
    
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reactSettingsGetJson3)
    });
    
    // Attempt 1: wrong password
    const failRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'anshika05', password: 'wrongpassword', role: 'counsellor' })
    });
    assert(failRes1.status === 401, 'First failed login returns 401');
    const failData1 = await failRes1.json();
    assert(failData1.message.includes('Attempts remaining: 2'), 'Correct remaining attempts message for attempt 1');
    
    // Attempt 2: wrong password
    const failRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'anshika05', password: 'wrongpassword', role: 'counsellor' })
    });
    assert(failRes2.status === 401, 'Second failed login returns 401');
    const failData2 = await failRes2.json();
    assert(failData2.message.includes('Attempts remaining: 1'), 'Correct remaining attempts message for attempt 2');
    
    // Attempt 3: wrong password
    const failRes3 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'anshika05', password: 'wrongpassword', role: 'counsellor' })
    });
    assert(failRes3.status === 403, 'Third consecutive failed login returns 403 Forbidden due to lockout');
    const failData3 = await failRes3.json();
    assert(failData3.message.includes('deactivated due to 3 consecutive failed login attempts'), 'Lockout error message returned');
    
    // 8. Verify login history logs
    console.log('\n--- Testing Login History Audit Logs ---');
    const historyRes = await fetch(`${BASE_URL}/api/login-history`, {
      headers: { 'x-user-role': 'admin' }
    });
    assert(historyRes.status === 200, 'Fetching login history returns 200 OK');
    const historyData = await historyRes.json();
    assert(historyData.length > 0, 'Login history has log entries');
    const deactEvent = historyData.find(h => h.username === 'anshika05' && h.action === 'deactivated_by_system');
    assert(deactEvent !== undefined, 'Found system deactivation event in logs');

  } catch (err) {
    console.error('❌ Integration test crashed with error:', err);
    failedTests++;
  } finally {
    // Tear down server
    console.log('\nCleaning up and closing server...');
    serverProcess.kill();
    
    // Restore backups
    try {
      if (admissionsBackup !== null) await fs.writeFile(admissionsPath, admissionsBackup, 'utf8');
      if (approvalsBackup !== null) await fs.writeFile(approvalsPath, approvalsBackup, 'utf8');
      if (settingsBackup !== null) await fs.writeFile(settingsPath, settingsBackup, 'utf8');
      if (incentiveRequestsBackup !== null) {
        await fs.writeFile(incentiveRequestsPath, incentiveRequestsBackup, 'utf8');
      } else {
        try { await fs.unlink(incentiveRequestsPath); } catch (e) {}
      }
      console.log('✅ Databases restored to original state');
    } catch (e) {
      console.error('Error restoring backups:', e);
    }
  }

  console.log('\n--- Test Summary ---');
  if (failedTests === 0) {
    console.log('✅ ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.log(`❌ ${failedTests} TESTS FAILED. Please review test failures.`);
    process.exit(1);
  }
}

runTests();
