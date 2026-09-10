import { db } from "./database.js";

// Global Fallback Google Apps Script Web App URL for sync across all clients/devices
const DEFAULT_GOOGLE_SYNC_URL = "https://script.google.com/macros/s/AKfycbxvsF4rItMlckw3BDKgz24PwKzllPQZaD6YyssUw-r5P2iD1WTk7QuVpW5jMh_xcGbAmg/exec";

// Helper to retrieve configured Sync Web App URL
function getGoogleSyncUrl() {
  return localStorage.getItem("google_sync_url") || DEFAULT_GOOGLE_SYNC_URL || "";
}


// Premium Level SVG Icons Generator Helper
function getLevelIconSvg(levelName, size = 20) {
  const name = String(levelName).toLowerCase();
  
  if (name === "bronze") {
    // Premium 3D-like Bronze Shield Badge
    return `<svg class="level-icon bronze" viewBox="0 0 24 24" width="${size}" height="${size}" style="pointer-events: none; filter: drop-shadow(0 2px 5px rgba(194,65,12,0.35));">
      <defs>
        <linearGradient id="grad-bronze-out-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b45309" />
          <stop offset="50%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#78350f" />
        </linearGradient>
        <linearGradient id="grad-bronze-in-${size}" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#78350f" />
          <stop offset="50%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#d97706" />
        </linearGradient>
      </defs>
      <!-- Outer Shield -->
      <path fill="url(#grad-bronze-out-${size})" d="M12 2L3 5v7c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-3z"/>
      <!-- Inner Shield Accent -->
      <path fill="url(#grad-bronze-in-${size})" d="M12 4L5.5 6.2v5.8c0 4.2 2.9 8.2 6.5 9.2 3.6-1 6.5-5 6.5-9.2V6.2L12 4z" opacity="0.95"/>
      <!-- Premium Center Star -->
      <polygon fill="#fff" points="12,7.5 13.5,10.6 17,10.9 14.5,13.3 15.1,16.8 12,15.1 8.9,16.8 9.5,13.3 7,10.9 10.5,10.6" opacity="0.95"/>
    </svg>`;
  } else if (name === "silver") {
    // Premium Chrome Silver Crest
    return `<svg class="level-icon silver" viewBox="0 0 24 24" width="${size}" height="${size}" style="pointer-events: none; filter: drop-shadow(0 2px 5px rgba(71,85,105,0.35));">
      <defs>
        <linearGradient id="grad-silver-out-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#64748b" />
          <stop offset="30%" stop-color="#94a3b8" />
          <stop offset="70%" stop-color="#cbd5e1" />
          <stop offset="100%" stop-color="#475569" />
        </linearGradient>
        <linearGradient id="grad-silver-in-${size}" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#334155" />
          <stop offset="50%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>
      </defs>
      <!-- Outer Circle Medal -->
      <circle cx="12" cy="12" r="11" fill="url(#grad-silver-out-${size})"/>
      <!-- Inner Design Circle -->
      <circle cx="12" cy="12" r="8.5" fill="url(#grad-silver-in-${size})"/>
      <!-- Premium Center Star -->
      <polygon fill="#475569" points="12,8.5 13.2,11 16,11.3 13.9,13.1 14.5,15.8 12,14.4 9.5,15.8 10.1,13.1 8,11.3 10.8,11" />
      <!-- Small Silver Accent Ring -->
      <circle cx="12" cy="12" r="5.5" fill="none" stroke="#ffffff" stroke-width="0.75" opacity="0.5"/>
    </svg>`;
  } else if (name === "gold") {
    // Premium Royal Crown Gold Badge
    return `<svg class="level-icon gold" viewBox="0 0 24 24" width="${size}" height="${size}" style="pointer-events: none; filter: drop-shadow(0 3px 6px rgba(202,138,4,0.45));">
      <defs>
        <linearGradient id="grad-gold-out-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#b45309" />
          <stop offset="40%" stop-color="#fbbf24" />
          <stop offset="70%" stop-color="#fef08a" />
          <stop offset="100%" stop-color="#92400e" />
        </linearGradient>
        <linearGradient id="grad-gold-in-${size}" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#78350f" />
          <stop offset="50%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#fef08a" />
        </linearGradient>
      </defs>
      <!-- Outer Shield -->
      <path fill="url(#grad-gold-out-${size})" d="M12 2L3 5v7c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-3z"/>
      <!-- Inner Shield Accent -->
      <path fill="url(#grad-gold-in-${size})" d="M12 4L5.5 6.2v5.8c0 4.2 2.9 8.2 6.5 9.2 3.6-1 6.5-5 6.5-9.2V6.2L12 4z" opacity="0.95"/>
      <!-- Premium Center Royal Crown -->
      <path fill="#ffffff" d="M7 16h10v-2.2l-2.2-2.5L12 13.8l-2.8-2.5L7 13.8V16zm5-7.5a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zm-4.5 1.5a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z"/>
    </svg>`;
  } else if (name === "diamond") {
    // Highly Faceted Glowing Diamond
    return `<svg class="level-icon diamond" viewBox="0 0 24 24" width="${size}" height="${size}" style="pointer-events: none;">
      <defs>
        <linearGradient id="grad-diamond-base-${size}" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1d4ed8" />
          <stop offset="50%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#60a5fa" />
        </linearGradient>
        <linearGradient id="grad-diamond-light-${size}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#dbeafe" />
          <stop offset="100%" stop-color="#93c5fd" />
        </linearGradient>
      </defs>
      <!-- Base Diamond Outer -->
      <path fill="url(#grad-diamond-base-${size})" d="M12 2L2 9l10 13 10-13L12 2z"/>
      <!-- Faceted Shimmers (Vibrant reflections) -->
      <polygon points="12,2 8.5,6.5 15.5,6.5" fill="url(#grad-diamond-light-${size})" opacity="0.9"/>
      <polygon points="2,9 8.5,6.5 12,2" fill="#93c5fd" opacity="0.6"/>
      <polygon points="22,9 15.5,6.5 12,2" fill="#ffffff" opacity="0.95"/>
      <polygon points="2,9 12,22 12,9.5 8.5,6.5" fill="#1e40af" opacity="0.7"/>
      <polygon points="22,9 12,22 12,9.5 15.5,6.5" fill="url(#grad-diamond-light-${size})" opacity="0.85"/>
      <polygon points="8.5,6.5 15.5,6.5 12,9.5" fill="#ffffff" opacity="0.8"/>
      <!-- Sparkle Stars -->
      <polygon points="19.5,3 20,4.2 21.2,4.5 20,4.8 19.5,6 19,4.8 17.8,4.5 19,4.2" fill="#ffffff"/>
      <polygon points="4.5,13.5 5,14.7 6.2,15 5,15.3 4.5,16.5 4,15.3 2.8,15 4,14.7" fill="#ffffff"/>
    </svg>`;
  }
  
  // Base Level (Sleek Circle Marker with dark/light glow)
  return `<svg class="level-icon base" viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" style="color: #64748b; pointer-events: none; filter: drop-shadow(0 1px 3px rgba(100,116,139,0.3));">
    <circle cx="12" cy="12" r="10" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
    <circle cx="12" cy="12" r="6" fill="#94a3b8"/>
  </svg>`;
}

// Helper to format currency (supports negative values elegantly)
function formatCurrency(amount) {
  const val = Number(amount) || 0;
  if (val < 0) {
    return `-₹${Math.abs(val).toLocaleString("en-IN")}`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
}

// Global Application State
let currentRole = "guest"; // guest | ambassador | admin
let currentUser = null;    // user object
let currentSection = "";   // active sub-section in dashboards

// Leaderboard state
let ambLeaderboardSearch = "";
let ambLeaderboardShowAll = false;
let admLeaderboardSearch = "";
let admLeaderboardShowAll = false;

// Chart.js Instances Manager
let chartReferralsTrendInstance = null;
let chartLeadsStatusInstance = null;
let chartCounselorPerformanceInstance = null;
let chartUniversityPerformanceInstance = null;

// DOM Elements Cache
const elApp = document.getElementById("app");
const elLoginView = document.getElementById("login-view");
const elAmbassadorView = document.getElementById("ambassador-view");
const elAdminView = document.getElementById("admin-view");

// View switcher
function switchView(viewId) {
  elLoginView.classList.remove("active");
  elAmbassadorView.classList.remove("active");
  elAdminView.classList.remove("active");
  
  if (viewId === "login") {
    elLoginView.classList.add("active");
    currentRole = "guest";
    currentUser = null;
    document.getElementById("login-form").reset();
    document.getElementById("login-error-msg").style.display = "none";
  } else if (viewId === "ambassador") {
    elAmbassadorView.classList.add("active");
    currentRole = "ambassador";
  } else if (viewId === "admin") {
    elAdminView.classList.add("active");
    currentRole = "admin";
  }

  // Refresh sidebar badges on view switch
  updateSidebarBadges();
}

// Sub-section switcher
function switchSection(sectionId) {
  // If role is ambassador, verify status remains active
  if (currentRole === "ambassador" && currentUser) {
    const stats = db.getAmbassadorStats(currentUser.id);
    if (stats && stats.ambassador.isActive === false) {
      alert("Your account is deactivated. Kindly contact support.");
      switchView("login");
      return;
    }
  }

  currentSection = sectionId;
  
  // Hide all sections in both dashboards
  document.querySelectorAll(".dashboard-section").forEach(s => {
    s.classList.remove("active");
  });
  
  // Show target section
  const targetSec = document.getElementById(sectionId);
  if (targetSec) targetSec.classList.add("active");
  
  // Update sidebar buttons active state
  document.querySelectorAll(".menu-item-btn").forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-section") === sectionId) {
      btn.classList.add("active");
    }
  });

  // Trigger content loading based on section
  if (sectionId === "amb-dashboard") renderAmbassadorDashboard();
  else if (sectionId === "amb-refer") populateReferralCounselorName();
  else if (sectionId === "amb-referrals") renderAmbassadorReferrals();
  else if (sectionId === "amb-payouts") renderAmbassadorPayouts();
  else if (sectionId === "amb-bank-details") renderAmbassadorBankDetails();
  else if (sectionId === "amb-profile") renderAmbassadorProfile();
  else if (sectionId === "amb-chat") renderAmbassadorChat();
  else if (sectionId === "adm-dashboard") renderAdminDashboard();
  else if (sectionId === "adm-directory") renderAdminDirectory();
  else if (sectionId === "adm-leads") renderAdminLeads();
  else if (sectionId === "adm-payouts") renderAdminPayouts();
  else if (sectionId === "adm-sync") renderAdminSync();
  else if (sectionId === "adm-chats") renderAdminChats();
  else if (sectionId === "adm-settings") renderAdminSettings();

  // Refresh sidebar badges on section switch
  updateSidebarBadges();

  // If role is admin, trigger auto-pull from Google Sheets in background (throttled)
  if (currentRole === "admin") {
    pullOnStartup();
  }
}

/* ==========================================================================
   AUTHENTICATION LOGIC
   ========================================================================== */

let loginTabRole = "ambassador"; // ambassador | admin

// Bind Login Tabs
document.getElementById("tab-ambassador").addEventListener("click", () => {
  loginTabRole = "ambassador";
  document.getElementById("tab-ambassador").classList.add("active");
  document.getElementById("tab-admin").classList.remove("active");
  document.getElementById("login-submit-btn").textContent = "Login as Ambassador";
  document.getElementById("login-submit-btn").className = "btn-primary";
});

document.getElementById("tab-admin").addEventListener("click", () => {
  loginTabRole = "admin";
  document.getElementById("tab-admin").classList.add("active");
  document.getElementById("tab-ambassador").classList.remove("active");
  document.getElementById("login-submit-btn").textContent = "Login as Admin";
  document.getElementById("login-submit-btn").className = "btn-primary btn-success";
});

// Bind Login Form Submit (ASYNC — calls backend API)
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const usernameVal = document.getElementById("login-username").value.trim();
  const passwordVal = document.getElementById("login-password").value.trim();
  const elError = document.getElementById("login-error-msg");
  const btnSubmit = document.getElementById("login-submit-btn");
  
  elError.style.display = "none";
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Logging in...";
  
  try {
    const res = await db.login(usernameVal, passwordVal, loginTabRole);
    
    if (res.success) {
      currentUser = res.user;
      currentRole = res.role;
      localStorage.setItem("currentRole", res.role);
      localStorage.setItem("currentUser", JSON.stringify(res.user));
      if (res.role === "admin") {
        switchView("admin");
        switchSection("adm-dashboard");
      } else {
        switchView("ambassador");
        switchSection("amb-dashboard");
        updateSidebarProfile();
      }
    } else {
      elError.textContent = res.message;
      elError.style.display = "block";
    }
  } catch (err) {
    elError.textContent = "Server connection failed. Please try again.";
    elError.style.display = "block";
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = loginTabRole === "admin" ? "Login as Admin" : "Login as Ambassador";
  }
});

// Bind Logouts
document.querySelectorAll(".btn-logout").forEach(btn => {
  btn.addEventListener("click", () => {
    db.addLog(currentRole === "admin" ? "Admin" : "Ambassador", "User logged out.");
    db.logout();
    currentUser = null;
    currentRole = null;
    switchView("login");
  });
});

// Bind Sidebar navigation
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const sectionId = e.currentTarget.getAttribute("data-section");
    switchSection(sectionId);
  });
});


/* ==========================================================================
   AMBASSADOR PORTAL RENDERING
   ========================================================================== */

function renderAmbassadorDashboard() {
  if (!currentUser) return;
  const stats = db.getAmbassadorStats(currentUser.id);
  if (!stats) return;

  // Refresh user object from database (holds latest stats)
  currentUser = stats.ambassador;
  updateSidebarProfile();
  
  // Setup Welcome text & Badge
  document.getElementById("amb-greeting-name").textContent = currentUser.name;
  
  const levelBadge = document.getElementById("amb-level-badge");
  levelBadge.className = `badge-level badge-${stats.levelInfo.name.toLowerCase()}`;
  levelBadge.innerHTML = `${getLevelIconSvg(stats.levelInfo.name, 20)} ${stats.levelInfo.name}`;

  // Setup KPI Cards
  document.getElementById("amb-stat-total-ref").textContent = stats.referrals.length;
  document.getElementById("amb-stat-admissions").textContent = stats.admissionsCount;
  document.getElementById("amb-stat-earnings").textContent = formatCurrency(stats.totalEarnings);
  document.getElementById("amb-stat-balance").textContent = formatCurrency(stats.balanceAvailable);

  // Journey timeline progression calculation
  const count = stats.admissionsCount;
  let progressPercentage = 0;
  let milestoneText = "";

  if (count < 3) {
    progressPercentage = (count / 3) * 25; // Base -> Bronze
    milestoneText = `${3 - count} more admissions needed to unlock Bronze Level`;
  } else if (count < 5) {
    progressPercentage = 25 + ((count - 3) / 2) * 25; // Bronze -> Silver
    milestoneText = `${5 - count} more admissions needed to unlock Silver Level`;
  } else if (count < 11) {
    progressPercentage = 50 + ((count - 5) / 6) * 25; // Silver -> Gold
    milestoneText = `${11 - count} more admissions needed to unlock Gold Level`;
  } else if (count < 20) {
    progressPercentage = 75 + ((count - 11) / 9) * 25; // Gold -> Diamond
    milestoneText = `${20 - count} more admissions needed to unlock Diamond Level`;
  } else {
    progressPercentage = 100;
    milestoneText = `Congratulations! You've unlocked the highest tier (Diamond level)`;
  }

  document.getElementById("amb-journey-bar").style.width = `${progressPercentage}%`;
  document.getElementById("amb-journey-info-text").textContent = milestoneText;

  // Render nodes states
  const levelsMapping = [
    { num: 0, minReq: 0, name: "Base" },
    { num: 1, minReq: 3, name: "Bronze" },
    { num: 2, minReq: 5, name: "Silver" },
    { num: 3, minReq: 11, name: "Gold" },
    { num: 4, minReq: 20, name: "Diamond" }
  ];

  levelsMapping.forEach(m => {
    const nodeEl = document.getElementById(`node-${m.num}`);
    nodeEl.className = "timeline-node";
    if (count >= m.minReq) {
      nodeEl.classList.add("unlocked");
    }
    if (stats.levelInfo.levelNum === m.num) {
      nodeEl.classList.add("current");
    }
    // Set level icon inside journey timeline node dot
    const dotEl = nodeEl.querySelector(".node-dot");
    if (dotEl) {
      dotEl.innerHTML = getLevelIconSvg(m.name, 24);
    }
  });

  // Render Tiers Grid details under timeline
  const allLevels = [
    { num: 1, name: "Bronze", req: "3 Admissions", bonus: "No Bonus", rewards: ["Welcome Kit", "Bronze Certificate", "LinkedIn Connect"] },
    { num: 2, name: "Silver", req: "5 Admissions", bonus: "₹5,000 Bonus", rewards: ["Silver Certificate", "LinkedIn / Social Recognition"] },
    { num: 3, name: "Gold", req: "11 Admissions", bonus: "₹11,000 Bonus", rewards: ["Gold Certificate", "Premium Recognition"] },
    { num: 4, name: "Diamond", req: "20 Admissions", bonus: "₹25,000 Bonus", rewards: ["Certificates & Trophy", "Annual Meet with Celebrity"] }
  ];

  let tiersGridHtml = "";
  allLevels.forEach(lvl => {
    let cardClass = "tier-detail-card";
    if (stats.levelInfo.levelNum === lvl.num) cardClass += " current";
    else if (stats.levelInfo.levelNum > lvl.num) cardClass += " active";

    const rewardsItems = lvl.rewards.map(r => `
      <li>
        <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
        ${r}
      </li>
    `).join("");

    tiersGridHtml += `
      <div class="${cardClass}">
        <div class="tier-title-row">
          <span class="tier-name" style="display: inline-flex; align-items: center; gap: 6px;">
            ${getLevelIconSvg(lvl.name, 32)}
            ${lvl.name}
          </span>
          <span class="tier-admissions-req">${lvl.req}</span>
        </div>
        <div style="font-weight: 700; font-size: 13px; color: var(--success-color);">${lvl.bonus}</div>
        <ul class="tier-rewards-list">
          ${rewardsItems}
        </ul>
      </div>
    `;
  });
  document.getElementById("amb-tiers-grid-list").innerHTML = tiersGridHtml;
  renderAmbassadorRankBoard();
  
  // Check for pending congratulations/appreciation popups
  checkPendingAmbassadorNotifications();
  renderAnnouncements();
}

function renderAmbassadorRankBoard() {
  renderLeaderboard("amb-leaderboard-podium", "amb-leaderboard-list", ambLeaderboardSearch, ambLeaderboardShowAll, true);
}

function renderLeaderboard(podiumContainerId, listContainerId, filterText, showAll, isAmbassadorMode) {
  const ambassadors = db.getAmbassadors();
  
  // Compute stats for all ambassadors
  const list = ambassadors.map(a => {
    const stats = db.getAmbassadorStats(a.id);
    return {
      id: a.id,
      name: a.name,
      admissionsCount: stats.admissionsCount,
      levelName: stats.levelInfo.name,
      profilePhoto: a.profilePhoto
    };
  });

  // Sort: admissionsCount descending, then name ascending
  list.sort((a, b) => {
    if (b.admissionsCount !== a.admissionsCount) {
      return b.admissionsCount - a.admissionsCount;
    }
    return a.name.localeCompare(b.name);
  });

  const podiumEl = document.getElementById(podiumContainerId);
  const listEl = document.getElementById(listContainerId);
  
  if (!listEl) return;

  // Find user's rank
  if (isAmbassadorMode && currentUser) {
    const userRankIdx = list.findIndex(a => a.id === currentUser.id);
    const userRank = userRankIdx !== -1 ? userRankIdx + 1 : "N/A";
    
    let rankMedal = "";
    if (userRank === 1) rankMedal = "🥇 ";
    else if (userRank === 2) rankMedal = "🥈 ";
    else if (userRank === 3) rankMedal = "🥉 ";
    
    const userRankEl = document.getElementById("amb-dashboard-user-rank");
    if (userRankEl) {
      userRankEl.innerHTML = `Your Rank: <strong>${rankMedal}#${userRank}</strong>`;
    }
  }

  // Handle Search Filtering
  const query = String(filterText || "").toLowerCase().trim();
  const filteredList = list.filter(item => {
    return item.name.toLowerCase().includes(query) || item.id.toLowerCase().includes(query);
  });

  // RENDER PODIUM (only if search is empty)
  if (podiumEl) {
    if (query !== "") {
      podiumEl.style.display = "none";
    } else {
      podiumEl.style.display = "flex";
      
      // Top 3 for podium
      const top3 = list.slice(0, 3);
      const podiumColumnsOrder = [];
      if (top3[1]) podiumColumnsOrder.push({ item: top3[1], place: "second", rankNum: 2, medal: "🥈" });
      if (top3[0]) podiumColumnsOrder.push({ item: top3[0], place: "first", rankNum: 1, medal: "🥇" });
      if (top3[2]) podiumColumnsOrder.push({ item: top3[2], place: "third", rankNum: 3, medal: "🥉" });
      
      podiumEl.innerHTML = podiumColumnsOrder.map(col => {
        const item = col.item;
        const isSelf = isAmbassadorMode && currentUser && item.id === currentUser.id;
        
        let avatarHtml = "";
        if (item.profilePhoto) {
          avatarHtml = `<img src="${item.profilePhoto}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid white;" />`;
        } else {
          const initials = item.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
          avatarHtml = `<div class="profile-avatar" style="width: 54px; height: 54px; font-size: 16px; background: ${isSelf ? 'var(--primary-color)' : '#64748b'}; color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 700; border: 2px solid white;">${initials}</div>`;
        }

        const crownHtml = col.place === "first" 
          ? `<div class="podium-crown">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
                 <path d="M2 18h20v2H2zm2-2l2-7 4 3 4-7 4 7 4-3 2 7H4z"/>
               </svg>
             </div>` 
          : "";

        return `
          <div class="podium-column ${col.place}">
            <div class="podium-avatar-wrapper">
              ${crownHtml}
              ${avatarHtml}
              <div class="podium-medal">${col.medal}</div>
            </div>
            <div class="podium-name">${item.name}</div>
            <div class="podium-stand">
              <span class="stand-rank">${col.rankNum}</span>
              <span class="stand-admissions">${item.admissionsCount} Adm.</span>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // RENDER LIST
  const maxAdmissions = list.length > 0 ? list[0].admissionsCount : 1;
  const maxCountVal = maxAdmissions > 0 ? maxAdmissions : 1;
  
  // Decide range to show
  let displayList = filteredList;
  if (!showAll && query === "") {
    // If not showing all, display ranks 4 and below in lists up to 10
    displayList = filteredList.slice(3, 10);
  } else if (query === "") {
    // Show all ranks 4 and below
    displayList = filteredList.slice(3);
  }

  if (displayList.length === 0) {
    listEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px 0;">No matching ambassadors found.</div>`;
    return;
  }

  listEl.innerHTML = displayList.map(item => {
    const absoluteRank = list.findIndex(x => x.id === item.id) + 1;
    const isSelf = isAmbassadorMode && currentUser && item.id === currentUser.id;
    const rowClass = isSelf ? "leaderboard-row highlighted" : "leaderboard-row";
    
    let avatarHtml = "";
    if (item.profilePhoto) {
      avatarHtml = `<img src="${item.profilePhoto}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;" />`;
    } else {
      const initials = item.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
      avatarHtml = `<div class="profile-avatar" style="width: 38px; height: 38px; font-size: 12px; background: ${isSelf ? 'var(--primary-color)' : '#64748b'}; color: white; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 700;">${initials}</div>`;
    }

    const pct = Math.round((item.admissionsCount / maxCountVal) * 100);
    const levelClass = item.levelName.toLowerCase();

    return `
      <div class="${rowClass}">
        <div class="leaderboard-rank-badge">#${absoluteRank}</div>
        ${avatarHtml}
        <div class="leaderboard-row-progress-wrapper">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: 700; font-size: 13px; color: var(--text-main); display: flex; align-items: center; gap: 6px; text-align: left;">
              ${item.name} ${isSelf ? '<small style="color: var(--primary-color); font-weight:800;">(You)</small>' : ''}
              <span class="badge-level badge-${levelClass}" style="font-size: 9px; padding: 1px 6px; margin: 0; display: inline-flex; align-items: center; gap: 2px;">
                ${getLevelIconSvg(item.levelName, 10)} ${item.levelName}
              </span>
            </div>
            <div style="font-weight: 800; font-size: 12px; color: var(--text-main); text-align: right;">${item.admissionsCount} admissions</div>
          </div>
          <div class="leaderboard-progress-bar-container">
            <div class="leaderboard-progress-bar-fill ${levelClass}" style="width: ${pct}%;"></div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function initLeaderboardListeners() {
  // Ambassador Dashboard Leaderboard Controls
  const ambSearch = document.getElementById("amb-leaderboard-search");
  const ambTop10Btn = document.getElementById("btn-toggle-amb-top10");
  const ambAllBtn = document.getElementById("btn-toggle-amb-all");

  if (ambSearch) {
    ambSearch.addEventListener("input", (e) => {
      ambLeaderboardSearch = e.target.value;
      renderLeaderboard("amb-leaderboard-podium", "amb-leaderboard-list", ambLeaderboardSearch, ambLeaderboardShowAll, true);
    });
  }

  if (ambTop10Btn && ambAllBtn) {
    ambTop10Btn.addEventListener("click", () => {
      ambLeaderboardShowAll = false;
      ambTop10Btn.style.background = "var(--primary-glow)";
      ambTop10Btn.style.color = "var(--primary-color)";
      ambAllBtn.style.background = "rgba(0,0,0,0.03)";
      ambAllBtn.style.color = "var(--text-muted)";
      renderLeaderboard("amb-leaderboard-podium", "amb-leaderboard-list", ambLeaderboardSearch, ambLeaderboardShowAll, true);
    });

    ambAllBtn.addEventListener("click", () => {
      ambLeaderboardShowAll = true;
      ambAllBtn.style.background = "var(--primary-glow)";
      ambAllBtn.style.color = "var(--primary-color)";
      ambTop10Btn.style.background = "rgba(0,0,0,0.03)";
      ambTop10Btn.style.color = "var(--text-muted)";
      renderLeaderboard("amb-leaderboard-podium", "amb-leaderboard-list", ambLeaderboardSearch, ambLeaderboardShowAll, true);
    });
  }

  // Admin Dashboard Leaderboard Controls
  const admSearch = document.getElementById("adm-leaderboard-search");
  const admTop10Btn = document.getElementById("btn-toggle-adm-top10");
  const admAllBtn = document.getElementById("btn-toggle-adm-all");

  if (admSearch) {
    admSearch.addEventListener("input", (e) => {
      admLeaderboardSearch = e.target.value;
      renderLeaderboard("adm-leaderboard-podium", "adm-leaderboard-list", admLeaderboardSearch, admLeaderboardShowAll, false);
    });
  }

  if (admTop10Btn && admAllBtn) {
    admTop10Btn.addEventListener("click", () => {
      admLeaderboardShowAll = false;
      admTop10Btn.style.background = "var(--primary-glow)";
      admTop10Btn.style.color = "var(--primary-color)";
      admAllBtn.style.background = "rgba(0,0,0,0.03)";
      admAllBtn.style.color = "var(--text-muted)";
      renderLeaderboard("adm-leaderboard-podium", "adm-leaderboard-list", admLeaderboardSearch, admLeaderboardShowAll, false);
    });

    admAllBtn.addEventListener("click", () => {
      admLeaderboardShowAll = true;
      admAllBtn.style.background = "var(--primary-glow)";
      admAllBtn.style.color = "var(--primary-color)";
      admTop10Btn.style.background = "rgba(0,0,0,0.03)";
      admTop10Btn.style.color = "var(--text-muted)";
      renderLeaderboard("adm-leaderboard-podium", "adm-leaderboard-list", admLeaderboardSearch, admLeaderboardShowAll, false);
    });
  }
}

function populateReferralCounselorName() {
  if (currentUser) {
    const counselorEl = document.getElementById("amb-ref-counselor");
    if (counselorEl) {
      counselorEl.value = currentUser.counselorName || "Unassigned Counselor";
    }
  }
}

// Ambassador Submission Form
const refUniEl = document.getElementById("amb-ref-university");
const refCourseEl = document.getElementById("amb-ref-course");

if (refUniEl && refCourseEl) {
  const uniCourses = {
    "LPU": ["BCA", "BA", "BBA", "MBA", "MCA", "MSC", "MCOM"],
    "Amity": ["BCA", "BA", "BBA", "MBA", "MCA", "MSC", "MCOM"],
    "MUJ": ["BBA", "BCA", "BCom", "MBA", "MCA", "MSc", "MA", "MCom", "MAJMC"],
    "GLA": ["BBA", "BCA", "BCom", "MBA", "MCA"],
    "SMU": ["BBA", "BA", "BCom", "MA", "MBA", "MCA", "MCom"]
  };

  refUniEl.addEventListener("change", (e) => {
    const selectedUni = e.target.value;
    const courses = uniCourses[selectedUni] || [];
    
    refCourseEl.innerHTML = `<option value="" disabled selected>Select Course</option>` + 
      courses.map(c => `<option value="${c}">${c}</option>`).join("");
    
    refCourseEl.disabled = false;
  });
}

// Bind WhatsApp screenshot change listener in Referral Form
const elWhatsappScreenshotInput = document.getElementById("amb-ref-whatsapp-screenshot");
const elWhatsappScreenshotPreviewContainer = document.getElementById("whatsapp-screenshot-preview-container");
const elWhatsappScreenshotLabelText = document.getElementById("whatsapp-screenshot-label-text");
let whatsappScreenshotBase64 = "";

if (elWhatsappScreenshotInput && elWhatsappScreenshotPreviewContainer && elWhatsappScreenshotLabelText) {
  elWhatsappScreenshotInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      whatsappScreenshotBase64 = "";
      elWhatsappScreenshotPreviewContainer.style.display = "none";
      elWhatsappScreenshotLabelText.textContent = "Upload Screenshot";
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      elWhatsappScreenshotInput.value = "";
      whatsappScreenshotBase64 = "";
      elWhatsappScreenshotPreviewContainer.style.display = "none";
      elWhatsappScreenshotLabelText.textContent = "Upload Screenshot";
      return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Image size should be less than 1.5MB to submit reference successfully.");
      elWhatsappScreenshotInput.value = "";
      whatsappScreenshotBase64 = "";
      elWhatsappScreenshotPreviewContainer.style.display = "none";
      elWhatsappScreenshotLabelText.textContent = "Upload Screenshot";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      whatsappScreenshotBase64 = event.target.result;
      elWhatsappScreenshotPreviewContainer.style.display = "block";
      elWhatsappScreenshotLabelText.textContent = file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name;
    };
    reader.readAsDataURL(file);
  });
}

document.getElementById("amb-referral-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return;
  
  const refData = {
    name: document.getElementById("amb-ref-name").value.trim(),
    mobile: document.getElementById("amb-ref-mobile").value.trim(),
    email: document.getElementById("amb-ref-email").value.trim(),
    course: document.getElementById("amb-ref-course").value,
    university: document.getElementById("amb-ref-university").value,
    studyMode: document.getElementById("amb-ref-mode").value,
    paymentType: document.getElementById("amb-ref-payment").value,
    counselorName: document.getElementById("amb-ref-counselor").value,
    whatsappScreenshot: whatsappScreenshotBase64
  };

  db.submitReferral(currentUser.id, refData);
  
  document.getElementById("amb-referral-form").reset();
  if (refCourseEl) {
    refCourseEl.innerHTML = `<option value="" disabled selected>Select Course</option>`;
    refCourseEl.disabled = true;
  }
  
  // Clear WhatsApp proof state
  whatsappScreenshotBase64 = "";
  if (elWhatsappScreenshotPreviewContainer) {
    elWhatsappScreenshotPreviewContainer.style.display = "none";
  }
  if (elWhatsappScreenshotLabelText) {
    elWhatsappScreenshotLabelText.textContent = "Upload Screenshot";
  }
  
  // Re-populate counselor name as form reset clears it
  populateReferralCounselorName();

  const msgEl = document.getElementById("amb-refer-success-msg");
  msgEl.style.display = "flex";
  setTimeout(() => {
    msgEl.style.display = "none";
  }, 5000);
});

// Render Ambassador referrals list
function renderAmbassadorReferrals() {
  if (!currentUser) return;
  const stats = db.getAmbassadorStats(currentUser.id);
  if (!stats) return;

  const tableBody = document.getElementById("amb-referrals-table-body");
  
  if (stats.referrals.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No referrals submitted yet. Click "Refer Student" to get started!</td></tr>`;
    return;
  }

  tableBody.innerHTML = stats.referrals.map(r => {
    const formattedDate = new Date(r.dateSubmitted).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
    
    const rewardAmount = db.calculateReferralReward(r);
    const rewardFormatted = formatCurrency(rewardAmount);

    // Separate student-level payout status mapping
    let payoutStatusHtml = "";
    if (r.status === "Pending") {
      payoutStatusHtml = `<span class="status-pill" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;">${rewardFormatted} (Pending Admission)</span>`;
    } else if (r.status === "Rejected") {
      payoutStatusHtml = `<span class="status-pill rejected" style="border: 1px solid #fca5a5;">₹0 (Rejected)</span>`;
    } else if (r.status === "Enrolled") {
      if (r.payoutStatus === "Paid") {
        payoutStatusHtml = `<span class="status-pill paid" style="border: 1px solid #bfdbfe; font-weight: 700;">${rewardFormatted} (Wallet Credited)</span>`;
      } else {
        const timestamp = r.enrollmentTimestamp || new Date(r.dateSubmitted).getTime();
        payoutStatusHtml = `
          <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
            <span class="status-pill pending" style="border: 1px solid #fdba74; font-size: 11px;">${rewardFormatted} (Unpaid)</span>
            <span class="payout-countdown" data-timestamp="${timestamp}" style="font-size: 11px; font-weight: 600; font-family: monospace; color: #ea580c;">Calculating...</span>
          </div>
        `;
      }
    }
    
    return `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.studentName}</td>
        <td>${r.studentMobile}</td>
        <td>
          ${r.courseInterest} (${r.studyMode || 'Regular'})<br/>
          <small style="color: var(--text-muted);">${r.university || 'N/A'}</small><br/>
          <span style="font-size: 10px; background: rgba(99, 102, 241, 0.08); color: var(--primary-color); padding: 1px 4px; border-radius: 3px; font-weight: 600; display: inline-block; margin-top: 2px;">
            ${r.paymentType || 'Annual'}
          </span>
        </td>
        <td>${formattedDate}</td>
        <td><span class="status-pill ${r.status.toLowerCase()}">${r.status}</span></td>
        <td>${payoutStatusHtml}</td>
      </tr>
    `;
  }).join("");

  // Start the live countdown ticker for referred rewards
  startPayoutCountdownTicker();
}

function renderAmbassadorPayouts() {
  if (!currentUser) return;
  const stats = db.getAmbassadorStats(currentUser.id);
  if (!stats) return;

  const unrequestedBalance = stats.balanceAvailable;
  document.getElementById("amb-payout-balance-display").textContent = formatCurrency(unrequestedBalance);
  document.getElementById("amb-payout-amount").max = unrequestedBalance;

  // Render pending and total unpaid earnings
  document.getElementById("amb-payout-pending-display").textContent = formatCurrency(stats.totalPending);
  document.getElementById("amb-payout-total-unpaid-display").textContent = formatCurrency(stats.balanceAvailable);

  const tableBody = document.getElementById("amb-payouts-table-body");
  const payoutsList = (stats.ambassador.payouts || []).filter(p => p.status !== "Rejected");

  if (payoutsList.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No payout transfers requested yet.</td></tr>`;
    return;
  }

  tableBody.innerHTML = payoutsList.slice().reverse().map(p => {
    let receiptHtml = "";
    if (p.status === "Paid") {
      receiptHtml = `
        <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
          <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">UTR: ${p.utrNumber || 'N/A'}</span>
          <button class="btn-primary btn-view-receipt" data-amb="${currentUser.id}" data-pay="${p.id}" style="padding: 4px 8px; font-size: 11px; width: auto; background: var(--primary-color);">View Receipt</button>
        </div>
      `;
    } else {
      receiptHtml = `<span style="color: var(--text-muted); font-size: 12px;">N/A</span>`;
    }

    return `
      <tr>
        <td><strong>${p.id}</strong></td>
        <td>${p.date}</td>
        <td><strong>${formatCurrency(p.amount)}</strong></td>
        <td><span class="status-pill ${p.status.toLowerCase()}">${p.status}</span></td>
        <td>${receiptHtml}</td>
      </tr>
    `;
  }).join("");

  // Bind click listeners for Ambassador view receipt
  tableBody.querySelectorAll(".btn-view-receipt").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const ambId = e.currentTarget.getAttribute("data-amb");
      const payId = e.currentTarget.getAttribute("data-pay");
      openReceiptModal(ambId, payId);
    });
  });
}

// Handle payout request submit
document.getElementById("amb-payout-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const amountInput = document.getElementById("amb-payout-amount");
  const amount = parseInt(amountInput.value, 10);
  const msgEl = document.getElementById("amb-payout-msg");

  const res = db.requestPayout(currentUser.id, amount);
  amountInput.value = "";
  
  if (res.success) {
    msgEl.textContent = `Payout of ₹${amount} requested successfully. Wait for admin approval.`;
    msgEl.className = "alert-info-box";
    msgEl.style.display = "flex";
    msgEl.style.borderLeftColor = "var(--success-color)";
    renderAmbassadorPayouts();
  } else {
    msgEl.textContent = res.message;
    msgEl.className = "alert-info-box";
    msgEl.style.display = "flex";
    msgEl.style.borderLeftColor = "#ef4444";
  }

  setTimeout(() => {
    msgEl.style.display = "none";
  }, 4000);
});


/* ==========================================================================
   AMBASSADOR BANK DETAILS LOGIC & UPLOADS
   ========================================================================== */

const elBankPassbookInput = document.getElementById("amb-bank-passbook");
const elBankPassbookPreview = document.getElementById("bank-passbook-preview");
const elBankPassbookContainer = document.getElementById("bank-passbook-preview-container");
const elBankPassbookRemove = document.getElementById("btn-remove-passbook");

const elUpiQrInput = document.getElementById("amb-upi-qr");
const elUpiQrPreview = document.getElementById("upi-qr-preview");
const elUpiQrContainer = document.getElementById("upi-qr-preview-container");
const elUpiQrRemove = document.getElementById("btn-remove-upi-qr");

function handleImageUpload(inputEl, previewEl, containerEl) {
  inputEl.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      inputEl.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      previewEl.src = event.target.result;
      containerEl.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}

// Bind file uploads
if (elBankPassbookInput && elBankPassbookPreview && elBankPassbookContainer) {
  handleImageUpload(elBankPassbookInput, elBankPassbookPreview, elBankPassbookContainer);
}
if (elUpiQrInput && elUpiQrPreview && elUpiQrContainer) {
  handleImageUpload(elUpiQrInput, elUpiQrPreview, elUpiQrContainer);
}

// Bind remove image buttons
if (elBankPassbookRemove) {
  elBankPassbookRemove.addEventListener("click", () => {
    elBankPassbookInput.value = "";
    elBankPassbookPreview.src = "";
    elBankPassbookContainer.style.display = "none";
  });
}
if (elUpiQrRemove) {
  elUpiQrRemove.addEventListener("click", () => {
    elUpiQrInput.value = "";
    elUpiQrPreview.src = "";
    elUpiQrContainer.style.display = "none";
  });
}

// Populate bank and UPI fields
function renderAmbassadorBankDetails() {
  if (!currentUser) return;
  const ambassadors = db.getAmbassadors();
  const amb = ambassadors.find(a => a.id === currentUser.id);
  if (!amb) return;

  document.getElementById("amb-bank-name").value = amb.bankName || "";
  document.getElementById("amb-bank-holder").value = amb.bankHolderName || "";
  document.getElementById("amb-bank-number").value = amb.bankAccountNumber || "";
  document.getElementById("amb-bank-ifsc").value = amb.bankIfsc || "";
  
  if (amb.bankPassbookPhoto) {
    elBankPassbookPreview.src = amb.bankPassbookPhoto;
    elBankPassbookContainer.style.display = "block";
  } else {
    elBankPassbookPreview.src = "";
    elBankPassbookContainer.style.display = "none";
    elBankPassbookInput.value = "";
  }

  document.getElementById("amb-upi-id").value = amb.upiId || "";

  if (amb.upiQrPhoto) {
    elUpiQrPreview.src = amb.upiQrPhoto;
    elUpiQrContainer.style.display = "block";
  } else {
    elUpiQrPreview.src = "";
    elUpiQrContainer.style.display = "none";
    elUpiQrInput.value = "";
  }
}

// Form submit handler
document.getElementById("amb-bank-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!currentUser) return;

  const details = {
    bankName: document.getElementById("amb-bank-name").value.trim(),
    bankHolderName: document.getElementById("amb-bank-holder").value.trim(),
    bankAccountNumber: document.getElementById("amb-bank-number").value.trim(),
    bankIfsc: document.getElementById("amb-bank-ifsc").value.trim(),
    bankPassbookPhoto: elBankPassbookPreview.src && elBankPassbookPreview.src.startsWith("data:image") ? elBankPassbookPreview.src : null,
    upiId: document.getElementById("amb-upi-id").value.trim(),
    upiQrPhoto: elUpiQrPreview.src && elUpiQrPreview.src.startsWith("data:image") ? elUpiQrPreview.src : null
  };

  db.updateAmbassadorBankDetails(currentUser.id, details);

  const successMsg = document.getElementById("amb-bank-success-msg");
  successMsg.style.display = "flex";
  setTimeout(() => {
    successMsg.style.display = "none";
  }, 4000);
});


/* ==========================================================================
   AMBASSADOR MY PROFILE LOGIC & PASSWORD TOGGLE
   ========================================================================== */

function renderAmbassadorProfile() {
  if (!currentUser) return;
  const stats = db.getAmbassadorStats(currentUser.id);
  if (!stats) return;
  const amb = stats.ambassador;

  // Render vertical ID card
  document.getElementById("amb-profile-card-name").textContent = amb.name;
  document.getElementById("amb-profile-card-id").textContent = `ID: ${amb.id}`;
  
  // Render avatar: image or initials
  const avatarCardEl = document.getElementById("amb-profile-card-avatar");
  if (avatarCardEl) {
    if (amb.profilePhoto) {
      avatarCardEl.innerHTML = `<img src="${amb.profilePhoto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
    } else {
      const initials = amb.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
      avatarCardEl.textContent = initials;
    }
  }
  
  const joinedDate = new Date(amb.dateCreated).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  document.getElementById("amb-profile-card-joined").textContent = joinedDate;

  // Render level variables on card for premium custom style glow
  const levelName = stats.levelInfo.name.toLowerCase();
  let levelColor = "#64748b";
  let levelGlow = "rgba(100, 116, 139, 0.15)";
  
  if (levelName === "bronze") {
    levelColor = "#ea580c";
    levelGlow = "rgba(234, 88, 12, 0.25)";
  } else if (levelName === "silver") {
    levelColor = "#475569";
    levelGlow = "rgba(71, 85, 105, 0.25)";
  } else if (levelName === "gold") {
    levelColor = "#ca8a04";
    levelGlow = "rgba(202, 138, 4, 0.35)";
  } else if (levelName === "diamond") {
    levelColor = "#2563eb";
    levelGlow = "rgba(37, 99, 235, 0.4)";
  }
  
  const cardEl = document.getElementById("amb-profile-card");
  if (cardEl) {
    cardEl.style.setProperty("--level-color", levelColor);
    cardEl.style.setProperty("--level-glow", levelGlow);
  }

  // Render glowing large level icon
  const largeIconEl = document.getElementById("amb-profile-level-icon-large");
  if (largeIconEl) {
    largeIconEl.innerHTML = getLevelIconSvg(stats.levelInfo.name, 48);
  }

  const profileBadge = document.getElementById("amb-profile-card-badge");
  profileBadge.className = `badge-level badge-${stats.levelInfo.name.toLowerCase()}`;
  profileBadge.innerHTML = `${getLevelIconSvg(stats.levelInfo.name, 20)} ${stats.levelInfo.name}`;

  // Render details grids
  document.getElementById("amb-profile-univ").textContent = amb.university;
  document.getElementById("amb-profile-course").textContent = amb.course;
  document.getElementById("amb-profile-enroll").textContent = amb.enrollmentNumber;
  document.getElementById("amb-profile-counselor").textContent = amb.counselorName;

  document.getElementById("amb-profile-father").textContent = amb.fatherName;
  document.getElementById("amb-profile-mobile").textContent = `+91 ${amb.mobile}`;
  document.getElementById("amb-profile-email").textContent = amb.email;
  document.getElementById("amb-profile-username").textContent = amb.username;
  
  const passInput = document.getElementById("amb-profile-password-input");
  passInput.value = amb.password;
  passInput.type = "password"; // hide by default
  
  // reset toggle icon to hidden state SVG
  const eyeBtnSvg = document.getElementById("svg-toggle-profile-pass-eye");
  eyeBtnSvg.innerHTML = `<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>`;
}

// Bind password toggle
document.getElementById("btn-toggle-profile-pass").addEventListener("click", () => {
  const passInput = document.getElementById("amb-profile-password-input");
  const eyeBtnSvg = document.getElementById("svg-toggle-profile-pass-eye");
  if (passInput.type === "password") {
    passInput.type = "text";
    // Eye-off SVG
    eyeBtnSvg.innerHTML = `<path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L3 3m12 12l6 6M21 12a9 9 0 01-1.562 3.03M21.543 12c-1.274-4.057-5.064-7-9.543-7a10.05 10.05 0 00-1.875.175"/>`;
  } else {
    passInput.type = "password";
    // Eye SVG
    eyeBtnSvg.innerHTML = `<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>`;
  }
});


/* ==========================================================================
   ADMIN PORTAL RENDERING
   ========================================================================== */

let searchFilter = "";
let historySearchFilter = "";
let historyTypeFilter = "All";

// Search filter binding
document.getElementById("adm-directory-search").addEventListener("input", (e) => {
  searchFilter = e.target.value.toLowerCase().trim();
  renderAdminDirectory();
});

// Payout History search and filter bindings
document.getElementById("adm-history-search").addEventListener("input", (e) => {
  historySearchFilter = e.target.value.toLowerCase().trim();
  renderAdminPayouts();
});

document.getElementById("adm-history-filter-type").addEventListener("change", (e) => {
  historyTypeFilter = e.target.value;
  renderAdminPayouts();
});

// Payout & Balances Category Tabs bindings
const tabBalances = document.getElementById("payout-tab-balances");
const tabHistory = document.getElementById("payout-tab-history");
const cardBalances = document.getElementById("adm-balances-card");
const cardHistory = document.getElementById("adm-history-card");

if (tabBalances && tabHistory && cardBalances && cardHistory) {
  tabBalances.addEventListener("click", () => {
    tabBalances.classList.add("active");
    tabHistory.classList.remove("active");
    cardBalances.style.display = "block";
    cardHistory.style.display = "none";
  });

  tabHistory.addEventListener("click", () => {
    tabHistory.classList.add("active");
    tabBalances.classList.remove("active");
    cardHistory.style.display = "block";
    cardBalances.style.display = "none";
  });
}

// Timeframe filter binding
const dashboardTimeframeEl = document.getElementById("adm-dashboard-timeframe");
if (dashboardTimeframeEl) {
  dashboardTimeframeEl.addEventListener("change", (e) => {
    const val = e.target.value;
    const wrapper = document.getElementById("adm-custom-date-wrapper");
    if (wrapper) {
      if (val === "custom") {
        wrapper.style.display = "flex";
      } else {
        wrapper.style.display = "none";
      }
    }
    renderAdminDashboard();
  });
}

const customStartEl = document.getElementById("adm-custom-start-date");
const customEndEl = document.getElementById("adm-custom-end-date");
if (customStartEl) {
  customStartEl.addEventListener("change", () => {
    renderAdminDashboard();
  });
}
if (customEndEl) {
  customEndEl.addEventListener("change", () => {
    renderAdminDashboard();
  });
}

// Collapsible detailed panels drawer
const dashboardDetailsBtn = document.getElementById("btn-toggle-dashboard-details");
const dashboardDetailsPanel = document.getElementById("dashboard-details-panel");
const dashboardChevronEl = document.getElementById("svg-toggle-details-chevron");

if (dashboardDetailsBtn && dashboardDetailsPanel && dashboardChevronEl) {
  dashboardDetailsBtn.addEventListener("click", () => {
    const isHidden = dashboardDetailsPanel.style.display === "none" || dashboardDetailsPanel.style.display === "";
    if (isHidden) {
      dashboardDetailsPanel.style.display = "grid";
      dashboardChevronEl.style.transform = "rotate(180deg)";
    } else {
      dashboardDetailsPanel.style.display = "none";
      dashboardChevronEl.style.transform = "rotate(0deg)";
    }
  });
}

// Render Admin Dashboard
function renderAdminDashboard() {
  const ambassadors = db.getAmbassadors();
  const referrals = db.getReferrals();

  // Read Timeframe filter
  const timeframeEl = document.getElementById("adm-dashboard-timeframe");
  const timeframe = timeframeEl ? timeframeEl.value : "all";

  // Filter datasets based on timeframe
  let filteredAmbassadors = ambassadors;
  let filteredReferrals = referrals;
  
  let limitMs = 0;
  let prevLimitMs = 0;
  let isCustom = false;
  let startMs = 0;
  let endMs = 0;
  const now = Date.now();

  if (timeframe === "month") {
    limitMs = 30 * 24 * 60 * 60 * 1000;
    prevLimitMs = 60 * 24 * 60 * 60 * 1000;
  } else if (timeframe === "week") {
    limitMs = 7 * 24 * 60 * 60 * 1000;
    prevLimitMs = 14 * 24 * 60 * 60 * 1000;
  } else if (timeframe === "quarterly") {
    limitMs = 90 * 24 * 60 * 60 * 1000;
    prevLimitMs = 180 * 24 * 60 * 60 * 1000;
  } else if (timeframe === "halfyear") {
    limitMs = 180 * 24 * 60 * 60 * 1000;
    prevLimitMs = 360 * 24 * 60 * 60 * 1000;
  } else if (timeframe === "annual") {
    limitMs = 365 * 24 * 60 * 60 * 1000;
    prevLimitMs = 730 * 24 * 60 * 60 * 1000;
  } else if (timeframe === "custom") {
    isCustom = true;
    const startVal = document.getElementById("adm-custom-start-date")?.value;
    const endVal = document.getElementById("adm-custom-end-date")?.value;
    if (startVal) {
      startMs = new Date(startVal).getTime();
    }
    if (endVal) {
      endMs = new Date(endVal).getTime() + 24 * 60 * 60 * 1000 - 1; // include full end day
    }
  }

  if (isCustom) {
    filteredAmbassadors = ambassadors.filter(a => {
      const dateVal = new Date(a.dateCreated).getTime();
      const afterStart = !startMs || dateVal >= startMs;
      const beforeEnd = !endMs || dateVal <= endMs;
      return afterStart && beforeEnd;
    });
    filteredReferrals = referrals.filter(r => {
      const dateVal = new Date(r.dateSubmitted).getTime();
      const afterStart = !startMs || dateVal >= startMs;
      const beforeEnd = !endMs || dateVal <= endMs;
      return afterStart && beforeEnd;
    });
  } else if (limitMs > 0) {
    filteredAmbassadors = ambassadors.filter(a => {
      const dateVal = new Date(a.dateCreated).getTime();
      return dateVal >= (now - limitMs);
    });
    filteredReferrals = referrals.filter(r => {
      const dateVal = new Date(r.dateSubmitted).getTime();
      return dateVal >= (now - limitMs);
    });
  }

  // 1. Calculations & Trend Indicators
  // Card 1: Active Ambassadors
  const activeCount = filteredAmbassadors.filter(a => a.isActive !== false).length;
  document.getElementById("kpi-total-ambassadors").textContent = activeCount;
  
  const ambTrendEl = document.getElementById("kpi-ambassadors-trend");
  if (isCustom) {
    ambTrendEl.style.color = "var(--text-muted)";
    ambTrendEl.innerHTML = `Custom timeframe`;
  } else if (limitMs > 0) {
    const prevAmbCount = ambassadors.filter(a => {
      const dateVal = new Date(a.dateCreated).getTime();
      return dateVal >= (now - prevLimitMs) && dateVal < (now - limitMs) && a.isActive !== false;
    }).length;
    const pct = getGrowthRate(activeCount, prevAmbCount);
    ambTrendEl.style.color = pct >= 0 ? "var(--success-color)" : "#ef4444";
    ambTrendEl.innerHTML = pct >= 0 
      ? `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg> +${pct}% Growth`
      : `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg> ${pct}% drop`;
  } else {
    ambTrendEl.style.color = "var(--success-color)";
    ambTrendEl.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg> Overall`;
  }

  // Card 2: Referrals Submitted
  const refCount = filteredReferrals.length;
  document.getElementById("kpi-total-referrals").textContent = refCount;
  
  const refTrendEl = document.getElementById("kpi-referrals-trend");
  if (isCustom) {
    refTrendEl.style.color = "var(--text-muted)";
    refTrendEl.innerHTML = `Custom timeframe`;
  } else if (limitMs > 0) {
    const prevRefCount = referrals.filter(r => {
      const dateVal = new Date(r.dateSubmitted).getTime();
      return dateVal >= (now - prevLimitMs) && dateVal < (now - limitMs);
    }).length;
    const pct = getGrowthRate(refCount, prevRefCount);
    refTrendEl.style.color = pct >= 0 ? "var(--success-color)" : "#ef4444";
    refTrendEl.innerHTML = pct >= 0 
      ? `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg> +${pct}% submissions`
      : `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg> ${pct}% drop`;
  } else {
    refTrendEl.style.color = "var(--success-color)";
    refTrendEl.innerHTML = `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg> Cumulative`;
  }

  // Card 3: Confirmed Admissions
  const enrolledCount = filteredReferrals.filter(r => r.status === "Enrolled").length;
  document.getElementById("kpi-total-admissions").textContent = enrolledCount;
  const rateVal = refCount > 0 ? Math.round((enrolledCount / refCount) * 100) : 0;
  document.getElementById("kpi-admissions-rate").innerHTML = `
    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    ${rateVal}% Conversion
  `;

  // Card 4: Rewards Earned & Pending
  let totalRewardsEarned = 0;
  let pendingApprovals = 0;
  
  // Sum up referral rewards matching the filteredReferrals list that are Enrolled
  filteredReferrals.filter(r => r.status === "Enrolled").forEach(r => {
    totalRewardsEarned += db.calculateReferralReward(r);
  });
  
  // Sum up level bonuses generated in the timeframe, and pending approvals
  ambassadors.forEach(a => {
    (a.payouts || []).forEach(p => {
      const pDate = new Date(p.date).getTime();
      if (isCustom) {
        const afterStart = !startMs || pDate >= startMs;
        const beforeEnd = !endMs || pDate <= endMs;
        if (!afterStart || !beforeEnd) return;
      } else if (limitMs > 0) {
        if (pDate < (now - limitMs)) return;
      }
      
      // If it's a level bonus, add to total rewards earned
      if (p.type && p.type !== "Withdrawal") {
        totalRewardsEarned += p.amount;
      }
      
      // If it's a pending withdrawal/bonus request
      if (p.status === "Pending") {
        pendingApprovals += p.amount;
      }
    });
  });

  let pendingDisbursals = 0;
  filteredReferrals.filter(r => r.status === "Enrolled" && r.payoutStatus !== "Paid").forEach(r => {
    pendingDisbursals += db.calculateReferralReward(r);
  });
  const pendingTotal = pendingApprovals + pendingDisbursals;

  document.getElementById("kpi-total-payouts").textContent = formatCurrency(totalRewardsEarned);
  document.getElementById("kpi-payouts-pending").innerHTML = `
    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
    ${formatCurrency(pendingTotal)} pending withdrawals
  `;

  // 2. Render Charts
  initAnalyticsCharts(filteredReferrals, filteredAmbassadors);

  // 3. Render Detailed Drawer Trees & Progress selectors
  renderCounselorTree(filteredAmbassadors);
  renderUniversityList(filteredReferrals);
  renderTierDistribution(filteredAmbassadors);
  populateProgressReportSelector();
  
  // 4. Render Rank Board
  renderLeaderboard("adm-leaderboard-podium", "adm-leaderboard-list", admLeaderboardSearch, admLeaderboardShowAll, false);
  renderAnnouncements();
}

function getGrowthRate(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function renderTierDistribution(ambList) {
  const ambassadors = ambList || db.getAmbassadors();
  const totalAmb = ambassadors.length;
  const counts = { Base: 0, Bronze: 0, Silver: 0, Gold: 0, Diamond: 0 };
  
  ambassadors.forEach(a => {
    const stats = db.getAmbassadorStats(a.id);
    if (stats && stats.levelInfo) {
      const name = stats.levelInfo.name;
      if (counts[name] !== undefined) counts[name]++;
    }
  });

  const tierDistributionEl = document.getElementById("analytics-tier-distribution");
  if (tierDistributionEl) {
    const maxCount = Math.max(...Object.values(counts), 1);
    const colors = {
      Base: "#94a3b8",
      Bronze: "#ea580c",
      Silver: "#64748b",
      Gold: "#ca8a04",
      Diamond: "#2563eb"
    };
    
    tierDistributionEl.innerHTML = Object.keys(counts).map(tier => {
      const cnt = counts[tier];
      const pct = (cnt / totalAmb) * 100 || 0;
      const barPct = (cnt / maxCount) * 100 || 0;
      
      return `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600;">
            <span style="display: flex; align-items: center; gap: 4px;">
              ${getLevelIconSvg(tier, 14)}
              ${tier}
            </span>
            <span>${cnt} (${pct.toFixed(0)}%)</span>
          </div>
          <div style="background: rgba(0,0,0,0.06); height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: ${colors[tier]}; width: ${barPct}%; height: 100%; border-radius: 3px; transition: width 0.5s ease;"></div>
          </div>
        </div>
      `;
    }).join("");
  }
}

function initAnalyticsCharts(referrals, ambassadors) {
  renderTrendChart(referrals);
  renderStatusDoughnut(referrals);
  renderCounselorChart(ambassadors);
  renderUniversityChart(referrals);
}

function renderTrendChart(referrals) {
  const grouped = {};
  const timeframe = document.getElementById("adm-dashboard-timeframe")?.value || "all";
  
  // Determine grouping mode: 'day', 'week', or 'month'
  let groupMode = "day";
  
  if (timeframe === "all" && referrals.length > 0) {
    let minTime = Infinity;
    let maxTime = -Infinity;
    referrals.forEach(r => {
      const t = new Date(r.dateSubmitted).getTime();
      if (t < minTime) minTime = t;
      if (t > maxTime) maxTime = t;
    });
    const diffDays = (maxTime - minTime) / (1000 * 60 * 60 * 24);
    if (diffDays > 60) {
      groupMode = "month";
    } else if (diffDays > 15) {
      groupMode = "week";
    } else {
      groupMode = "day";
    }
  } else if (timeframe === "all") {
    groupMode = "month";
  }

  referrals.forEach(r => {
    const d = new Date(r.dateSubmitted);
    let key = "";
    if (groupMode === "month") {
      key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    } else if (groupMode === "week") {
      const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
      const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      key = `Wk ${weekNum}, ${d.toLocaleString("en-IN", { month: "short" })}`;
    } else {
      key = d.toLocaleString("en-IN", { day: "2-digit", month: "short" });
    }
    
    if (!grouped[key]) {
      grouped[key] = { referrals: 0, admissions: 0, timestamp: d.getTime() };
    }
    grouped[key].referrals++;
    if (r.status === "Enrolled") {
      grouped[key].admissions++;
    }
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => grouped[a].timestamp - grouped[b].timestamp);
  
  let labels = sortedKeys.length > 0 ? [...sortedKeys] : ["No Data"];
  let refData = sortedKeys.map(k => grouped[k].referrals);
  let admData = sortedKeys.map(k => grouped[k].admissions);

  // If there's only one data point, pad it with a zero-value point from the day/week/month before to ensure a line is drawn
  if (sortedKeys.length === 1 && sortedKeys[0] !== "No Data") {
    const singleKey = sortedKeys[0];
    const singleItem = grouped[singleKey];
    
    let prevKey = "";
    if (groupMode === "month") {
      const mDate = new Date(singleItem.timestamp);
      mDate.setMonth(mDate.getMonth() - 1);
      prevKey = mDate.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    } else if (groupMode === "week") {
      const wDate = new Date(singleItem.timestamp - 7 * 24 * 60 * 60 * 1000);
      const firstDayOfYear = new Date(wDate.getFullYear(), 0, 1);
      const pastDaysOfYear = (wDate - firstDayOfYear) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      prevKey = `Wk ${weekNum}, ${wDate.toLocaleString("en-IN", { month: "short" })}`;
    } else {
      const prevDate = new Date(singleItem.timestamp - 24 * 60 * 60 * 1000);
      prevKey = prevDate.toLocaleString("en-IN", { day: "2-digit", month: "short" });
    }
    
    labels.unshift(prevKey);
    refData.unshift(0);
    admData.unshift(0);
  }

  if (chartReferralsTrendInstance) chartReferralsTrendInstance.destroy();

  const ctx = document.getElementById("chart-referrals-trend");
  if (!ctx) return;

  chartReferralsTrendInstance = new Chart(ctx.getContext("2d"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Referrals Submitted",
          data: refData,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.05)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: "#2563eb",
          pointBorderColor: "#fff",
          pointHoverRadius: 6
        },
        {
          label: "Confirmed Admissions",
          data: admData,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.05)",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#fff",
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { font: { family: "Outfit", weight: 600 }, color: "#0f172a" }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "Outfit" }, color: "#64748b" } },
        y: { grid: { color: "#e2e8f0" }, ticks: { font: { family: "Outfit" }, color: "#64748b", stepSize: 1 } }
      }
    }
  });
}

function renderStatusDoughnut(referrals) {
  let enrolled = 0, pending = 0, rejected = 0;
  
  referrals.forEach(r => {
    if (r.status === "Enrolled") enrolled++;
    else if (r.status === "Rejected") rejected++;
    else pending++;
  });

  if (chartLeadsStatusInstance) chartLeadsStatusInstance.destroy();

  const ctx = document.getElementById("chart-leads-status");
  if (!ctx) return;

  chartLeadsStatusInstance = new Chart(ctx.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Enrolled", "Pending", "Rejected"],
      datasets: [{
        data: [enrolled, pending, rejected],
        backgroundColor: ["#10b981", "#f97316", "#ef4444"],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { family: "Outfit", weight: 600 }, color: "#0f172a", padding: 12 }
        }
      },
      cutout: "65%"
    }
  });
}

function renderCounselorChart(ambassadors) {
  const counselors = {};
  
  ambassadors.forEach(a => {
    const counselor = a.counselorName || "Unassigned";
    if (!counselors[counselor]) {
      counselors[counselor] = { referrals: 0, enrolled: 0 };
    }
    
    const stats = db.getAmbassadorStats(a.id);
    counselors[counselor].referrals += stats.referrals.length;
    counselors[counselor].enrolled += stats.enrolledCount;
  });

  const labels = Object.keys(counselors);
  const refData = labels.map(k => counselors[k].referrals);
  const admData = labels.map(k => counselors[k].enrolled);

  if (chartCounselorPerformanceInstance) chartCounselorPerformanceInstance.destroy();

  const ctx = document.getElementById("chart-counselor-performance");
  if (!ctx) return;

  chartCounselorPerformanceInstance = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Leads",
          data: refData,
          backgroundColor: "#2563eb",
          borderRadius: 4
        },
        {
          label: "Confirmed",
          data: admData,
          backgroundColor: "#10b981",
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { family: "Outfit", weight: 600 }, color: "#0f172a" }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "Outfit" }, color: "#64748b", stepSize: 1 } },
        y: { grid: { display: false }, ticks: { font: { family: "Outfit" }, color: "#64748b" } }
      }
    }
  });
}

function renderUniversityChart(referrals) {
  const univs = {};
  
  referrals.filter(r => r.status === "Enrolled").forEach(r => {
    const univ = r.university || "Unspecified";
    univs[univ] = (univs[univ] || 0) + 1;
  });

  const labels = Object.keys(univs);
  const data = labels.map(k => univs[k]);

  if (chartUniversityPerformanceInstance) chartUniversityPerformanceInstance.destroy();

  const ctx = document.getElementById("chart-university-performance");
  if (!ctx) return;

  chartUniversityPerformanceInstance = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Admissions",
        data: data,
        backgroundColor: "#8b5cf6",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "Outfit" }, color: "#64748b" } },
        y: { grid: { color: "#e2e8f0" }, ticks: { font: { family: "Outfit" }, color: "#64748b", stepSize: 1 } }
      }
    }
  });
}

function renderCounselorTree(ambList) {
  const container = document.getElementById("counselor-performance-tree");
  if (!container) return;

  const ambassadors = ambList || db.getAmbassadors();
  const counselors = {};

  ambassadors.forEach(a => {
    const counselor = a.counselorName || "Unassigned Counselor";
    if (!counselors[counselor]) {
      counselors[counselor] = [];
    }
    const stats = db.getAmbassadorStats(a.id);
    counselors[counselor].push({
      id: a.id,
      name: a.name,
      referralsCount: stats.referrals.length,
      admissionsCount: stats.admissionsCount
    });
  });

  let treeHtml = "";
  for (const [counselorName, list] of Object.entries(counselors)) {
    const itemsHtml = list.map(amb => `
      <div class="counselor-ambassador-item">
        <div>
          <strong>${amb.name}</strong> <small style="color: var(--text-muted);">(${amb.id})</small>
        </div>
        <div style="font-weight: 600; color: var(--text-muted);">
          Leads: <span style="color: var(--text-main);">${amb.referralsCount}</span> | Confirmed: <span style="color: var(--success-color);">${amb.admissionsCount}</span>
        </div>
      </div>
    `).join("");

    treeHtml += `
      <div class="counselor-node">
        <div class="counselor-header">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span>${counselorName}</span>
        </div>
        ${itemsHtml}
      </div>
    `;
  }

  container.innerHTML = treeHtml || `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 40px;">No counselor data found.</div>`;
}

function renderUniversityList(refList) {
  const container = document.getElementById("university-performance-list");
  if (!container) return;

  const referrals = refList || db.getReferrals();
  const univStats = {};

  referrals.forEach(r => {
    const univ = r.university || "Unspecified University";
    if (!univStats[univ]) {
      univStats[univ] = { enrolled: 0, rejected: 0, pending: 0 };
    }
    if (r.status === "Enrolled") {
      univStats[univ].enrolled++;
    } else if (r.status === "Rejected") {
      univStats[univ].rejected++;
    } else {
      univStats[univ].pending++;
    }
  });

  let univHtml = "";
  for (const [univName, stats] of Object.entries(univStats)) {
    univHtml += `
      <div class="univ-perf-item">
        <div class="univ-perf-header">
          <span>${univName}</span>
          <span style="color: var(--primary-color);">${stats.enrolled + stats.rejected + stats.pending} Total</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
          <span>Confirmed: <strong style="color: var(--success-color);">${stats.enrolled}</strong></span>
          <span>Rejected: <strong style="color: #ef4444;">${stats.rejected}</strong></span>
          <span>Pending: <strong style="color: #d97706;">${stats.pending}</strong></span>
        </div>
      </div>
    `;
  }

  container.innerHTML = univHtml || `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 40px;">No university data found.</div>`;
}

function populateProgressReportSelector() {
  const selectEl = document.getElementById("progress-report-user-select");
  if (!selectEl) return;

  const ambassadors = db.getAmbassadors();
  const currentVal = selectEl.value;
  selectEl.innerHTML = ambassadors.map(a => `<option value="${a.id}">${a.name} (${a.id})</option>`).join("");

  if (currentVal && ambassadors.some(a => a.id === currentVal)) {
    selectEl.value = currentVal;
    renderProgressReport(currentVal);
  } else if (ambassadors.length > 0) {
    selectEl.value = ambassadors[0].id;
    renderProgressReport(ambassadors[0].id);
  } else {
    document.getElementById("progress-report-display-container").innerHTML = `<div style="color: var(--text-muted); text-align: center; margin-top: 40px;">No ambassadors found.</div>`;
  }
}

function renderProgressReport(ambassadorId) {
  const container = document.getElementById("progress-report-display-container");
  if (!container) return;

  const stats = db.getAmbassadorStats(ambassadorId);
  if (!stats) {
    container.innerHTML = `<div style="color: var(--text-muted); text-align: center; margin-top: 40px;">Selected ambassador stats not found.</div>`;
    return;
  }

  const amb = stats.ambassador;
  const totalLeads = stats.referrals.length;
  const enrolledCount = stats.enrolledCount;
  const rejectedCount = stats.referrals.filter(r => r.status === "Rejected").length;
  const conversionRate = totalLeads > 0 ? ((enrolledCount / totalLeads) * 100).toFixed(1) : "0.0";
  
  const statusBadge = amb.isActive !== false
    ? `<span class="status-pill" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); font-size: 10px; padding: 2px 6px; display: inline-flex;">Active</span>`
    : `<span class="status-pill" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); font-size: 10px; padding: 2px 6px; display: inline-flex;">Deactivated</span>`;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
      <div>
        <h4 style="font-weight: 700; color: var(--text-main); font-size: 14px; margin: 0 0 2px 0;">${amb.name}</h4>
        <span style="font-size: 11px; color: var(--text-muted); font-family: monospace;">ID: ${amb.id}</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
        <span class="badge-level badge-${stats.levelInfo.name.toLowerCase()}" style="font-size: 11px; padding: 2px 8px; margin: 0; display: inline-flex; align-items: center; gap: 4px;">
          ${getLevelIconSvg(stats.levelInfo.name, 14)} ${stats.levelInfo.name}
        </span>
        ${statusBadge}
      </div>
    </div>
    
    <div class="progress-report-stats-grid">
      <div class="progress-report-card">
        <span class="progress-report-num" style="color: var(--primary-color);">${totalLeads}</span>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Total Leads</span>
      </div>
      <div class="progress-report-card">
        <span class="progress-report-num" style="color: var(--success-color);">${enrolledCount}</span>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Enrolled</span>
      </div>
      <div class="progress-report-card">
        <span class="progress-report-num" style="color: #ef4444;">${rejectedCount}</span>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Rejected</span>
      </div>
      <div class="progress-report-card">
        <span class="progress-report-num" style="color: #8b5cf6;">${conversionRate}%</span>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Conversion</span>
      </div>
    </div>
    
    <div style="margin-top: 14px; border-top: 1px dashed var(--border-color); padding-top: 10px; display: flex; flex-direction: column; gap: 6px;">
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <span style="color: var(--text-muted);">Total Earnings:</span>
        <strong style="color: var(--text-main);">${formatCurrency(stats.totalEarnings)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <span style="color: var(--text-muted);">Available Balance:</span>
        <strong style="color: var(--success-color);">${formatCurrency(stats.balanceAvailable)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <span style="color: var(--text-muted);">Counselor:</span>
        <strong style="color: var(--text-main);">${amb.counselorName || 'N/A'}</strong>
      </div>
    </div>
  `;
}

function renderAmbassadorChat() {
  if (!currentUser) return;
  const chatMessagesEl = document.getElementById("amb-chat-messages");
  if (!chatMessagesEl) return;

  const chats = db.getChats();
  const userChat = chats[currentUser.id] || [];

  if (userChat.length === 0) {
    chatMessagesEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 100px;">No messages yet. Send a message to start chatting with your counselor!</div>`;
  } else {
    chatMessagesEl.innerHTML = userChat.map(msg => {
      const isSent = msg.sender === currentUser.id;
      const bubbleClass = isSent ? "sent" : "received";
      const senderName = isSent ? "You" : msg.senderName;
      const timeStr = new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

      return `
        <div class="chat-message-bubble ${bubbleClass}">
          <div style="font-size: 10px; opacity: 0.75; font-weight: 700; margin-bottom: 2px; text-transform: uppercase;">${senderName}</div>
          <div style="font-size: 13px; font-weight: 500; white-space: pre-wrap;">${msg.text}</div>
          <div style="font-size: 9px; opacity: 0.6; text-align: right; margin-top: 4px;">${timeStr}</div>
        </div>
      `;
    }).join("");
  }

  // Scroll to bottom
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  
  // Counselor name header update
  const counselorNameEl = document.getElementById("amb-chat-counselor-name");
  if (counselorNameEl) {
    counselorNameEl.textContent = `${currentUser.counselorName || 'Counselor'} Support`;
  }

  // Refresh sidebar badges
  updateSidebarBadges();
}

let activeAdminChatAmbassadorId = null;

function renderAdminChats() {
  const chats = db.getChats();
  const ambassadors = db.getAmbassadors();
  const chatsListEl = document.getElementById("adm-chats-list");
  if (!chatsListEl) return;

  const chatAmbassadorIds = Object.keys(chats);

  if (chatAmbassadorIds.length === 0) {
    chatsListEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 40px; padding: 10px;">No chats started yet.</div>`;
  } else {
    // Sort by latest message timestamp
    const sortedAmbassadors = chatAmbassadorIds.map(ambId => {
      const amb = ambassadors.find(a => a.id === ambId) || { name: `Ambassador (${ambId})`, id: ambId };
      const msgList = chats[ambId] || [];
      const latestMsg = msgList[msgList.length - 1] || { text: "", timestamp: 0 };
      return {
        amb,
        latestMsg
      };
    }).sort((a, b) => b.latestMsg.timestamp - a.latestMsg.timestamp);

    chatsListEl.innerHTML = sortedAmbassadors.map(item => {
      const isActive = item.amb.id === activeAdminChatAmbassadorId;
      const snippet = item.latestMsg.text.length > 30 ? item.latestMsg.text.substring(0, 30) + "..." : item.latestMsg.text;
      const timeStr = item.latestMsg.timestamp > 0 
        ? new Date(item.latestMsg.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) 
        : "";

      return `
        <div class="chat-user-row ${isActive ? 'active' : ''}" data-id="${item.amb.id}">
          <div class="profile-avatar" style="width: 36px; height: 36px; font-size: 12px; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; border-radius: 50%;">
            ${item.amb.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <strong style="font-size: 13px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.amb.name}</strong>
              <small style="font-size: 10px; color: var(--text-muted);">${timeStr}</small>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${snippet || 'No messages'}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Add click listeners to chat rows
    chatsListEl.querySelectorAll(".chat-user-row").forEach(row => {
      row.addEventListener("click", (e) => {
        activeAdminChatAmbassadorId = e.currentTarget.getAttribute("data-id");
        renderAdminChats();
      });
    });
  }

  // Render current active thread
  const threadHeaderNameEl = document.getElementById("adm-active-chat-name");
  const threadHeaderSubEl = document.getElementById("adm-active-chat-sub");
  const threadMessagesEl = document.getElementById("adm-chat-messages");
  const chatInputEl = document.getElementById("adm-chat-input");
  const chatSendBtnEl = document.getElementById("adm-chat-send-btn");

  if (!threadHeaderNameEl || !threadMessagesEl || !chatInputEl || !chatSendBtnEl) return;

  if (!activeAdminChatAmbassadorId) {
    threadHeaderNameEl.textContent = "Select a conversation";
    threadHeaderSubEl.textContent = "No chat active";
    threadMessagesEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 150px;">Select an Ambassador from the list to start messaging.</div>`;
    chatInputEl.disabled = true;
    chatSendBtnEl.disabled = true;
  } else {
    const activeAmbassador = ambassadors.find(a => a.id === activeAdminChatAmbassadorId);
    const activeAmbName = activeAmbassador ? activeAmbassador.name : `Ambassador (${activeAdminChatAmbassadorId})`;
    
    // Header
    threadHeaderNameEl.textContent = activeAmbName;
    threadHeaderSubEl.textContent = `ID: ${activeAdminChatAmbassadorId} | Counselor: ${activeAmbassador ? activeAmbassador.counselorName : 'N/A'}`;
    
    // Enable input & send button
    chatInputEl.disabled = false;
    chatSendBtnEl.disabled = false;

    // Messages
    const threadChatList = chats[activeAdminChatAmbassadorId] || [];
    if (threadChatList.length === 0) {
      threadMessagesEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 150px;">No messages yet.</div>`;
    } else {
      threadMessagesEl.innerHTML = threadChatList.map(msg => {
        const isSentByAdmin = msg.sender === "admin";
        const bubbleClass = isSentByAdmin ? "sent" : "received";
        const senderName = isSentByAdmin ? "You" : msg.senderName;
        const timeStr = new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

        return `
          <div class="chat-message-bubble ${bubbleClass}">
            <div style="font-size: 10px; opacity: 0.75; font-weight: 700; margin-bottom: 2px; text-transform: uppercase;">${senderName}</div>
            <div style="font-size: 13px; font-weight: 500; white-space: pre-wrap;">${msg.text}</div>
            <div style="font-size: 9px; opacity: 0.6; text-align: right; margin-top: 4px;">${timeStr}</div>
          </div>
        `;
      }).join("");
    }

    // Scroll to bottom
    threadMessagesEl.scrollTop = threadMessagesEl.scrollHeight;
  }

  // Refresh sidebar badges
  updateSidebarBadges();
}

// Render Admin Directory section
function renderAdminDirectory() {
  const ambassadors = db.getAmbassadors();
  const tableBody = document.getElementById("adm-directory-table-body");
  
  const filtered = ambassadors.filter(a => {
    return (
      a.id.toLowerCase().includes(searchFilter) ||
      a.name.toLowerCase().includes(searchFilter) ||
      a.username.toLowerCase().includes(searchFilter) ||
      a.mobile.includes(searchFilter)
    );
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No ambassadors matching filter found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(a => {
    const stats = db.getAmbassadorStats(a.id);
    const dateFormatted = new Date(a.dateCreated).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "2-digit"
    });

    return `
      <tr>
        <td><strong>${a.id}</strong></td>
        <td>
          <div style="font-weight: 700;">${a.name}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${a.email} | ${a.mobile}</div>
          <div style="font-size: 11px; font-weight: 600; color: var(--primary-color); margin-top: 3px;">Counselor: ${a.counselorName || 'N/A'}</div>
        </td>
        <td><span class="badge-level badge-${stats.levelInfo.name.toLowerCase()}" style="display: inline-flex; align-items: center; gap: 4px;">${getLevelIconSvg(stats.levelInfo.name, 18)} ${stats.levelInfo.name}</span></td>
        <td>
          <div style="font-size: 13px;">U: <strong style="color: var(--primary-color);">${a.username}</strong></div>
          <div style="font-size: 13px;">P: <strong style="color: var(--success-color);">${a.password}</strong></div>
        </td>
        <td>
          ${a.isActive !== false 
            ? `<span class="status-pill" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">Active</span>` 
            : `<span class="status-pill" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">Deavtivate</span>`}
        </td>
        <td>${dateFormatted}</td>
        <td>
          <button class="btn-primary btn-edit-profile" data-id="${a.id}" style="padding: 8px 12px; font-size: 12px; width: auto; background: var(--primary-color);">Edit Details</button>
        </td>
      </tr>
    `;
  }).join("");

  // Balance overrides removed. Available balance is calculated dynamically.

  // Bind edit details click
  document.querySelectorAll(".btn-edit-profile").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const ambassadors = db.getAmbassadors();
      const a = ambassadors.find(x => x.id === id);
      if (!a) return;

      document.getElementById("edit-user-id").value = a.id;
      document.getElementById("edit-user-name").value = a.name;
      document.getElementById("edit-user-father").value = a.fatherName;
      document.getElementById("edit-user-mobile").value = a.mobile;
      document.getElementById("edit-user-email").value = a.email;
      document.getElementById("edit-user-course").value = a.course;
      document.getElementById("edit-user-university").value = a.university;
      document.getElementById("edit-user-enrollment").value = a.enrollmentNumber;
      document.getElementById("edit-user-counselor").value = a.counselorName;
      document.getElementById("edit-user-username").value = a.username || "";
      document.getElementById("edit-user-password").value = a.password || "";
      document.getElementById("edit-user-status").value = a.isActive !== false ? "Active" : "Deavtivate";

      // Populate Bank and UPI Details inside Admin's Edit Modal
      document.getElementById("admin-disp-bank-name").textContent = a.bankName || "Not Provided";
      document.getElementById("admin-disp-bank-holder").textContent = a.bankHolderName || "Not Provided";
      document.getElementById("admin-disp-bank-number").textContent = a.bankAccountNumber || "Not Provided";
      document.getElementById("admin-disp-bank-ifsc").textContent = a.bankIfsc || "Not Provided";
      document.getElementById("admin-disp-upi-id").textContent = a.upiId || "Not Provided";

      const adminPassbookImg = document.getElementById("admin-disp-bank-passbook");
      const adminPassbookPlaceholder = document.getElementById("admin-disp-bank-passbook-placeholder");
      if (a.bankPassbookPhoto) {
        adminPassbookImg.src = a.bankPassbookPhoto;
        adminPassbookImg.style.display = "block";
        adminPassbookPlaceholder.style.display = "none";
      } else {
        adminPassbookImg.src = "";
        adminPassbookImg.style.display = "none";
        adminPassbookPlaceholder.style.display = "block";
      }

      const adminUpiQrImg = document.getElementById("admin-disp-upi-qr");
      const adminUpiQrPlaceholder = document.getElementById("admin-disp-upi-qr-placeholder");
      if (a.upiQrPhoto) {
        adminUpiQrImg.src = a.upiQrPhoto;
        adminUpiQrImg.style.display = "block";
        adminUpiQrPlaceholder.style.display = "none";
      } else {
        adminUpiQrImg.src = "";
        adminUpiQrImg.style.display = "none";
        adminUpiQrPlaceholder.style.display = "block";
      }

      document.getElementById("modal-edit-account").classList.add("active");
    });
  });
}

// Render Admin Leads Database section
function renderAdminLeads() {
  const referrals = db.getReferrals();
  const ambassadors = db.getAmbassadors();
  const tableBody = document.getElementById("adm-leads-table-body");

  if (referrals.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No student leads submitted yet.</td></tr>`;
    return;
  }

  // Reverse list to show newest on top
  tableBody.innerHTML = referrals.slice().reverse().map(r => {
    const dateFormatted = new Date(r.dateSubmitted).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const referrer = ambassadors.find(a => a.id === r.referrerId);
    let referrerHtml = `<div style="font-weight: 700; color: #ef4444;">Deleted Ambassador</div>`;
    if (referrer) {
      let proofHtml = "";
      if (r.whatsappScreenshot) {
        proofHtml = `<button class="btn-primary btn-view-whatsapp-proof" data-ref-id="${r.id}" style="padding: 4px 8px; font-size: 11px; width: auto; background: var(--primary-color); margin-top: 6px;">View Chat Proof</button>`;
      } else {
        proofHtml = `<span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">No WhatsApp Proof</span>`;
      }

      referrerHtml = `
        <div style="font-weight: 700; color: var(--text-main);">${referrer.name} (${referrer.id})</div>
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 500; margin-top: 2px;">
          Counselor: ${r.counselorName || referrer.counselorName || 'N/A'}
        </div>
        ${proofHtml}
      `;
    }

    const rewardAmount = db.calculateReferralReward(r);
    const rewardFormatted = formatCurrency(rewardAmount);

    // Separate student-level payout status mapping
    let payoutStatusHtml = "";
    if (r.status === "Pending") {
      payoutStatusHtml = `<span class="status-pill" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;">${rewardFormatted} (Pending Admission)</span>`;
    } else if (r.status === "Rejected") {
      payoutStatusHtml = `<span class="status-pill rejected" style="border: 1px solid #fca5a5;">₹0 (Rejected)</span>`;
    } else if (r.status === "Enrolled") {
      if (r.payoutStatus === "Paid") {
        payoutStatusHtml = `<span class="status-pill paid" style="border: 1px solid #bfdbfe; font-weight: 700;">${rewardFormatted} (Wallet Credited)</span>`;
      } else {
        const timestamp = r.enrollmentTimestamp || new Date(r.dateSubmitted).getTime();
        payoutStatusHtml = `
          <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start;">
            <span class="status-pill pending" style="border: 1px solid #fdba74; font-size: 11px;">${rewardFormatted} (Unpaid)</span>
            <span class="payout-countdown" data-timestamp="${timestamp}" style="font-size: 11px; font-weight: 600; font-family: monospace;">Calculating...</span>
            <button class="btn-primary btn-release-reward" data-id="${r.id}" style="padding: 4px 8px; font-size: 11px; width: auto; background: var(--success-color);">
              Release Reward
            </button>
          </div>
        `;
      }
    }

    return `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${referrerHtml}</td>
        <td>
          <div style="font-weight: 700;">${r.studentName}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${r.studentEmail} | ${r.studentMobile}</div>
        </td>
        <td>
          ${r.courseInterest} (${r.studyMode || 'Regular'})<br/>
          <small style="color: var(--text-muted);">${r.university || 'N/A'}</small><br/>
          <span style="font-size: 10px; background: rgba(99, 102, 241, 0.08); color: var(--primary-color); padding: 1px 4px; border-radius: 3px; font-weight: 600; display: inline-block; margin-top: 2px;">
            ${r.paymentType || 'Annual'}
          </span>
        </td>
        <td>${dateFormatted}</td>
        <td>
          <select class="form-input select-lead-status" data-id="${r.id}" style="padding: 6px 12px; width: 140px; font-size: 13px;">
            <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Enrolled" ${r.status === 'Enrolled' ? 'selected' : ''}>Enrolled</option>
            <option value="Rejected" ${r.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </td>
        <td>${payoutStatusHtml}</td>
      </tr>
    `;
  }).join("");

  // Bind click for whatsapp proof view
  tableBody.querySelectorAll(".btn-view-whatsapp-proof").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const refId = e.currentTarget.getAttribute("data-ref-id");
      const refItem = referrals.find(item => item.id === refId);
      if (refItem && refItem.whatsappScreenshot) {
        document.getElementById("proof-image").src = refItem.whatsappScreenshot;
        document.getElementById("modal-view-proof").classList.add("active");
      }
    });
  });

  // Bind status selectors changed
  document.querySelectorAll(".select-lead-status").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const id = e.target.getAttribute("data-id");
      const val = e.target.value;
      try {
        const success = db.updateReferralStatus(id, val);
        if (success) {
          if (val === "Enrolled") {
            const leadRef = referrals.find(ref => ref.id === id);
            const amt = leadRef ? db.calculateReferralReward(leadRef) : 5000;
            alert(`Lead ${id} has been marked as Enrolled!\n- Ambassador admissions count and level progress updated.\n- You can now release their ${formatCurrency(amt)} reward using the Release Reward button.`);
          } else {
            alert(`Lead ${id} status updated to ${val} successfully.`);
          }
        } else {
          alert("Failed to update status.");
        }
      } catch (err) {
        console.error("Error updating status:", err);
        alert("Error: " + err.message);
      }
      renderAdminLeads();
    });
  });

  // Bind click for reward release
  document.querySelectorAll(".btn-release-reward").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const refId = e.currentTarget.getAttribute("data-id");
      try {
        const success = db.releaseReferralReward(refId);
        if (success) {
          alert(`Reward for Referral ${refId} has been successfully released to the Ambassador's wallet!`);
        } else {
          alert("Failed to release reward.");
        }
      } catch (err) {
        console.error("Error releasing reward:", err);
        alert("Error: " + err.message);
      }
      renderAdminLeads();
    });
  });

  // Refresh sidebar badges
  updateSidebarBadges();
}

// Render Payout approvals view
let payoutCountdownInterval = null;

function startPayoutCountdownTicker() {
  if (payoutCountdownInterval) clearInterval(payoutCountdownInterval);
  
  const updateTickers = () => {
    const elements = document.querySelectorAll(".payout-countdown");
    if (elements.length === 0) return;
    
    const now = Date.now();
    const fortyFiveDaysMs = 45 * 24 * 60 * 60 * 1000;
    
    elements.forEach(el => {
      const timestamp = parseInt(el.getAttribute("data-timestamp"), 10);
      if (isNaN(timestamp)) {
        el.textContent = "N/A";
        return;
      }
      
      const targetTime = timestamp + fortyFiveDaysMs;
      const diff = targetTime - now;
      
      if (diff <= 0) {
        el.innerHTML = `<span style="color: var(--success-color); font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
          Release Ready
        </span>`;
      } else {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((diff % (60 * 1000)) / 1000);
        
        el.innerHTML = `<span style="font-weight: 600; font-family: monospace; color: #ea580c;">
          ${days}d ${hours}h ${minutes}m ${seconds}s
        </span>`;
      }
    });
  };
  
  updateTickers();
  payoutCountdownInterval = setInterval(updateTickers, 1000);
}

function renderAdminPayouts() {
  const ambassadors = db.getAmbassadors();
  const tableBody = document.getElementById("adm-payouts-table-body");
  
  // Calculate summary stats
  let totalDisbursedVal = 0;
  let totalPaidVal = 0;
  let totalPendingVal = 0;
  let totalAvailableVal = 0;

  ambassadors.forEach(a => {
    const stats = db.getAmbassadorStats(a.id);
    if (stats) {
      const pendingWithdrawals = (a.payouts || [])
        .filter(p => p.status === "Pending")
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pendingDisbursals = stats.totalPending - pendingWithdrawals;
      
      totalDisbursedVal += stats.totalEarnings + pendingDisbursals;
      totalPaidVal += stats.totalPaid;
      totalAvailableVal += stats.balanceAvailable;
      totalPendingVal += pendingWithdrawals;
    }
  });

  // Render stats cards
  const elDisbursed = document.getElementById("adm-stat-disbursed");
  const elPaid = document.getElementById("adm-stat-paid");
  const elPending = document.getElementById("adm-stat-pending");
  const elAvailable = document.getElementById("adm-stat-available");

  if (elDisbursed) elDisbursed.textContent = formatCurrency(totalDisbursedVal);
  if (elPaid) elPaid.textContent = formatCurrency(totalPaidVal);
  if (elPending) elPending.textContent = formatCurrency(totalPendingVal);
  if (elAvailable) {
    elAvailable.textContent = formatCurrency(totalAvailableVal);
    if (totalAvailableVal < 0) {
      elAvailable.style.color = "#ef4444";
    } else {
      elAvailable.style.color = "var(--primary-color)";
    }
  }

  // 1. Flatten all payouts that are "Pending"
  let pendingPayouts = [];
  ambassadors.forEach(a => {
    const pList = a.payouts || [];
    pList.forEach(p => {
      if (p.status === "Pending") {
        // Resolve timestamp
        let timestamp = p.timestamp;
        if (!timestamp) {
          const match = p.id.match(/^PAY-(\d{10,})$/);
          if (match) {
            timestamp = parseInt(match[1], 10);
          } else {
            timestamp = new Date(p.date).getTime();
          }
        }
        
        pendingPayouts.push({
          ambassadorId: a.id,
          ambassadorName: a.name,
          counselorName: a.counselorName || "N/A",
          payoutId: p.id,
          date: p.date,
          amount: p.amount,
          timestamp: timestamp,
          type: p.type || "Withdrawal"
        });
      }
    });
  });

  if (pendingPayouts.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No pending payout requests. All cleared!</td></tr>`;
  } else {
    tableBody.innerHTML = pendingPayouts.map(p => `
      <tr>
        <td>
          <strong>${p.payoutId}</strong>
          ${p.type !== "Withdrawal" 
            ? `<div style="font-size: 11px; color: var(--success-color); font-weight: 700; margin-top: 2px;">${p.type}</div>` 
            : `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Withdrawal</div>`}
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-main);">${p.ambassadorName} (${p.ambassadorId})</div>
          <div style="font-size: 11px; color: var(--primary-color); font-weight: 600; margin-top: 2px;">Counselor: ${p.counselorName}</div>
        </td>
        <td>${p.date}</td>
        <td><strong style="color: var(--primary-color);">${formatCurrency(p.amount)}</strong></td>
        <td><span class="payout-countdown" data-timestamp="${p.timestamp}">Calculating...</span></td>
        <td>
          <div style="display: flex; gap: 8px;">
            <button class="btn-primary btn-approve-payout" data-amb="${p.ambassadorId}" data-pay="${p.payoutId}" style="padding: 6px 14px; width: auto; font-size: 13px;">
              Approve Payout
            </button>
            <button class="btn-primary btn-reject-payout" data-amb="${p.ambassadorId}" data-pay="${p.payoutId}" style="padding: 6px 14px; width: auto; font-size: 13px; background: #ef4444; border-color: #ef4444;">
              Reject
            </button>
          </div>
        </td>
      </tr>
    `).join("");

    // Bind click payout approvals
    document.querySelectorAll(".btn-approve-payout").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const ambId = e.currentTarget.getAttribute("data-amb");
        const payId = e.currentTarget.getAttribute("data-pay");
        
        const payoutItem = pendingPayouts.find(item => item.payoutId === payId && item.ambassadorId === ambId);
        if (!payoutItem) return;

        document.getElementById("disburse-amb-id").value = ambId;
        document.getElementById("disburse-payout-id").value = payId;
        document.getElementById("disburse-amb-name").textContent = `${payoutItem.ambassadorName} (${ambId})`;
        document.getElementById("disburse-amount").textContent = formatCurrency(payoutItem.amount);
        document.getElementById("disburse-datetime").textContent = new Date().toLocaleString("en-IN");
        
        document.getElementById("disburse-utr").value = "";
        document.getElementById("disburse-screenshot").value = "";
        
        const previewImg = document.getElementById("disburse-screenshot-preview");
        const previewContainer = document.getElementById("disburse-screenshot-preview-container");
        previewImg.src = "";
        previewContainer.style.display = "none";
        
        document.getElementById("modal-disburse-payout").classList.add("active");
      });
    });

    // Bind click payout rejections
    document.querySelectorAll(".btn-reject-payout").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const ambId = e.currentTarget.getAttribute("data-amb");
        const payId = e.currentTarget.getAttribute("data-pay");
        
        const payoutItem = pendingPayouts.find(item => item.payoutId === payId && item.ambassadorId === ambId);
        if (!payoutItem) return;

        if (confirm(`Are you sure you want to reject this payout request of ${formatCurrency(payoutItem.amount)} for ${payoutItem.ambassadorName}? The amount will be refunded to the ambassador's wallet.`)) {
          const success = db.rejectPayout(ambId, payId);
          if (success) {
            alert("Payout request rejected successfully!");
            renderAdminPayouts();
            if (typeof renderAdminDashboard === "function") renderAdminDashboard();
          } else {
            alert("Failed to reject payout request.");
          }
        }
      });
    });
  }

  // 2. Populate Ambassador Account Balances
  const balancesTableBody = document.getElementById("adm-balances-table-body");
  if (balancesTableBody) {
    balancesTableBody.innerHTML = ambassadors.map(a => {
      const stats = db.getAmbassadorStats(a.id);
      const pendingWithdrawals = (a.payouts || [])
        .filter(p => p.status === "Pending")
        .reduce((sum, p) => sum + p.amount, 0);

      return `
        <tr>
          <td><strong>${a.id}</strong></td>
          <td>${a.name}</td>
          <td><strong style="color: var(--success-color);">${formatCurrency(stats.totalEarnings)}</strong></td>
          <td><strong>${formatCurrency(stats.totalPaid)}</strong></td>
          <td><strong style="color: #ea580c;">${formatCurrency(pendingWithdrawals)}</strong></td>
          <td><strong style="color: ${stats.balanceAvailable < 0 ? '#ef4444' : 'var(--primary-color)'};">${formatCurrency(stats.balanceAvailable)}</strong></td>
        </tr>
      `;
    }).join("");
  }

  // 3. Populate Disbursement & Payout History
  const historyTableBody = document.getElementById("adm-history-table-body");
  if (historyTableBody) {
    let historyList = [];

    // Collect paid withdrawals
    ambassadors.forEach(a => {
      const pList = a.payouts || [];
      pList.forEach(p => {
        if (p.status === "Paid") {
          historyList.push({
            timestamp: p.timestamp || new Date(p.date).getTime(),
            dateStr: p.date,
            type: "Withdrawal",
            ambassadorName: a.name,
            ambassadorId: a.id,
            counselorName: a.counselorName || "N/A",
            details: `Withdrawal Approved (Txn ID: ${p.id})`,
            amount: p.amount,
            status: "Completed",
            utrNumber: p.utrNumber || "N/A",
            screenshot: p.screenshot || "",
            disbursedAt: p.disbursedAt || null,
            payoutId: p.id
          });
        }
      });
    });

    // Collect rewarded referral records
    const referrals = db.getReferrals();
    referrals.forEach(r => {
      if (r.status === "Enrolled" && r.payoutStatus === "Paid") {
        const amb = ambassadors.find(a => a.id === r.referrerId);
        const ambName = amb ? amb.name : "Unknown";
        
        let enrollmentDate = r.enrollmentDate;
        if (!enrollmentDate) {
          enrollmentDate = r.dateSubmitted.split("T")[0];
        }

        historyList.push({
          timestamp: r.enrollmentTimestamp || new Date(r.dateSubmitted).getTime(),
          dateStr: enrollmentDate,
          type: "Reward Released",
          ambassadorName: ambName,
          ambassadorId: r.referrerId,
          counselorName: r.counselorName || (amb ? amb.counselorName : "N/A"),
          details: `Referral Reward: ${r.studentName} (${r.courseInterest})`,
          amount: db.calculateReferralReward(r),
          status: "Wallet Credited"
        });
      }
    });

    // Sort by timestamp descending
    historyList.sort((a, b) => b.timestamp - a.timestamp);

    // Apply Search and Filter Types
    let filteredHistory = historyList;
    if (historyTypeFilter !== "All") {
      filteredHistory = filteredHistory.filter(h => h.type === historyTypeFilter);
    }
    if (historySearchFilter) {
      filteredHistory = filteredHistory.filter(h => {
        return (
          h.ambassadorName.toLowerCase().includes(historySearchFilter) ||
          h.ambassadorId.toLowerCase().includes(historySearchFilter) ||
          h.details.toLowerCase().includes(historySearchFilter) ||
          h.type.toLowerCase().includes(historySearchFilter) ||
          h.status.toLowerCase().includes(historySearchFilter) ||
          h.amount.toString().includes(historySearchFilter)
        );
      });
    }

    if (filteredHistory.length === 0) {
      historyTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 20px;">No historical transfers or rewards found matching filters.</td></tr>`;
    } else {
      historyTableBody.innerHTML = filteredHistory.map(h => {
        const typeBadgeColor = h.type === "Withdrawal" ? "background: #dbeafe; color: #1e40af;" : "background: #d1fae5; color: #065f46;";
        let statusBadgeColor = "background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;";
        if (h.status === "Completed") {
          statusBadgeColor = "background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;";
        } else if (h.status === "Rejected") {
          statusBadgeColor = "background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;";
        }
        
        let receiptHtml = "";
        if (h.type === "Withdrawal" && h.status === "Completed") {
          receiptHtml = `
            <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">UTR: ${h.utrNumber || 'N/A'}</span>
              <button class="btn-primary btn-view-receipt" data-amb="${h.ambassadorId}" data-pay="${h.payoutId}" style="padding: 4px 8px; font-size: 11px; width: auto; background: var(--primary-color);">View Receipt</button>
            </div>
          `;
        } else {
          receiptHtml = `<span style="color: var(--text-muted); font-size: 12px;">N/A</span>`;
        }

        return `
          <tr>
            <td>${h.dateStr}</td>
            <td><span class="status-pill" style="${typeBadgeColor} font-weight: 600; font-size: 11px;">${h.type}</span></td>
            <td>
              <div style="font-weight: 700; color: var(--text-main);">${h.ambassadorName} (${h.ambassadorId})</div>
              <div style="font-size: 11px; color: var(--primary-color); font-weight: 600; margin-top: 2px;">Counselor: ${h.counselorName || 'N/A'}</div>
            </td>
            <td>${h.details}</td>
            <td><strong style="color: var(--text-main);">${formatCurrency(h.amount)}</strong></td>
            <td><span class="status-pill" style="${statusBadgeColor} font-weight: 700;">${h.status}</span></td>
            <td>${receiptHtml}</td>
          </tr>
        `;
      }).join("");

      // Bind click listeners for history table receipt viewers
      historyTableBody.querySelectorAll(".btn-view-receipt").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const ambId = e.currentTarget.getAttribute("data-amb");
          const payId = e.currentTarget.getAttribute("data-pay");
          openReceiptModal(ambId, payId);
        });
      });
    }
  }

  // Start/restart the live countdown ticker
  startPayoutCountdownTicker();

  // Refresh sidebar badges
  updateSidebarBadges();
}

// Render sync logs section
function renderAdminSync() {
  const logs = db.getLogs();
  const logsEl = document.getElementById("admin-terminal-logs");
  
  if (logsEl) {
    logsEl.innerHTML = logs.map(l => {
      const time = new Date(l.timestamp).toLocaleTimeString("en-IN", { hour12: false });
      return `
        <div class="log-entry">
          <span class="log-time">[${time}]</span>
          <span class="log-type ${l.type}">${l.type.toUpperCase()}:</span>
          <span class="log-message" style="color: #f8fafc;">${l.message}</span>
        </div>
      `;
    }).join("");
  }

  // Render developer mode panel if checked
  renderDeveloperPanel();
}

// Active tab state for Developer Mode
let activeDevTab = "dev-ambassadors";

function initDeveloperMode() {
  const toggle = document.getElementById("developer-mode-toggle");
  const panel = document.getElementById("developer-panel-content");
  
  if (!toggle || !panel) return;

  // Restore state
  const isDevMode = localStorage.getItem("developer_mode_active") === "true";
  toggle.checked = isDevMode;
  panel.style.display = isDevMode ? "flex" : "none";

  toggle.addEventListener("change", (e) => {
    const active = e.target.checked;
    localStorage.setItem("developer_mode_active", active ? "true" : "false");
    panel.style.display = active ? "flex" : "none";
    if (active) {
      renderDeveloperPanel();
    }
  });

  // Tab switching
  document.querySelectorAll(".dev-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".dev-tab-btn").forEach(b => b.classList.remove("active-tab"));
      btn.classList.add("active-tab");
      
      activeDevTab = btn.getAttribute("data-tab");
      document.querySelectorAll(".dev-tab-pane").forEach(pane => {
        pane.style.display = pane.id === activeDevTab ? "block" : "none";
      });
      renderDeveloperPanel();
    });
  });

  // Close modals
  document.querySelectorAll(".btn-close-dev-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
    });
  });

  // Save Ambassador Overrides
  const ambForm = document.getElementById("dev-edit-ambassador-form");
  if (ambForm) {
    ambForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const ambId = document.getElementById("dev-amb-id").value;
      const ambassadors = db.getAmbassadors();
      const idx = ambassadors.findIndex(a => a.id === ambId);
      if (idx !== -1) {
        const clearAll = document.getElementById("dev-amb-clear-overrides").checked;
        if (clearAll) {
          delete ambassadors[idx].admissionsCountOverride;
          delete ambassadors[idx].referralsCountOverride;
          delete ambassadors[idx].balanceOverride;
          delete ambassadors[idx].earningsOverride;
          delete ambassadors[idx].paidOverride;
        } else {
          const adm = document.getElementById("dev-amb-admissions").value;
          const refs = document.getElementById("dev-amb-referrals").value;
          const bal = document.getElementById("dev-amb-balance").value;
          const earn = document.getElementById("dev-amb-earnings").value;
          const paid = document.getElementById("dev-amb-paid").value;

          ambassadors[idx].admissionsCountOverride = adm !== "" ? Number(adm) : null;
          ambassadors[idx].referralsCountOverride = refs !== "" ? Number(refs) : null;
          ambassadors[idx].balanceOverride = bal !== "" ? Number(bal) : null;
          ambassadors[idx].earningsOverride = earn !== "" ? Number(earn) : null;
          ambassadors[idx].paidOverride = paid !== "" ? Number(paid) : null;
        }

        db.saveAmbassadors(ambassadors);
        db.addLog("Admin", `Developer override updated for ambassador ${ambassadors[idx].name} (ID: ${ambId})`);
        
        // Hide modal
        document.getElementById("modal-dev-edit-ambassador").classList.remove("active");
        renderDeveloperPanel();
        
        if (typeof renderAdminDirectory === "function") renderAdminDirectory();
        if (typeof renderAdminDashboard === "function") renderAdminDashboard();
      }
    });
  }

  // Save Referral Details
  const refForm = document.getElementById("dev-edit-referral-form");
  if (refForm) {
    refForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const refId = document.getElementById("dev-ref-id").value;
      const referrals = db.getReferrals();
      const idx = referrals.findIndex(r => r.id === refId);
      if (idx !== -1) {
        const studentName = document.getElementById("dev-ref-name").value;
        const referrerId = document.getElementById("dev-ref-referrer-id").value;
        const studentMobile = document.getElementById("dev-ref-mobile").value;
        const studentEmail = document.getElementById("dev-ref-email").value;
        const courseInterest = document.getElementById("dev-ref-course").value;
        const university = document.getElementById("dev-ref-university").value;
        const status = document.getElementById("dev-ref-status").value;
        const payoutStatus = document.getElementById("dev-ref-payout-status").value;

        // If enrolled and status changed to Enrolled, make sure timestamp exists
        if (status === "Enrolled" && referrals[idx].status !== "Enrolled") {
          referrals[idx].enrollmentTimestamp = Date.now();
          referrals[idx].enrollmentDate = new Date().toISOString().split("T")[0];
        }

        referrals[idx].studentName = studentName;
        referrals[idx].referrerId = referrerId;
        referrals[idx].studentMobile = studentMobile;
        referrals[idx].studentEmail = studentEmail;
        referrals[idx].courseInterest = courseInterest;
        referrals[idx].university = university;
        referrals[idx].status = status;
        referrals[idx].payoutStatus = payoutStatus;

        db.saveReferrals(referrals);
        db.addLog("Admin", `Developer edit updated for referral ${refId} (Student: ${studentName})`);

        document.getElementById("modal-dev-edit-referral").classList.remove("active");
        renderDeveloperPanel();
        
        if (typeof renderAdminLeads === "function") renderAdminLeads();
        if (typeof renderAdminDashboard === "function") renderAdminDashboard();
      }
    });
  }

  // Save Payout/Withdrawal Details
  const payForm = document.getElementById("dev-edit-payout-form");
  if (payForm) {
    payForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const payId = document.getElementById("dev-pay-id").value;
      const ambId = document.getElementById("dev-pay-amb-id").value;
      
      const ambassadors = db.getAmbassadors();
      const ambIdx = ambassadors.findIndex(a => a.id === ambId);
      if (ambIdx !== -1) {
        const payouts = ambassadors[ambIdx].payouts || [];
        const payIdx = payouts.findIndex(p => p.id === payId);
        if (payIdx !== -1) {
          const amount = Number(document.getElementById("dev-pay-amount").value);
          const date = document.getElementById("dev-pay-date").value;
          const utr = document.getElementById("dev-pay-utr").value;
          const status = document.getElementById("dev-pay-status").value;

          payouts[payIdx].amount = amount;
          payouts[payIdx].date = date;
          payouts[payIdx].utrNumber = utr || "N/A";
          payouts[payIdx].status = status;
          if (status === "Paid" && !payouts[payIdx].disbursedAt) {
            payouts[payIdx].disbursedAt = new Date().toISOString();
          }

          ambassadors[ambIdx].payouts = payouts;
          db.saveAmbassadors(ambassadors);
          db.addLog("Admin", `Developer edit updated for payout ${payId} (Ambassador: ${ambassadors[ambIdx].name})`);

          document.getElementById("modal-dev-edit-payout").classList.remove("active");
          renderDeveloperPanel();
          
          if (typeof renderAdminPayouts === "function") renderAdminPayouts();
          if (typeof renderAdminDashboard === "function") renderAdminDashboard();
        }
      }
    });
  }
}

function renderDeveloperPanel() {
  const toggle = document.getElementById("developer-mode-toggle");
  if (!toggle || !toggle.checked) return;

  if (activeDevTab === "dev-ambassadors") {
    renderDeveloperAmbassadors();
  } else if (activeDevTab === "dev-referrals") {
    renderDeveloperReferrals();
  } else if (activeDevTab === "dev-payouts") {
    renderDeveloperPayouts();
  }
}

function renderDeveloperAmbassadors() {
  const listEl = document.getElementById("dev-ambassadors-list");
  if (!listEl) return;

  const ambassadors = db.getAmbassadors();
  
  if (ambassadors.length === 0) {
    listEl.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No ambassadors in database.</td></tr>`;
    return;
  }

  listEl.innerHTML = ambassadors.map(amb => {
    const stats = db.getAmbassadorStats(amb.id);
    if (!stats) return "";
    
    // Check which fields are overridden
    const isAdmOverridden = amb.admissionsCountOverride !== undefined && amb.admissionsCountOverride !== null;
    const isRefsOverridden = amb.referralsCountOverride !== undefined && amb.referralsCountOverride !== null;
    const isBalOverridden = amb.balanceOverride !== undefined && amb.balanceOverride !== null;
    const isEarnOverridden = amb.earningsOverride !== undefined && amb.earningsOverride !== null;
    const isPaidOverridden = amb.paidOverride !== undefined && amb.paidOverride !== null;

    const formatOverride = (val, isOverridden) => {
      if (isOverridden) {
        return `<span style="color: #ef4444; font-weight: 700;">${val} <small style="font-size: 9px; background: rgba(239, 68, 68, 0.1); padding: 2px 4px; border-radius: 4px;">OR</small></span>`;
      }
      return `<span style="color: var(--text-main); font-weight: 500;">${val}</span>`;
    };

    return `
      <tr>
        <td style="font-family: monospace; font-weight: bold; color: var(--text-muted);">${amb.id}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${amb.name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${amb.email}</div>
        </td>
        <td style="text-align: center;">${formatOverride(stats.referralsCount, isRefsOverridden)}</td>
        <td style="text-align: center;">${formatOverride(stats.admissionsCount, isAdmOverridden)}</td>
        <td>${formatOverride(formatCurrency(stats.balanceAvailable), isBalOverridden)}</td>
        <td>${formatOverride(formatCurrency(stats.totalEarnings), isEarnOverridden)}</td>
        <td>${formatOverride(formatCurrency(stats.totalPaid), isPaidOverridden)}</td>
        <td style="text-align: center;">
          <button class="dev-actions-btn edit btn-dev-edit-amb" data-id="${amb.id}">
            Edit
          </button>
        </td>
      </tr>
    `;
  }).join("");

  // Attach handlers
  document.querySelectorAll(".btn-dev-edit-amb").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const amb = ambassadors.find(a => a.id === id);
      if (amb) {
        document.getElementById("dev-amb-id").value = amb.id;
        document.getElementById("dev-amb-name").textContent = `${amb.name} (${amb.id})`;
        
        document.getElementById("dev-amb-admissions").value = amb.admissionsCountOverride !== undefined && amb.admissionsCountOverride !== null ? amb.admissionsCountOverride : "";
        document.getElementById("dev-amb-referrals").value = amb.referralsCountOverride !== undefined && amb.referralsCountOverride !== null ? amb.referralsCountOverride : "";
        document.getElementById("dev-amb-balance").value = amb.balanceOverride !== undefined && amb.balanceOverride !== null ? amb.balanceOverride : "";
        document.getElementById("dev-amb-earnings").value = amb.earningsOverride !== undefined && amb.earningsOverride !== null ? amb.earningsOverride : "";
        document.getElementById("dev-amb-paid").value = amb.paidOverride !== undefined && amb.paidOverride !== null ? amb.paidOverride : "";
        
        document.getElementById("dev-amb-clear-overrides").checked = false;

        document.getElementById("modal-dev-edit-ambassador").classList.add("active");
      }
    });
  });
}

function renderDeveloperReferrals() {
  const listEl = document.getElementById("dev-referrals-list");
  if (!listEl) return;

  const referrals = db.getReferrals();
  const ambassadors = db.getAmbassadors();

  if (referrals.length === 0) {
    listEl.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No referrals in database.</td></tr>`;
    return;
  }

  listEl.innerHTML = referrals.map(ref => {
    const referrer = ambassadors.find(a => a.id === ref.referrerId);
    const referrerName = referrer ? referrer.name : `Unknown (${ref.referrerId})`;
    
    let statusClass = "Pending";
    if (ref.status === "Enrolled") statusClass = "Enrolled";
    else if (ref.status === "Rejected") statusClass = "Rejected";

    let payClass = "Unpaid";
    if (ref.payoutStatus === "Paid") payClass = "Paid";
    else if (ref.payoutStatus === "Requested") payClass = "Requested";

    return `
      <tr>
        <td style="font-family: monospace; font-weight: bold; color: var(--text-muted);">${ref.id}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${ref.studentName}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${ref.studentMobile || 'No Mobile'}</div>
        </td>
        <td>
          <div style="font-weight: 500; color: var(--text-main);">${referrerName}</div>
          <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">ID: ${ref.referrerId}</div>
        </td>
        <td>
          <div style="font-weight: 500; color: var(--text-main);">${ref.courseInterest}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${ref.university}</div>
        </td>
        <td>
          <span class="status-pill status-${statusClass.toLowerCase()}" style="font-weight: 600;">${ref.status}</span>
        </td>
        <td>
          <span class="status-pill payout-${payClass.toLowerCase()}" style="font-weight: 600;">${ref.payoutStatus}</span>
        </td>
        <td style="text-align: center;">
          <button class="dev-actions-btn edit btn-dev-edit-ref" data-id="${ref.id}">
            Edit
          </button>
        </td>
      </tr>
    `;
  }).join("");

  // Attach handlers
  document.querySelectorAll(".btn-dev-edit-ref").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const ref = referrals.find(r => r.id === id);
      if (ref) {
        document.getElementById("dev-ref-id").value = ref.id;
        document.getElementById("dev-ref-name").value = ref.studentName;
        document.getElementById("dev-ref-referrer-id").value = ref.referrerId;
        document.getElementById("dev-ref-mobile").value = ref.studentMobile || "";
        document.getElementById("dev-ref-email").value = ref.studentEmail || "";
        document.getElementById("dev-ref-course").value = ref.courseInterest;
        document.getElementById("dev-ref-university").value = ref.university;
        document.getElementById("dev-ref-status").value = ref.status;
        document.getElementById("dev-ref-payout-status").value = ref.payoutStatus;

        document.getElementById("modal-dev-edit-referral").classList.add("active");
      }
    });
  });
}

function renderDeveloperPayouts() {
  const listEl = document.getElementById("dev-payouts-list");
  if (!listEl) return;

  const ambassadors = db.getAmbassadors();
  const allPayouts = [];

  ambassadors.forEach(amb => {
    if (amb.payouts && Array.isArray(amb.payouts)) {
      amb.payouts.forEach(pay => {
        allPayouts.push({
          payout: pay,
          ambassadorId: amb.id,
          ambassadorName: amb.name
        });
      });
    }
  });

  // Sort payouts by date descending
  allPayouts.sort((a, b) => b.payout.timestamp - a.payout.timestamp);

  if (allPayouts.length === 0) {
    listEl.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No withdrawal requests in database.</td></tr>`;
    return;
  }

  listEl.innerHTML = allPayouts.map(item => {
    const pay = item.payout;
    const statusClass = pay.status === "Paid" ? "Paid" : "Pending";
    return `
      <tr>
        <td style="font-family: monospace; font-weight: bold; color: var(--text-muted);">${pay.id}</td>
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${item.ambassadorName}</div>
          <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">ID: ${item.ambassadorId}</div>
        </td>
        <td style="font-weight: 700; color: var(--text-main);">${formatCurrency(pay.amount)}</td>
        <td>${pay.date}</td>
        <td>
          <span class="status-pill status-${statusClass.toLowerCase()}" style="font-weight: 600;">${pay.status}</span>
        </td>
        <td style="font-family: monospace; font-size: 12px; color: var(--text-muted);">${pay.utrNumber || 'N/A'}</td>
        <td style="text-align: center;">
          <button class="dev-actions-btn edit btn-dev-edit-pay" data-id="${pay.id}" data-amb-id="${item.ambassadorId}">
            Edit
          </button>
        </td>
      </tr>
    `;
  }).join("");

  // Attach handlers
  document.querySelectorAll(".btn-dev-edit-pay").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const ambId = btn.getAttribute("data-amb-id");
      
      const amb = ambassadors.find(a => a.id === ambId);
      if (amb && amb.payouts) {
        const pay = amb.payouts.find(p => p.id === id);
        if (pay) {
          document.getElementById("dev-pay-id").value = pay.id;
          document.getElementById("dev-pay-amb-id").value = ambId;
          document.getElementById("dev-pay-id-label").textContent = `${pay.id} (${amb.name})`;
          
          document.getElementById("dev-pay-amount").value = pay.amount;
          document.getElementById("dev-pay-date").value = pay.date;
          document.getElementById("dev-pay-utr").value = pay.utrNumber !== "N/A" ? pay.utrNumber : "";
          document.getElementById("dev-pay-status").value = pay.status;

          document.getElementById("modal-dev-edit-payout").classList.add("active");
        }
      }
    });
  });
}


// Render Admin Settings section
function renderAdminSettings() {
  const settings = db.getReferralSettings();
  
  // Set default amount input
  const defaultAmountEl = document.getElementById("settings-default-amount");
  if (defaultAmountEl) {
    defaultAmountEl.value = settings.defaultAmount || 5000;
  }
  
  // Populate rules grouped container
  const rulesContainer = document.getElementById("settings-rules-container");
  if (rulesContainer) {
    const rules = settings.rules || [];
    if (rules.length === 0) {
      rulesContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px; background: rgba(0,0,0,0.01); border: 1px solid var(--border-color); border-radius: 12px;">No custom rules defined yet. System will use the global default reward.</div>`;
    } else {
      // Group rules by University
      const groupedRules = {};
      rules.forEach(r => {
        const uni = r.university || 'Other';
        if (!groupedRules[uni]) {
          groupedRules[uni] = [];
        }
        groupedRules[uni].push(r);
      });
      
      const unis = Object.keys(groupedRules).sort();
      
      rulesContainer.innerHTML = unis.map((uni, idx) => {
        const list = groupedRules[uni];
        const displayStyle = idx === 0 ? "block" : "none";
        const rotateStyle = idx === 0 ? "rotate(0deg)" : "rotate(180deg)";
        
        const rowsHtml = list.map(r => `
          <tr>
            <td style="padding: 12px 20px;"><strong>${r.course || 'Any'}</strong></td>
            <td style="padding: 12px 20px;"><span class="status-pill" style="background: rgba(99, 102, 241, 0.08); color: var(--primary-color); font-weight: 600;">${r.paymentType || 'Any'}</span></td>
            <td style="padding: 12px 20px;"><strong style="color: var(--success-color);">${formatCurrency(r.amount)}</strong></td>
            <td style="padding: 12px 20px; text-align: center;">
              <button class="btn-primary btn-delete-rule" data-id="${r.id}" style="padding: 4px 10px; font-size: 11px; width: auto; background: #ef4444; border: none; cursor: pointer; border-radius: 4px;">
                Delete
              </button>
            </td>
          </tr>
        `).join("");
        
        return `
          <div class="rules-group-card" style="border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; background: white; transition: all 0.3s ease;">
            <div class="rules-group-header" data-uni="${uni}" style="padding: 14px 20px; background: rgba(0,0,0,0.01); display: flex; align-items: center; justify-content: space-between; cursor: pointer; border-bottom: 1px solid var(--border-color); user-select: none;">
              <div style="display: flex; align-items: center; text-align: left; gap: 10px;">
                <span style="font-weight: 700; color: var(--text-main); font-size: 14px;">${uni} Payout Rules</span>
                <span class="status-pill" style="font-size: 11px; background: var(--primary-glow); color: var(--primary-color); font-weight: 600;">${list.length} ${list.length === 1 ? 'Rule' : 'Rules'}</span>
              </div>
              <span class="chevron-icon" style="transition: transform 0.2s ease; transform: ${rotateStyle}; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
              </span>
            </div>
            
            <div class="rules-group-content" id="content-rules-${uni.replace(/\s+/g, '')}" style="display: ${displayStyle}; border-top: none;">
              <div class="table-responsive" style="margin: 0; border: none; border-radius: 0;">
                <table class="custom-table" style="margin: 0; border: none;">
                  <thead>
                    <tr style="background: transparent;">
                      <th style="padding: 10px 20px;">Course</th>
                      <th style="padding: 10px 20px;">Payment Plan</th>
                      <th style="padding: 10px 20px;">Reward Amount</th>
                      <th style="padding: 10px 20px; width: 80px; text-align: center;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      }).join("");
      
      // Bind accordion clicks
      document.querySelectorAll(".rules-group-header").forEach(header => {
        header.addEventListener("click", () => {
          const uni = header.getAttribute("data-uni");
          const content = document.getElementById(`content-rules-${uni.replace(/\s+/g, '')}`);
          const chevron = header.querySelector(".chevron-icon");
          if (content) {
            const isHidden = content.style.display === "none";
            content.style.display = isHidden ? "block" : "none";
            if (chevron) {
              chevron.style.transform = isHidden ? "rotate(0deg)" : "rotate(180deg)";
            }
          }
        });
      });

      // Bind delete buttons
      document.querySelectorAll(".btn-delete-rule").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const ruleId = e.currentTarget.getAttribute("data-id");
          const settings = db.getReferralSettings();
          settings.rules = (settings.rules || []).filter(r => r.id !== ruleId);
          db.saveReferralSettings(settings);
          renderAdminSettings();
        });
      });
    }
  }
  renderAnnouncements();
  initAnnouncementsRecipientDropdown();
}

// Bind Settings form submissions
setTimeout(() => {
  const formDefaultSettings = document.getElementById("form-settings-default");
  if (formDefaultSettings) {
    formDefaultSettings.addEventListener("submit", (e) => {
      e.preventDefault();
      const newAmount = parseInt(document.getElementById("settings-default-amount").value, 10);
      if (!isNaN(newAmount)) {
        const settings = db.getReferralSettings();
        settings.defaultAmount = newAmount;
        db.saveReferralSettings(settings);
        
        const successEl = document.getElementById("settings-default-success");
        if (successEl) {
          successEl.style.display = "block";
          setTimeout(() => {
            successEl.style.display = "none";
          }, 3000);
        }
      }
    });
  }

  const formAddRule = document.getElementById("form-settings-add-rule");
  if (formAddRule) {
    formAddRule.addEventListener("submit", (e) => {
      e.preventDefault();
      const universityVal = document.getElementById("settings-rule-university").value.trim() || "Any";
      const courseVal = document.getElementById("settings-rule-course").value.trim() || "Any";
      const paymentVal = document.getElementById("settings-rule-payment").value;
      const amountVal = parseInt(document.getElementById("settings-rule-amount").value, 10);
      
      if (!isNaN(amountVal)) {
        const settings = db.getReferralSettings();
        const rules = settings.rules || [];
        const newRule = {
          id: `rule-${Date.now()}`,
          university: universityVal,
          course: courseVal,
          paymentType: paymentVal,
          amount: amountVal
        };
        
        rules.push(newRule);
        settings.rules = rules;
        db.saveReferralSettings(settings);
        
        formAddRule.reset();
        renderAdminSettings();
      }
    });
  }

  const formAnnouncement = document.getElementById("form-settings-announcement");
  if (formAnnouncement) {
    formAnnouncement.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("announcement-title").value.trim();
      const message = document.getElementById("announcement-message").value.trim();
      
      if (title && message) {
        db.addAnnouncement(title, message, selectedRecipientIds);
        formAnnouncement.reset();
        
        // Reset recipients selection
        selectedRecipientIds = [];
        const textSpan = document.getElementById("announcement-recipients-text");
        if (textSpan) {
          textSpan.textContent = "All Ambassadors (Public)";
          textSpan.style.color = "var(--text-muted)";
        }
        const searchInput = document.getElementById("announcement-recipients-search");
        if (searchInput) searchInput.value = "";
        initAnnouncementsRecipientDropdown();
        
        const successEl = document.getElementById("settings-announcement-success");
        if (successEl) {
          successEl.style.display = "block";
          setTimeout(() => {
            successEl.style.display = "none";
          }, 3000);
        }
        
        renderAnnouncements();
      }
    });
  }
}, 100);

// Bind Exports
document.getElementById("btn-export-ambassadors").addEventListener("click", () => {
  db.exportAmbassadorsCSV();
});

document.getElementById("btn-export-referrals").addEventListener("click", () => {
  db.exportReferralsCSV();
});


/* ==========================================================================
   MODALS POPUP CONTROL
   ========================================================================== */

const elCreateModal = document.getElementById("modal-create-account");
const elSuccessModal = document.getElementById("modal-credentials-success");
const elEditModal = document.getElementById("modal-edit-account");

// Open modal triggers
document.getElementById("btn-trigger-create-modal").addEventListener("click", () => {
  elCreateModal.classList.add("active");
  document.getElementById("admin-create-user-form").reset();
});

// Close triggers - Closes any modal overlay
document.querySelectorAll(".btn-close-modal").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
  });
});

document.getElementById("btn-close-success-modal").addEventListener("click", () => {
  elSuccessModal.classList.remove("active");
  renderAdminDirectory(); // refresh dashboard rows
});

// Submit creation form
document.getElementById("admin-create-user-form").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const ambassadorDetails = {
    name: document.getElementById("adm-user-name").value.trim(),
    fatherName: document.getElementById("adm-user-father").value.trim(),
    mobile: document.getElementById("adm-user-mobile").value.trim(),
    email: document.getElementById("adm-user-email").value.trim(),
    course: document.getElementById("adm-user-course").value.trim(),
    university: document.getElementById("adm-user-university").value.trim(),
    enrollmentNumber: document.getElementById("adm-user-enrollment").value.trim(),
    counselorName: document.getElementById("adm-user-counselor").value.trim()
  };

  const newUser = db.createAmbassador(ambassadorDetails);
  
  // Hide create modal and show credentials success modal
  elCreateModal.classList.remove("active");
  
  document.getElementById("disp-username").textContent = newUser.username;
  document.getElementById("disp-password").textContent = newUser.password;
  
  elSuccessModal.classList.add("active");
  document.getElementById("copy-status").textContent = "";
});

// Submit edit details form
document.getElementById("admin-edit-user-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("edit-user-id").value;
  const ambassadorDetails = {
    name: document.getElementById("edit-user-name").value.trim(),
    fatherName: document.getElementById("edit-user-father").value.trim(),
    mobile: document.getElementById("edit-user-mobile").value.trim(),
    email: document.getElementById("edit-user-email").value.trim(),
    course: document.getElementById("edit-user-course").value.trim(),
    university: document.getElementById("edit-user-university").value.trim(),
    enrollmentNumber: document.getElementById("edit-user-enrollment").value.trim(),
    counselorName: document.getElementById("edit-user-counselor").value.trim(),
    username: document.getElementById("edit-user-username").value.trim(),
    password: document.getElementById("edit-user-password").value.trim(),
    isActive: document.getElementById("edit-user-status").value === "Active"
  };

  try {
    const success = db.updateAmbassadorProfile(id, ambassadorDetails);
    if (success) {
      alert("Ambassador details updated successfully!");
      elEditModal.classList.remove("active");
      renderAdminDirectory();
    } else {
      alert("Failed to update profile.");
    }
  } catch (err) {
    console.error("Error updating profile details:", err);
    alert("Error: " + err.message);
  }
});

// View Receipt Modal helper function
function openReceiptModal(ambassadorId, payoutId) {
  const ambassadors = db.getAmbassadors();
  const amb = ambassadors.find(a => a.id === ambassadorId);
  if (!amb) return;
  const p = (amb.payouts || []).find(pay => pay.id === payoutId);
  if (!p) return;

  document.getElementById("receipt-amount").textContent = formatCurrency(p.amount);
  document.getElementById("receipt-utr").textContent = p.utrNumber || "N/A";
  
  const formattedTime = p.disbursedAt 
    ? new Date(p.disbursedAt).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
      })
    : "N/A";
  document.getElementById("receipt-time").textContent = formattedTime;

  const receiptImg = document.getElementById("receipt-image");
  const receiptPlaceholder = document.getElementById("receipt-placeholder");
  if (p.screenshot) {
    receiptImg.src = p.screenshot;
    receiptImg.style.display = "block";
    receiptPlaceholder.style.display = "none";
  } else {
    receiptImg.src = "";
    receiptImg.style.display = "none";
    receiptPlaceholder.style.display = "block";
  }

  document.getElementById("modal-view-receipt").classList.add("active");
}

// Bind disburse modal file upload change listener for size validation & preview
const elDisburseScreenshotInput = document.getElementById("disburse-screenshot");
const elDisburseScreenshotPreview = document.getElementById("disburse-screenshot-preview");
const elDisburseScreenshotContainer = document.getElementById("disburse-screenshot-preview-container");
const elDisburseScreenshotRemove = document.getElementById("btn-remove-disburse-screenshot");

if (elDisburseScreenshotInput && elDisburseScreenshotPreview && elDisburseScreenshotContainer) {
  elDisburseScreenshotInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      elDisburseScreenshotInput.value = "";
      return;
    }

    // Limit to 1.5MB to stay within safe localStorage bounds
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Image size should be less than 1.5MB to disburse payout successfully.");
      elDisburseScreenshotInput.value = "";
      elDisburseScreenshotPreview.src = "";
      elDisburseScreenshotContainer.style.display = "none";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      elDisburseScreenshotPreview.src = event.target.result;
      elDisburseScreenshotContainer.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}

if (elDisburseScreenshotRemove) {
  elDisburseScreenshotRemove.addEventListener("click", () => {
    elDisburseScreenshotInput.value = "";
    elDisburseScreenshotPreview.src = "";
    elDisburseScreenshotContainer.style.display = "none";
  });
}

// Submit disburse payout form
const formDisburse = document.getElementById("admin-disburse-payout-form");
if (formDisburse) {
  formDisburse.addEventListener("submit", (e) => {
    e.preventDefault();
    const ambId = document.getElementById("disburse-amb-id").value;
    const payId = document.getElementById("disburse-payout-id").value;
    const utr = document.getElementById("disburse-utr").value.trim();
    const previewImg = document.getElementById("disburse-screenshot-preview");
    
    let base64 = "";
    if (previewImg.src && previewImg.src.startsWith("data:image")) {
      base64 = previewImg.src;
    }
    
    if (!utr) {
      alert("Please enter a UTR transaction number.");
      return;
    }
    if (!base64) {
      alert("Please upload a transaction receipt screenshot.");
      return;
    }

    try {
      const success = db.approvePayout(ambId, payId, utr, base64);
      if (success) {
        alert(`Payout ${payId} approved and disbursed successfully!`);
        document.getElementById("modal-disburse-payout").classList.remove("active");
        renderAdminPayouts();
      } else {
        alert("Failed to approve payout.");
      }
    } catch (err) {
      console.error("Error approving payout:", err);
      alert("Error: " + err.message);
    }
  });
}

// Copy credentials to Clipboard
document.getElementById("btn-copy-username").addEventListener("click", () => {
  const username = document.getElementById("disp-username").textContent;
  navigator.clipboard.writeText(username);
  showCopyStatus("Username copied!");
});

document.getElementById("btn-copy-password").addEventListener("click", () => {
  const password = document.getElementById("disp-password").textContent;
  navigator.clipboard.writeText(password);
  showCopyStatus("Password copied!");
});

function showCopyStatus(text) {
  const el = document.getElementById("copy-status");
  el.textContent = text;
  setTimeout(() => {
    if (el.textContent === text) el.textContent = "";
  }, 2000);
}

// Sidebar profile syncing helper
function updateSidebarProfile() {
  if (!currentUser) return;
  document.getElementById("amb-profile-name").textContent = currentUser.name;
  
  const avatarEl = document.getElementById("amb-avatar");
  if (avatarEl) {
    if (currentUser.profilePhoto) {
      avatarEl.innerHTML = `<img src="${currentUser.profilePhoto}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
    } else {
      const initials = currentUser.name.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
      avatarEl.textContent = initials;
    }
  }
}

// Profile photo upload click and change listeners
const elProfilePhotoInput = document.getElementById("amb-profile-photo-input");
const elProfileAvatarWrapper = document.querySelector(".profile-avatar-wrapper");

if (elProfileAvatarWrapper && elProfilePhotoInput) {
  elProfileAvatarWrapper.addEventListener("click", () => {
    elProfilePhotoInput.click();
  });

  elProfilePhotoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      elProfilePhotoInput.value = "";
      return;
    }

    // Limit to 1.5MB to stay within safe localStorage bounds
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Image size should be less than 1.5MB to save profile successfully.");
      elProfilePhotoInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      
      // Save to database
      const success = db.updateAmbassadorProfilePhoto(currentUser.id, dataUrl);
      if (success) {
        // Update local session cache
        currentUser.profilePhoto = dataUrl;
        
        // Refresh UI components immediately
        const avatarCardEl = document.getElementById("amb-profile-card-avatar");
        if (avatarCardEl) {
          avatarCardEl.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`;
        }
        
        updateSidebarProfile();
      } else {
        alert("Failed to update profile photo.");
      }
    };
    reader.readAsDataURL(file);
  });
}

// Bind User Progress Report select change
const progressReportSelect = document.getElementById("progress-report-user-select");
if (progressReportSelect) {
  progressReportSelect.addEventListener("change", (e) => {
    renderProgressReport(e.target.value);
  });
}

// Bind Ambassador Chat Form submit
const ambChatForm = document.getElementById("amb-chat-form");
if (ambChatForm) {
  ambChatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const inputEl = document.getElementById("amb-chat-input");
    const text = inputEl.value.trim();
    if (!text) return;

    // Add user message
    db.addChatMessage(currentUser.id, currentUser.id, currentUser.name, text);
    
    // Clear input & re-render
    inputEl.value = "";
    renderAmbassadorChat();

    // Trigger counselor response after 1.5 seconds
    setTimeout(() => {
      if (currentRole === "ambassador" && currentUser && currentSection === "amb-chat") {
        // Generate simulated counselor response
        const responses = [
          "Thanks for reaching out! Let me check this for you and get back to you shortly.",
          "Good to hear from you. I am looking into your referral details in the master sheet now.",
          "I have noted your query. Rest assured, your payment status will be updated as soon as university verification completes.",
          "Hi! Please check if your bank account and IFSC details are saved correctly in the 'Add Bank Account' tab so there's no delay in transfers.",
          "Excellent progress on your referrals! Let me know if you need help with any specific student counseling."
        ];
        // Select one based on message keywords
        let response = responses[Math.floor(Math.random() * responses.length)];
        const lowerText = text.toLowerCase();
        if (lowerText.includes("pay") || lowerText.includes("money") || lowerText.includes("earning") || lowerText.includes("disburse") || lowerText.includes("reward")) {
          response = `Hi ${currentUser.name.split(" ")[0]}! Referral payouts are released within 45 days of admission confirmation. If the student has enrolled, I'll update their status so you can request a withdrawal.`;
        } else if (lowerText.includes("bank") || lowerText.includes("passbook") || lowerText.includes("upi") || lowerText.includes("qr")) {
          response = "Please make sure your bank/UPI credentials and attachments (Passbook/QR code) are clear. I will verify them from the admin panel.";
        } else if (lowerText.includes("admission") || lowerText.includes("enrol") || lowerText.includes("confirm")) {
          response = "I am checking the enrollment records with the university. Once they confirm, I'll mark the lead status as 'Enrolled'.";
        }

        db.addChatMessage(currentUser.id, "admin", `${currentUser.counselorName} (Counselor)`, response);
        db.addLog("System", `Simulated reply sent to Ambassador ${currentUser.name} by counselor.`);
        
        renderAmbassadorChat();
      }
    }, 1500);
  });
}

// Bind Admin Chat Form submit
const admChatForm = document.getElementById("adm-chat-form");
if (admChatForm) {
  admChatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeAdminChatAmbassadorId) return;

    const inputEl = document.getElementById("adm-chat-input");
    const text = inputEl.value.trim();
    if (!text) return;

    const ambassadors = db.getAmbassadors();
    const activeAmbassador = ambassadors.find(a => a.id === activeAdminChatAmbassadorId);
    const counselorName = activeAmbassador ? activeAmbassador.counselorName : "Shubham Sharma";

    // Add admin message
    db.addChatMessage(activeAdminChatAmbassadorId, "admin", `${counselorName} (Counselor)`, text);
    
    // Clear input & re-render
    inputEl.value = "";
    renderAdminChats();
  });
}


initLeaderboardListeners();

/* ==========================================================================
   AMBASSADOR CONGRATULATIONS & APPRECIATION POPUPS
   ========================================================================== */

function checkPendingAmbassadorNotifications() {
  if (!currentUser || currentRole !== "ambassador") return;
  
  // Refresh the currentUser object from the database to get the latest pendingPopups
  const ambassadors = db.getAmbassadors();
  const latestUser = ambassadors.find(a => a.id === currentUser.id);
  if (!latestUser) return;
  currentUser = latestUser;

  const popups = currentUser.pendingPopups || [];
  if (popups.length === 0) return;

  // Retrieve the first popup
  const popup = popups[0];
  const modal = document.getElementById("modal-ambassador-notification");
  if (!modal) return;

  const notifIcon = document.getElementById("notif-pulse-icon");
  const notifSvg = document.getElementById("notif-svg");
  const notifTitle = document.getElementById("notif-title");
  const notifMsg = document.getElementById("notif-message");
  const notifDetails = document.getElementById("notif-details-content");
  const notifDismissBtn = document.getElementById("btn-dismiss-notif");

  // Setup the popup content based on the notification type
  if (popup.type === "AdmissionApproved") {
    // Pulse Icon Setup: Blue style for info/referral approval
    notifIcon.style.borderColor = "var(--primary-color)";
    notifIcon.style.background = "rgba(37, 99, 235, 0.1)";
    notifIcon.style.animation = "pulse-primary 2s infinite";
    notifSvg.setAttribute("stroke", "var(--primary-color)");
    notifSvg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`;

    notifTitle.textContent = "Admission Confirmed! 🎉";
    notifMsg.innerHTML = `Great job! Your referred student, <strong style="color: var(--text-main); font-weight: 700;">${popup.data.studentName}</strong>, has successfully confirmed their admission.`;
    notifDetails.innerHTML = `
      <div style="display: flex; justify-content: space-between;"><span>Student:</span><strong>${popup.data.studentName}</strong></div>
      <div style="display: flex; justify-content: space-between;"><span>Reward Pending:</span><strong style="color: var(--primary-color);">${formatCurrency(popup.data.rewardAmount)}</strong></div>
      <div style="display: flex; justify-content: space-between;"><span>Status:</span><span class="status-pill pending" style="border:1px solid #fdba74; font-size:11px; padding:2px 6px;">Unpaid</span></div>
    `;
    notifDismissBtn.textContent = "Awesome!";
    
  } else if (popup.type === "RewardCredited") {
    // Pulse Icon Setup: Success/Green style for reward credited
    notifIcon.style.borderColor = "var(--success-color)";
    notifIcon.style.background = "rgba(16, 185, 129, 0.1)";
    notifIcon.style.animation = "pulse-success 2s infinite";
    notifSvg.setAttribute("stroke", "var(--success-color)");
    notifSvg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;

    notifTitle.textContent = "Wallet Balance Credited! 💰";
    notifMsg.innerHTML = `Excellent news! Your referral reward for <strong style="color: var(--text-main); font-weight: 700;">${popup.data.studentName}</strong> has been processed and credited to your wallet balance.`;
    notifDetails.innerHTML = `
      <div style="display: flex; justify-content: space-between;"><span>Student:</span><strong>${popup.data.studentName}</strong></div>
      <div style="display: flex; justify-content: space-between;"><span>Wallet Credited:</span><strong style="color: var(--success-color);">${formatCurrency(popup.data.rewardAmount)}</strong></div>
      <div style="display: flex; justify-content: space-between;"><span>Status:</span><span class="status-pill paid" style="border:1px solid #bfdbfe; font-size:11px; padding:2px 6px;">Wallet Credited</span></div>
    `;
    notifDismissBtn.textContent = "Great!";

  } else if (popup.type === "WithdrawalDisbursed") {
    // Pulse Icon Setup: Amber/Warning style for Bank/UPI transfer
    notifIcon.style.borderColor = "var(--success-color)";
    notifIcon.style.background = "rgba(16, 185, 129, 0.1)";
    notifIcon.style.animation = "pulse-success 2s infinite";
    notifSvg.setAttribute("stroke", "var(--success-color)");
    notifSvg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />`;

    notifTitle.textContent = "Withdrawal Disbursed! 🏦";
    notifMsg.innerHTML = `Congratulations! Your withdrawal request of <strong style="color: var(--text-main); font-weight: 700;">${formatCurrency(popup.data.amount)}</strong> has been disbursed and sent to your bank account.`;
    notifDetails.innerHTML = `
      <div style="display: flex; justify-content: space-between;"><span>Withdrawal ID:</span><strong>${popup.data.payoutId}</strong></div>
      <div style="display: flex; justify-content: space-between;"><span>Amount Transferred:</span><strong style="color: var(--success-color);">${formatCurrency(popup.data.amount)}</strong></div>
      <div style="display: flex; justify-content: space-between;"><span>UTR Number:</span><strong style="font-family: monospace; font-size: 12px; color: var(--text-main);">${popup.data.utrNumber}</strong></div>
    `;
    notifDismissBtn.textContent = "Perfect!";
  }

  // Show the modal
  modal.classList.add("active");
  
  // Trigger Confetti Explosion
  createConfettiExplosion();

  // Clear existing event listener by cloning button (prevents stacked listener issues)
  const newBtn = notifDismissBtn.cloneNode(true);
  notifDismissBtn.parentNode.replaceChild(newBtn, notifDismissBtn);

  // Bind the dismiss click
  newBtn.addEventListener("click", () => {
    modal.classList.remove("active");
    // Clear notification from database
    db.clearPendingPopup(currentUser.id, popup.id);
    
    // Check if more notifications are queued (recurse after a short delay)
    setTimeout(() => {
      checkPendingAmbassadorNotifications();
    }, 300);
  });
}

function createConfettiExplosion() {
  const container = document.getElementById("notification-confetti-container");
  if (!container) return;
  
  // Clear any existing pieces
  container.innerHTML = "";

  const colors = ["#ffd300", "#10b981", "#3b82f6", "#f43f5e", "#a855f7", "#fb923c"];
  const piecesCount = 45;

  for (let i = 0; i < piecesCount; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    
    // Randomize initial positions, colors, and animation values
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const leftPos = Math.random() * 100; // in %
    const animDelay = Math.random() * 0.5; // seconds
    const animDuration = 2.5 + Math.random() * 1.5; // seconds
    const size = 6 + Math.random() * 8; // width/height in px
    const rotation = 180 + Math.random() * 360; // deg
    const drift = -80 + Math.random() * 160; // px translation horizontal

    piece.style.backgroundColor = randomColor;
    piece.style.left = `${leftPos}%`;
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.animationDelay = `${animDelay}s`;
    piece.style.animationDuration = `${animDuration}s`;
    piece.style.setProperty("--drift", `${drift}px`);
    piece.style.setProperty("--rot", `${rotation}deg`);

    container.appendChild(piece);
  }
}

/* ==========================================================================
   SIDEBAR NOTIFICATION BADGES
   ========================================================================== */

function updateSidebarBadges() {
  if (!db) return;

  if (currentRole === "admin") {
    // 1. Update Referral Leads badge (count pending referrals)
    const leadsBadge = document.getElementById("badge-adm-leads");
    if (leadsBadge) {
      const pendingLeads = db.getReferrals().filter(r => r.status === "Pending").length;
      leadsBadge.textContent = pendingLeads;
      leadsBadge.style.display = pendingLeads > 0 ? "inline-block" : "none";
    }

    // 2. Update Payout Approvals badge (count pending withdrawals)
    const payoutsBadge = document.getElementById("badge-adm-payouts");
    if (payoutsBadge) {
      let pendingPayouts = 0;
      db.getAmbassadors().forEach(a => {
        (a.payouts || []).forEach(p => {
          if (p.status === "Pending") pendingPayouts++;
        });
      });
      payoutsBadge.textContent = pendingPayouts;
      payoutsBadge.style.display = pendingPayouts > 0 ? "inline-block" : "none";
    }

    // 3. Update Support Chats badge (count chats pending response from admin)
    const chatsBadge = document.getElementById("badge-adm-chats");
    if (chatsBadge) {
      let pendingChats = 0;
      const chats = db.getChats();
      Object.keys(chats).forEach(ambId => {
        const msgList = chats[ambId] || [];
        if (msgList.length > 0) {
          const latestMsg = msgList[msgList.length - 1];
          if (latestMsg.sender !== "admin") {
            // Only count if we aren't currently viewing this active chat thread
            if (currentSection !== "adm-chats" || activeAdminChatAmbassadorId !== ambId) {
              pendingChats++;
            }
          }
        }
      });
      chatsBadge.textContent = pendingChats;
      chatsBadge.style.display = pendingChats > 0 ? "inline-block" : "none";
    }
  } else if (currentRole === "ambassador" && currentUser) {
    // Update Ambassador Chat badge (count unread/new messages from counselor)
    const ambChatBadge = document.getElementById("badge-amb-chat");
    if (ambChatBadge) {
      let pendingAmbChat = 0;
      const chats = db.getChats();
      const msgList = chats[currentUser.id] || [];
      if (msgList.length > 0) {
        const latestMsg = msgList[msgList.length - 1];
        if (latestMsg.sender === "admin" && currentSection !== "amb-chat") {
          pendingAmbChat = 1;
        }
      }
      ambChatBadge.textContent = pendingAmbChat;
      ambChatBadge.style.display = pendingAmbChat > 0 ? "inline-block" : "none";
    }
  }
}

// Selected recipients array
let selectedRecipientIds = [];

// Initialize recipient dropdown logic
function initAnnouncementsRecipientDropdown() {
  const trigger = document.getElementById("announcement-recipients-trigger");
  const menu = document.getElementById("announcement-recipients-menu");
  const searchInput = document.getElementById("announcement-recipients-search");
  const listContainer = document.getElementById("announcement-recipients-list");
  const chevron = document.getElementById("announcement-recipients-chevron");

  if (!trigger || !menu || !searchInput || !listContainer) return;

  // Toggle menu
  trigger.onclick = (e) => {
    e.stopPropagation();
    const isOpen = menu.style.display === "flex";
    menu.style.display = isOpen ? "none" : "flex";
    if (chevron) chevron.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
  };

  // Populate options
  const ambassadors = db.getAmbassadors();
  
  function renderOptions(filterText = "") {
    const query = filterText.toLowerCase();
    
    // Check if "All" is selected
    const allChecked = selectedRecipientIds.length === 0;

    let html = `
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 8px; border-radius: 6px; transition: background 0.2s ease; font-size: 13px; font-weight: 600; color: var(--primary-color);">
        <input type="checkbox" id="recipient-opt-all" value="all" ${allChecked ? "checked" : ""} style="cursor: pointer;" />
        All Ambassadors (Public)
      </label>
    `;

    const filtered = ambassadors.filter(a => 
      a.name.toLowerCase().includes(query) || a.id.toLowerCase().includes(query)
    );

    html += filtered.map(a => {
      const isChecked = selectedRecipientIds.includes(a.id);
      return `
        <label class="recipient-option-item" style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 8px; border-radius: 6px; transition: background 0.2s ease; font-size: 13px; color: var(--text-main);">
          <input type="checkbox" class="recipient-opt-individual" value="${a.id}" ${isChecked ? "checked" : ""} style="cursor: pointer;" />
          <span style="font-weight: 600;">${a.name}</span> <span style="color: var(--text-muted); font-size: 11px;">(${a.id})</span>
        </label>
      `;
    }).join("");

    listContainer.innerHTML = html;

    // Bind event handlers on checkboxes
    const chkAll = document.getElementById("recipient-opt-all");
    if (chkAll) {
      chkAll.onchange = (e) => {
        if (e.target.checked) {
          selectedRecipientIds = [];
          document.querySelectorAll(".recipient-opt-individual").forEach(chk => chk.checked = false);
        }
        updateTriggerText();
      };
    }

    document.querySelectorAll(".recipient-opt-individual").forEach(chk => {
      chk.onchange = (e) => {
        const id = e.target.value;
        if (e.target.checked) {
          if (chkAll) chkAll.checked = false;
          if (!selectedRecipientIds.includes(id)) {
            selectedRecipientIds.push(id);
          }
        } else {
          selectedRecipientIds = selectedRecipientIds.filter(x => x !== id);
          if (selectedRecipientIds.length === 0 && chkAll) {
            chkAll.checked = true;
          }
        }
        updateTriggerText();
      };
    });
  }

  function updateTriggerText() {
    const textSpan = document.getElementById("announcement-recipients-text");
    if (!textSpan) return;

    if (selectedRecipientIds.length === 0) {
      textSpan.textContent = "All Ambassadors (Public)";
      textSpan.style.color = "var(--text-muted)";
    } else {
      const names = selectedRecipientIds.map(id => {
        const a = ambassadors.find(x => x.id === id);
        return a ? a.name : id;
      });
      
      if (names.length <= 2) {
        textSpan.textContent = names.join(", ");
      } else {
        textSpan.textContent = `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
      }
      textSpan.style.color = "var(--text-main)";
    }
  }

  // Filter list on search
  searchInput.oninput = (e) => {
    renderOptions(e.target.value);
  };

  // Initial render
  renderOptions();
}

// Global click to close menu when clicking outside
document.addEventListener("click", (e) => {
  const trigger = document.getElementById("announcement-recipients-trigger");
  const menu = document.getElementById("announcement-recipients-menu");
  const chevron = document.getElementById("announcement-recipients-chevron");
  if (trigger && menu) {
    if (!trigger.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = "none";
      if (chevron) chevron.style.transform = "rotate(0deg)";
    }
  }
});

// Render announcements on dashboards & settings
function renderAnnouncements() {
  const announcements = db.getAnnouncements();

  // 1. Ambassador Dashboard (Filter by targetUserIds)
  const ambWidget = document.getElementById("amb-announcements-widget");
  const ambList = document.getElementById("amb-announcements-list");
  if (ambWidget && ambList) {
    const filteredAnnouncements = announcements.filter(a => 
      !a.targetUserIds || a.targetUserIds.length === 0 || a.targetUserIds.includes("all") || a.targetUserIds.includes(currentUser.id)
    );

    if (filteredAnnouncements.length === 0) {
      ambWidget.style.display = "none";
    } else {
      ambWidget.style.display = "flex";
      ambList.innerHTML = filteredAnnouncements.map(a => `
        <div class="announcement-item" style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
            <h4 style="font-weight: 700; color: var(--text-main); font-size: 15px; margin: 0;">${a.title}</h4>
            <span style="font-size: 11px; font-weight: 600; color: var(--text-muted); background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 20px;">${a.date}</span>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0; white-space: pre-line;">${a.message}</p>
        </div>
      `).join("");
    }
  }

  // 2. Admin Dashboard (Show target information)
  const admWidget = document.getElementById("adm-announcements-widget");
  const admList = document.getElementById("adm-announcements-list");
  if (admWidget && admList) {
    if (announcements.length === 0) {
      admWidget.style.display = "none";
    } else {
      admWidget.style.display = "flex";
      const ambassadors = db.getAmbassadors();
      
      admList.innerHTML = announcements.map(a => {
        let targetText = "Public (All)";
        if (a.targetUserIds && a.targetUserIds.length > 0 && !a.targetUserIds.includes("all")) {
          const names = a.targetUserIds.map(id => {
            const amb = ambassadors.find(x => x.id === id);
            return amb ? amb.name : id;
          });
          targetText = `Targeted: ${names.join(", ")}`;
        }

        return `
          <div class="announcement-item" style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; text-align: left;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
              <div>
                <h4 style="font-weight: 700; color: var(--text-main); font-size: 15px; margin: 0;">${a.title}</h4>
                <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); background: rgba(0,0,0,0.03); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color); display: inline-block; margin-top: 4px;">${targetText}</div>
              </div>
              <span style="font-size: 11px; font-weight: 600; color: var(--text-muted); background: rgba(0,0,0,0.05); padding: 4px 8px; border-radius: 20px;">${a.date}</span>
            </div>
            <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0; white-space: pre-line;">${a.message}</p>
          </div>
        `;
      }).join("");
    }
  }

  // 3. Admin Settings
  const adminSettingsList = document.getElementById("admin-announcements-list");
  if (adminSettingsList) {
    if (announcements.length === 0) {
      adminSettingsList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; border: 1px solid var(--border-color); border-radius: 12px; font-size: 13px;">No active announcements. Use the form above to post one!</div>`;
    } else {
      const ambassadors = db.getAmbassadors();
      
      adminSettingsList.innerHTML = announcements.map(a => {
        let targetText = "Public (All)";
        if (a.targetUserIds && a.targetUserIds.length > 0 && !a.targetUserIds.includes("all")) {
          const names = a.targetUserIds.map(id => {
            const amb = ambassadors.find(x => x.id === id);
            return amb ? amb.name : id;
          });
          targetText = `Targeted: ${names.join(", ")}`;
        }

        return `
          <div class="announcement-item" style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; text-align: left;">
            <div style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
              <h4 style="font-weight: 700; color: var(--text-main); font-size: 15px; margin: 0;">${a.title}</h4>
              <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); background: rgba(0,0,0,0.03); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border-color); display: inline-block; margin-top: 2px; width: fit-content;">${targetText}</div>
              <span style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 4px;">${a.date}</span>
              <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0; white-space: pre-line; margin-top: 6px;">${a.message}</p>
            </div>
            <button class="btn-primary btn-danger btn-delete-announcement" data-id="${a.id}" style="padding: 6px 12px; font-size: 12px; width: auto; background: #ef4444; border-color: #ef4444;">Delete</button>
          </div>
        `;
      }).join("");

      // Bind delete button events
      adminSettingsList.querySelectorAll(".btn-delete-announcement").forEach(btn => {
        btn.onclick = (e) => {
          const id = e.currentTarget.getAttribute("data-id");
          db.deleteAnnouncement(id);
          renderAnnouncements();
        };
      });
    }
  }
}

/* ==========================================================================
   LIVE SUCCESS EVENTS NOTIFICATION TICKER
   ========================================================================== */

const TICKER_NAMES_POOL = [
  "Achyuta", "Alok", "Anamol", "Anish", "Anjaiah", "Anjaneyulu", "Appayya", "Arindam", 
  "Aryaman", "Aseem", "Ashish", "Avneet", "Balakrishna", "Balasubramaniam", "Bhagwati", 
  "Bimal", "Binod", "Biraj", "Brijesh", "Brijmohan", "Chakravarthy", "Chandramouli", 
  "Chetan", "Deepan", "Deepu", "Deo", "Dharmpal", "Divakar", "Divya", "Dorabjee", 
  "Gangaram", "Girraj", "Hanumantha Rao", "Harbhajan", "Harikrishna", "Harit", 
  "Harmanpreet", "Harsh Vardhan", "Ishaan", "Ishwar", "Jagan", "Jagmeet", "Jaisingrao", 
  "Jayendra", "Jigar", "Keerti", "Keki", "Keshavadasa", "Krishnamurti", "Krishnayya", 
  "Kuladhar", "Kunchan", "Kutumba Rao", "Lakshmi", "Lakshmikantam", "Lal", "Latha", 
  "Laxmikant", "Mallikarjuna Rao", "Manasvi", "Mandar", "Mandeep", "Manikandan", 
  "Manpreet", "Manu", "Milkha", "Mohinder", "Mriganka", "Mrinal", "Nachiketa", 
  "Nakusha", "Nalinaksha", "Nanubhai", "Narendran", "Naresh", "Nathuram", "Ninan", 
  "Nishant", "Pardeep", "Prabhakar", "Pradyut", "Pranay", "Prasad", "Prasanta", 
  "Pratibha", "Priyadarshana", "Raghava", "Raghavan", "Rama Devi", "Ramachandra Rao", 
  "Ranganathan", "Ranveer", "Ratilal", "Ratnakar", "Ravikumar", "Ravindranath", 
  "Romesh", "Saahil", "Sambasiva Rao", "Santosh", "Seema", "Shashank", "Shashi", 
  "Shaurya", "Shirish", "Shyam", "Sikkil", "Sitaram", "Siva Rao", "Somayajulu", 
  "Sonal", "Sreedharan", "Srinivasa", "Sujana", "Sukhdev", "Sukhjit", "Surender", 
  "Suri", "Suryanarayana", "Swathi", "Tanaji", "Tanvi", "Tapas", "Trilok", "Trupti", 
  "Udaya", "Ujjwal", "Vaibhav", "Vallabha", "Vamsi", "Vem", "Venkata", "Venkatesh", 
  "Venkateswaran", "Vidyasagar", "Vijay", "Vikram", "Vishal", "Vishesh", "Vishwajeet", 
  "Vishwanath", "Viswanathan", "Yamini", "Zorawar"
];

const TICKER_AMOUNTS = [3000, 5000, 10000];
const TICKER_EARNINGS = [10000, 15000, 20000];

function triggerSuccessTicker() {
  if (currentRole === "guest" || !currentUser) {
    return; // Don't show notifications unless logged in
  }

  const elTicker = document.getElementById("live-success-ticker");
  const elMessage = document.getElementById("success-ticker-message");
  if (!elTicker || !elMessage) return;

  // 1. Gather all excluded names (Current active user + Top 10 Performers)
  const excluded = new Set();
  
  if (currentUser && currentUser.name) {
    excluded.add(currentUser.name.toLowerCase().trim());
  }

  try {
    const ambassadors = db.getAmbassadors() || [];
    const leaderboardList = ambassadors.map(a => {
      const stats = db.getAmbassadorStats(a.id);
      return {
        name: a.name,
        admissionsCount: stats ? stats.admissionsCount : 0
      };
    });
    // Sort descending by admissionsCount
    leaderboardList.sort((a, b) => b.admissionsCount - a.admissionsCount);
    // Take top 10
    leaderboardList.slice(0, 10).forEach(x => {
      if (x.name) {
        excluded.add(x.name.toLowerCase().trim());
      }
    });
  } catch (e) {
    console.error("Error computing top 10 list for ticker exclusion", e);
  }

  // Helper to pick random name not in exclusion set
  const getRandomName = (exSet) => {
    const candidates = TICKER_NAMES_POOL.filter(name => {
      const lowerName = name.toLowerCase().trim();
      for (const exName of exSet) {
        if (lowerName === exName || lowerName.includes(exName) || exName.includes(lowerName)) {
          return false;
        }
      }
      return true;
    });

    if (candidates.length === 0) {
      // Ultimate fallback if too many exclusions
      return TICKER_NAMES_POOL[Math.floor(Math.random() * TICKER_NAMES_POOL.length)];
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const templateType = Math.floor(Math.random() * 3); // 0, 1, or 2
  let messageHtml = "";

  if (templateType === 0) {
    const amb = getRandomName(excluded);
    // Exclude the picked ambassador name as well to avoid same-name student-enrollments
    const studentEx = new Set(excluded);
    studentEx.add(amb.toLowerCase().trim());
    const student = getRandomName(studentEx);
    messageHtml = `<strong>${student}</strong> successfully enrolled via <strong>${amb}</strong>!`;
  } else if (templateType === 1) {
    const amb = getRandomName(excluded);
    const amount = TICKER_AMOUNTS[Math.floor(Math.random() * TICKER_AMOUNTS.length)];
    messageHtml = `<strong>${amb}</strong> has received a reward payout of <span class="success-highlight">₹${amount.toLocaleString("en-IN")}</span>!`;
  } else {
    const amb = getRandomName(excluded);
    const amount = TICKER_EARNINGS[Math.floor(Math.random() * TICKER_EARNINGS.length)];
    messageHtml = `<strong>${amb}</strong>'s total earnings today reached <span class="success-highlight">₹${amount.toLocaleString("en-IN")}</span>!`;
  }

  elMessage.innerHTML = messageHtml;
  elTicker.classList.remove("hide");
  elTicker.classList.add("show");

  // Auto-hide after 5 seconds
  const autoHideTimeout = setTimeout(() => {
    if (elTicker.classList.contains("show")) {
      elTicker.classList.remove("show");
      elTicker.classList.add("hide");
    }
  }, 5000);

  // Store timeout ref on element to handle manually clicking close
  elTicker.dataset.hideTimeoutId = autoHideTimeout;
}

function initSuccessTicker() {
  const elTicker = document.getElementById("live-success-ticker");
  const btnClose = document.getElementById("btn-close-ticker");

  if (btnClose && elTicker) {
    btnClose.addEventListener("click", () => {
      // Clear auto hide timeout if active
      if (elTicker.dataset.hideTimeoutId) {
        clearTimeout(Number(elTicker.dataset.hideTimeoutId));
      }
      elTicker.classList.remove("show");
      elTicker.classList.add("hide");
    });
  }

  // Run the loop every 32 seconds (32000 ms)
  setInterval(triggerSuccessTicker, 32000);
}

// Initialize Success Events Notification Ticker
initSuccessTicker();

/* ==========================================================================
   GOOGLE SHEETS & DRIVE SYNC INTEGRATION
   ========================================================================== */

const APPS_SCRIPT_CODE = `// Google Apps Script code to paste in script.google.com
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || "sync";
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "sync" || action === "push") {
      // 1. Ambassadors Sheet
      var sheetAmb = ss.getSheetByName("Ambassadors") || ss.insertSheet("Ambassadors");
      sheetAmb.clear();
      var ambHeaders = ["Ambassador ID", "Name", "Father Name", "Email", "Mobile", "Course", "University", "Enrollment Number", "Counselor", "Status", "Available Balance", "Total Earned", "Total Paid", "Bank Name", "IFSC", "Account Number", "UPI ID", "Date Registered"];
      sheetAmb.appendRow(ambHeaders);
      if (data.ambassadors && data.ambassadors.length > 0) {
        data.ambassadors.forEach(function(a) {
          sheetAmb.appendRow([
            a.id, a.name, a.fatherName || "", a.email, a.mobile, a.course, a.university, a.enrollmentNumber, a.counselorName, 
            a.isActive ? "Active" : "Inactive", a.balanceAvailable || 0, a.totalEarnings || 0, a.totalPaid || 0,
            a.bankName || "", a.bankIfsc || "", a.bankAccountNumber || "", a.upiId || "", a.dateCreated || ""
          ]);
        });
      }
      
      // 2. Referrals Sheet
      var sheetRef = ss.getSheetByName("Referrals") || ss.insertSheet("Referrals");
      sheetRef.clear();
      var refHeaders = ["Lead ID", "Student Name", "Mobile", "Email", "Course Interest", "University", "Referrer ID", "Referrer Name", "Counselor", "Status", "Date Submitted", "Payout Status"];
      sheetRef.appendRow(refHeaders);
      if (data.referrals && data.referrals.length > 0) {
        data.referrals.forEach(function(r) {
          sheetRef.appendRow([
            r.id, r.studentName, r.studentMobile || r.mobile || "", r.studentEmail || r.email || "", 
            r.courseInterest, r.university, r.referrerId, r.referrerName || "", 
            r.counselorName || "", r.status, r.dateSubmitted, r.payoutStatus
          ]);
        });
      }
      
      // 3. Withdrawals Sheet
      var sheetWithdrawals = ss.getSheetByName("Withdrawals") || ss.insertSheet("Withdrawals");
      sheetWithdrawals.clear();
      var wHeaders = ["Transaction ID", "Ambassador Name", "Ambassador ID", "Request Date", "Amount (INR)", "Status", "Disbursed Date", "UTR Number", "Screenshot Receipt"];
      sheetWithdrawals.appendRow(wHeaders);
      if (data.withdrawals && data.withdrawals.length > 0) {
        data.withdrawals.forEach(function(w) {
          sheetWithdrawals.appendRow([
            w.id, w.ambassadorName, w.ambassadorId, w.date, w.amount, w.status, w.disbursedAt || "", w.utrNumber || "", w.screenshot ? "Yes (Base64)" : "No"
          ]);
        });
      }

      // 4. Announcements Sheet
      var sheetAnn = ss.getSheetByName("Announcements") || ss.insertSheet("Announcements");
      sheetAnn.clear();
      var annHeaders = ["Announcement ID", "Title", "Message Details", "Target Audience", "Date Published"];
      sheetAnn.appendRow(annHeaders);
      if (data.announcements && data.announcements.length > 0) {
        data.announcements.forEach(function(a) {
          var target = "All";
          if (a.targetUserIds && a.targetUserIds.length > 0) {
            target = a.targetUserIds.join(", ");
          }
          sheetAnn.appendRow([a.id, a.title, a.message, target, a.date]);
        });
      }
      
      // 5. System Logs Sheet
      var sheetLogs = ss.getSheetByName("System Logs") || ss.insertSheet("System Logs");
      sheetLogs.clear();
      var logHeaders = ["Timestamp", "Type", "Log Message"];
      sheetLogs.appendRow(logHeaders);
      if (data.logs && data.logs.length > 0) {
        data.logs.forEach(function(l) {
          sheetLogs.appendRow([l.timestamp, l.type, l.message]);
        });
      }
      
      // Drive Backup JSON
      var folderName = "Sky CRM Backups";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
      
      var backupName = "gravity_master_backup.json";
      var files = folder.getFilesByName(backupName);
      while (files.hasNext()) {
        files.next().setTrashed(true);
      }
      
      folder.createFile(backupName, JSON.stringify(data, null, 2), MimeType.PLAIN_TEXT);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Data successfully backed up to Google Drive & Sheets!"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "pull") {
      var data = {
        ambassadors: [],
        referrals: [],
        announcements: [],
        logs: [],
        chats: {}
      };
      
      // 1. Read Ambassadors (Dynamic Mapping)
      var sheetAmb = ss.getSheetByName("Ambassadors");
      var ambMap = {};
      if (sheetAmb) {
        var rows = sheetAmb.getDataRange().getValues();
        if (rows.length > 0) {
          var headers = rows[0];
          var idxId = headers.indexOf("Ambassador ID");
          var idxName = headers.indexOf("Name");
          var idxFather = headers.indexOf("Father Name");
          var idxEmail = headers.indexOf("Email");
          var idxMobile = headers.indexOf("Mobile");
          var idxCourse = headers.indexOf("Course");
          var idxUni = headers.indexOf("University");
          var idxEnroll = headers.indexOf("Enrollment Number");
          var idxCounselor = headers.indexOf("Counselor");
          var idxStatus = headers.indexOf("Status");
          var idxBank = headers.indexOf("Bank Name");
          var idxIfsc = headers.indexOf("IFSC");
          var idxAccNum = headers.indexOf("Account Number");
          var idxUpi = headers.indexOf("UPI ID");
          var idxDate = headers.indexOf("Date Registered");

          for (var i = 1; i < rows.length; i++) {
            var r = rows[i];
            if (idxId !== -1 && !r[idxId]) continue;
            var ambId = r[idxId];
            
            var cleanName = (idxName !== -1 ? r[idxName] || "User" : "User").replace(/[^a-zA-Z]/g, "").toLowerCase();
            var idNum = ambId.replace(/[^0-9]/g, "");
            var defUsername = cleanName + idNum;
            var defPassword = cleanName.substring(0,3).toUpperCase() + idNum;

            var ambObj = {
              id: ambId,
              name: idxName !== -1 ? r[idxName] || "" : "",
              fatherName: idxFather !== -1 ? r[idxFather] || "" : "",
              email: idxEmail !== -1 ? r[idxEmail] || "" : "",
              mobile: idxMobile !== -1 ? String(r[idxMobile] || "") : "",
              course: idxCourse !== -1 ? r[idxCourse] || "" : "",
              university: idxUni !== -1 ? r[idxUni] || "" : "",
              enrollmentNumber: idxEnroll !== -1 ? r[idxEnroll] || "" : "",
              counselorName: idxCounselor !== -1 ? r[idxCounselor] || "" : "",
              isActive: idxStatus !== -1 ? r[idxStatus] !== "Inactive" : true,
              dateCreated: idxDate !== -1 ? (r[idxDate] || new Date().toISOString()) : new Date().toISOString(),
              bankName: idxBank !== -1 ? r[idxBank] || "" : "",
              bankHolderName: idxName !== -1 ? r[idxName] || "" : "",
              bankAccountNumber: idxAccNum !== -1 ? String(r[idxAccNum] || "") : "",
              bankIfsc: idxIfsc !== -1 ? r[idxIfsc] || "" : "",
              upiId: idxUpi !== -1 ? r[idxUpi] || "" : "",
              bankPassbookPhoto: "",
              upiQrPhoto: "",
              username: defUsername,
              password: defPassword,
              payouts: [],
              earningsOverride: null,
              paidOverride: null,
              balanceOverride: null,
              referralsCountOverride: null,
              admissionsCountOverride: null
            };
            
            data.ambassadors.push(ambObj);
            ambMap[ambId] = data.ambassadors.length - 1;
          }
        }
      }
      
      // 2. Read Referrals (Dynamic Mapping)
      var sheetRef = ss.getSheetByName("Referrals");
      if (sheetRef) {
        var rows = sheetRef.getDataRange().getValues();
        if (rows.length > 0) {
          var headers = rows[0];
          var idxId = headers.indexOf("Lead ID");
          var idxName = headers.indexOf("Student Name");
          var idxMobile = headers.indexOf("Mobile");
          var idxEmail = headers.indexOf("Email");
          var idxCourse = headers.indexOf("Course Interest");
          var idxUni = headers.indexOf("University");
          var idxRefId = headers.indexOf("Referrer ID");
          var idxRefName = headers.indexOf("Referrer Name");
          var idxCounselor = headers.indexOf("Counselor");
          var idxStatus = headers.indexOf("Status");
          var idxDate = headers.indexOf("Date Submitted");
          var idxPayout = headers.indexOf("Payout Status");

          for (var i = 1; i < rows.length; i++) {
            var r = rows[i];
            var referralIdVal = idxId !== -1 ? r[idxId] : "";
            if (!referralIdVal) continue;
            
            data.referrals.push({
              id: referralIdVal,
              studentName: idxName !== -1 ? r[idxName] || "" : "",
              studentMobile: idxMobile !== -1 ? String(r[idxMobile] || "") : "",
              studentEmail: idxEmail !== -1 ? String(r[idxEmail] || "") : "",
              courseInterest: idxCourse !== -1 ? r[idxCourse] || "" : "",
              university: idxUni !== -1 ? r[idxUni] || "" : "",
              referrerId: idxRefId !== -1 ? r[idxRefId] || "" : "",
              referrerName: idxRefName !== -1 ? r[idxRefName] || "" : "",
              counselorName: idxCounselor !== -1 ? r[idxCounselor] || "" : "",
              status: idxStatus !== -1 ? (r[idxStatus] || "Pending") : "Pending",
              dateSubmitted: idxDate !== -1 ? (r[idxDate] || new Date().toISOString()) : new Date().toISOString(),
              payoutStatus: idxPayout !== -1 ? (r[idxPayout] || "None") : "None",
              studyMode: "Online",
              notes: ""
            });
          }
        }
      }
      
      // 3. Read Withdrawals (Dynamic Mapping)
      var sheetWithdrawals = ss.getSheetByName("Withdrawals");
      if (sheetWithdrawals) {
        var rows = sheetWithdrawals.getDataRange().getValues();
        if (rows.length > 0) {
          var headers = rows[0];
          var idxId = headers.indexOf("Transaction ID");
          var idxAmbId = headers.indexOf("Ambassador ID");
          var idxDate = headers.indexOf("Request Date");
          var idxAmount = headers.indexOf("Amount (INR)");
          var idxStatus = headers.indexOf("Status");
          var idxDisbursed = headers.indexOf("Disbursed Date");
          var idxUtr = headers.indexOf("UTR Number");

          for (var i = 1; i < rows.length; i++) {
            var r = rows[i];
            var payIdVal = idxId !== -1 ? r[idxId] : "";
            if (!payIdVal) continue;
            var ambId = idxAmbId !== -1 ? r[idxAmbId] : "";
            var amount = idxAmount !== -1 ? Number(r[idxAmount] || 0) : 0;
            var status = idxStatus !== -1 ? r[idxStatus] || "Pending" : "Pending";
            
            var payoutObj = {
              id: payIdVal,
              amount: amount,
              date: idxDate !== -1 ? (r[idxDate] || new Date().toISOString().split("T")[0]) : new Date().toISOString().split("T")[0],
              timestamp: idxDate !== -1 ? new Date(r[idxDate] || Date.now()).getTime() : Date.now(),
              status: status,
              utrNumber: idxUtr !== -1 ? (r[idxUtr] || "N/A") : "N/A",
              screenshot: "",
              disbursedAt: idxDisbursed !== -1 ? (r[idxDisbursed] || "") : ""
            };
            
            if (ambMap[ambId] !== undefined) {
              data.ambassadors[ambMap[ambId]].payouts.push(payoutObj);
            }
          }
        }
      }
      
      // 4. Read Announcements (Dynamic Mapping)
      var sheetAnn = ss.getSheetByName("Announcements");
      if (sheetAnn) {
        var rows = sheetAnn.getDataRange().getValues();
        if (rows.length > 0) {
          var headers = rows[0];
          var idxId = headers.indexOf("Announcement ID");
          var idxTitle = headers.indexOf("Title");
          var idxMsg = headers.indexOf("Message Details");
          var idxTarget = headers.indexOf("Target Audience");
          var idxDate = headers.indexOf("Date Published");

          for (var i = 1; i < rows.length; i++) {
            var r = rows[i];
            var annIdVal = idxId !== -1 ? r[idxId] : "";
            if (!annIdVal) continue;
            var targetStr = idxTarget !== -1 ? (r[idxTarget] || "All") : "All";
            var targetUserIds = targetStr === "All" ? [] : targetStr.split(", ");
            data.announcements.push({
              id: annIdVal,
              title: idxTitle !== -1 ? r[idxTitle] || "" : "",
              message: idxMsg !== -1 ? r[idxMsg] || "" : "",
              targetUserIds: targetUserIds,
              date: idxDate !== -1 ? (r[idxDate] || new Date().toISOString().split("T")[0]) : new Date().toISOString().split("T")[0]
            });
          }
        }
      }
      
      // 5. Read Logs (Dynamic Mapping)
      var sheetLogs = ss.getSheetByName("System Logs");
      if (sheetLogs) {
        var rows = sheetLogs.getDataRange().getValues();
        if (rows.length > 0) {
          var headers = rows[0];
          var idxTime = headers.indexOf("Timestamp");
          var idxType = headers.indexOf("Type");
          var idxMsg = headers.indexOf("Log Message");

          for (var i = 1; i < rows.length; i++) {
            var r = rows[i];
            var logTimeVal = idxTime !== -1 ? r[idxTime] : "";
            if (!logTimeVal) continue;
            data.logs.push({
              timestamp: logTimeVal,
              type: idxType !== -1 ? r[idxType] || "" : "",
              message: idxMsg !== -1 ? r[idxMsg] || "" : ""
            });
          }
        }
      }
      
      // Merge with master JSON file from Google Drive to get credentials/chats
      var folderName = "Sky CRM Backups";
      var folders = DriveApp.getFoldersByName(folderName);
      if (folders.hasNext()) {
        var folder = folders.next();
        var files = folder.getFilesByName("gravity_master_backup.json");
        if (files.hasNext()) {
          try {
            var file = files.next();
            var fileContent = JSON.parse(file.getAs("text/plain").getDataAsString());
            if (fileContent.ambassadors) {
              fileContent.ambassadors.forEach(function(oldAmb) {
                if (ambMap[oldAmb.id] !== undefined) {
                  var currentAmb = data.ambassadors[ambMap[oldAmb.id]];
                  currentAmb.username = oldAmb.username || currentAmb.username;
                  currentAmb.password = oldAmb.password || currentAmb.password;
                  currentAmb.bankName = oldAmb.bankName || currentAmb.bankName;
                  currentAmb.bankHolderName = oldAmb.bankHolderName || currentAmb.bankHolderName;
                  currentAmb.bankAccountNumber = oldAmb.bankAccountNumber || currentAmb.bankAccountNumber;
                  currentAmb.bankIfsc = oldAmb.bankIfsc || currentAmb.bankIfsc;
                  currentAmb.upiId = oldAmb.upiId || currentAmb.upiId;
                  currentAmb.bankPassbookPhoto = oldAmb.bankPassbookPhoto || "";
                  currentAmb.upiQrPhoto = oldAmb.upiQrPhoto || "";
                  currentAmb.earningsOverride = oldAmb.earningsOverride !== undefined ? oldAmb.earningsOverride : null;
                  currentAmb.paidOverride = oldAmb.paidOverride !== undefined ? oldAmb.paidOverride : null;
                  currentAmb.balanceOverride = oldAmb.balanceOverride !== undefined ? oldAmb.balanceOverride : null;
                  currentAmb.referralsCountOverride = oldAmb.referralsCountOverride !== undefined ? oldAmb.referralsCountOverride : null;
                  currentAmb.admissionsCountOverride = oldAmb.admissionsCountOverride !== undefined ? oldAmb.admissionsCountOverride : null;

                  // Restore payout receipt screenshots
                  if (oldAmb.payouts && oldAmb.payouts.length > 0 && currentAmb.payouts) {
                    currentAmb.payouts.forEach(function(currentPayout) {
                      for (var p = 0; p < oldAmb.payouts.length; p++) {
                        if (oldAmb.payouts[p].id === currentPayout.id) {
                          currentPayout.screenshot = oldAmb.payouts[p].screenshot || "";
                          break;
                        }
                      }
                    });
                  }
                }
              });
            }
            // Restore referral WhatsApp screenshots and extra fields
            if (fileContent.referrals && fileContent.referrals.length > 0 && data.referrals) {
              var refMap = {};
              fileContent.referrals.forEach(function(ref) {
                refMap[ref.id] = ref;
              });
              data.referrals.forEach(function(currentRef) {
                var oldRef = refMap[currentRef.id];
                if (oldRef) {
                  currentRef.whatsappScreenshot = oldRef.whatsappScreenshot || "";
                  currentRef.studyMode = oldRef.studyMode || currentRef.studyMode || "Online";
                  currentRef.notes = oldRef.notes || currentRef.notes || "";
                  currentRef.paymentType = oldRef.paymentType || currentRef.paymentType || "Annual";
                }
              });
            }
            if (fileContent.chats) data.chats = fileContent.chats;
          } catch(err) {
            // Ignore parse errors
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: data
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Sky CRM Sync active.");
}`;


function updateSyncUI() {
  const syncUrl = getGoogleSyncUrl();
  const lastTime = localStorage.getItem("google_sync_last_time") || "Never";
  
  const elUrl = document.getElementById("settings-google-sync-url");
  const elStatus = document.getElementById("google-sync-status");
  const elLastTime = document.getElementById("google-sync-last-time");
  const elAutoStatus = document.getElementById("google-sync-auto-status");
  
  if (elUrl) elUrl.value = localStorage.getItem("google_sync_url") || "";
  
  if (syncUrl) {
    if (elStatus) {
      elStatus.textContent = "Connected";
      elStatus.style.color = "var(--success-color)";
    }
    if (elAutoStatus) {
      elAutoStatus.textContent = "Active";
      elAutoStatus.style.color = "var(--success-color)";
    }
  } else {
    if (elStatus) {
      elStatus.textContent = "Not Configured";
      elStatus.style.color = "#ef4444";
    }
    if (elAutoStatus) {
      elAutoStatus.textContent = "Disabled";
      elAutoStatus.style.color = "var(--text-muted)";
    }
  }
  if (elLastTime) elLastTime.textContent = lastTime;
}

function pushToGoogleSync(isAuto = false) {
  const syncUrl = getGoogleSyncUrl();
  if (!syncUrl) return Promise.reject("Not configured");

  const logType = isAuto ? "Auto" : "Sync";
  db.addLog(logType, "Initiating data push to Google Sheets & Drive...");
  if (currentSection === "adm-sync") renderAdminSync();

  // 1. Enrich Ambassadors database with stats
  const enrichedAmbassadors = db.getAmbassadors().map(a => {
    const stats = db.getAmbassadorStats(a.id);
    return {
      ...a,
      totalEarnings: stats ? stats.totalEarnings : 0,
      totalPaid: stats ? stats.totalPaid : 0,
      balanceAvailable: stats ? stats.balanceAvailable : 0
    };
  });

  // 2. Extract Payout Withdrawals list
  const withdrawals = [];
  db.getAmbassadors().forEach(a => {
    (a.payouts || []).forEach(p => {
      withdrawals.push({
        id: p.id,
        ambassadorName: a.name,
        ambassadorId: a.id,
        date: p.date,
        amount: p.amount,
        status: p.status,
        disbursedAt: p.disbursedAt || "",
        utrNumber: p.utrNumber || "",
        screenshot: p.screenshot || ""
      });
    });
  });

  const payload = {
    action: "sync",
    ambassadors: enrichedAmbassadors,
    referrals: db.getReferrals(),
    withdrawals: withdrawals,
    chats: db.getChats(),
    announcements: db.getAnnouncements(),
    logs: db.getLogs()
  };

  return fetch(syncUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify(payload)
  })
  .then(() => {
    const timestampStr = new Date().toLocaleString("en-IN");
    localStorage.setItem("google_sync_last_time", timestampStr);
    db.addLog(logType, "Success: Data backed up to Google Drive & Sheets.");
    
    updateSyncUI();
    if (currentSection === "adm-sync") renderAdminSync();
  })
  .catch(err => {
    db.addLog("Error", "Google Sync push failed: " + err.toString());
    updateSyncUI();
    if (currentSection === "adm-sync") renderAdminSync();
    throw err;
  });
}

function pullFromGoogleSync() {
  const syncUrl = getGoogleSyncUrl();
  if (!syncUrl) {
    alert("Please configure your Google Web App URL first.");
    return;
  }

  db.addLog("Sync", "Requesting backup restore from Google Drive...");
  if (currentSection === "adm-sync") renderAdminSync();

  const payload = {
    action: "pull"
  };

  fetch(syncUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error("Network response was not ok: " + res.status);
    return res.json();
  })
  .then(resData => {
    if (resData && resData.success && resData.data) {
      const data = resData.data;
      
      if (data.ambassadors && data.ambassadors.length > 0) db.saveAmbassadors(data.ambassadors);
      if (data.referrals && data.referrals.length > 0) db.saveReferrals(data.referrals);
      if (data.chats) db.saveChats(data.chats);
      if (data.announcements) db.saveAnnouncements(data.announcements);
      if (data.logs && data.logs.length > 0) {
        db._cache.logs = data.logs;
        db._syncToServer("logs", data.logs);
      }
      
      const timestampStr = new Date().toLocaleString("en-IN");
      localStorage.setItem("google_sync_last_time", timestampStr);
      db.addLog("Sync", "Success: Database restored from Google Drive backup.");
      
      updateSyncUI();
      renderAdminSync();
      alert("Existing database restored from Google Drive/Sheets successfully!");
      
      if (currentSection === "adm-directory") renderAdminDirectory();
      else if (currentSection === "adm-leads") renderAdminLeads();
      else if (currentSection === "adm-payouts") renderAdminPayouts();
      else if (currentSection === "adm-settings") renderAdminSettings();
    } else {
      throw new Error(resData.message || "Failed to load cloud backup");
    }
  })
  .catch(err => {
    db.addLog("Error", "Cloud Restore failed: " + err.toString());
    renderAdminSync();
    alert("Cloud Restore failed! Ensure Web App is deployed correctly. Detail: " + err.toString());
  });
}

let lastGoogleSyncPullTime = 0;

function pullOnStartup() {
  const now = Date.now();
  if (now - lastGoogleSyncPullTime < 30000) {
    console.log("[Auto-Sync] Skipped pullOnStartup: pulled less than 30s ago.");
    return;
  }

  const syncUrl = getGoogleSyncUrl();
  if (!syncUrl) return;

  lastGoogleSyncPullTime = now;

  const payload = {
    action: "pull"
  };

  fetch(syncUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error("Network response was not ok: " + res.status);
    return res.json();
  })
  .then(resData => {
    if (resData && resData.success && resData.data) {
      const data = resData.data;
      
      if (data.ambassadors && data.ambassadors.length > 0) db.saveAmbassadors(data.ambassadors);
      if (data.referrals && data.referrals.length > 0) db.saveReferrals(data.referrals);
      if (data.chats) db.saveChats(data.chats);
      if (data.announcements) db.saveAnnouncements(data.announcements);
      if (data.logs && data.logs.length > 0) {
        db._cache.logs = data.logs;
        db._syncToServer("logs", data.logs);
      }
      
      const timestampStr = new Date().toLocaleString("en-IN");
      localStorage.setItem("google_sync_last_time", timestampStr);
      
      updateSyncUI();
      
      // Update session if role/user is active
      const activeRole = localStorage.getItem("currentRole");
      const activeUserStr = localStorage.getItem("currentUser");
      if (activeRole && activeUserStr) {
        try {
          const activeUser = JSON.parse(activeUserStr);
          if (activeRole === "ambassador") {
            const stats = db.getAmbassadorStats(activeUser.id);
            if (stats) {
              currentUser = stats.ambassador;
              localStorage.setItem("currentUser", JSON.stringify(currentUser));
            }
          }
        } catch(e) {}
      }

      // Re-render current active section
      if (currentSection === "amb-dashboard") renderAmbassadorDashboard();
      else if (currentSection === "amb-referrals") renderAmbassadorReferrals();
      else if (currentSection === "amb-payouts") renderAmbassadorPayouts();
      else if (currentSection === "amb-bank-details") renderAmbassadorBankDetails();
      else if (currentSection === "amb-profile") renderAmbassadorProfile();
      else if (currentSection === "amb-chat") renderAmbassadorChat();
      else if (currentSection === "adm-dashboard") renderAdminDashboard();
      else if (currentSection === "adm-directory") renderAdminDirectory();
      else if (currentSection === "adm-leads") renderAdminLeads();
      else if (currentSection === "adm-payouts") renderAdminPayouts();
      else if (currentSection === "adm-chats") renderAdminChats();
      else if (currentSection === "adm-settings") renderAdminSettings();
      else if (currentSection === "adm-sync") renderAdminSync();
      
      console.log("Auto-synced latest cloud data on startup.");
    }
  })
  .catch(err => {
    console.error("Failed to auto-sync latest cloud data on startup:", err);
  });
}

let autoSaveDebounceTimeout = null;
function triggerBackgroundAutoSave() {
  const syncUrl = getGoogleSyncUrl();
  if (!syncUrl) return;

  if (autoSaveDebounceTimeout) clearTimeout(autoSaveDebounceTimeout);
  autoSaveDebounceTimeout = setTimeout(() => {
    pushToGoogleSync(true);
  }, 1000);
}

// Intercept database saves to automatically trigger background cloud sync
const originalSaveAmbassadors = db.saveAmbassadors;
db.saveAmbassadors = function(ambassadors) {
  originalSaveAmbassadors.call(db, ambassadors);
  triggerBackgroundAutoSave();
};

const originalSaveReferrals = db.saveReferrals;
db.saveReferrals = function(referrals) {
  originalSaveReferrals.call(db, referrals);
  triggerBackgroundAutoSave();
};

const originalSaveChats = db.saveChats;
db.saveChats = function(chats) {
  originalSaveChats.call(db, chats);
  triggerBackgroundAutoSave();
};

const originalSaveAnnouncements = db.saveAnnouncements;
db.saveAnnouncements = function(announcements) {
  originalSaveAnnouncements.call(db, announcements);
  triggerBackgroundAutoSave();
};

function initGoogleSyncLogic() {
  const elCodeBlock = document.getElementById("apps-script-code-block");
  if (elCodeBlock) elCodeBlock.value = APPS_SCRIPT_CODE;

  updateSyncUI();

  const btnSave = document.getElementById("btn-save-google-sync-url");
  if (btnSave) {
    btnSave.addEventListener("click", () => {
      const urlEl = document.getElementById("settings-google-sync-url");
      const url = urlEl ? urlEl.value.trim() : "";
      
      if (url) {
        localStorage.setItem("google_sync_url", url);
        db.addLog("Sync", `Configured new Google Web App URL: ${url.substring(0, 45)}...`);
        alert("Google Sync configuration saved successfully!\n\nTo make this URL active for all ambassadors on all devices, please copy this URL and update the 'DEFAULT_GOOGLE_SYNC_URL' variable in 'src/main.js' and build/re-deploy.");
      } else {
        localStorage.removeItem("google_sync_url");
        db.addLog("Sync", "Cleared Google Web App URL configuration.");
        alert("Google Sync configuration cleared.");
      }
      updateSyncUI();
      renderAdminSync();
    });
  }

  const btnPush = document.getElementById("btn-google-sync-push");
  if (btnPush) {
    btnPush.addEventListener("click", () => {
      const syncUrl = getGoogleSyncUrl();
      if (!syncUrl) {
        alert("Please paste your Google Apps Script Web App URL first!");
        return;
      }
      btnPush.disabled = true;
      btnPush.textContent = "Syncing with Cloud...";
      
      pushToGoogleSync(false)
        .then(() => {
          alert("Backup uploaded to Google Sheets & Drive successfully!");
        })
        .catch(err => {
          console.error("Sync push error", err);
        })
        .finally(() => {
          btnPush.disabled = false;
          btnPush.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:8px; display:inline-block; vertical-align:middle;"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> Backup & Sync to Cloud (Push)`;
        });
    });
  }

  const btnPull = document.getElementById("btn-google-sync-pull");
  if (btnPull) {
    btnPull.addEventListener("click", () => {
      const syncUrl = getGoogleSyncUrl();
      if (!syncUrl) {
        alert("Please paste your Google Apps Script Web App URL first!");
        return;
      }
      if (confirm("WARNING: This will overwrite your local browser database with the backup saved on Google Drive. Do you want to proceed?")) {
        btnPull.disabled = true;
        btnPull.textContent = "Restoring Database...";
        pullFromGoogleSync();
        btnPull.disabled = false;
        btnPull.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:8px; display:inline-block; vertical-align:middle;"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Restore Data from Cloud (Pull)`;
      }
    });
  }

  const btnCopy = document.getElementById("btn-copy-apps-script");
  if (btnCopy) {
    btnCopy.addEventListener("click", () => {
      navigator.clipboard.writeText(APPS_SCRIPT_CODE)
        .then(() => {
          btnCopy.textContent = "Copied!";
          setTimeout(() => {
            btnCopy.textContent = "Copy Code";
          }, 2000);
        });
    });
  }

  const btnToggle = document.getElementById("btn-toggle-sync-instructions");
  const content = document.getElementById("sync-instructions-content");
  const chevron = document.getElementById("sync-instructions-chevron");
  if (btnToggle && content && chevron) {
    btnToggle.addEventListener("click", () => {
      const isHidden = content.style.display === "none";
      content.style.display = isHidden ? "flex" : "none";
      chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    });
  }
}

// Initialize Success Events Ticker & Google Sync Logic
initSuccessTicker();
initGoogleSyncLogic();
initDeveloperMode();

// ============================================================
//  ASYNC SESSION RESTORE (JWT-based with backend verification)
// ============================================================
(async () => {
  const authToken = localStorage.getItem("auth_token");
  
  if (authToken) {
    try {
      // Verify session with backend server
      const session = await db.verifySession();
      
      if (session) {
        // Token is valid — load data from server and restore session
        await db.loadFromServer();
        
        currentRole = session.role;
        currentUser = session.user;
        localStorage.setItem("currentRole", session.role);
        localStorage.setItem("currentUser", JSON.stringify(session.user));
        
        if (currentRole === "admin") {
          switchView("admin");
          switchSection("adm-dashboard");
        } else {
          switchView("ambassador");
          switchSection("amb-dashboard");
          updateSidebarProfile();
        }
        
        console.log("[App] Session restored from backend.");
      } else {
        // Token expired or invalid
        db.logout();
        switchView("login");
      }
    } catch (e) {
      console.error("Session restore failed:", e);
      // Fallback: try localStorage session
      const savedRole = localStorage.getItem("currentRole");
      const savedUser = localStorage.getItem("currentUser");
      if (savedRole && savedUser) {
        try {
          currentRole = savedRole;
          currentUser = JSON.parse(savedUser);
          if (currentRole === "admin") {
            switchView("admin");
            switchSection("adm-dashboard");
          } else {
            switchView("ambassador");
            switchSection("amb-dashboard");
            updateSidebarProfile();
          }
        } catch(e2) {
          db.logout();
          switchView("login");
        }
      } else {
        switchView("login");
      }
    }
  } else {
    switchView("login");
  }
})();

// Start a periodic background sync (every 60 seconds)
setInterval(() => {
  if (document.visibilityState === "visible" && currentUser) {
    if (currentRole === "admin") {
      console.log("[Auto-Sync] Admin active: pulling latest data from Google Sheets...");
      pullOnStartup();
    } else if (currentRole === "ambassador") {
      console.log("[Auto-Sync] Ambassador active: loading latest data from backend server...");
      db.loadFromServer().then(loaded => {
        if (loaded) {
          // Re-render current active section
          if (currentSection === "amb-dashboard") renderAmbassadorDashboard();
          else if (currentSection === "amb-referrals") renderAmbassadorReferrals();
          else if (currentSection === "amb-payouts") renderAmbassadorPayouts();
          else if (currentSection === "amb-bank-details") renderAmbassadorBankDetails();
          else if (currentSection === "amb-profile") renderAmbassadorProfile();
          else if (currentSection === "amb-chat") renderAmbassadorChat();
        }
      });
    }
  }
}, 60000); // every 60 seconds
