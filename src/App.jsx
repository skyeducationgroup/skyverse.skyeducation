import React, { useState, useEffect } from 'react';
import { LayoutDashboard, UserPlus, Table, Settings, LogOut, BookOpen, Sun, Moon, Award, User, RefreshCw, CheckSquare, Shield, Mail, Briefcase, Smartphone, Activity, Lock, Unlock, Trophy, Coins, Star, Zap, Flame, Rocket, Crown, Target, Gem, Info, Calendar } from 'lucide-react';
import Login from './components/Login';
import CounsellorForm from './components/CounsellorForm';
import AdminDashboard from './components/AdminDashboard';
import AdmissionsTable from './components/AdmissionsTable';
import SettingsPanel from './components/SettingsPanel';
import ApprovalsPanel from './components/ApprovalsPanel';
import './App.css';

const renderMarkdown = (mdText) => {
  if (!mdText) return null;
  const lines = mdText.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];
  let inTable = false;
  let tableRows = [];
  let tableHeaders = null;

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ paddingLeft: '24px', marginBottom: '16px', listStyleType: 'disc' }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {item}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = (key) => {
    if (tableRows.length > 0 || tableHeaders) {
      elements.push(
        <div key={`table-wrapper-${key}`} style={{ overflowX: 'auto', marginBottom: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            {tableHeaders && (
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  {tableHeaders.map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', fontWeight: 650, color: 'var(--text-primary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: rIdx === tableRows.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      tableHeaders = null;
      inTable = false;
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();

    // Handle Table
    if (line.startsWith('|')) {
      flushList(idx);
      inTable = true;
      const cells = line.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
      
      // Skip alignment rows
      if (line.includes('---')) {
        continue;
      }

      if (!tableHeaders && tableRows.length === 0) {
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable(idx);
    }

    // Handle Lists
    if (line.startsWith('*') || line.startsWith('-')) {
      const itemText = line.substring(1).trim();
      listItems.push(itemText);
      inList = true;
      continue;
    } else if (inList) {
      flushList(idx);
    }

    // Handle Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={idx} style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '24px', marginBottom: '16px', color: 'var(--text-primary)', borderBottom: '2px solid var(--accent-primary)', paddingBottom: '8px' }}>
          {line.substring(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={idx} style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '24px', marginBottom: '12px', color: 'var(--accent-light)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
          {line.substring(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={idx} style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '16px', marginBottom: '8px', color: 'var(--emerald)' }}>
          {line.substring(4)}
        </h3>
      );
    } 
    // Handle Horizontal Rule
    else if (line === '---') {
      elements.push(
        <hr key={idx} style={{ border: 'none', height: '1px', backgroundColor: 'var(--border-color)', margin: '24px 0' }} />
      );
    } 
    // Handle Paragraph
    else if (line.length > 0) {
      elements.push(
        <p key={idx} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
          {line}
        </p>
      );
    }
  }

  // Flush remaining open groups
  flushList('end');
  flushTable('end');

  return elements;
};

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('form');
  const [ledgerFilters, setLedgerFilters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('crm_theme') || 'light';
  });
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [approvalsCount, setApprovalsCount] = useState(0);
  const [settingsInitialTab, setSettingsInitialTab] = useState('dropdowns');
  const [disclaimerText, setDisclaimerText] = useState('');
  const [loadingDisclaimer, setLoadingDisclaimer] = useState(false);
  const [incentiveRequests, setIncentiveRequests] = useState([]);
  const [submittingBadgeId, setSubmittingBadgeId] = useState(null);

  const fetchApprovalsCount = () => {
    if (user && (user.role === 'admin' || user.role === 'it')) {
      Promise.all([
        fetch('/api/approvals').then(res => res.json()).catch(() => []),
        fetch('/api/incentive-requests').then(res => res.json()).catch(() => [])
      ])
        .then(([admissions, incentives]) => {
          const pendingIncentives = incentives.filter(r => r.status === 'pending');
          setApprovalsCount(admissions.length + pendingIncentives.length);
        })
        .catch(err => console.error('Error fetching approvals count:', err));
    }
  };

  useEffect(() => {
    fetchApprovalsCount();
  }, [user, activeTab]);

  const fetchIncentiveRequests = () => {
    if (user) {
      let url = '/api/incentive-requests';
      const params = [];
      if (user.role === 'counsellor' || user.role === 'tl') {
        params.push(`username=${encodeURIComponent(user.username)}`);
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      fetch(url)
        .then(res => res.json())
        .then(data => setIncentiveRequests(data))
        .catch(err => console.error('Error fetching incentive requests in App:', err));
    }
  };

  useEffect(() => {
    fetchIncentiveRequests();
  }, [user, activeTab]);

  const handleSendBadgeRequest = async (badge, currentRequestsCount) => {
    if (submittingBadgeId !== null) return;
    setSubmittingBadgeId(badge.key);
    try {
      const occurrenceIndex = currentRequestsCount + 1;
      const res = await fetch('/api/incentive-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counsellorName: user.name,
          counsellorUsername: user.username,
          periodId: badge.key,
          range: `Occurrence ${occurrenceIndex}`,
          target: 0,
          revenue: 0,
          percentage: 100,
          amount: badge.baseAmount
        })
      });
      if (res.ok) {
        fetchIncentiveRequests();
        fetchApprovalsCount();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit claim request');
      }
    } catch (err) {
      alert('Error submitting request: ' + err.message);
    } finally {
      setSubmittingBadgeId(null);
    }
  };

  // Fetch profile data and achievements from settings
  useEffect(() => {
    if (activeTab === 'profile' && user) {
      setLoadingProfile(true);
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          const matched = data.users?.find(u => u.username.toLowerCase() === user.username.toLowerCase());
          setProfileData(matched);
          setLoadingProfile(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingProfile(false);
        });
    }
  }, [activeTab, user]);

  // Fetch Policy Disclaimer settings dynamically when tab active
  useEffect(() => {
    if (activeTab === 'disclaimer' && user) {
      setLoadingDisclaimer(true);
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          setDisclaimerText(data.policyDisclaimer?.text || '');
          setLoadingDisclaimer(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingDisclaimer(false);
        });
    }
  }, [activeTab, user]);

  // Apply theme to document body
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('crm_theme', theme);
  }, [theme]);


  // Restore session from localStorage on load with 7-day expiration check
  useEffect(() => {
    const savedUser = localStorage.getItem('crm_user');
    const loginTimeStr = localStorage.getItem('crm_login_time');
    
    if (savedUser) {
      if (loginTimeStr) {
        const loginTime = parseInt(loginTimeStr, 10);
        const elapsed = Date.now() - loginTime;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        
        if (elapsed > sevenDaysMs) {
          localStorage.removeItem('crm_user');
          localStorage.removeItem('crm_login_time');
          setUser(null);
          alert('Your session has expired (7-day security limit). Please login again.');
          setLoading(false);
          return;
        }
      }
      
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      // Admin, IT and TL default to Dashboard, Counsellor defaults to Form
      setActiveTab((parsed.role === 'admin' || parsed.role === 'it' || parsed.role === 'tl') ? 'dashboard' : 'form');
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('crm_user', JSON.stringify(userData));
    localStorage.setItem('crm_login_time', Date.now().toString());
    setActiveTab((userData.role === 'admin' || userData.role === 'it' || userData.role === 'tl') ? 'dashboard' : 'form');
  };

  const handleLogout = () => {
    if (user) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          name: user.name,
          role: user.role
        })
      }).catch(err => console.error('Failed to log logout event:', err));
    }
    setUser(null);
    localStorage.removeItem('crm_user');
    localStorage.removeItem('crm_login_time');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'white' }}>
        <span>Loading Portal Session...</span>
      </div>
    );
  }

  // If not authenticated, force login page
  if (!user) {
    return (
      <>
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1001 }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-action-icon"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--glass-bg)', width: '38px', height: '38px' }}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <Login onLogin={handleLogin} />
      </>
    );
  }

  const renderProfileView = () => {
    if (loadingProfile) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '10px' }}>
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent-primary)' }} />
          <span>Fetching Profile & Achievements...</span>
        </div>
      );
    }

    const matchedUser = profileData || user;
    const achievements = matchedUser.achievements || {
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

    // Calculate total incentive bonus cash based on approved requests
    const badgeKeys = ['doubleStrike', 'hattrickHero', 'skyStorm', 'skyTsunami', 'consistencyChampion'];
    const totalBonusCash = incentiveRequests
      .filter(r => 
        r.status === 'approved' && 
        badgeKeys.includes(r.periodId) &&
        r.counsellorUsername?.toLowerCase() === matchedUser.username?.toLowerCase()
      )
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Achievements progress tracking
    const activeBadgeKeys = [
      'doubleStrike', 'hattrickHero', 'skyStorm', 'skyTsunami', 'consistencyChampion',
      'skyStriker', 'skyWarrior', 'skyCommander', 'skyRatna'
    ];
    const unlockedCount = activeBadgeKeys.filter(k => achievements[k] > 0 || achievements[k] === true).length;
    const totalAchievements = activeBadgeKeys.length;
    const progressPercent = Math.round((unlockedCount / totalAchievements) * 100);

    const getRoleBadgeStyle = (role) => {
      const isLight = theme === 'light';
      switch (role?.toLowerCase()) {
        case 'admin':
          return isLight 
            ? { background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.15) 100%)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#b91c1c' }
            : { background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.3) 100%)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' };
        case 'it':
          return isLight
            ? { background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.15) 100%)', borderColor: 'rgba(59, 130, 246, 0.35)', color: '#1d4ed8' }
            : { background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.3) 100%)', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#93c5fd' };
        case 'tl':
          return isLight
            ? { background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.15) 100%)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#b45309' }
            : { background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.3) 100%)', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fcd34d' };
        default: // counsellor
          return isLight
            ? { background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.15) 100%)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#047857' }
            : { background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.3) 100%)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#6ee7b7' };
      }
    };

    const roleStyle = getRoleBadgeStyle(matchedUser.role);

    return (
      <div className="profile-container animate-fade-in">
        <style>{`
          .profile-container {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
          
          .profile-grid-header {
            display: grid;
            grid-template-columns: 1.2fr 2.8fr;
            gap: 24px;
          }
          
          @media (max-width: 992px) {
            .profile-grid-header {
              grid-template-columns: 1fr;
            }
          }

          .premium-avatar-card {
            background: var(--glass-bg);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-lg);
            backdrop-filter: var(--glass-blur);
            border-radius: var(--radius-lg);
            padding: 32px 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .premium-avatar-card:hover {
            transform: translateY(-4px);
            border-color: rgba(99, 102, 241, 0.35);
            box-shadow: 0 16px 48px rgba(99, 102, 241, 0.15);
          }

          .avatar-wrapper {
            position: relative;
            padding: 8px;
            margin-bottom: 16px;
            display: inline-block;
          }

          .avatar-orbit-glow {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border-radius: 50%;
            border: 2px dashed rgba(99, 102, 241, 0.45);
            animation: rotateOrbit 15s linear infinite;
            pointer-events: none;
          }

          @keyframes rotateOrbit {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .avatar-glow-ring {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 50%, #4f46e5 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.8rem;
            font-weight: 800;
            color: white;
            border: 4px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 0 25px rgba(99, 102, 241, 0.4);
            position: relative;
            z-index: 2;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .premium-avatar-card:hover .avatar-glow-ring {
            transform: scale(1.05) rotate(5deg);
            box-shadow: 0 0 35px rgba(99, 102, 241, 0.6);
            border-color: rgba(255, 255, 255, 0.2);
          }

          .avatar-status-badge {
            position: absolute;
            bottom: 12px;
            right: 12px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: var(--emerald);
            border: 3px solid var(--bg-secondary);
            box-shadow: 0 0 10px var(--emerald);
            z-index: 3;
            animation: pulseStatus 2s infinite alternate;
          }

          @keyframes pulseStatus {
            0% { transform: scale(0.9); opacity: 0.8; }
            100% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 14px var(--emerald); }
          }

          .premium-badge-role {
            text-transform: uppercase;
            font-size: 0.7rem;
            font-weight: 850;
            letter-spacing: 1px;
            padding: 6px 16px;
            border-radius: 30px;
            margin-top: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
            border: 1px solid;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }

          .premium-details-card {
            background: var(--glass-bg);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-lg);
            backdrop-filter: var(--glass-blur);
            border-radius: var(--radius-lg);
            padding: 32px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.4s ease;
          }
          
          .premium-details-card:hover {
            border-color: var(--accent-light);
          }

          .profile-fields-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            flex-grow: 1;
          }

          .profile-field-item {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 14px 18px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 14px;
          }
          
          .profile-field-item:hover {
            background: var(--bg-tertiary);
            border-color: var(--accent-primary);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          .field-icon-container {
            width: 40px;
            height: 40px;
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s ease;
          }

          .profile-field-item:hover .field-icon-container {
            transform: scale(1.05);
            border-color: rgba(99, 102, 241, 0.4);
            background-color: rgba(99, 102, 241, 0.15) !important;
          }

          /* Achievement Locker Styling */
          .achievement-locker-card {
            background: var(--glass-bg);
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-lg);
            backdrop-filter: var(--glass-blur);
            border-radius: var(--radius-lg);
            padding: 32px;
            position: relative;
            overflow: hidden;
          }

          .bonus-vault-card {
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, #059669 0%, #10b981 50%, #059669 100%);
            color: white;
            font-weight: 700;
            font-size: 0.95rem;
            padding: 10px 22px;
            border-radius: var(--radius-md);
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 20px rgba(16, 185, 129, 0.35);
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .bonus-vault-card:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
          }
          
          .bonus-vault-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 50%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transform: skewX(-20deg);
            animation: shineEffect 4s infinite linear;
          }

          @keyframes shineEffect {
            0% { left: -100%; }
            45% { left: 100%; }
            100% { left: 100%; }
          }

          /* Titles Cards styling */
          .unlocked-title-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(251, 191, 36, 0.04) 100%);
            border: 1px solid rgba(245, 158, 11, 0.4);
            border-radius: var(--radius-md);
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.08);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
          }
          
          .unlocked-title-card:hover {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
            border-color: rgba(245, 158, 11, 0.8);
          }

          .locked-title-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            opacity: 0.5;
            transition: all 0.3s ease;
          }
          
          .locked-title-card:hover {
            opacity: 0.8;
            background: var(--bg-tertiary);
            border-color: var(--border-color);
            transform: scale(0.99);
          }

          .badge-icon-wrapper {
            font-size: 2.2rem;
            display: inline-block;
            transition: transform 0.4s ease;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
          }
          
          .unlocked-title-card:hover .badge-icon-wrapper {
            transform: scale(1.15) rotate(8deg);
          }

          .premium-badge-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          
          @media (max-width: 576px) {
            .premium-badge-grid {
              grid-template-columns: 1fr;
            }
          }

          .unlocked-badge-card {
            border-radius: var(--radius-md);
            padding: 18px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 130px;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 1px solid;
          }
          
          .unlocked-badge-card:hover {
            transform: translateY(-5px) scale(1.02);
          }
          
          .unlocked-badge-card:hover .badge-icon-wrapper {
            transform: scale(1.15) rotate(8deg);
          }

          /* Unlocked Badges Themes */
          .badge-doubleStrike { 
            border-color: rgba(245, 158, 11, 0.45); 
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.03) 100%); 
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.08); 
          }
          .badge-doubleStrike:hover { 
            border-color: rgba(245, 158, 11, 0.8); 
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.25); 
          }
          
          .badge-hattrickHero { 
            border-color: rgba(239, 68, 68, 0.45); 
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.03) 100%); 
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.08); 
          }
          .badge-hattrickHero:hover { 
            border-color: rgba(239, 68, 68, 0.8); 
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.25); 
          }
          
          .badge-skyStorm { 
            border-color: rgba(168, 85, 247, 0.45); 
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0.03) 100%); 
            box-shadow: 0 4px 15px rgba(168, 85, 247, 0.08); 
          }
          .badge-skyStorm:hover { 
            border-color: rgba(168, 85, 247, 0.8); 
            box-shadow: 0 8px 25px rgba(168, 85, 247, 0.25); 
          }
          
          .badge-skyTsunami { 
            border-color: rgba(59, 130, 246, 0.45); 
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.03) 100%); 
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.08); 
          }
          .badge-skyTsunami:hover { 
            border-color: rgba(59, 130, 246, 0.8); 
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25); 
          }
          
          .badge-consistencyChampion { 
            border-color: rgba(16, 185, 129, 0.45); 
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.03) 100%); 
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.08); 
          }
          .badge-consistencyChampion:hover { 
            border-color: rgba(16, 185, 129, 0.8); 
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.25); 
          }

          .locked-badge-card {
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 18px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 130px;
            opacity: 0.5;
            filter: grayscale(100%);
            transition: all 0.3s ease;
          }
          
          .locked-badge-card:hover {
            opacity: 0.8;
            filter: grayscale(70%);
            background: var(--bg-tertiary);
            border-color: var(--border-color);
            transform: scale(0.99);
          }

          .multiplier-badge {
            background: var(--accent-secondary);
            color: white;
            font-size: 0.75rem;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 12px;
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
            animation: pulseGlowAnimation 2s infinite alternate;
          }

          @keyframes pulseGlowAnimation {
            0% { transform: scale(1); opacity: 0.9; }
            100% { transform: scale(1.08); opacity: 1; }
          }
        `}</style>

        {/* Profile Card & Info */}
        <div className="profile-grid-header">
          {/* Avatar & Card */}
          <div className="premium-avatar-card">
            <div className="avatar-wrapper">
              <div className="avatar-orbit-glow"></div>
              <div className="avatar-glow-ring">
                {matchedUser.name?.charAt(0).toUpperCase()}
              </div>
              <div className="avatar-status-badge" title="Status: Active"></div>
            </div>
            
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
              {matchedUser.name}
            </h3>
            
            <span className="premium-badge-role" style={roleStyle}>
              <Shield size={13} /> {matchedUser.role} Account
            </span>
            
            {/* Achievement progress */}
            <div style={{ width: '100%', marginTop: '24px', padding: '0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <span>Achievement Lock Progress</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{unlockedCount}/{totalAchievements} Unlocked</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '3px', boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)' }}></div>
              </div>
            </div>

            <div style={{ marginTop: '24px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Member Since
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.92rem', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Calendar size={14} style={{ color: 'var(--accent-light)' }} />
                {matchedUser.dateOfJoining || 'N/A'}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="premium-details-card">
            <h3 style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--accent-primary)' }} />
              Account details (Read-Only)
            </h3>
            
            <div className="profile-fields-grid">
              <div className="profile-field-item">
                <div className="field-icon-container" style={{ backgroundColor: theme === 'light' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.08)' }}>
                  <User size={18} style={{ color: theme === 'light' ? '#2563eb' : '#60a5fa' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 500 }}>Full Name</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{matchedUser.name}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <div className="field-icon-container" style={{ backgroundColor: theme === 'light' ? 'rgba(79, 70, 229, 0.08)' : 'rgba(99, 102, 241, 0.08)' }}>
                  <Mail size={18} style={{ color: theme === 'light' ? '#4f46e5' : '#a5b4fc' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 500 }}>Login Username</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{matchedUser.username}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <div className="field-icon-container" style={{ backgroundColor: theme === 'light' ? 'rgba(5, 150, 105, 0.08)' : 'rgba(16, 185, 129, 0.08)' }}>
                  <Briefcase size={18} style={{ color: theme === 'light' ? '#059669' : '#6ee7b7' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 500 }}>Account Type / Role</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{matchedUser.role}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <div className="field-icon-container" style={{ backgroundColor: theme === 'light' ? 'rgba(217, 119, 6, 0.08)' : 'rgba(245, 158, 11, 0.08)' }}>
                  <Shield size={18} style={{ color: theme === 'light' ? '#d97706' : '#fcd34d' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 500 }}>Employee ID / Number</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{matchedUser.employeeNumber || 'Not Specified'}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <div className="field-icon-container" style={{ backgroundColor: theme === 'light' ? 'rgba(124, 58, 237, 0.08)' : 'rgba(192, 132, 252, 0.08)' }}>
                  <Smartphone size={18} style={{ color: theme === 'light' ? '#7c3aed' : '#c084fc' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 500 }}>Mobile Number</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{matchedUser.mobileNumber || 'Not Specified'}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <div className="field-icon-container" style={{ backgroundColor: theme === 'light' ? 'var(--emerald-bg)' : 'rgba(16, 185, 129, 0.08)' }}>
                  <Activity size={18} style={{ color: 'var(--emerald)' }} />
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 500 }}>Status</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--emerald)' }}>Active</span>
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '24px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={14} style={{ color: 'var(--amber)' }} />
              Profile details can only be modified by the System Administrator.
            </div>
          </div>
        </div>

        {/* Google 2FA Setup Card if enabled */}
        {matchedUser.twoFactorEnabled && (
          <div className="achievement-locker-card animate-fade-in" style={{ borderLeft: '4px solid var(--amber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
              <Shield size={20} style={{ color: 'var(--amber)' }} />
              <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                Google Authenticator (2FA) Security Setup
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Your account has Google 2-Factor Authentication enabled. If you have not paired your Google Authenticator app on your smartphone, scan the QR code below or enter the secret key manually.
            </p>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`otpauth://totp/SkyAdmissions:${matchedUser.username}?secret=${matchedUser.twoFactorSecret}&issuer=SkyAdmissions`)}`}
                alt="2FA QR Code"
                style={{ border: '4px solid white', borderRadius: '4px', width: '140px', height: '140px' }}
              />
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Authenticator Secret Key:</span>
                <code style={{ fontSize: '0.9rem', color: 'var(--accent-light)', padding: '4px 8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', letterSpacing: '1px', display: 'inline-block', fontFamily: 'monospace' }}>
                  {matchedUser.twoFactorSecret}
                </code>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '10px' }}>
                  Tip: Download Google Authenticator or Microsoft Authenticator from App Store / Play Store. Scan code and enter the 6-digit dynamic OTP to login next time.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Achievement Locker & Bonuses */}
        <div className="achievement-locker-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
              <Trophy size={22} style={{ color: 'var(--amber)' }} />
              🏆 Achievement & Badge Locker
            </h3>
            <div className="bonus-vault-card">
              <Coins size={18} style={{ color: '#fbbf24' }} />
              Incentive Bonus Earned: Rs. {totalBonusCash.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="profile-locker-grid">
            {/* Period Winner Titles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Period Target Titles</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { key: 'skyStriker', title: 'Sky Striker', emoji: '🏹', desc: 'Monthly Target Achieved Winner', color: 'var(--amber)' },
                  { key: 'skyWarrior', title: 'Sky Warrior', emoji: '⚔️', desc: 'Quarterly Target Achieved Winner', color: '#c084fc' },
                  { key: 'skyCommander', title: 'Sky Commander', emoji: '👑', desc: 'Half-Yearly Target Achieved Winner', color: '#60a5fa' },
                  { key: 'skyRatna', title: 'Sky Ratna', emoji: '💎', desc: 'Annual Target Achieved Winner', color: '#f43f5e' }
                ].map((title) => {
                  const active = !!achievements[title.key];
                  return active ? (
                    <div key={title.key} className="unlocked-title-card">
                      <span className="badge-icon-wrapper">{title.emoji}</span>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: title.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {title.title} 
                          <span className="multiplier-badge" style={{ backgroundColor: title.color, color: '#000', fontSize: '0.65rem', padding: '2px 8px', fontWeight: 'bold' }}>
                            🏆 Unlocked
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{title.desc}</div>
                      </div>
                    </div>
                  ) : (
                    <div key={title.key} className="locked-title-card" title="Complete targets to unlock this title">
                      <span className="badge-icon-wrapper" style={{ opacity: 0.4 }}>{title.emoji}</span>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {title.title} 
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Lock size={10} /> Locked
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{title.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Badges Locker Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>Incentive Badge Locker</h4>
              <div className="premium-badge-grid">
                {[
                  { key: 'doubleStrike', title: 'Double Strike', emoji: '⚡', bonus: '₹500 / day', baseAmount: 500, desc: '2 Admissions Same Day' },
                  { key: 'hattrickHero', title: 'Hattrick Hero', emoji: '🔥', bonus: '₹1,500 / day', baseAmount: 1500, desc: '3 Admissions Same Day' },
                  { key: 'skyStorm', title: 'Sky Storm', emoji: '🚀', bonus: '₹3,000 / day', baseAmount: 3000, desc: '4 Admissions Same Day' },
                  { key: 'skyTsunami', title: 'Sky Tsunami', emoji: '👑', bonus: '₹5,000 / day', baseAmount: 5000, desc: '5 Admissions Same Day' },
                  { key: 'consistencyChampion', title: 'Consistency Champ', emoji: '🎯', bonus: '₹1,500 / month', baseAmount: 1500, desc: '1 Admission Every Week' }
                ].map((badge) => {
                  const count = achievements[badge.key] || 0;
                  const active = count > 0;
                  
                  const badgeRequests = incentiveRequests.filter(r => 
                    r.periodId === badge.key &&
                    r.counsellorUsername?.toLowerCase() === matchedUser.username?.toLowerCase()
                  );
                  const pendingCount = badgeRequests.filter(r => r.status === 'pending').length;
                  const approvedCount = badgeRequests.filter(r => r.status === 'approved').length;
                  const totalRequested = pendingCount + approvedCount;
                  const canClaim = totalRequested < count && (user?.role === 'counsellor' || user?.role === 'tl') && user.username.toLowerCase() === matchedUser.username.toLowerCase();

                  return active ? (
                    <div key={badge.key} className={`unlocked-badge-card badge-${badge.key}`} style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span className="badge-icon-wrapper">{badge.emoji}</span>
                          <span className="multiplier-badge">
                            × {count}
                          </span>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{badge.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{badge.desc}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Unlock size={12} /> Earned: Rs. {(count * badge.baseAmount).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>
                      
                      {/* Claims Status & Actions */}
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <span>Claims submitted:</span>
                          <span style={{ fontWeight: 'bold' }}>{totalRequested} / {count}</span>
                        </div>
                        
                        {/* Mini list of requests for this badge */}
                        {badgeRequests.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto', paddingRight: '4px' }}>
                            {badgeRequests.map((r) => (
                              <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', fontSize: '0.68rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 500 }}>{r.range}:</span>
                                  <span className={`badge ${
                                    r.status === 'approved' ? 'badge-done' : r.status === 'rejected' ? 'badge-refund' : 'badge-pending'
                                  }`} style={{ fontSize: '0.6rem', padding: '0 4px', textTransform: 'uppercase' }}>
                                    {r.status === 'pending' ? '⌛ Pending' : r.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                                  </span>
                                </div>
                                {r.comment && (
                                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic', wordBreak: 'break-word' }}>
                                    Comment: "{r.comment}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Request Button */}
                        {canClaim && (
                          <button
                            className="btn-action-sm primary"
                            style={{ margin: '4px 0 0 0', width: '100%', padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                            onClick={() => handleSendBadgeRequest(badge, totalRequested)}
                            disabled={submittingBadgeId !== null}
                          >
                            {submittingBadgeId === badge.key ? (
                              <RefreshCw className="animate-spin" size={10} style={{ marginRight: '4px' }} />
                            ) : (
                              <Award size={10} style={{ marginRight: '4px' }} />
                            )}
                            Claim Incentive (Rs. {badge.baseAmount})
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div key={badge.key} className="locked-badge-card" title={`Record ${badge.desc} to unlock`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="badge-icon-wrapper" style={{ opacity: 0.4 }}>{badge.emoji}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Lock size={10} /> Locked
                        </span>
                      </div>
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{badge.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{badge.desc}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>Value: {badge.bonus}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render view based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (user.role === 'admin' || user.role === 'it' || user.role === 'tl' || user.role === 'counsellor') ? (
          <AdminDashboard 
            currentUser={user}
            onNavigate={(tab, filters) => {
              setActiveTab(tab);
              setLedgerFilters(filters);
            }} 
          />
        ) : (
          <CounsellorForm currentUser={user} />
        );
      case 'form':
        return <CounsellorForm currentUser={user} />;
      case 'table':
        return (user.role === 'admin' || user.role === 'it' || user.role === 'tl' || user.role === 'counsellor') ? (
          <AdmissionsTable 
            currentUser={user}
            initialFilters={ledgerFilters} 
            clearInitialFilters={() => setLedgerFilters(null)} 
          />
        ) : (
          <CounsellorForm currentUser={user} />
        );
      case 'settings':
        return (user.role === 'admin' || user.role === 'it') ? <SettingsPanel currentUser={user} initialActiveTab={settingsInitialTab} /> : <CounsellorForm currentUser={user} />;
      case 'overall-target':
        return (user.role === 'admin' || user.role === 'it' || user.role === 'tl' || user.role === 'counsellor') ? (
          <AdminDashboard 
            currentUser={user} 
            onlyShowTargetTracker={true}
          />
        ) : (
          <CounsellorForm currentUser={user} />
        );
      case 'profile':
        return renderProfileView();
      case 'approvals':
        return (user.role === 'admin' || user.role === 'it') ? (
          <ApprovalsPanel 
            currentUser={user}
            onApprovalProcessed={fetchApprovalsCount}
          />
        ) : (
          <CounsellorForm currentUser={user} />
        );
      case 'disclaimer':
        return (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>📄</span>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Policy Document Reader</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sky Education <span style={{ color: 'var(--emerald)', fontWeight: 'bold' }}>Group</span> Official Guidelines</span>
                  </div>
                </div>
                {(user.role === 'admin' || user.role === 'it') && (
                  <button
                    onClick={() => {
                      setSettingsInitialTab('disclaimer');
                      setActiveTab('settings');
                    }}
                    className="btn-submit"
                    style={{ minWidth: '140px', height: '36px', gap: '6px', fontSize: '0.8rem', padding: '0 12px' }}
                  >
                    <Settings size={14} />
                    Edit Policy Text
                  </button>
                )}
              </div>

              {loadingDisclaimer ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', gap: '10px' }}>
                  <RefreshCw className="animate-spin" size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span>Loading Policy Terms...</span>
                </div>
              ) : disclaimerText ? (
                <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '12px', textAlign: 'left' }}>
                  {renderMarkdown(disclaimerText)}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  No Policy Disclaimer document initialized.
                </div>
              )}

            </div>
          </div>
        );
      default:
        return <CounsellorForm currentUser={user} />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Analytics Dashboard';
      case 'form': return 'Admission Registration Form';
      case 'table': return 'Admissions Ledger';
      case 'settings': return 'System Settings & API Configuration';
      case 'overall-target': return 'Overall Target Tracker';
      case 'profile': return 'My User Profile & Badges';
      case 'approvals': return 'Pending Admissions Review & Approvals';
      case 'disclaimer': return 'Official Policy Disclaimer, Terms & Conditions';
      default: return 'Performance & Rewards Portal';
    }
  };

  return (
    <div className="crm-container">
      {/* Sidebar Navigation */}
      <aside className="crm-sidebar">
        <div className="sidebar-logo">
          <img 
            src="/logo.png" 
            alt="Sky Education Group Logo" 
            style={{ width: '70px', height: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', marginBottom: '8px' }} 
          />
          <div>
            <h1 className="logo-text">Sky Education <span style={{ color: 'var(--emerald)' }}>Group</span></h1>
            <span className="logo-sub">Performance & Rewards Portal</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          {(user.role === 'admin' || user.role === 'it' || user.role === 'tl' || user.role === 'counsellor') && (
            <button
              className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              Dashboard Overview
            </button>
          )}

          <button
            className={`menu-item ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            <UserPlus size={18} />
            Student Entry Form
          </button>

          {(user.role === 'admin' || user.role === 'it' || user.role === 'tl' || user.role === 'counsellor') && (
            <button
              className={`menu-item ${activeTab === 'table' ? 'active' : ''}`}
              onClick={() => setActiveTab('table')}
            >
              <Table size={18} />
              Admissions Ledger
            </button>
          )}

          {(user.role === 'admin' || user.role === 'it' || user.role === 'tl' || user.role === 'counsellor') && (
            <button
              className={`menu-item ${activeTab === 'overall-target' ? 'active' : ''}`}
              onClick={() => setActiveTab('overall-target')}
            >
              <Award size={18} />
              Overall Counsellor Target
            </button>
          )}

          <button
            className={`menu-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            My Profile
          </button>

          {(user.role === 'admin' || user.role === 'it') && (
            <button
              className={`menu-item ${activeTab === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvals')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckSquare size={18} />
                <span>Approvals</span>
              </div>
              {approvalsCount > 0 && (
                <span className="badge badge-followup" style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', backgroundColor: 'var(--rose)', color: 'white', fontWeight: 'bold' }}>
                  {approvalsCount}
                </span>
              )}
            </button>
          )}

          {(user.role === 'admin' || user.role === 'it') && (
            <button
              className={`menu-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setSettingsInitialTab('dropdowns');
                setActiveTab('settings');
              }}
            >
              <Settings size={18} />
              System Settings
            </button>
          )}
          <button
            className={`menu-item mobile-only-menu-item ${activeTab === 'disclaimer' ? 'active' : ''}`}
            onClick={() => setActiveTab('disclaimer')}
          >
            <BookOpen size={18} />
            Policy Disclaimer
          </button>
        </nav>

        <div className="sidebar-disclaimer-container">
          <button 
            onClick={() => setActiveTab('disclaimer')}
            className={`disclaimer-card-btn ${activeTab === 'disclaimer' ? 'active' : ''}`}
          >
            <BookOpen size={18} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 650, fontSize: '0.78rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Policy Disclaimer</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Terms & Conditions</div>
            </div>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user.name.charAt(0)}
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role} Portal</div>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="crm-main">
        <header className="crm-header animate-slide-in-left">
          <h2 style={{ fontSize: '1.25rem' }}>{getPageTitle()}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-action-icon"
              style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', width: '38px', height: '38px' }}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Today's Date: {new Date().toLocaleDateString('en-IN')}
            </span>
          </div>
        </header>

        <div className="crm-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
