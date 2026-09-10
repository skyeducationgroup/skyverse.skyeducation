// Database layer for Sky Education Group Ambassador Program CRM
// API-backed with in-memory cache for instant reads

const ADMIN_CREDENTIALS = {
  username: "skyeducation.co.in",
  password: "skyeducationgroup.co.in.admin"
};

// Seed default data for first-time setup
const DEFAULT_AMBASSADORS = [
  {
    id: "AMB-01",
    name: "Bunty Singh",
    fatherName: "Rajesh Kumar",
    mobile: "9289062707",
    email: "bunty@example.com",
    course: "B.Tech Computer Science",
    university: "Sky Technical University",
    enrollmentNumber: "STU2026001",
    counselorName: "Shubham Sharma",
    username: "bunty270701",
    password: "BUN270701",
    dateCreated: "2026-06-01T10:00:00.000Z",
    isActive: true,
    payouts: []
  },
  {
    id: "AMB-02",
    name: "Amit Patel",
    fatherName: "Sanjay Patel",
    mobile: "9876543210",
    email: "amit.patel@example.com",
    course: "MBA Marketing",
    university: "Global Business School",
    enrollmentNumber: "GBS998877",
    counselorName: "Preeti Singh",
    username: "amit321002",
    password: "AMI321002",
    dateCreated: "2026-06-02T11:30:00.000Z",
    isActive: true,
    payouts: []
  },
  {
    id: "AMB-03",
    name: "Priya Sharma",
    fatherName: "Vijay Sharma",
    mobile: "9123456789",
    email: "priya.sharma@example.com",
    course: "BCA",
    university: "National Institute of Tech",
    enrollmentNumber: "NIT887766",
    counselorName: "Vikram Malhotra",
    username: "priya678903",
    password: "PRI678903",
    dateCreated: "2026-06-03T09:15:00.000Z",
    isActive: true,
    payouts: []
  }
];

const DEFAULT_CHATS = {
  "AMB-01": [
    {
      sender: "AMB-01",
      senderName: "Bunty Singh",
      text: "Hello, I have a question about the referral program.",
      timestamp: Date.now() - 86400000
    },
    {
      sender: "admin",
      senderName: "Administrator",
      text: "Hi Bunty! Sure, feel free to ask. How can I help?",
      timestamp: Date.now() - 47 * 60 * 60 * 1000
    }
  ]
};

function generateDefaultReferralRules() {
  const rules = [];
  const universities = [
    {
      name: "LPU",
      courses: [
        { name: "BCA", type: "UG" },
        { name: "BA", type: "UG" },
        { name: "BBA", type: "UG" },
        { name: "MBA", type: "PG" },
        { name: "MCA", type: "PG" },
        { name: "MSC", type: "PG" },
        { name: "MCOM", type: "PG" }
      ]
    },
    {
      name: "Amity",
      courses: [
        { name: "BCA", type: "UG" },
        { name: "BA", type: "UG" },
        { name: "BBA", type: "UG" },
        { name: "MBA", type: "PG" },
        { name: "MCA", type: "PG" },
        { name: "MSC", type: "PG" },
        { name: "MCOM", type: "PG" }
      ]
    },
    {
      name: "MUJ",
      courses: [
        { name: "MBA", type: "PG" },
        { name: "BBA", type: "UG" },
        { name: "BCA", type: "UG" },
        { name: "MCA", type: "PG" },
        { name: "BCom", type: "UG" },
        { name: "MSc", type: "PG" },
        { name: "MA", type: "PG" },
        { name: "MCom", type: "PG" },
        { name: "MAJMC", type: "PG" }
      ]
    },
    {
      name: "GLA",
      courses: [
        { name: "MBA", type: "PG" },
        { name: "BBA", type: "UG" },
        { name: "MCA", type: "PG" },
        { name: "BCA", type: "UG" },
        { name: "BCom", type: "UG" }
      ]
    },
    {
      name: "SMU",
      courses: [
        { name: "MA", type: "PG" },
        { name: "MBA", type: "PG" },
        { name: "MCA", type: "PG" },
        { name: "BBA", type: "UG" },
        { name: "BA", type: "UG" },
        { name: "BCom", type: "UG" },
        { name: "MCom", type: "PG" }
      ]
    }
  ];

  let idCounter = 1;
  universities.forEach(uni => {
    uni.courses.forEach(c => {
      rules.push({
        id: `rule-${idCounter++}`,
        university: uni.name,
        course: c.name,
        paymentType: "Any",
        amount: c.type === "UG" ? 3000 : 5000
      });
    });
  });
  return rules;
}

class Database {
  constructor() {
    // In-memory cache for instant synchronous reads
    this._cache = {
      ambassadors: [],
      referrals: [],
      chats: {},
      logs: [],
      announcements: [],
      referralSettings: null
    };
    this._token = localStorage.getItem("auth_token") || "";
    this._initialized = false;
    this._syncDebounce = {};

    // Initialize default referral settings in cache
    this._cache.referralSettings = {
      defaultAmount: 5000,
      rules: generateDefaultReferralRules()
    };
  }

  // ============================================================
  //  SERVER COMMUNICATION
  // ============================================================

  _getUrl(endpoint) {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      return endpoint;
    }
    // If the frontend is hosted on a different domain than referance.onrender.com (like referance-1.onrender.com),
    // route requests to the main backend server referance.onrender.com!
    if (window.location.origin !== "https://referance.onrender.com") {
      return `https://referance.onrender.com${endpoint}`;
    }
    return endpoint;
  }

  _getHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (this._token) {
      headers["Authorization"] = `Bearer ${this._token}`;
    }
    return headers;
  }

  // Background sync to server (fire-and-forget)
  _syncToServer(collection, data) {
    if (!this._token) return;

    // SAFETY: Never overwrite critical collections with empty data
    if (collection === "ambassadors" && Array.isArray(data) && data.length === 0) {
      console.warn("[DB] BLOCKED: Refusing to sync empty ambassadors array to server.");
      return;
    }

    // Debounce per collection (500ms)
    if (this._syncDebounce[collection]) {
      clearTimeout(this._syncDebounce[collection]);
    }
    this._syncDebounce[collection] = setTimeout(() => {
      fetch(this._getUrl(`/api/data/${collection}`), {
        method: "PUT",
        headers: this._getHeaders(),
        body: JSON.stringify(data)
      }).catch(err => console.error(`[DB] Sync ${collection} failed:`, err));
    }, 300);
  }

  // Load all data from the server into cache
  async loadFromServer() {
    try {
      const res = await fetch(this._getUrl("/api/data"), {
        headers: this._getHeaders()
      });
      if (!res.ok) {
        console.warn("[DB] Server returned", res.status, "- using local cache");
        return false;
      }
      const data = await res.json();
      if (data.ambassadors && data.ambassadors.length > 0) {
        this._cache.ambassadors = data.ambassadors;
      }
      if (data.referrals) {
        this._cache.referrals = data.referrals;
      }
      if (data.chats && Object.keys(data.chats).length > 0) {
        this._cache.chats = data.chats;
      }
      if (data.logs && data.logs.length > 0) {
        this._cache.logs = data.logs;
      }
      if (data.announcements) {
        this._cache.announcements = data.announcements;
      }
      if (data.settings) {
        this._cache.referralSettings = data.settings;
      }
      this._initialized = true;

      // Check level bonuses for all ambassadors
      try {
        this._cache.ambassadors.forEach(a => {
          this.checkAndGenerateLevelBonuses(a.id);
        });
      } catch (e) {}

      console.log("[DB] Data loaded from server:", {
        ambassadors: this._cache.ambassadors.length,
        referrals: this._cache.referrals.length
      });
      return true;
    } catch (err) {
      console.warn("[DB] Failed to load from server, using local cache:", err);
      return false;
    }
  }

  // Seed default data on server (called if server DB is empty)
  async seedDefaults() {
    try {
      // Check if server already has data
      const res = await fetch(this._getUrl("/api/data"), { headers: this._getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.ambassadors && data.ambassadors.length > 0) {
          return; // Already has data, don't seed
        }
      }

      // Seed defaults
      this._cache.ambassadors = DEFAULT_AMBASSADORS;
      this._cache.referrals = [];
      this._cache.chats = DEFAULT_CHATS;
      this._cache.logs = [
        { timestamp: new Date().toISOString(), type: "System", message: "Database initialized with backend." }
      ];

      // Push to server
      await Promise.all([
        fetch(this._getUrl("/api/data/ambassadors"), { method: "PUT", headers: this._getHeaders(), body: JSON.stringify(this._cache.ambassadors) }),
        fetch(this._getUrl("/api/data/referrals"), { method: "PUT", headers: this._getHeaders(), body: JSON.stringify(this._cache.referrals) }),
        fetch(this._getUrl("/api/data/chats"), { method: "PUT", headers: this._getHeaders(), body: JSON.stringify(this._cache.chats) }),
        fetch(this._getUrl("/api/data/logs"), { method: "PUT", headers: this._getHeaders(), body: JSON.stringify(this._cache.logs) }),
        fetch(this._getUrl("/api/data/settings"), { method: "PUT", headers: this._getHeaders(), body: JSON.stringify(this._cache.referralSettings) })
      ]);

      console.log("[DB] Seeded default data to server");
    } catch (err) {
      console.error("[DB] Failed to seed defaults:", err);
    }
  }

  // ============================================================
  //  AUTHENTICATION (ASYNC)
  // ============================================================

  async login(username, password, role) {
    try {
      const res = await fetch(this._getUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
      });
      const data = await res.json();

      if (data.success) {
        this._token = data.token;
        localStorage.setItem("auth_token", data.token);

        // Load all data from server after login
        await this.loadFromServer();
        await this.seedDefaults();
        await this.loadFromServer();

        if (role === "admin") {
          this.addLog("Admin", "Admin logged in successfully.");
        } else if (data.user) {
          this.addLog("Ambassador", `Ambassador ${data.user.name} logged in.`);
        }
      }

      return data;
    } catch (err) {
      console.error("[DB] Login failed:", err);
      return { success: false, message: "Server connection failed. Please try again." };
    }
  }

  async verifySession() {
    if (!this._token) return null;
    try {
      const res = await fetch(this._getUrl("/api/auth/me"), {
        headers: this._getHeaders()
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.success) {
        return { role: data.role, user: data.user };
      }
      return null;
    } catch (err) {
      console.error("[DB] Session verification failed:", err);
      return null;
    }
  }

  logout() {
    this._token = "";
    localStorage.removeItem("auth_token");
    localStorage.removeItem("currentRole");
    localStorage.removeItem("currentUser");
  }

  // ============================================================
  //  REFERRAL SETTINGS
  // ============================================================

  getReferralSettings() {
    if (!this._cache.referralSettings) {
      this._cache.referralSettings = {
        defaultAmount: 5000,
        rules: generateDefaultReferralRules()
      };
    }
    return this._cache.referralSettings;
  }

  saveReferralSettings(settings) {
    this._cache.referralSettings = settings;
    this._syncToServer("settings", settings);
  }

  calculateReferralReward(referral) {
    if (!referral) return 0;
    const settings = this.getReferralSettings();
    const defaultAmount = settings.defaultAmount !== undefined ? settings.defaultAmount : 5000;
    const rules = settings.rules || [];

    const isAny = (val) => !val || val.trim() === "" || val.toLowerCase() === "any";

    const matchWordOrExact = (val, target) => {
      if (!val || !target) return false;
      const escaped = target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp('\\b' + escaped + '\\b', 'i');
      return regex.test(val);
    };

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const uniMatch = isAny(rule.university) || 
        (referral.university && matchWordOrExact(referral.university, rule.university));
      const courseMatch = isAny(rule.course) || 
        (referral.courseInterest && matchWordOrExact(referral.courseInterest, rule.course));
      const paymentMatch = isAny(rule.paymentType) || 
        (referral.paymentType && referral.paymentType.toLowerCase() === rule.paymentType.toLowerCase());

      if (uniMatch && courseMatch && paymentMatch) {
        return rule.amount || defaultAmount;
      }
    }

    return defaultAmount;
  }

  // ============================================================
  //  DATA GETTERS & SETTERS (SYNCHRONOUS CACHE)
  // ============================================================

  // Clear data back to default
  resetData() {
    this._cache.ambassadors = DEFAULT_AMBASSADORS;
    this._cache.referrals = [];
    this._cache.chats = DEFAULT_CHATS;
    this._cache.logs = [
      { timestamp: new Date().toISOString(), type: "System", message: "Database reset." }
    ];
    this._syncToServer("ambassadors", this._cache.ambassadors);
    this._syncToServer("referrals", this._cache.referrals);
    this._syncToServer("chats", this._cache.chats);
    this._syncToServer("logs", this._cache.logs);
  }

  getAmbassadors() {
    return this._cache.ambassadors || [];
  }

  getReferrals() {
    return this._cache.referrals || [];
  }

  getLogs() {
    return this._cache.logs || [];
  }

  getChats() {
    return this._cache.chats || {};
  }

  saveChats(chats) {
    this._cache.chats = chats;
    this._syncToServer("chats", chats);
  }

  addChatMessage(ambassadorId, sender, senderName, text) {
    const chats = this.getChats();
    if (!chats[ambassadorId]) chats[ambassadorId] = [];
    chats[ambassadorId].push({
      sender,
      senderName,
      text,
      timestamp: Date.now()
    });
    this.saveChats(chats);
  }

  // Log events
  addLog(type, message) {
    const logs = this.getLogs();
    logs.unshift({
      timestamp: new Date().toISOString(),
      type,
      message
    });
    // Keep last 100 logs
    if (logs.length > 100) logs.pop();
    this._cache.logs = logs;
    this._syncToServer("logs", logs);
  }

  // Save changes
  saveAmbassadors(ambassadors) {
    // SAFETY: Never replace with empty array if we already have data
    if (Array.isArray(ambassadors) && ambassadors.length === 0 && this._cache.ambassadors.length > 0) {
      console.warn("[DB] BLOCKED: saveAmbassadors called with empty array, keeping existing data.");
      return;
    }
    this._cache.ambassadors = ambassadors;
    this._syncToServer("ambassadors", ambassadors);
  }

  saveReferrals(referrals) {
    this._cache.referrals = referrals;
    this._syncToServer("referrals", referrals);
  }

  // ============================================================
  //  LEVEL & STATS CALCULATIONS (UNCHANGED BUSINESS LOGIC)
  // ============================================================

  // Level calculator based on admissions
  calculateLevel(admissionsCount) {
    let level = {
      levelNum: 0,
      name: "Base",
      nextLevelName: "Bronze",
      admissionsNeeded: 3,
      currentProgress: admissionsCount,
      targetAdmissions: 3,
      percent: Math.min((admissionsCount / 3) * 100, 100),
      rewards: ["₹5,000 Per Referral"],
      nextRewards: ["Welcome Kit", "Bronze Certificate", "LinkedIn / Social Recognition"],
      bonus: 0
    };

    if (admissionsCount >= 20) {
      level = {
        levelNum: 4,
        name: "Diamond",
        nextLevelName: "Max Level",
        admissionsNeeded: 0,
        currentProgress: admissionsCount,
        targetAdmissions: 20,
        percent: 100,
        rewards: [
          "₹5,000 Per Referral", 
          "Welcome Kit", 
          "Certificates", 
          "LinkedIn Connection",
          "₹5,000 Silver Bonus",
          "₹11,000 Gold Bonus",
          "₹25,000 Diamond Bonus", 
          "Diamond Trophy", 
          "Annual Celebrity Meet Invite"
        ],
        nextRewards: [],
        bonus: 25000 + 11000 + 5000
      };
    } else if (admissionsCount >= 11) {
      level = {
        levelNum: 3,
        name: "Gold",
        nextLevelName: "Diamond",
        admissionsNeeded: 20 - admissionsCount,
        currentProgress: admissionsCount,
        targetAdmissions: 20,
        percent: ((admissionsCount - 11) / 9) * 100,
        rewards: [
          "₹5,000 Per Referral", 
          "Welcome Kit", 
          "Certificates", 
          "LinkedIn Connection",
          "₹5,000 Silver Bonus",
          "₹11,000 Gold Bonus"
        ],
        nextRewards: ["₹25,000 Diamond Bonus", "Diamond Trophy", "Annual Celebrity Meet Invite"],
        bonus: 11000 + 5000
      };
    } else if (admissionsCount >= 5) {
      level = {
        levelNum: 2,
        name: "Silver",
        nextLevelName: "Gold",
        admissionsNeeded: 11 - admissionsCount,
        currentProgress: admissionsCount,
        targetAdmissions: 11,
        percent: ((admissionsCount - 5) / 6) * 100,
        rewards: [
          "₹5,000 Per Referral", 
          "Welcome Kit", 
          "Silver Certificate", 
          "LinkedIn Connection",
          "₹5,000 Silver Bonus"
        ],
        nextRewards: ["₹11,000 Gold Bonus"],
        bonus: 5000
      };
    } else if (admissionsCount >= 3) {
      level = {
        levelNum: 1,
        name: "Bronze",
        nextLevelName: "Silver",
        admissionsNeeded: 5 - admissionsCount,
        currentProgress: admissionsCount,
        targetAdmissions: 5,
        percent: ((admissionsCount - 3) / 2) * 100,
        rewards: ["₹5,000 Per Referral", "Welcome Kit", "Bronze Certificate", "LinkedIn / Social Recognition"],
        nextRewards: ["₹5,000 Silver Bonus", "Silver Certificate"],
        bonus: 0
      };
    }

    return level;
  }

  // Get Ambassador details & stats
  getAmbassadorStats(ambassadorId) {
    const ambassadors = this.getAmbassadors();
    const ambassador = ambassadors.find(a => a.id === ambassadorId);
    if (!ambassador) return null;

    const referrals = this.getReferrals().filter(r => r.referrerId === ambassadorId);
    const enrolledReferrals = referrals.filter(r => r.status === "Enrolled");
    const disbursedReferrals = referrals.filter(r => r.status === "Enrolled" && r.payoutStatus === "Paid");
    
    // Check if admin has set a manual count. If not, use referral count of enrolled admissions.
    const isOverridden = ambassador.admissionsCountOverride !== undefined && ambassador.admissionsCountOverride !== null;
    const admissionsCount = isOverridden ? ambassador.admissionsCountOverride : enrolledReferrals.length;
    const levelInfo = this.calculateLevel(admissionsCount);

    // Earnings: dynamic per disbursed referral + level bonus. Manual override applies to both.
    let baseReferralEarnings = 0;
    const paidRefs = referrals.filter(r => r.status === "Enrolled" && r.payoutStatus === "Paid");
    paidRefs.forEach(r => {
      baseReferralEarnings += this.calculateReferralReward(r);
    });

    if (isOverridden) {
      const diff = admissionsCount - paidRefs.length;
      if (diff > 0) {
        const settings = this.getReferralSettings();
        baseReferralEarnings += diff * (settings.defaultAmount !== undefined ? settings.defaultAmount : 5000);
      }
    }
    
    let totalEarnings = baseReferralEarnings + levelInfo.bonus;
    if (ambassador.earningsOverride !== undefined && ambassador.earningsOverride !== null) {
      totalEarnings = Number(ambassador.earningsOverride);
    }

    // Payout details
    let totalPaid = (ambassador.payouts || [])
      .filter(p => p.status === "Paid")
      .reduce((sum, p) => sum + p.amount, 0);
    if (ambassador.paidOverride !== undefined && ambassador.paidOverride !== null) {
      totalPaid = Number(ambassador.paidOverride);
    }

    // Pending details
    const pendingWithdrawals = (ambassador.payouts || [])
      .filter(p => p.status === "Pending")
      .reduce((sum, p) => sum + p.amount, 0);

    let pendingDisbursals = 0;
    const unpaidRefs = referrals.filter(r => r.status === "Enrolled" && r.payoutStatus !== "Paid");
    unpaidRefs.forEach(r => {
      pendingDisbursals += this.calculateReferralReward(r);
    });

    const totalPending = pendingWithdrawals + pendingDisbursals;

    let balanceAvailable = totalEarnings - totalPaid - pendingWithdrawals;
    if (ambassador.balanceOverride !== undefined && ambassador.balanceOverride !== null) {
      balanceAvailable = Number(ambassador.balanceOverride);
    }

    const referralsCount = ambassador.referralsCountOverride !== undefined && ambassador.referralsCountOverride !== null
      ? Number(ambassador.referralsCountOverride)
      : referrals.length;

    return {
      ambassador,
      referrals,
      referralsCount,
      enrolledCount: enrolledReferrals.length,
      admissionsCount,
      levelInfo,
      totalEarnings,
      totalPaid,
      totalPending,
      balanceAvailable
    };
  }

  // ============================================================
  //  AMBASSADOR CRUD (UNCHANGED BUSINESS LOGIC)
  // ============================================================

  // Create Ambassador (Admin Action)
  createAmbassador(data) {
    const ambassadors = this.getAmbassadors();
    const nextSerial = ambassadors.length + 1;
    const serialStr = String(nextSerial).padStart(2, "0");

    // Generate credentials
    const cleanedName = data.name.replace(/\s+/g, "").toLowerCase();
    const phoneLast4 = data.mobile.slice(-4);
    const username = `${cleanedName}${phoneLast4}${serialStr}`;

    const name3 = data.name.substring(0, 3).toUpperCase().padEnd(3, "X");
    const password = `${name3}${phoneLast4}${serialStr}`;

    const newAmbassador = {
      id: `AMB-${serialStr}`,
      name: data.name,
      fatherName: data.fatherName,
      mobile: data.mobile,
      email: data.email,
      course: data.course,
      university: data.university,
      enrollmentNumber: data.enrollmentNumber,
      counselorName: data.counselorName,
      username,
      password,
      isActive: true,
      dateCreated: new Date().toISOString(),
      payouts: []
    };

    ambassadors.push(newAmbassador);
    this.saveAmbassadors(ambassadors);

    this.addLog("Admin", `Created new Ambassador account: ${data.name} (ID: ${newAmbassador.id})`);
    this.addLog("GoogleSheets", `Synced: Row added in Sheet "Ambassadors" for ${data.name}.`);
    this.addLog("GoogleDrive", `Created Directory: "Ambassador_Group/Kits/${data.name}_${newAmbassador.id}"`);

    return newAmbassador;
  }

  // Update Ambassador admissions count or manual details
  updateAmbassadorAdmissions(ambassadorId, newCount) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return false;

    const oldCount = ambassadors[index].admissionsCountOverride !== undefined 
      ? ambassadors[index].admissionsCountOverride 
      : (ambassadors[index].admissionsCount !== undefined ? ambassadors[index].admissionsCount : 0);
    
    if (newCount === "" || newCount === null || newCount === undefined) {
      delete ambassadors[index].admissionsCountOverride;
      delete ambassadors[index].admissionsCount;
      this.saveAmbassadors(ambassadors);
      this.addLog("Admin", `Reset admissions override for ${ambassadors[index].name} to automatic calculation`);
      this.addLog("GoogleSheets", `Reset admissions count override for ID ${ambassadorId}`);
      return true;
    }

    const countVal = parseInt(newCount, 10);
    ambassadors[index].admissionsCountOverride = countVal;
    delete ambassadors[index].admissionsCount;
    
    this.saveAmbassadors(ambassadors);

    this.addLog("Admin", `Updated admissions for ${ambassadors[index].name} from ${oldCount} to ${newCount}`);
    this.addLog("GoogleSheets", `Updated admissions count override for ID ${ambassadorId} to ${newCount}`);
    
    // Check level shifts to trigger certificate generation log
    const oldLevel = this.calculateLevel(oldCount);
    const newLevel = this.calculateLevel(countVal);
    if (newLevel.levelNum > oldLevel.levelNum) {
      this.addLog("GoogleDrive", `Generated Level ${newLevel.levelNum} (${newLevel.name}) Certificate for ${ambassadors[index].name} in Drive folder.`);
    }

    this.checkAndGenerateLevelBonuses(ambassadorId);

    return true;
  }

  // Check and automatically generate pending payout requests for level bonuses
  checkAndGenerateLevelBonuses(ambassadorId) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return;

    const amb = ambassadors[index];
    const referrals = this.getReferrals().filter(r => r.referrerId === ambassadorId);
    const enrolledReferrals = referrals.filter(r => r.status === "Enrolled");
    const isOverridden = amb.admissionsCountOverride !== undefined && amb.admissionsCountOverride !== null;
    const count = isOverridden ? amb.admissionsCountOverride : enrolledReferrals.length;

    if (!amb.payouts) amb.payouts = [];
    let updated = false;

    // Check Silver (>= 5 admissions, ₹5,000 bonus)
    if (count >= 5) {
      const hasSilver = amb.payouts.some(p => p.id === `PAY-BONUS-SILVER-${ambassadorId}`);
      if (!hasSilver) {
        amb.payouts.push({
          id: `PAY-BONUS-SILVER-${ambassadorId}`,
          amount: 5000,
          date: new Date().toISOString().split("T")[0],
          timestamp: Date.now(),
          status: "Pending",
          type: "Level Bonus (Silver)"
        });
        this.addLog("System", `Generated Silver Level Bonus payout request of ₹5,000 for ${amb.name}`);
        updated = true;
      }
    }

    // Check Gold (>= 11 admissions, ₹11,000 bonus)
    if (count >= 11) {
      const hasGold = amb.payouts.some(p => p.id === `PAY-BONUS-GOLD-${ambassadorId}`);
      if (!hasGold) {
        amb.payouts.push({
          id: `PAY-BONUS-GOLD-${ambassadorId}`,
          amount: 11000,
          date: new Date().toISOString().split("T")[0],
          timestamp: Date.now(),
          status: "Pending",
          type: "Level Bonus (Gold)"
        });
        this.addLog("System", `Generated Gold Level Bonus payout request of ₹11,000 for ${amb.name}`);
        updated = true;
      }
    }

    // Check Diamond (>= 20 admissions, ₹25,000 bonus)
    if (count >= 20) {
      const hasDiamond = amb.payouts.some(p => p.id === `PAY-BONUS-DIAMOND-${ambassadorId}`);
      if (!hasDiamond) {
        amb.payouts.push({
          id: `PAY-BONUS-DIAMOND-${ambassadorId}`,
          amount: 25000,
          date: new Date().toISOString().split("T")[0],
          timestamp: Date.now(),
          status: "Pending",
          type: "Level Bonus (Diamond)"
        });
        this.addLog("System", `Generated Diamond Level Bonus payout request of ₹25,000 for ${amb.name}`);
        updated = true;
      }
    }

    if (updated) {
      this.saveAmbassadors(ambassadors);
    }
  }

  // Update Ambassador profile photo
  updateAmbassadorProfilePhoto(ambassadorId, profilePhotoBase64) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return false;

    ambassadors[index].profilePhoto = profilePhotoBase64;
    this.saveAmbassadors(ambassadors);
    return true;
  }

  // Update Ambassador complete profile (Admin Action)
  updateAmbassadorProfile(ambassadorId, data) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return false;

    const amb = ambassadors[index];
    const oldName = amb.name;

    amb.name = data.name;
    amb.fatherName = data.fatherName;
    amb.mobile = data.mobile;
    amb.email = data.email;
    amb.course = data.course;
    amb.university = data.university;
    amb.enrollmentNumber = data.enrollmentNumber;
    amb.counselorName = data.counselorName;
    amb.username = data.username;
    amb.password = data.password;
    amb.isActive = data.isActive !== undefined ? data.isActive : true;

    this.saveAmbassadors(ambassadors);

    this.addLog("Admin", `Updated details for Ambassador ${oldName} (ID: ${ambassadorId})`);
    this.addLog("GoogleSheets", `Updated profile data for ID ${ambassadorId} in Google Sheets.`);

    return true;
  }

  // Add a pending popup notification for an ambassador
  addPendingPopup(ambassadorId, type, data) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return false;

    const amb = ambassadors[index];
    amb.pendingPopups = amb.pendingPopups || [];
    
    const popupId = `POP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    amb.pendingPopups.push({
      id: popupId,
      type: type,
      data: data,
      timestamp: Date.now()
    });

    this.saveAmbassadors(ambassadors);
    return true;
  }

  // Clear a pending popup notification for an ambassador
  clearPendingPopup(ambassadorId, popupId) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return false;

    const amb = ambassadors[index];
    if (amb.pendingPopups) {
      amb.pendingPopups = amb.pendingPopups.filter(p => p.id !== popupId);
      this.saveAmbassadors(ambassadors);
    }
    return true;
  }

  // Update Ambassador bank & UPI details (Ambassador Action)
  updateAmbassadorBankDetails(ambassadorId, details) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return false;

    const amb = ambassadors[index];
    amb.bankName = details.bankName;
    amb.bankHolderName = details.bankHolderName;
    amb.bankAccountNumber = details.bankAccountNumber;
    amb.bankIfsc = details.bankIfsc;
    amb.bankPassbookPhoto = details.bankPassbookPhoto;
    amb.upiId = details.upiId;
    amb.upiQrPhoto = details.upiQrPhoto;

    this.saveAmbassadors(ambassadors);

    this.addLog("Ambassador", `Updated Bank & UPI details for ${amb.name} (ID: ${ambassadorId})`);
    this.addLog("GoogleSheets", `Updated bank/UPI details for ID ${ambassadorId} in database.`);
    this.addLog("GoogleDrive", `Uploaded passbook/scanner assets to folder "Ambassador_Group/Payment_Verification/${amb.name}_${ambassadorId}"`);

    return true;
  }

  // ============================================================
  //  PAYOUT MANAGEMENT (UNCHANGED BUSINESS LOGIC)
  // ============================================================

  // Create Payout Request (Ambassador Action)
  requestPayout(ambassadorId, amount) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return false;

    const stats = this.getAmbassadorStats(ambassadorId);
    const unrequestedBalance = stats.balanceAvailable;
    if (amount > unrequestedBalance) return { success: false, message: "Requested amount exceeds available unrequested balance." };

    const newPayout = {
      id: `PAY-${Date.now()}`,
      amount: parseInt(amount, 10),
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      status: "Pending"
    };

    if (!ambassadors[index].payouts) ambassadors[index].payouts = [];
    ambassadors[index].payouts.push(newPayout);
    this.saveAmbassadors(ambassadors);

    this.addLog("Ambassador", `${ambassadors[index].name} requested a payout of ₹${amount}.`);
    this.addLog("GoogleSheets", `Added Row: Payout requested for ${ambassadors[index].name} of ₹${amount}.`);

    return { success: true, payout: newPayout };
  }

  // Update Payout Status (Admin Action)
  approvePayout(ambassadorId, payoutId, utrNumber, screenshotBase64) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return false;

    const payouts = ambassadors[index].payouts || [];
    const payoutIndex = payouts.findIndex(p => p.id === payoutId);
    if (payoutIndex === -1) return false;

    const payoutAmount = payouts[payoutIndex].amount;
    payouts[payoutIndex].status = "Paid";
    payouts[payoutIndex].utrNumber = utrNumber || "N/A";
    payouts[payoutIndex].screenshot = screenshotBase64 || "";
    payouts[payoutIndex].disbursedAt = new Date().toISOString();
    
    ambassadors[index].payouts = payouts;
    this.saveAmbassadors(ambassadors);

    // Queue a withdrawal disbursed popup
    this.addPendingPopup(ambassadorId, "WithdrawalDisbursed", {
      payoutId: payoutId,
      amount: payoutAmount,
      utrNumber: utrNumber || "N/A"
    });

    this.addLog("Admin", `Approved and processed payout of ₹${payoutAmount} for ${ambassadors[index].name}. UTR: ${utrNumber || 'N/A'}`);
    this.addLog("GoogleSheets", `Updated Payout ${payoutId} status to PAID in sheets database.`);

    return true;
  }

  // Reject Payout Request (Admin Action)
  rejectPayout(ambassadorId, payoutId) {
    const ambassadors = this.getAmbassadors();
    const index = ambassadors.findIndex(a => a.id === ambassadorId);
    if (index === -1) return false;

    const payouts = ambassadors[index].payouts || [];
    const payoutIndex = payouts.findIndex(p => p.id === payoutId);
    if (payoutIndex === -1) return false;

    const payoutAmount = payouts[payoutIndex].amount;
    payouts[payoutIndex].status = "Rejected";
    payouts[payoutIndex].rejectedAt = new Date().toISOString();
    
    ambassadors[index].payouts = payouts;
    this.saveAmbassadors(ambassadors);

    this.addLog("Admin", `Rejected payout request of ₹${payoutAmount} for ${ambassadors[index].name}.`);
    this.addLog("GoogleSheets", `Updated Payout ${payoutId} status to REJECTED in sheets database.`);

    return true;
  }

  // ============================================================
  //  REFERRAL MANAGEMENT (UNCHANGED BUSINESS LOGIC)
  // ============================================================

  // Submit student reference (Ambassador Action)
  submitReferral(ambassadorId, referralData) {
    const referrals = this.getReferrals();
    const newRef = {
      id: `REF-${String(referrals.length + 1).padStart(3, "0")}`,
      referrerId: ambassadorId,
      studentName: referralData.name,
      studentMobile: referralData.mobile,
      studentEmail: referralData.email,
      courseInterest: referralData.course,
      university: referralData.university,
      studyMode: referralData.studyMode,
      status: "Pending",
      payoutStatus: "None",
      notes: "Reference submitted by Ambassador.",
      dateSubmitted: new Date().toISOString(),
      counselorName: referralData.counselorName || "",
      whatsappScreenshot: referralData.whatsappScreenshot || "",
      paymentType: referralData.paymentType || "Annual"
    };

    referrals.push(newRef);
    this.saveReferrals(referrals);

    const ambassadors = this.getAmbassadors();
    const amb = ambassadors.find(a => a.id === ambassadorId);
    const ambName = amb ? amb.name : "Unknown";

    this.addLog("Ambassador", `${ambName} submitted reference for ${referralData.name}.`);
    this.addLog("GoogleSheets", `Synced: Row added in Sheet "Referrals" for candidate ${referralData.name}.`);

    return newRef;
  }

  // Update referral status (Admin Action)
  updateReferralStatus(referralId, newStatus) {
    const referrals = this.getReferrals();
    const index = referrals.findIndex(r => r.id === referralId);
    if (index === -1) return false;

    const oldStatus = referrals[index].status;
    referrals[index].status = newStatus;

    this.addLog("Admin", `Updated referral ${referralId} status from ${oldStatus} to ${newStatus}.`);
    this.addLog("GoogleSheets", `Updated Referral ID ${referralId} status to ${newStatus} in Google Sheets.`);

    // If status changed to Enrolled, check if we need to set payoutStatus and timestamps
    if (newStatus === "Enrolled" && oldStatus !== "Enrolled") {
      referrals[index].payoutStatus = "Requested";
      referrals[index].enrollmentTimestamp = Date.now();
      referrals[index].enrollmentDate = new Date().toISOString().split("T")[0];
      this.saveReferrals(referrals);

      // Queue a congratulatory popup
      const refObj = referrals[index];
      const rewardAmt = this.calculateReferralReward(refObj);
      this.addPendingPopup(refObj.referrerId, "AdmissionApproved", {
        studentName: refObj.studentName,
        rewardAmount: rewardAmt
      });
    } else {
      if (newStatus !== "Enrolled" && oldStatus === "Enrolled") {
        delete referrals[index].enrollmentTimestamp;
        delete referrals[index].enrollmentDate;
        referrals[index].payoutStatus = "None";
        this.saveReferrals(referrals);
      } else {
        this.saveReferrals(referrals);
      }
    }

    return true;
  }

  // Release individual referral reward to ambassador balance
  releaseReferralReward(referralId) {
    const referrals = this.getReferrals();
    const rIndex = referrals.findIndex(r => r.id === referralId);
    if (rIndex === -1) return false;

    const referral = referrals[rIndex];
    if (referral.status !== "Enrolled") return false;
    if (referral.payoutStatus === "Paid") return false;

    referrals[rIndex].payoutStatus = "Paid";
    this.saveReferrals(referrals);

    const amount = this.calculateReferralReward(referral);
    this.addPendingPopup(referral.referrerId, "RewardCredited", {
      studentName: referral.studentName,
      rewardAmount: amount
    });

    const ambassadors = this.getAmbassadors();
    const amb = ambassadors.find(a => a.id === referral.referrerId);
    const ambName = amb ? amb.name : "Unknown";

    this.addLog("Admin", `Released referral reward of ₹${amount.toLocaleString('en-IN')} for referral ${referralId} to Ambassador ${ambName}'s wallet.`);
    this.addLog("GoogleSheets", `Referral reward ${referralId} status set to PAID (Wallet Credited).`);
    
    this.checkAndGenerateLevelBonuses(referral.referrerId);

    return true;
  }

  // ============================================================
  //  EXPORT CSV (UNCHANGED)
  // ============================================================

  exportAmbassadorsCSV() {
    const ambassadors = this.getAmbassadors();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Father Name,Mobile,Email,Course,University,Enrollment No,Counselor,Username,Admissions Count,Date Created\n";

    ambassadors.forEach(a => {
      const row = [
        a.id,
        `"${a.name}"`,
        `"${a.fatherName}"`,
        a.mobile,
        a.email,
        `"${a.course}"`,
        `"${a.university}"`,
        a.enrollmentNumber,
        `"${a.counselorName}"`,
        a.username,
        a.admissionsCount,
        a.dateCreated
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sky_Education_Ambassadors_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportReferralsCSV() {
    const referrals = this.getReferrals();
    const ambassadors = this.getAmbassadors();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Referral ID,Referrer Name,Student Name,Student Mobile,Student Email,Course Interest,Status,Payout Status,Date Submitted\n";

    referrals.forEach(r => {
      const referrer = ambassadors.find(a => a.id === r.referrerId);
      const referrerName = referrer ? referrer.name : "Unknown";
      const row = [
        r.id,
        `"${referrerName}"`,
        `"${r.studentName}"`,
        r.studentMobile,
        r.studentEmail,
        `"${r.courseInterest}"`,
        r.status,
        r.payoutStatus,
        r.dateSubmitted
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sky_Education_Referrals_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ============================================================
  //  ANNOUNCEMENTS (UNCHANGED BUSINESS LOGIC)
  // ============================================================

  getAnnouncements() {
    return this._cache.announcements || [];
  }

  saveAnnouncements(announcements) {
    this._cache.announcements = announcements;
    this._syncToServer("announcements", announcements);
  }

  addAnnouncement(title, message, targetUserIds) {
    const announcements = this.getAnnouncements();
    const newAnnouncement = {
      id: `ANN-${Date.now()}`,
      title,
      message,
      targetUserIds: targetUserIds || [],
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      timestamp: Date.now()
    };
    announcements.unshift(newAnnouncement);
    this.saveAnnouncements(announcements);
    this.addLog("Admin", `Posted new portal announcement: "${title}"`);
    return newAnnouncement;
  }

  deleteAnnouncement(id) {
    const announcements = this.getAnnouncements();
    const filtered = announcements.filter(a => a.id !== id);
    this.saveAnnouncements(filtered);
    this.addLog("Admin", `Deleted portal announcement: ${id}`);
    return true;
  }
}

export const db = new Database();
