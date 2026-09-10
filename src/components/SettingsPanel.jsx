import React, { useState, useEffect } from 'react';
import { ToggleLeft, Database, Phone, UserPlus, RefreshCw, Plus, X, Copy, Check, Save, Calendar, Edit2, ShieldCheck, Award, MessageSquare } from 'lucide-react';

export default function SettingsPanel({ currentUser, initialActiveTab }) {
  const [activeTab, setActiveTab] = useState(initialActiveTab || 'dropdowns');

  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disclaimerText, setDisclaimerText] = useState('');
  const [loginHistory, setLoginHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states for adding items
  const [newSession, setNewSession] = useState('');
  const [newUniversity, setNewUniversity] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('');
  const [newCounsellor, setNewCounsellor] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [newCustomPeriodName, setNewCustomPeriodName] = useState('');
  const [newCustomPeriodStartDate, setNewCustomPeriodStartDate] = useState('');
  const [newCustomPeriodEndDate, setNewCustomPeriodEndDate] = useState('');

  // User account form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState('counsellor');
  const [newDateOfJoining, setNewDateOfJoining] = useState('');
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [newEmployeeNumber, setNewEmployeeNumber] = useState('');
  const [newTwoFactorEnabled, setNewTwoFactorEnabled] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newTlCounsellors, setNewTlCounsellors] = useState([]);

  // Target Override form states
  const [overrideCounsellor, setOverrideCounsellor] = useState('');
  const [overrideStartDate, setOverrideStartDate] = useState('');
  const [overrideEndDate, setOverrideEndDate] = useState('');
  const [overrideAmount, setOverrideAmount] = useState('');

  // Daily Thought Bulletin states
  const [thoughtMode, setThoughtMode] = useState('same');
  const [thoughtTitleSame, setThoughtTitleSame] = useState('');
  const [thoughtTextSame, setThoughtTextSame] = useState('');
  const [thoughtTitleCounsellor, setThoughtTitleCounsellor] = useState('');
  const [thoughtTextCounsellor, setThoughtTextCounsellor] = useState('');
  const [thoughtTitleTl, setThoughtTitleTl] = useState('');
  const [thoughtTextTl, setThoughtTextTl] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        // Fallback for counsellors in dropdowns if not present
        if (!data.dropdowns.counsellors) {
          data.dropdowns.counsellors = data.users
            .filter(u => u.role === 'counsellor' || u.role === 'tl')
            .map(u => u.name);
        }
        // Fallback for statuses if not present
        if (!data.dropdowns.statuses) {
          data.dropdowns.statuses = [
            "Admission Done",
            "Registration",
            "Pending",
            "Follow-up",
            "Refund",
            "Refund ProcessStarted"
          ];
        }
        if (!data.dropdowns.months) {
          data.dropdowns.months = [
            "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
            "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"
          ];
        }
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveThought = () => {
    const updated = {
      ...settings,
      dailyThought: {
        mode: thoughtMode,
        same: {
          title: thoughtTitleSame,
          text: thoughtTextSame
        },
        counsellor: {
          title: thoughtTitleCounsellor,
          text: thoughtTextCounsellor
        },
        tl: {
          title: thoughtTitleTl,
          text: thoughtTextTl
        }
      }
    };
    handleSaveSettings(updated);
  };

  const handleSaveDisclaimer = () => {
    const updated = {
      ...settings,
      policyDisclaimer: {
        text: disclaimerText
      }
    };
    handleSaveSettings(updated);
  };

  const fetchLoginHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/login-history', {
        headers: {
          'x-user-role': currentUser?.role || ''
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch login history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'loginHistory') {
      fetchLoginHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      const dt = settings.dailyThought || {};
      setThoughtMode(dt.mode || 'same');
      
      // Fallbacks for older data structures
      setThoughtTitleSame(dt.same?.title || dt.title || '');
      setThoughtTextSame(dt.same?.text || dt.text || '');
      
      setThoughtTitleCounsellor(dt.counsellor?.title || '');
      setThoughtTextCounsellor(dt.counsellor?.text || '');
      
      setThoughtTitleTl(dt.tl?.title || '');
      setThoughtTextTl(dt.tl?.text || '');
      setDisclaimerText(settings.policyDisclaimer?.text || '');
    }
  }, [settings]);

  const handleSaveSettings = async (updated, customTotpCode = null) => {
    setIsSaving(true);
    
    // Check if admin credentials are changing
    const currentAdmin = settings?.users?.find(u => u.isPrimaryAdmin || u.username === 'admin');
    const updatedAdmin = updated?.users?.find(u => u.isPrimaryAdmin || (currentAdmin && u.username === currentAdmin.username));
    let totpCode = customTotpCode;
    
    // Ensure the updated admin retains the isPrimaryAdmin flag
    if (updatedAdmin) {
      updatedAdmin.isPrimaryAdmin = true;
    }

    const passwordChanged = currentAdmin && updatedAdmin && currentAdmin.password !== updatedAdmin.password;
    const usernameChanged = currentAdmin && updatedAdmin && currentAdmin.username !== updatedAdmin.username;
    
    if (currentAdmin && updatedAdmin && (passwordChanged || usernameChanged) && !totpCode) {
      const code = window.prompt("Enter 6-digit Google Authenticator code to authorize Admin credentials change:");
      if (code === null) {
        setIsSaving(false);
        fetchSettings(); // Revert UI
        return;
      }
      totpCode = code;
    }

    try {
      const bodyPayload = { ...updated };
      if (totpCode) {
        bodyPayload.adminTotpCode = totpCode;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyPayload)
      });
      
      const result = await response.json();
      if (response.ok && result.success) {
        setSettings(updated);
      } else {
        alert(result.error || 'Failed to save settings');
        fetchSettings(); // Revert UI
      }
    } catch (err) {
      alert('Error saving settings');
      fetchSettings(); // Revert UI
    } finally {
      setIsSaving(false);
    }
  };

  // Tag manager add/remove functions
  const handleAddItem = (category, value, setter) => {
    if (!value.trim()) return;
    
    const updated = { ...settings };
    const cleanVal = value.trim();
    if (updated.dropdowns[category].map(x => x.toLowerCase()).includes(cleanVal.toLowerCase())) {
      alert('This item already exists in the list');
      return;
    }
    updated.dropdowns[category].push(cleanVal);
    // If we are adding a counsellor name, also keep the list synced
    if (category === 'counsellors') {
      // Just syncs dropdown display, doesn't create user credentials
    }
    handleSaveSettings(updated);
    setter('');
  };

  const handleRemoveItem = (category, item) => {
    const updated = { ...settings };
    updated.dropdowns[category] = updated.dropdowns[category].filter(i => i !== item);
    handleSaveSettings(updated);
  };

  const handleAddCustomPeriod = () => {
    if (!newCustomPeriodName.trim() || !newCustomPeriodStartDate || !newCustomPeriodEndDate) {
      alert('Please fill out all custom period fields (Name, Start Date, End Date)');
      return;
    }

    const updated = { ...settings };
    if (!updated.customDateFilters) {
      updated.customDateFilters = [];
    }

    const newPeriod = {
      id: `period_${Date.now()}`,
      name: newCustomPeriodName.trim(),
      startDate: newCustomPeriodStartDate,
      endDate: newCustomPeriodEndDate
    };

    updated.customDateFilters.push(newPeriod);
    handleSaveSettings(updated);

    // Reset inputs
    setNewCustomPeriodName('');
    setNewCustomPeriodStartDate('');
    setNewCustomPeriodEndDate('');
  };

  const handleRemoveCustomPeriod = (id) => {
    const updated = { ...settings };
    if (updated.customDateFilters) {
      updated.customDateFilters = updated.customDateFilters.filter(p => p.id !== id);
    }
    handleSaveSettings(updated);
  };

  // Integration changes
  const handleToggleSync = (category) => {
    const updated = { ...settings };
    updated[category].enabled = !updated[category].enabled;
    handleSaveSettings(updated);
  };

  const handleIntegrationInputChange = (category, field, value) => {
    const updated = { ...settings };
    updated[category][field] = value;
    setSettings(updated); // Local update, will save on blur or manual click
  };

  // Add User Account
  const handleAddUser = (e) => {
    e.preventDefault();
    const cleanUsername = newUsername.trim().toLowerCase();
    const cleanFullName = newFullName.trim();
    
    if (!cleanUsername || !newPassword || !cleanFullName) return;

    const updated = { ...settings };
    if (updated.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      alert('Username already exists');
      return;
    }

    const newUser = {
      username: cleanUsername,
      password: newPassword,
      role: newUserRole,
      name: cleanFullName,
      dateOfJoining: newDateOfJoining || '',
      mobileNumber: newMobileNumber || '',
      employeeNumber: newEmployeeNumber || '',
      twoFactorEnabled: newTwoFactorEnabled,
      twoFactorSecret: '',
      status: 'active',
      lastWorkingDate: '',
      achievements: {
        doubleStrike: 0,
        hattrickHero: 0,
        skyStorm: 0,
        skyTsunami: 0,
        consistencyChampion: 0,
        skyStriker: false,
        skyWarrior: false,
        skyCommander: false,
        skyRatna: false
      },
      counsellors: newUserRole === 'tl' ? newTlCounsellors : []
    };

    updated.users.push(newUser);
    
    // If counsellor or tl, also auto-add to dropdown
    if (newUserRole === 'counsellor' || newUserRole === 'tl') {
      if (!updated.dropdowns.counsellors.includes(newUser.name)) {
        updated.dropdowns.counsellors.push(newUser.name);
      }
    }

    handleSaveSettings(updated);

    // Reset fields
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewUserRole('counsellor');
    setNewDateOfJoining('');
    setNewMobileNumber('');
    setNewEmployeeNumber('');
    setNewTwoFactorEnabled(false);
    setNewTlCounsellors([]);
  };

  // Update User Account Details
  const handleUpdateUser = (e) => {
    e.preventDefault();
    const cleanUsername = editingUser.username.trim().toLowerCase();
    const cleanFullName = editingUser.name.trim();
    
    if (!cleanUsername || !editingUser.password || !cleanFullName) return;

    const updated = { ...settings };
    
    // Check if the modified username already exists in another user
    const usernameExists = updated.users.some(
      (u, idx) => u.username.toLowerCase() === cleanUsername && idx !== editingUser.index
    );
    if (usernameExists) {
      alert('Username already exists');
      return;
    }

    const updatedUser = {
      username: cleanUsername,
      password: editingUser.password,
      role: editingUser.role,
      name: cleanFullName,
      dateOfJoining: editingUser.dateOfJoining || '',
      mobileNumber: editingUser.mobileNumber || '',
      employeeNumber: editingUser.employeeNumber || '',
      twoFactorEnabled: !!editingUser.twoFactorEnabled,
      twoFactorSecret: editingUser.twoFactorSecret || '',
      status: editingUser.status || 'active',
      lastWorkingDate: editingUser.status === 'deactivated' ? (editingUser.lastWorkingDate || '') : '',
      achievements: editingUser.achievements || {
        doubleStrike: 0,
        hattrickHero: 0,
        skyStorm: 0,
        skyTsunami: 0,
        consistencyChampion: 0,
        skyStriker: false,
        skyWarrior: false,
        skyCommander: false,
        skyRatna: false
      },
      counsellors: editingUser.role === 'tl' ? (editingUser.counsellors || []) : []
    };

    const oldUser = updated.users[editingUser.index];
    updated.users[editingUser.index] = updatedUser;
    
    // Sync counsellor dropdown names if name changed and role is counsellor or tl, AND user is active!
    if ((updatedUser.role === 'counsellor' || updatedUser.role === 'tl') && updatedUser.status !== 'deactivated') {
      if (oldUser && oldUser.name) {
        updated.dropdowns.counsellors = updated.dropdowns.counsellors.filter(c => c !== oldUser.name);
      }
      if (!updated.dropdowns.counsellors.includes(updatedUser.name)) {
        updated.dropdowns.counsellors.push(updatedUser.name);
      }
    } else {
      if (oldUser && (oldUser.role === 'counsellor' || oldUser.role === 'tl')) {
        updated.dropdowns.counsellors = updated.dropdowns.counsellors.filter(c => c !== oldUser.name);
      }
    }

    handleSaveSettings(updated, editingUser.adminTotpCode);
    setEditingUser(null);
  };

  const handleRemoveUser = (username) => {
    if (username === 'admin') {
      alert('Cannot delete primary administrator');
      return;
    }
    if (confirm(`Are you sure you want to delete account "${username}"?`)) {
      const updated = { ...settings };
      const user = updated.users.find(u => u.username === username);
      updated.users = updated.users.filter(u => u.username !== username);
      
      // Also remove from counsellor dropdown
      if (user && (user.role === 'counsellor' || user.role === 'tl')) {
        updated.dropdowns.counsellors = updated.dropdowns.counsellors.filter(c => c !== user.name);
      }

      handleSaveSettings(updated);
    }
  };

  const handleIncentiveTargetChange = (val) => {
    const updated = { ...settings };
    if (!updated.incentiveConfig) {
      updated.incentiveConfig = {};
    }
    updated.incentiveConfig.monthlyTarget = Number(val) || 0;
    setSettings(updated);
  };

  const handleSlabChange = (period, index, field, value) => {
    const updated = { ...settings };
    if (!updated.incentiveConfig) {
      updated.incentiveConfig = {};
    }
    if (!updated.incentiveConfig[period]) {
      updated.incentiveConfig[period] = [];
    }
    const val = field === 'amount' || field === 'min' || field === 'max' ? Number(value) : value;
    updated.incentiveConfig[period][index][field] = val;
    setSettings(updated);
  };

  const handleAddSlab = (period) => {
    const updated = { ...settings };
    if (!updated.incentiveConfig) {
      updated.incentiveConfig = {};
    }
    if (!updated.incentiveConfig[period]) {
      updated.incentiveConfig[period] = [];
    }
    updated.incentiveConfig[period].push({ min: 0, max: 100, amount: 0 });
    setSettings(updated);
  };

  const handleRemoveSlab = (period, index) => {
    const updated = { ...settings };
    if (updated.incentiveConfig && updated.incentiveConfig[period]) {
      updated.incentiveConfig[period].splice(index, 1);
      handleSaveSettings(updated);
    }
  };

  const handleTeamSlabChange = (period, index, field, value) => {
    const updated = { ...settings };
    if (!updated.incentiveConfig) {
      updated.incentiveConfig = {};
    }
    if (!updated.incentiveConfig.teamSlabs) {
      updated.incentiveConfig.teamSlabs = {};
    }
    if (!updated.incentiveConfig.teamSlabs[period]) {
      updated.incentiveConfig.teamSlabs[period] = [];
    }
    const val = field === 'amount' || field === 'min' || field === 'max' ? Number(value) : value;
    updated.incentiveConfig.teamSlabs[period][index][field] = val;
    setSettings(updated);
  };

  const handleAddTeamSlab = (period) => {
    const updated = { ...settings };
    if (!updated.incentiveConfig) {
      updated.incentiveConfig = {};
    }
    if (!updated.incentiveConfig.teamSlabs) {
      updated.incentiveConfig.teamSlabs = {};
    }
    if (!updated.incentiveConfig.teamSlabs[period]) {
      updated.incentiveConfig.teamSlabs[period] = [];
    }
    updated.incentiveConfig.teamSlabs[period].push({ min: 100, max: 120, amount: 0 });
    setSettings(updated);
  };

  const handleRemoveTeamSlab = (period, index) => {
    const updated = { ...settings };
    if (updated.incentiveConfig && updated.incentiveConfig.teamSlabs && updated.incentiveConfig.teamSlabs[period]) {
      updated.incentiveConfig.teamSlabs[period].splice(index, 1);
      handleSaveSettings(updated);
    }
  };

  const handleAddOverride = (e) => {
    e.preventDefault();
    if (!overrideCounsellor || !overrideStartDate || !overrideEndDate || !overrideAmount) {
      alert('Please fill out all override fields');
      return;
    }
    
    const updated = { ...settings };
    if (!updated.counsellorTargets) {
      updated.counsellorTargets = [];
    }
    
    updated.counsellorTargets.push({
      counsellorName: overrideCounsellor,
      startDate: overrideStartDate,
      endDate: overrideEndDate,
      targetAmount: Number(overrideAmount) || 0
    });
    
    handleSaveSettings(updated);
    
    // Clear fields
    setOverrideCounsellor('');
    setOverrideStartDate('');
    setOverrideEndDate('');
    setOverrideAmount('');
  };

  const handleRemoveOverride = (index) => {
    const updated = { ...settings };
    if (updated.counsellorTargets) {
      updated.counsellorTargets.splice(index, 1);
      handleSaveSettings(updated);
    }
  };

  const googleAppsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    
    if (action === "create") {
      var lastRow = sheet.getLastRow();
      var nextSNo = 1;
      if (lastRow > 1) {
        var val = sheet.getRange(lastRow, 1).getValue();
        if (!isNaN(val)) {
          nextSNo = parseInt(val) + 1;
        }
      }
      
      sheet.appendRow([
        nextSNo,
        data.date || "",
        data.time || "",
        data.session || "",
        data.studentName || "",
        data.mobileNumber || "",
        data.universityName || "",
        data.course || "",
        data.feesType || "",
        data.paymentMode || "",
        data.amountPaid || 0,
        data.dateOfAdmission || "",
        data.counsellorName || "",
        data.leadSource || "",
        data.remarks || "",
        data.status || ""
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", sNo: nextSNo }))
        .setMimeType(ContentService.MimeType.JSON);
    } 
    else if (action === "update") {
      var sNoToFind = data.sNo;
      var lastRow = sheet.getLastRow();
      var foundRow = -1;
      
      if (lastRow > 1) {
        var sNos = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < sNos.length; i++) {
          if (parseInt(sNos[i][0]) === parseInt(sNoToFind)) {
            foundRow = i + 2;
            break;
          }
        }
      }
      
      if (foundRow !== -1) {
        var rowValues = [
          sNoToFind,
          data.date || "",
          data.time || "",
          data.session || "",
          data.studentName || "",
          data.mobileNumber || "",
          data.universityName || "",
          data.course || "",
          data.feesType || "",
          data.paymentMode || "",
          data.amountPaid || 0,
          data.dateOfAdmission || "",
          data.counsellorName || "",
          data.leadSource || "",
          data.remarks || "",
          data.status || ""
        ];
        
        sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "S.No not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } 
    else if (action === "delete") {
      var sNoToFind = data.sNo;
      var lastRow = sheet.getLastRow();
      var foundRow = -1;
      
      if (lastRow > 1) {
        var sNos = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < sNos.length; i++) {
          if (parseInt(sNos[i][0]) === parseInt(sNoToFind)) {
            foundRow = i + 2;
            break;
          }
        }
      }
      
      if (foundRow !== -1) {
        sheet.deleteRow(foundRow);
        return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "S.No not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    var data = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
    var records = [];
    
    var keys = [
      "sNo", "date", "time", "session", "studentName", "mobileNumber", 
      "universityName", "course", "feesType", "paymentMode", "amountPaid", 
      "dateOfAdmission", "counsellorName", "leadSource", "remarks", "status"
    ];
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var record = {};
      
      for (var j = 0; j < keys.length; j++) {
        var val = row[j];
        if (val === undefined || val === null) {
          record[keys[j]] = keys[j] === "amountPaid" || keys[j] === "sNo" ? 0 : "";
        } else if (keys[j] === "sNo" || keys[j] === "amountPaid") {
          record[keys[j]] = Number(val) || 0;
        } else if (val instanceof Date) {
          var day = String(val.getDate()).padStart(2, '0');
          var month = String(val.getMonth() + 1).padStart(2, '0');
          var year = val.getFullYear();
          record[keys[j]] = day + "/" + month + "/" + year;
        } else {
          record[keys[j]] = String(val).trim();
        }
      }
      
      if (record.studentName && record.mobileNumber) {
        records.push(record);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(records))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '10px' }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent-primary)' }} />
        <span>Loading Configuration Panel...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Settings Navigation Tabs */}
      <div className="settings-tabs">
        <button className={`settings-tab-btn ${activeTab === 'dropdowns' ? 'active' : ''}`} onClick={() => setActiveTab('dropdowns')}>
          Dropdown Options
        </button>
        <button className={`settings-tab-btn ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')}>
          Services & APIs
        </button>
        <button className={`settings-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          Counsellor Accounts
        </button>
        <button className={`settings-tab-btn ${activeTab === 'incentives' ? 'active' : ''}`} onClick={() => setActiveTab('incentives')}>
          Incentives & Targets
        </button>
        <button className={`settings-tab-btn ${activeTab === 'bulletin' ? 'active' : ''}`} onClick={() => setActiveTab('bulletin')}>
          Daily Thought
        </button>
        <button className={`settings-tab-btn ${activeTab === 'disclaimer' ? 'active' : ''}`} onClick={() => setActiveTab('disclaimer')}>
          Policy Disclaimer
        </button>
        <button className={`settings-tab-btn ${activeTab === 'loginHistory' ? 'active' : ''}`} onClick={() => setActiveTab('loginHistory')}>
          🔑 Login History
        </button>
      </div>

      {isSaving && (
        <div style={{ position: 'fixed', right: '32px', top: '90px', background: 'var(--bg-tertiary)', border: '1px solid var(--emerald-border)', color: 'var(--emerald)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', zIndex: 100, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <RefreshCw className="animate-spin" size={14} />
          <span>Saving updates...</span>
        </div>
      )}

      {/* TAB 1: DROPDOWNS CUSTOMIZER */}
      {activeTab === 'dropdowns' && (
        <div className="animate-fade-in">
          <div className="settings-dropdowns-grid">
            
            {/* Sessions Box */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Sessions List</h3>
              <div className="tag-manager-list">
                {settings.dropdowns.sessions.map((item, i) => (
                  <span key={i} className="tag-manager-item">
                    {item}
                    <button className="tag-remove-btn" onClick={() => handleRemoveItem('sessions', item)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="input-add-tag">
                <input
                  type="text"
                  placeholder="e.g. Winter 2026"
                  className="form-control"
                  style={{ height: '34px', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={newSession}
                  onChange={(e) => setNewSession(e.target.value)}
                />
                <button className="btn-action-sm primary" style={{ height: '34px' }} onClick={() => handleAddItem('sessions', newSession, setNewSession)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Universities Box */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Universities List</h3>
              <div className="tag-manager-list">
                {settings.dropdowns.universities.map((item, i) => (
                  <span key={i} className="tag-manager-item">
                    {item}
                    <button className="tag-remove-btn" onClick={() => handleRemoveItem('universities', item)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="input-add-tag">
                <input
                  type="text"
                  placeholder="e.g. Amity University"
                  className="form-control"
                  style={{ height: '34px', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={newUniversity}
                  onChange={(e) => setNewUniversity(e.target.value)}
                />
                <button className="btn-action-sm primary" style={{ height: '34px' }} onClick={() => handleAddItem('universities', newUniversity, setNewUniversity)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Courses Box */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Courses List</h3>
              <div className="tag-manager-list">
                {settings.dropdowns.courses.map((item, i) => (
                  <span key={i} className="tag-manager-item">
                    {item}
                    <button className="tag-remove-btn" onClick={() => handleRemoveItem('courses', item)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="input-add-tag">
                <input
                  type="text"
                  placeholder="e.g. MCA"
                  className="form-control"
                  style={{ height: '34px', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                />
                <button className="btn-action-sm primary" style={{ height: '34px' }} onClick={() => handleAddItem('courses', newCourse, setNewCourse)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Lead Sources Box */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Lead Sources List</h3>
              <div className="tag-manager-list">
                {settings.dropdowns.leadSources.map((item, i) => (
                  <span key={i} className="tag-manager-item">
                    {item}
                    <button className="tag-remove-btn" onClick={() => handleRemoveItem('leadSources', item)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="input-add-tag">
                <input
                  type="text"
                  placeholder="e.g. Facebook Ads"
                  className="form-control"
                  style={{ height: '34px', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={newLeadSource}
                  onChange={(e) => setNewLeadSource(e.target.value)}
                />
                <button className="btn-action-sm primary" style={{ height: '34px' }} onClick={() => handleAddItem('leadSources', newLeadSource, setNewLeadSource)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Counsellor Display Names Box */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Active Counsellor Display Names</h3>
              <div className="tag-manager-list">
                {settings.dropdowns.counsellors?.map((item, i) => (
                  <span key={i} className="tag-manager-item">
                    {item}
                    <button className="tag-remove-btn" onClick={() => handleRemoveItem('counsellors', item)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="input-add-tag">
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  className="form-control"
                  style={{ height: '34px', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={newCounsellor}
                  onChange={(e) => setNewCounsellor(e.target.value)}
                />
                <button className="btn-action-sm primary" style={{ height: '34px' }} onClick={() => handleAddItem('counsellors', newCounsellor, setNewCounsellor)}>
                  <Plus size={14} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Note: Editing this list changes the options in dropdown menus. To create actual login accounts, use the **Counsellor Accounts** tab.
              </p>
            </div>

            {/* Statuses Box */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Statuses List</h3>
              <div className="tag-manager-list">
                {settings.dropdowns.statuses?.map((item, i) => (
                  <span key={i} className="tag-manager-item">
                    {item}
                    <button className="tag-remove-btn" onClick={() => handleRemoveItem('statuses', item)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="input-add-tag">
                <input
                  type="text"
                  placeholder="e.g. Refund"
                  className="form-control"
                  style={{ height: '34px', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                />
                <button className="btn-action-sm primary" style={{ height: '34px' }} onClick={() => handleAddItem('statuses', newStatus, setNewStatus)}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Target Tracker Months Box */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Target Tracker Months List</h3>
              <div className="tag-manager-list">
                {[...(settings.dropdowns.months || [])].sort().map((item, i) => {
                  const parts = item.split('-');
                  let displayVal = item;
                  if (parts.length === 2) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const d = new Date(year, month, 15);
                    if (!isNaN(d.getTime())) {
                      displayVal = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    }
                  }
                  return (
                    <span key={i} className="tag-manager-item">
                      {displayVal} ({item})
                      <button className="tag-remove-btn" onClick={() => handleRemoveItem('months', item)}>
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
              <div className="input-add-tag">
                <input
                  type="month"
                  className="form-control"
                  style={{ height: '34px', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                />
                <button className="btn-action-sm primary" style={{ height: '34px' }} onClick={() => handleAddItem('months', newMonth, setNewMonth)}>
                  <Plus size={14} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Select a month to add it to the Target Tracker dropdown menu on the dashboard.
              </p>
            </div>

            {/* Custom Date Periods Box */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Custom Date Periods</h3>
              <div className="tag-manager-list" style={{ gap: '10px', marginBottom: '16px' }}>
                {(settings.customDateFilters || []).map((item) => (
                  <span key={item.id} className="tag-manager-item" style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <strong>{item.name}</strong> ({item.startDate} to {item.endDate})
                    <button className="tag-remove-btn" style={{ marginLeft: '4px', position: 'static' }} onClick={() => handleRemoveCustomPeriod(item.id)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Period Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Q1 Target Contest"
                    className="form-control"
                    style={{ height: '34px', fontSize: '0.85rem' }}
                    value={newCustomPeriodName}
                    onChange={(e) => setNewCustomPeriodName(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Start Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      style={{ height: '34px', fontSize: '0.85rem' }}
                      value={newCustomPeriodStartDate}
                      onChange={(e) => setNewCustomPeriodStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>End Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      style={{ height: '34px', fontSize: '0.85rem' }}
                      value={newCustomPeriodEndDate}
                      onChange={(e) => setNewCustomPeriodEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  className="btn-submit" 
                  style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', width: '100%', marginTop: '4px' }}
                  onClick={handleAddCustomPeriod}
                  type="button"
                >
                  <Plus size={14} />
                  Add Custom Period
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: INTEGRATIONS (SHEETS, WHATSAPP) */}
      {activeTab === 'integrations' && (
        <div className="animate-fade-in">
          {/* Google Sheets box */}
          <div className="settings-box">
            <div className="toggle-container" style={{ borderBottom: 'none', margin: 0, paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Database size={22} style={{ color: 'var(--emerald)' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Google Sheets Synchronization</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Log admissions automatically as rows into Google Sheets</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={settings.googleSheets.enabled} onChange={() => handleToggleSync('googleSheets')} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {settings.googleSheets.enabled && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }} className="animate-fade-in">
                <div className="form-group" style={{ maxWidth: '600px' }}>
                  <label>Google Apps Script Web App Webhook URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={settings.googleSheets.webhookUrl}
                    onChange={(e) => handleIntegrationInputChange('googleSheets', 'webhookUrl', e.target.value)}
                    onBlur={() => handleSaveSettings(settings)}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Paste the published Apps Script URL above. Changes are saved automatically when you click away.
                  </p>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Google Apps Script Boilerplate Code:</h4>
                    <button className="btn-action-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }} onClick={copyToClipboard}>
                      {copied ? <Check size={14} style={{ color: 'var(--emerald)' }} /> : <Copy size={14} />}
                      {copied ? 'Copied!' : 'Copy Script'}
                    </button>
                  </div>
                  <pre className="code-snippet">{googleAppsScriptCode}</pre>
                  <ol style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: 1.6 }}>
                    <li>Open your Google Sheet, select **Extensions** &rarr; **Apps Script**.</li>
                    <li>Replace all code in the script editor with the snippet copied above.</li>
                    <li>Click **Deploy** &rarr; **New deployment**.</li>
                    <li>Choose type **Web app**, set execute as **"Me"**, and set access as **"Anyone"**.</li>
                    <li>Click deploy, copy the generated Web app URL, and paste it into the Webhook URL field above.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Twilio WhatsApp box */}
          <div className="settings-box">
            <div className="toggle-container" style={{ borderBottom: 'none', margin: 0, paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={22} style={{ color: '#c084fc' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Twilio WhatsApp Alerts</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Send automated alerts to admin when admissions are processed</p>
                </div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={settings.whatsapp.enabled} onChange={() => handleToggleSync('whatsapp')} />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--amber)', backgroundColor: 'var(--amber-bg)', border: '1px solid var(--amber-border)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
              Note: When disabled, WhatsApp runs in **Simulation Mode** and will log messages to the browser console and success popups for testing.
            </div>

            {settings.whatsapp.enabled && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }} className="animate-fade-in">
                <div className="settings-double-grid">
                  
                  <div className="form-group">
                    <label>Twilio Account SID</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="AC..."
                      value={settings.whatsapp.twilioAccountSid}
                      onChange={(e) => handleIntegrationInputChange('whatsapp', 'twilioAccountSid', e.target.value)}
                      onBlur={() => handleSaveSettings(settings)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Twilio Auth Token</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••••••••••••••••••••••••••"
                      value={settings.whatsapp.twilioAuthToken}
                      onChange={(e) => handleIntegrationInputChange('whatsapp', 'twilioAuthToken', e.target.value)}
                      onBlur={() => handleSaveSettings(settings)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Twilio Approved WhatsApp Sender Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="+14155238886"
                      value={settings.whatsapp.twilioFromNumber}
                      onChange={(e) => handleIntegrationInputChange('whatsapp', 'twilioFromNumber', e.target.value)}
                      onBlur={() => handleSaveSettings(settings)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Recipient Number (Admin notifications)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="9289062707"
                      value={settings.whatsapp.targetNumber}
                      onChange={(e) => handleIntegrationInputChange('whatsapp', 'targetNumber', e.target.value)}
                      onBlur={() => handleSaveSettings(settings)}
                    />
                  </div>

                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-action-sm primary" onClick={() => handleSaveSettings(settings)}>
                    Save API Credentials
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: COUNSELLOR LOGIN ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="animate-fade-in">
          <div className="settings-split-grid">
            {/* List of active users */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Registered Accounts</h3>
              
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th style={{ width: '60px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.users.map((user, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>
                        <div>{user.name}</div>
                        {user.employeeNumber && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ID: {user.employeeNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <code>{user.username}</code>
                        {user.mobileNumber && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Mob: {user.mobileNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <input
                          type="password"
                          className="form-control"
                          style={{ height: '30px', padding: '4px 8px', fontSize: '0.85rem', width: '110px', margin: 0, fontFamily: 'monospace' }}
                          value={user.password}
                          onChange={(e) => {
                            const updated = { ...settings };
                            updated.users[i].password = e.target.value;
                            setSettings(updated);
                          }}
                          onBlur={() => handleSaveSettings(settings)}
                          disabled={(user.isPrimaryAdmin || user.username === 'admin') && currentUser?.role !== 'admin'}
                          title={(user.isPrimaryAdmin || user.username === 'admin') && currentUser?.role !== 'admin' ? "Only the main administrator can reset the admin password." : "Edit and click away to reset password."}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                          <span className={`badge ${user.role === 'admin' ? 'badge-done' : user.role === 'it' ? 'badge-registration' : user.role === 'tl' ? 'badge-pending' : 'badge-followup'}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            {user.role}
                          </span>
                          {user.status === 'deactivated' ? (
                            <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', backgroundColor: 'rgba(244, 63, 94, 0.1)', color: 'var(--rose)', border: '1px solid rgba(244, 63, 94, 0.2)', fontWeight: 700 }}>
                              Deactivated
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 700 }}>
                              Active
                            </span>
                          )}
                        </div>
                        {user.dateOfJoining && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            DOJ: {user.dateOfJoining}
                          </div>
                        )}
                        {user.status === 'deactivated' && user.lastWorkingDate && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--rose)', marginTop: '2px', fontWeight: 600 }}>
                            LWD: {user.lastWorkingDate}
                          </div>
                        )}
                        {user.role === 'tl' && user.counsellors && user.counsellors.length > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)', marginTop: '4px', maxWidth: '200px', wordBreak: 'break-word' }}>
                            Team: {user.counsellors.map(cUsername => {
                              const match = settings.users.find(u => u.username === cUsername);
                              return match ? match.name : cUsername;
                            }).join(', ')}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-action-icon"
                            title="Edit User Details"
                            onClick={() => setEditingUser({ 
                              ...user, 
                              originalUsername: user.username, 
                              index: i,
                              achievements: user.achievements || {
                                doubleStrike: 0,
                                hattrickHero: 0,
                                skyStorm: 0,
                                skyTsunami: 0,
                                consistencyChampion: 0,
                                skyStriker: false,
                                skyWarrior: false,
                                skyCommander: false,
                                skyRatna: false
                              }
                            })}
                            disabled={(user.isPrimaryAdmin || user.username === 'admin') && currentUser?.role !== 'admin'}
                            style={{ width: '26px', height: '26px', padding: 0 }}
                          >
                            <Edit2 size={13} />
                          </button>
                          {!(user.isPrimaryAdmin || user.username === 'admin') && (
                            <button
                              type="button"
                              className="tag-remove-btn"
                              title="Delete Account"
                              onClick={() => handleRemoveUser(user.username)}
                              style={{ padding: 0, width: '22px', height: '22px' }}
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create New User */}
            <div className="settings-box">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} style={{ color: 'var(--accent-primary)' }} />
                Register New Account
              </h3>

              <form onSubmit={handleAddUser} autoComplete="off">
                <div className="form-group">
                  <label>Full Display Name (Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ramesh Kumar"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="form-group">
                  <label>Account Type (Role)</label>
                  <select
                    className="form-control"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    required
                    style={{ height: '38px', padding: '0 12px', fontSize: '0.9rem' }}
                  >
                    <option value="counsellor">Counsellor</option>
                    <option value="it">IT</option>
                    <option value="tl">Team Leader (TL)</option>
                  </select>
                </div>

                {newUserRole === 'tl' && (
                  <div className="form-group form-full-width" style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Map Counsellors under this TL</label>
                    <div className="settings-double-grid" style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-primary)',
                      padding: '12px',
                      gap: '8px'
                    }}>
                      {settings.users?.filter(u => u.role === 'counsellor').map(c => (
                        <label key={c.username} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={newTlCounsellors.includes(c.username)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTlCounsellors([...newTlCounsellors, c.username]);
                              } else {
                                setNewTlCounsellors(newTlCounsellors.filter(u => u !== c.username));
                              }
                            }}
                          />
                          {c.name} ({c.username})
                        </label>
                      ))}
                      {settings.users?.filter(u => u.role === 'counsellor').length === 0 && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No counsellors available to map</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Login Username</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ramesh"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={newMobileNumber}
                    onChange={(e) => setNewMobileNumber(e.target.value)}
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label>Employee ID / Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. EMP123"
                    value={newEmployeeNumber}
                    onChange={(e) => setNewEmployeeNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Date of Joining</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newDateOfJoining}
                    onChange={(e) => setNewDateOfJoining(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="newTwoFactorEnabled"
                    checked={newTwoFactorEnabled}
                    onChange={(e) => setNewTwoFactorEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="newTwoFactorEnabled" style={{ cursor: 'pointer', margin: 0, fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--amber)' }} /> Enable Google 2FA Security
                  </label>
                </div>

                <button type="submit" className="btn-submit" style={{ width: '100%', marginTop: '12px' }}>
                  <Plus size={16} />
                  Add User Credentials
                </button>
              </form>
            </div>

            {currentUser?.role === 'admin' && settings?.adminTotpSecret && (
              <div className="settings-box" style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--emerald)' }} />
                  Google Authenticator (2FA) Security
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  Google Authenticator is required to change or reset the Administrator password. Scan the QR code below or enter the secret key manually into your Google Authenticator app.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`otpauth://totp/SkyAdmissions:admin?secret=${settings.adminTotpSecret}&issuer=SkyAdmissions`)}`}
                    alt="Authenticator QR Code"
                    style={{ border: '4px solid white', borderRadius: '4px', width: '160px', height: '160px' }}
                  />
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Secret Key:</span>
                    <code style={{ fontSize: '0.85rem', color: 'var(--accent-light)', padding: '4px 8px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', letterSpacing: '1px', wordBreak: 'break-all' }}>
                      {settings.adminTotpSecret}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal Overlay */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Edit User Details</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Display Name (Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Account Type (Role)</label>
                  <select
                    className="form-control"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    disabled={editingUser.isPrimaryAdmin || editingUser.originalUsername === 'admin'}
                    required
                    style={{ height: '38px', padding: '0 12px', fontSize: '0.9rem' }}
                  >
                    <option value="admin">Administrator (Admin)</option>
                    <option value="it">IT Support</option>
                    <option value="tl">Team Leader (TL)</option>
                    <option value="counsellor">Counsellor</option>
                  </select>
                </div>

                {editingUser.role === 'tl' && (
                  <div className="form-group form-full-width" style={{ marginTop: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Map Counsellors under this TL</label>
                    <div className="settings-double-grid" style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-primary)',
                      padding: '12px',
                      gap: '8px'
                    }}>
                      {settings.users?.filter(u => u.role === 'counsellor').map(c => {
                        const currentCounsellors = editingUser.counsellors || [];
                        return (
                          <label key={c.username} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input
                              type="checkbox"
                              checked={currentCounsellors.includes(c.username)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditingUser({
                                    ...editingUser,
                                    counsellors: [...currentCounsellors, c.username]
                                  });
                                } else {
                                  setEditingUser({
                                    ...editingUser,
                                    counsellors: currentCounsellors.filter(u => u !== c.username)
                                  });
                                }
                              }}
                            />
                            {c.name} ({c.username})
                          </label>
                        );
                      })}
                      {settings.users?.filter(u => u.role === 'counsellor').length === 0 && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No counsellors available to map</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Login Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    disabled={false}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingUser.password}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 9876543210"
                    value={editingUser.mobileNumber || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, mobileNumber: e.target.value })}
                    maxLength={10}
                  />
                </div>

                <div className="form-group">
                  <label>Employee ID / Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. EMP123"
                    value={editingUser.employeeNumber || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, employeeNumber: e.target.value })}
                  />
                </div>

                <div className="form-group form-full-width">
                   <label>Date of Joining</label>
                   <input
                     type="date"
                     className="form-control"
                     value={editingUser.dateOfJoining || ''}
                     onChange={(e) => setEditingUser({ ...editingUser, dateOfJoining: e.target.value })}
                   />
                 </div>

                 <div className="form-group">
                   <label>Account Status</label>
                   <select
                     className="form-control"
                     value={editingUser.status || 'active'}
                     onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                     disabled={editingUser.originalUsername === 'admin'}
                     required
                     style={{ height: '38px', padding: '0 12px', fontSize: '0.9rem' }}
                   >
                     <option value="active">Active (Working)</option>
                     <option value="deactivated">Deactivated (Left Job)</option>
                   </select>
                 </div>

                 {editingUser.status === 'deactivated' && (
                   <div className="form-group">
                     <label>Last Date of Working</label>
                     <input
                       type="date"
                       className="form-control"
                       value={editingUser.lastWorkingDate || ''}
                       onChange={(e) => setEditingUser({ ...editingUser, lastWorkingDate: e.target.value })}
                       required
                     />
                   </div>
                 )}

                {editingUser.originalUsername !== 'admin' && (
                  <div className="form-group form-full-width" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!editingUser.twoFactorEnabled}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const generateSecret = () => {
                            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
                            let secret = '';
                            for (let i = 0; i < 16; i++) {
                              secret += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            return secret;
                          };
                          setEditingUser({
                            ...editingUser,
                            twoFactorEnabled: isChecked,
                            twoFactorSecret: isChecked && !editingUser.twoFactorSecret ? generateSecret() : editingUser.twoFactorSecret
                          });
                        }}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable Google 2FA Security
                    </label>

                    {editingUser.twoFactorEnabled && (
                      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>QR Code to Setup Google Authenticator:</span>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`otpauth://totp/SkyAdmissions:${editingUser.username}?secret=${editingUser.twoFactorSecret}&issuer=SkyAdmissions`)}`}
                          alt="2FA Setup QR Code"
                          style={{ border: '4px solid white', borderRadius: '4px', width: '140px', height: '140px' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Secret Key: <code style={{ letterSpacing: '1px', color: 'var(--accent-light)' }}>{editingUser.twoFactorSecret}</code>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {(editingUser.isPrimaryAdmin || editingUser.originalUsername === 'admin') && (
                  <div className="form-group form-full-width" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                    <label style={{ color: 'var(--amber)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck size={16} />
                      Google Authenticator OTP (Required)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter 6-digit OTP code to verify"
                      value={editingUser.adminTotpCode || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, adminTotpCode: e.target.value })}
                      maxLength={6}
                      required
                      style={{ letterSpacing: '2px', fontFamily: 'monospace', fontSize: '1.1rem', textAlign: 'center', height: '42px' }}
                    />
                  </div>
                )}
                {editingUser.originalUsername !== 'admin' && (
                  <div className="form-group form-full-width" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--amber)' }}>
                      <Award size={16} />
                      Counsellor Achievements & Badges Locker
                    </h4>
                    
                    {/* Badges Counts */}
                    <div className="settings-triple-grid" style={{ marginBottom: '16px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem' }}>⚡ Double Strike</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          style={{ height: '32px', fontSize: '0.85rem' }}
                          value={editingUser.achievements?.doubleStrike || 0}
                          onChange={(e) => {
                            const ach = editingUser.achievements || {};
                            setEditingUser({
                              ...editingUser,
                              achievements: { ...ach, doubleStrike: Math.max(0, parseInt(e.target.value) || 0) }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem' }}>🔥 Hattrick Hero</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          style={{ height: '32px', fontSize: '0.85rem' }}
                          value={editingUser.achievements?.hattrickHero || 0}
                          onChange={(e) => {
                            const ach = editingUser.achievements || {};
                            setEditingUser({
                              ...editingUser,
                              achievements: { ...ach, hattrickHero: Math.max(0, parseInt(e.target.value) || 0) }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem' }}>🚀 Sky Storm</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          style={{ height: '32px', fontSize: '0.85rem' }}
                          value={editingUser.achievements?.skyStorm || 0}
                          onChange={(e) => {
                            const ach = editingUser.achievements || {};
                            setEditingUser({
                              ...editingUser,
                              achievements: { ...ach, skyStorm: Math.max(0, parseInt(e.target.value) || 0) }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem' }}>👑 Sky Tsunami</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          style={{ height: '32px', fontSize: '0.85rem' }}
                          value={editingUser.achievements?.skyTsunami || 0}
                          onChange={(e) => {
                            const ach = editingUser.achievements || {};
                            setEditingUser({
                              ...editingUser,
                              achievements: { ...ach, skyTsunami: Math.max(0, parseInt(e.target.value) || 0) }
                            });
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '0.75rem' }}>🎯 Consistency Champ</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          style={{ height: '32px', fontSize: '0.85rem' }}
                          value={editingUser.achievements?.consistencyChampion || 0}
                          onChange={(e) => {
                            const ach = editingUser.achievements || {};
                            setEditingUser({
                              ...editingUser,
                              achievements: { ...ach, consistencyChampion: Math.max(0, parseInt(e.target.value) || 0) }
                            });
                          }}
                        />
                      </div>
                    </div>

                    {/* Titles Toggles */}
                    <div className="settings-double-grid" style={{ gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!editingUser.achievements?.skyStriker}
                          onChange={(e) => {
                            const ach = editingUser.achievements || {};
                            setEditingUser({
                              ...editingUser,
                              achievements: { ...ach, skyStriker: e.target.checked }
                            });
                          }}
                        />
                        🏹 Sky Striker (Monthly)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!editingUser.achievements?.skyWarrior}
                          onChange={(e) => {
                            const ach = editingUser.achievements || {};
                            setEditingUser({
                              ...editingUser,
                              achievements: { ...ach, skyWarrior: e.target.checked }
                            });
                          }}
                        />
                        ⚔️ Sky Warrior (Quarterly)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!editingUser.achievements?.skyCommander}
                          onChange={(e) => {
                            const ach = editingUser.achievements || {};
                            setEditingUser({
                              ...editingUser,
                              achievements: { ...ach, skyCommander: e.target.checked }
                            });
                          }}
                        />
                        👑 Sky Commander (Half-Yr)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={!!editingUser.achievements?.skyRatna}
                          onChange={(e) => {
                            const ach = editingUser.achievements || {};
                            setEditingUser({
                              ...editingUser,
                              achievements: { ...ach, skyRatna: e.target.checked }
                            });
                          }}
                        />
                        💎 Sky Ratna (Annual)
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn-action-sm" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-action-sm primary">
                  <Save size={14} style={{ marginRight: '6px' }} />
                  Save User Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: INCENTIVES & TARGETS */}
      {activeTab === 'incentives' && settings.incentiveConfig && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Base Target Card */}
          <div className="settings-box">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Base Targets Configuration</h3>
            <div className="settings-double-grid" style={{ alignItems: 'center' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Monthly Target (Rs.)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.incentiveConfig.monthlyTarget}
                  onChange={(e) => {
                    handleIncentiveTargetChange(e.target.value);
                    const updated = { ...settings };
                    if (!updated.incentiveConfig) updated.incentiveConfig = {};
                    updated.incentiveConfig.monthlyTarget = Number(e.target.value) || 0;
                    handleSaveSettings(updated);
                  }}
                  style={{ height: '38px' }}
                />
              </div>
              <div className="settings-triple-grid" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Quarterly Target (3X)</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Rs. {(settings.incentiveConfig.monthlyTarget * 3).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Half-Yearly Target (6X)</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Rs. {(settings.incentiveConfig.monthlyTarget * 6).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Annual Target (12X)</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Rs. {(settings.incentiveConfig.monthlyTarget * 12).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Overrides Card */}
          <div className="settings-box">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Counsellor-Specific Target Overrides</h3>
            <div className="settings-split-grid">
              {/* Overrides list */}
              <div>
                <table className="users-table" style={{ marginTop: 0 }}>
                  <thead>
                    <tr>
                      <th>Counsellor Name</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Monthly Target (Rs.)</th>
                      <th style={{ width: '60px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(settings.counsellorTargets || []).map((override, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 500 }}>{override.counsellorName}</td>
                        <td><code>{override.startDate}</code></td>
                        <td><code>{override.endDate}</code></td>
                        <td><strong>Rs. {Number(override.targetAmount).toLocaleString('en-IN')}</strong></td>
                        <td>
                          <button className="tag-remove-btn" onClick={() => handleRemoveOverride(i)}>
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!settings.counsellorTargets || settings.counsellorTargets.length === 0) && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                          No counsellor-specific target overrides set. Standard target will apply.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Override Form */}
              <div className="settings-override-form">
                <h4 style={{ fontSize: '0.95rem', marginBottom: '12px', fontWeight: 600 }}>Create Target Override</h4>
                <form onSubmit={handleAddOverride}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.8rem' }}>Select Counsellor</label>
                    <select
                      className="form-control"
                      value={overrideCounsellor}
                      onChange={(e) => setOverrideCounsellor(e.target.value)}
                      required
                      style={{ height: '34px', padding: '0 10px', fontSize: '0.85rem' }}
                    >
                      <option value="">-- Choose Counsellor --</option>
                      {settings.dropdowns.counsellors.map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-double-grid" style={{ gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem' }}>Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={overrideStartDate}
                        onChange={(e) => setOverrideStartDate(e.target.value)}
                        required
                        style={{ height: '34px', padding: '0 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem' }}>End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={overrideEndDate}
                        onChange={(e) => setOverrideEndDate(e.target.value)}
                        required
                        style={{ height: '34px', padding: '0 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.8rem' }}>Monthly Target Amount (Rs.)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={overrideAmount}
                      onChange={(e) => setOverrideAmount(e.target.value)}
                      required
                      placeholder="e.g. 200000"
                      style={{ height: '34px', padding: '0 10px', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button type="submit" className="btn-submit" style={{ width: '100%', height: '36px' }}>
                    <Plus size={16} />
                    Apply Custom Target
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Start Date Option at the top of Slabs */}
          <div className="settings-box" style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
              Revenue Calculation Start Date
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', alignItems: 'center' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Calculation Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={settings.incentiveConfig.calculationStartDate || '2026-04-01'}
                  onChange={(e) => {
                    const updated = { ...settings };
                    if (!updated.incentiveConfig) {
                      updated.incentiveConfig = {};
                    }
                    updated.incentiveConfig.calculationStartDate = e.target.value;
                    setSettings(updated);
                    handleSaveSettings(updated);
                  }}
                  style={{ height: '38px' }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Set the start date to calculate counsellor revenue and slab eligibility. Admissions before this date are excluded from Monthly, Quarterly, Half-Yearly, and Annual target calculations.
              </p>
            </div>
          </div>

          {/* Slab Tables for all 4 periods */}
          {['monthly', 'quarterly', 'halfYearly', 'annual'].map((period) => {
            const slabs = settings.incentiveConfig[period] || [];
            const title = period === 'monthly' ? 'Monthly Achievement Slabs' :
                          period === 'quarterly' ? 'Quarterly Achievement Slabs (Bonus)' :
                          period === 'halfYearly' ? 'Half-Yearly Achievement Slabs (Bonus)' :
                          'Annual Achievement Slabs (Bonus)';
            
            return (
              <div className="settings-box" key={period}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{title}</h3>
                  <button className="btn-action-sm primary" onClick={() => handleAddSlab(period)} style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}>
                    <Plus size={14} /> Add Slab
                  </button>
                </div>

                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Min Achievement %</th>
                      <th>Max Achievement %</th>
                      <th>Incentive Amount (Rs.)</th>
                      <th>Eligibility Label</th>
                      <th style={{ width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slabs.map((slab, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            style={{ height: '32px', padding: '4px 8px', fontSize: '0.85rem', width: '100px' }}
                            value={slab.min}
                            onChange={(e) => handleSlabChange(period, index, 'min', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            style={{ height: '32px', padding: '4px 8px', fontSize: '0.85rem', width: '100px' }}
                            value={slab.max}
                            onChange={(e) => handleSlabChange(period, index, 'max', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            style={{ height: '32px', padding: '4px 8px', fontSize: '0.85rem', width: '120px' }}
                            value={slab.amount}
                            onChange={(e) => handleSlabChange(period, index, 'amount', e.target.value)}
                          />
                        </td>
                        <td>
                          <span className={`badge ${slab.amount > 0 ? 'badge-done' : 'badge-followup'}`}>
                            {slab.amount > 0 ? `Eligible (Rs. ${slab.amount.toLocaleString('en-IN')})` : 'Not Eligible (Nil)'}
                          </span>
                        </td>
                        <td>
                          <button className="tag-remove-btn" onClick={() => handleRemoveSlab(period, index)}>
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {slabs.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                          No slabs configured. Click "Add Slab" to configure.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}

          <h2 style={{ fontSize: '1.25rem', marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', color: 'var(--text-primary)' }}>
            👥 Team Achievement (TL) Slabs Configuration
          </h2>
          {['monthly', 'quarterly', 'halfYearly', 'annual'].map((period) => {
            const slabs = settings.incentiveConfig.teamSlabs?.[period] || [];
            const title = period === 'monthly' ? 'Monthly Team Achievement Slabs' :
                          period === 'quarterly' ? 'Quarterly Team Achievement Slabs' :
                          period === 'halfYearly' ? 'Half-Yearly Team Achievement Slabs' :
                          'Annual Team Achievement Slabs';
            
            return (
              <div className="settings-box" key={`team-${period}`} style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{title}</h3>
                  <button className="btn-action-sm primary" onClick={() => handleAddTeamSlab(period)} style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}>
                    <Plus size={14} /> Add Slab
                  </button>
                </div>

                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Min Achievement %</th>
                      <th>Max Achievement %</th>
                      <th>Incentive Amount (Rs.)</th>
                      <th>Eligibility Label</th>
                      <th style={{ width: '80px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slabs.map((slab, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            style={{ height: '32px', padding: '4px 8px', fontSize: '0.85rem', width: '100px' }}
                            value={slab.min}
                            onChange={(e) => handleTeamSlabChange(period, index, 'min', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            style={{ height: '32px', padding: '4px 8px', fontSize: '0.85rem', width: '100px' }}
                            value={slab.max}
                            onChange={(e) => handleTeamSlabChange(period, index, 'max', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            style={{ height: '32px', padding: '4px 8px', fontSize: '0.85rem', width: '120px' }}
                            value={slab.amount}
                            onChange={(e) => handleTeamSlabChange(period, index, 'amount', e.target.value)}
                          />
                        </td>
                        <td>
                          <span className={`badge ${slab.amount > 0 ? 'badge-done' : 'badge-followup'}`}>
                            {slab.amount > 0 ? `Eligible (Rs. ${slab.amount.toLocaleString('en-IN')})` : 'Not Eligible (Nil)'}
                          </span>
                        </td>
                        <td>
                          <button className="tag-remove-btn" onClick={() => handleRemoveTeamSlab(period, index)}>
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {slabs.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                          No slabs configured. Click "Add Slab" to configure.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', marginBottom: '24px' }}>
            <button className="btn-submit" onClick={() => handleSaveSettings(settings)} style={{ minWidth: '180px', height: '42px', gap: '8px' }}>
              <Save size={18} />
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {activeTab === 'bulletin' && (
        <div className="animate-fade-in settings-box" style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} style={{ color: 'var(--accent-primary)' }} />
            Daily Thought Bulletin Configurator
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
            Configure the announcement, motivational quote, or daily thought shown on dashboard screens. You can broadcast a single message to everyone or set role-specific bulletins for Counsellors and Team Leaders.
          </p>

          {/* Mode Selector */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button
              onClick={() => setThoughtMode('same')}
              style={{
                flex: 1,
                padding: '12px 18px',
                background: thoughtMode === 'same' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                border: '1px solid ' + (thoughtMode === 'same' ? 'var(--accent-primary)' : 'var(--border-color)'),
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ fontWeight: 650, fontSize: '0.9rem', color: thoughtMode === 'same' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                📢 Same for Everyone
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Broadcast a single message across all dashboards.
              </span>
            </button>
            <button
              onClick={() => setThoughtMode('role-specific')}
              style={{
                flex: 1,
                padding: '12px 18px',
                background: thoughtMode === 'role-specific' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                border: '1px solid ' + (thoughtMode === 'role-specific' ? 'var(--accent-primary)' : 'var(--border-color)'),
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ fontWeight: 650, fontSize: '0.9rem', color: thoughtMode === 'role-specific' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                🎭 Designation-Specific
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Show different messages to Counsellors and Team Leaders.
              </span>
            </button>
          </div>

          {thoughtMode === 'same' ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Thought Title (shows in Green):</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%', height: '38px', padding: '0 12px' }}
                  placeholder="e.g. Do You Know That?"
                  value={thoughtTitleSame}
                  onChange={(e) => setThoughtTitleSame(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Thought Description / Paragraph (shows in Blue):</label>
                <textarea
                  className="form-control"
                  style={{ width: '100%', minHeight: '100px', padding: '12px', resize: 'vertical', lineHeight: 1.5 }}
                  placeholder="e.g. Every success story begins with the decision to try. Keep pushing forward!"
                  value={thoughtTextSame}
                  onChange={(e) => setThoughtTextSame(e.target.value)}
                />
              </div>

              {/* Preview Box */}
              <div style={{ border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', marginTop: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Preview (All Dashboards):</span>
                {thoughtTextSame ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ fontSize: '1.8rem' }}>💡</div>
                    <div style={{ textAlign: 'left' }}>
                      {thoughtTitleSame && <h4 style={{ margin: 0, color: 'var(--emerald)', fontSize: '0.95rem', fontWeight: 700 }}>{thoughtTitleSame}</h4>}
                      <p style={{ margin: '2px 0 0 0', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 500 }}>{thoughtTextSame}</p>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Enter a thought to see the live preview.</span>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="settings-double-grid">
                {/* Counsellor Bulletin Section */}
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-light)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    📢 Counsellor Bulletin
                  </h4>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Title (Green):</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', height: '34px', padding: '0 10px', fontSize: '0.85rem' }}
                      placeholder="e.g. Daily Target Tip"
                      value={thoughtTitleCounsellor}
                      onChange={(e) => setThoughtTitleCounsellor(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Description / Paragraph (Blue):</label>
                    <textarea
                      className="form-control"
                      style={{ width: '100%', minHeight: '80px', padding: '8px 10px', fontSize: '0.85rem', resize: 'vertical', lineHeight: 1.4 }}
                      placeholder="Enter motivational thought or tip for counsellors..."
                      value={thoughtTextCounsellor}
                      onChange={(e) => setThoughtTextCounsellor(e.target.value)}
                    />
                  </div>
                  {/* Counsellor Preview */}
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Counsellor Dashboard Preview:</span>
                    {thoughtTextCounsellor ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '1.4rem' }}>💡</div>
                        <div style={{ textAlign: 'left' }}>
                          {thoughtTitleCounsellor && <h5 style={{ margin: 0, color: 'var(--emerald)', fontSize: '0.85rem', fontWeight: 700 }}>{thoughtTitleCounsellor}</h5>}
                          <p style={{ margin: '2px 0 0 0', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 500 }}>{thoughtTextCounsellor}</p>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No bulletin set for counsellors.</span>
                    )}
                  </div>
                </div>

                {/* TL Bulletin Section */}
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-light)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                    📢 Team Leader (TL) Bulletin
                  </h4>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Title (Green):</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ width: '100%', height: '34px', padding: '0 10px', fontSize: '0.85rem' }}
                      placeholder="e.g. TL Management Tip"
                      value={thoughtTitleTl}
                      onChange={(e) => setThoughtTitleTl(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.8rem' }}>Description / Paragraph (Blue):</label>
                    <textarea
                      className="form-control"
                      style={{ width: '100%', minHeight: '80px', padding: '8px 10px', fontSize: '0.85rem', resize: 'vertical', lineHeight: 1.4 }}
                      placeholder="Enter instruction or encouragement for team leaders..."
                      value={thoughtTextTl}
                      onChange={(e) => setThoughtTextTl(e.target.value)}
                    />
                  </div>
                  {/* TL Preview */}
                  <div style={{ border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>TL Dashboard Preview:</span>
                    {thoughtTextTl ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--glass-bg)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '1.4rem' }}>💡</div>
                        <div style={{ textAlign: 'left' }}>
                          {thoughtTitleTl && <h5 style={{ margin: 0, color: 'var(--emerald)', fontSize: '0.85rem', fontWeight: 700 }}>{thoughtTitleTl}</h5>}
                          <p style={{ margin: '2px 0 0 0', color: 'var(--accent-primary)', fontSize: '0.78rem', fontWeight: 500 }}>{thoughtTextTl}</p>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No bulletin set for TLs.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button
              className="btn-submit"
              onClick={handleSaveThought}
              style={{ minWidth: '160px', height: '40px', gap: '8px' }}
              disabled={isSaving}
            >
              <Save size={16} />
              Save Bulletins
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: POLICY DISCLAIMER */}
      {activeTab === 'disclaimer' && (
        <div className="animate-fade-in">
          <div className="settings-box" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ fontSize: '1.4rem' }}>📄</div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Policy Disclaimer Editor</h3>
            </div>
            
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
              This markdown text will be displayed in the left-hand sidebar menu under <strong>"Policy Disclaimer"</strong> on all user dashboards. 
              Only administrators can view and edit this configuration.
            </p>

            <div className="form-group">
              <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.85rem' }}>Disclaimer & Policy Document (Markdown):</label>
              <textarea
                className="form-control"
                style={{ 
                  width: '100%', 
                  minHeight: '350px', 
                  padding: '16px', 
                  fontFamily: 'Consolas, Monaco, monospace', 
                  fontSize: '0.82rem', 
                  lineHeight: 1.5,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  resize: 'vertical'
                }}
                placeholder="Write policy terms in markdown..."
                value={disclaimerText}
                onChange={(e) => setDisclaimerText(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button
              className="btn-submit"
              onClick={handleSaveDisclaimer}
              style={{ minWidth: '200px', height: '40px', gap: '8px' }}
              disabled={isSaving}
            >
              <Save size={16} />
              Save Policy Disclaimer
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: LOGIN HISTORY */}
      {activeTab === 'loginHistory' && (
        <div className="animate-fade-in">
          <div className="settings-box" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ fontSize: '1.4rem' }}>🔑</div>
                <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Login & Logout Activity History</h3>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={fetchLoginHistory}
                disabled={loadingHistory}
                style={{ height: '32px', fontSize: '0.8rem', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
                Refresh Logs
              </button>
            </div>
            
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
              This audit log displays the authentication history, including successful logins, manual logouts, and system deactivations due to incorrect passwords.
            </p>

            {loadingHistory ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', gap: '10px' }}>
                <RefreshCw className="animate-spin" size={20} style={{ color: 'var(--accent-primary)' }} />
                <span>Loading activity log...</span>
              </div>
            ) : loginHistory.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No authentication records found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Timestamp</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Name (Username)</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Role</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>Action Event</th>
                      <th style={{ textAlign: 'left', padding: '10px' }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.timestamp}</td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>
                          {log.name} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.78rem' }}>({log.username})</span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge ${log.role === 'admin' ? 'badge-done' : log.role === 'it' ? 'badge-registration' : log.role === 'tl' ? 'badge-pending' : 'badge-followup'}`} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            {log.role}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {log.action === 'login' && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 700 }}>
                              LOGIN
                            </span>
                          )}
                          {log.action === 'logout' && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: 700 }}>
                              LOGOUT
                            </span>
                          )}
                          {log.action === 'deactivated_by_system' && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--rose)', border: '1px solid rgba(239, 68, 68, 0.2)', fontWeight: 700 }} title="Locked due to 3 consecutive failed password attempts">
                              BLOCKED BY SYSTEM
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
