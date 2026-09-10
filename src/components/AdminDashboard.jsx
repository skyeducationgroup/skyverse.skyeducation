import React, { useState, useEffect } from 'react';
import { Users, Award, IndianRupee, Calendar, TrendingUp, RefreshCw, Layers, BookOpen, CreditCard, RotateCcw } from 'lucide-react';

export default function AdminDashboard({ currentUser, onNavigate = () => {}, onlyShowTargetTracker = false }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date & Counsellor Filters
  const [dateFilter, setDateFilter] = useState('overall');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCustomPeriodId, setSelectedCustomPeriodId] = useState('');
  const [uniChartType, setUniChartType] = useState('bar');
  const [courseChartType, setCourseChartType] = useState('bar');
  const [selectedCounsellor, setSelectedCounsellor] = useState(() => {
    return currentUser?.role === 'counsellor' ? currentUser.name : '';
  });
  const [counsellors, setCounsellors] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedHalfYear, setSelectedHalfYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [calcStartDate, setCalcStartDate] = useState('');
  const [calcRevenue, setCalcRevenue] = useState('');
  const [calcPeriod, setCalcPeriod] = useState('monthly');
  const [fullSettings, setFullSettings] = useState(null);
  const [calcTargetType, setCalcTargetType] = useState('');
  const [incentiveRequests, setIncentiveRequests] = useState([]);
  const [submittingRequestId, setSubmittingRequestId] = useState(null);

  const getMonthsOfFiscalYear = () => {
    if (fullSettings?.dropdowns?.months && fullSettings.dropdowns.months.length > 0) {
      return [...fullSettings.dropdowns.months].sort().map(m => {
        const parts = m.split('-');
        let displayName = m;
        if (parts.length === 2) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const d = new Date(year, month, 15);
          if (!isNaN(d.getTime())) {
            displayName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        }
        return { value: m, label: displayName };
      });
    }

    if (!calcStartDate) return [];
    const months = [];
    const start = new Date(calcStartDate);
    for (let i = 0; i < 36; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const yearMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const displayName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      months.push({ value: yearMonthStr, label: displayName });
    }
    return months;
  };

  const getCounsellorDisplayName = (value) => {
    if (!value) return '';
    if (value.startsWith('team:')) {
      const username = value.substring(5);
      const uObj = fullSettings?.users?.find(u => u.username.toLowerCase() === username.toLowerCase());
      return uObj ? `${uObj.name} (Team)` : `${username} (Team)`;
    }
    return value;
  };

  const getDropdownOptions = () => {
    if (!fullSettings) return [];
    
    if (currentUser?.role === 'tl') {
      const tlUser = fullSettings.users?.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
      if (!tlUser) return [];
      const teamNames = [];
      if (tlUser.name) teamNames.push({ label: tlUser.name, value: tlUser.name });
      if (tlUser.counsellors && Array.isArray(tlUser.counsellors)) {
        tlUser.counsellors.forEach(cUsername => {
          const match = fullSettings.users?.find(u => u.username.toLowerCase() === cUsername.toLowerCase());
          if (match && match.name) {
            teamNames.push({ label: match.name, value: match.name });
          }
        });
      }
      const unique = [];
      const seen = new Set();
      teamNames.forEach(opt => {
        if (!seen.has(opt.value)) {
          seen.add(opt.value);
          unique.push(opt);
        }
      });
      return unique;
    } else {
      const options = [];
      const users = fullSettings.users || [];
      const tls = users.filter(u => u.role === 'tl');
      const staticNames = fullSettings.dropdowns?.counsellors || [];
      
      const individualNames = new Set();
      users.forEach(u => {
        if ((u.role === 'counsellor' || u.role === 'tl') && u.name) {
          individualNames.add(u.name);
        }
      });
      staticNames.forEach(name => {
        individualNames.add(name);
      });
      
      const sortedIndividuals = Array.from(individualNames).sort();
      sortedIndividuals.forEach(name => {
        options.push({ label: name, value: name });
      });
      
      tls.forEach(tl => {
        if (tl.name && tl.username) {
          options.push({
            label: `${tl.name} (Team)`,
            value: `team:${tl.username}`
          });
        }
      });
      
      return options;
    }
  };

  useEffect(() => {
    if (selectedCounsellor) {
      setCalcTargetType(selectedCounsellor);
    } else if (currentUser?.role === 'counsellor') {
      setCalcTargetType(currentUser.name);
    } else {
      setCalcTargetType('');
    }
  }, [selectedCounsellor, counsellors, currentUser]);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getActiveDateRange = () => {
    let start = '';
    let end = '';
    const now = new Date();
    
    if (dateFilter === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      start = formatLocalDate(monday);
      end = formatLocalDate(sunday);
    } else if (dateFilter === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      start = formatLocalDate(firstDay);
      end = formatLocalDate(lastDay);
    } else if (dateFilter === 'last-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      
      start = formatLocalDate(firstDay);
      end = formatLocalDate(lastDay);
    } else if (dateFilter === 'custom') {
      start = customStartDate;
      end = customEndDate;
    } else if (dateFilter === 'custom-period') {
      const matched = fullSettings?.customDateFilters?.find(f => f.id === selectedCustomPeriodId);
      if (matched) {
        start = matched.startDate;
        end = matched.endDate;
      }
    }
    return { start, end };
  };

  const handleCardClick = (filterOverride) => {
    const { start, end } = getActiveDateRange();
    const filters = {
      counsellor: selectedCounsellor,
      startDate: start,
      endDate: end,
      ...filterOverride
    };
    onNavigate('table', filters);
  };

  // Load active counsellors on mount
  useEffect(() => {
    const fetchCounsellors = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setFullSettings(data);
          if (currentUser?.role === 'tl') {
            const tlUser = data.users?.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
            if (tlUser) {
              const teamNames = [];
              if (tlUser.name) teamNames.push(tlUser.name);
              if (tlUser.counsellors && Array.isArray(tlUser.counsellors)) {
                tlUser.counsellors.forEach(cUsername => {
                  const match = data.users?.find(u => u.username.toLowerCase() === cUsername.toLowerCase());
                  if (match && match.name) teamNames.push(match.name);
                });
              }
              setCounsellors([...new Set(teamNames)]);
            } else {
              setCounsellors([]);
            }
          } else {
            if (data.dropdowns && data.dropdowns.counsellors) {
              setCounsellors(data.dropdowns.counsellors);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load settings in dashboard:', err);
      }
    };
    fetchCounsellors();
  }, [currentUser]);

  const fetchIncentiveRequests = async () => {
    try {
      let url = '/api/incentive-requests';
      const params = [];
      if (currentUser?.role === 'counsellor') {
        params.push(`username=${encodeURIComponent(currentUser.username)}`);
      } else if (selectedCounsellor) {
        let name = selectedCounsellor;
        if (selectedCounsellor.startsWith('team:')) {
          const username = selectedCounsellor.substring(5);
          const uObj = fullSettings?.users?.find(u => u.username.toLowerCase() === username.toLowerCase());
          name = uObj ? uObj.name : '';
        }
        if (name) {
          params.push(`counsellorName=${encodeURIComponent(name)}`);
        }
      }
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIncentiveRequests(data);
      }
    } catch (err) {
      console.error('Failed to load incentive requests:', err);
    }
  };

  useEffect(() => {
    fetchIncentiveRequests();
  }, [selectedCounsellor, currentUser]);

  const fetchStats = async (start = '', end = '', counsellor = '') => {
    try {
      setLoading(true);
      setError(null);
      let url = '/api/stats';
      const params = [];
      if (start) params.push(`startDate=${start}`);
      if (end) params.push(`endDate=${end}`);
      
      let targetCounsellor = counsellor;
      let targetTlUsername = '';
      if (counsellor && counsellor.startsWith('team:')) {
        targetCounsellor = '';
        targetTlUsername = counsellor.substring(5);
      }
      
      if (targetCounsellor) params.push(`counsellorName=${encodeURIComponent(targetCounsellor)}`);
      if (targetTlUsername) {
        params.push(`tlUsername=${encodeURIComponent(targetTlUsername)}`);
      } else if (currentUser?.role === 'tl') {
        params.push(`tlUsername=${encodeURIComponent(currentUser.username)}`);
      }
      
      // Pass target tracker options
      if (selectedQuarter) params.push(`selectedQuarter=${selectedQuarter}`);
      if (selectedHalfYear) params.push(`selectedHalfYear=${selectedHalfYear}`);
      if (selectedMonth) params.push(`selectedMonth=${selectedMonth}`);
      if (calcStartDate) params.push(`calculationStartDate=${calcStartDate}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        
        // Auto-initialize filters on first fetch if they are empty
        if (data.incentiveConfig && data.incentiveConfig.calculationStartDate && !calcStartDate) {
          setCalcStartDate(data.incentiveConfig.calculationStartDate);
        }
        if (data.targetMetrics) {
          if (selectedQuarter === '') {
            setSelectedQuarter(String(data.targetMetrics.currentQuarter || '1'));
          }
          if (selectedHalfYear === '') {
            setSelectedHalfYear(String(data.targetMetrics.currentHalfYear || '1'));
          }
          if (selectedMonth === '') {
            const availableMonths = getMonthsOfFiscalYear();
            const resolvedMonth = data.targetMetrics.currentMonthStr || '';
            if (availableMonths.length > 0) {
              const hasResolved = availableMonths.some(m => m.value === resolvedMonth);
              setSelectedMonth(hasResolved ? resolvedMonth : availableMonths[0].value);
            } else {
              setSelectedMonth(resolvedMonth);
            }
          }
        }
      } else {
        throw new Error('Failed to load dashboard metrics');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let start = '';
    let end = '';
    
    // Create timezone-safe local date calculations
    const now = new Date();
    
    if (dateFilter === 'week') {
      const day = now.getDay();
      // Calculate Monday of current week
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      start = formatLocalDate(monday);
      end = formatLocalDate(sunday);
    } else if (dateFilter === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      start = formatLocalDate(firstDay);
      end = formatLocalDate(lastDay);
    } else if (dateFilter === 'last-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      
      start = formatLocalDate(firstDay);
      end = formatLocalDate(lastDay);
    } else if (dateFilter === 'custom') {
      if (!customStartDate || !customEndDate) return; // Wait until both are entered
      start = customStartDate;
      end = customEndDate;
    } else if (dateFilter === 'custom-period') {
      const matched = fullSettings?.customDateFilters?.find(f => f.id === selectedCustomPeriodId);
      if (!matched) return;
      start = matched.startDate;
      end = matched.endDate;
    }
    
    fetchStats(start, end, selectedCounsellor);
  }, [dateFilter, customStartDate, customEndDate, selectedCounsellor, selectedQuarter, selectedHalfYear, selectedMonth, calcStartDate, selectedCustomPeriodId, fullSettings]);

  // Initial spinner on mount
  if (!stats && loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '10px' }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent-primary)' }} />
        <span>Computing Analytics & Compiling Charts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="duplicate-alert" style={{ backgroundColor: 'var(--rose-bg)', borderColor: 'var(--rose-border)', color: 'var(--rose)' }}>
        <span>Error loading metrics: {error}</span>
      </div>
    );
  }

  const { summary, universityStats, courseStats, leaderboard, trends } = stats;

  const renderPieOrDonutChart = (data, isDonut = false) => {
    if (data.length === 0) return <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No data available</div>;

    const total = data.reduce((sum, d) => sum + d.admissions, 0);
    if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No admissions recorded in this period</div>;

    const colors = [
      '#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#a855f7', 
      '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#eab308'
    ];

    let accumulatedPercent = 0;
    const slices = data.map((d, index) => {
      const val = d.admissions;
      const percent = val / total;
      if (percent === 0) return null;
      
      const startPercent = accumulatedPercent;
      accumulatedPercent += percent;
      const endPercent = accumulatedPercent;
      
      const startX = Math.cos(2 * Math.PI * startPercent - Math.PI / 2) * 80;
      const startY = Math.sin(2 * Math.PI * startPercent - Math.PI / 2) * 80;
      const endX = Math.cos(2 * Math.PI * endPercent - Math.PI / 2) * 80;
      const endY = Math.sin(2 * Math.PI * endPercent - Math.PI / 2) * 80;
      
      const largeArcFlag = percent > 0.5 ? 1 : 0;
      
      const pathData = [
        `M 0 0`,
        `L ${startX} ${startY}`,
        `A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `Z`
      ].join(' ');
      
      return {
        pathData,
        name: d.name,
        val,
        percent: (percent * 100).toFixed(1),
        color: colors[index % colors.length]
      };
    }).filter(Boolean);

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '24px' }}>
        <svg viewBox="-100 -100 200 200" width="180" height="180">
          {slices.length === 1 ? (
            <circle
              r="80"
              fill={slices[0].color}
              className="chart-bar"
              style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
              onMouseEnter={(e) => e.target.setAttribute('transform', 'scale(1.05)')}
              onMouseLeave={(e) => e.target.setAttribute('transform', 'scale(1)')}
            >
              <title>{`${slices[0].name}: ${slices[0].val} (${slices[0].percent}%)`}</title>
            </circle>
          ) : (
            slices.map((slice, i) => (
              <path
                key={i}
                d={slice.pathData}
                fill={slice.color}
                className="chart-bar"
                style={{ transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={(e) => e.target.setAttribute('transform', 'scale(1.05)')}
                onMouseLeave={(e) => e.target.setAttribute('transform', 'scale(1)')}
              >
                <title>{`${slice.name}: ${slice.val} (${slice.percent}%)`}</title>
              </path>
            ))
          )}
          {isDonut && (
            <>
              <circle r="48" fill="var(--bg-secondary)" />
              <text x="0" y="-5" textAnchor="middle" style={{ fill: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold' }}>
                {total}
              </text>
              <text x="0" y="10" textAnchor="middle" style={{ fill: 'var(--text-secondary)', fontSize: '8px' }}>
                Admissions
              </text>
            </>
          )}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '10px', minWidth: '140px' }}>
          {slices.map((slice, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: slice.color, borderRadius: '2px', display: 'inline-block', flexShrink: 0 }}></span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{slice.name}:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{slice.val}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLineChart = (data, mainColor = '#3b82f6', secondaryColor = '#818cf8') => {
    if (data.length === 0) return <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No data available</div>;

    const width = 500;
    const height = 220;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data.map(d => Math.max(d.admissions, d.registrations)), 1);
    
    const ticksCount = 4;
    const yTicks = Array.from({ length: ticksCount + 1 }, (_, i) => Math.round((maxVal / ticksCount) * i));

    const pointsAdm = data.map((d, index) => {
      const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
      const x = padding + step * index;
      const y = height - padding - (d.admissions / maxVal) * chartHeight;
      return { x, y, val: d.admissions, name: d.name };
    });

    const pointsReg = data.map((d, index) => {
      const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
      const x = padding + step * index;
      const y = height - padding - (d.registrations / maxVal) * chartHeight;
      return { x, y, val: d.registrations, name: d.name };
    });

    let pathDAdm = '';
    let pathDReg = '';
    
    if (pointsAdm.length > 0) {
      pathDAdm = `M ${pointsAdm[0].x} ${pointsAdm[0].y} ` + pointsAdm.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      pathDReg = `M ${pointsReg[0].x} ${pointsReg[0].y} ` + pointsReg.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {yTicks.map((tick, i) => {
          const y = height - padding - (tick / maxVal) * chartHeight;
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} className="chart-gridline" />
              <text x={padding - 10} y={y + 4} textAnchor="end" className="chart-text">{tick}</text>
            </g>
          );
        })}

        {pointsAdm.length > 0 && (
          <>
            <path d={pathDAdm} fill="none" stroke={mainColor} strokeWidth="3" strokeLinecap="round" />
            <path d={pathDReg} fill="none" stroke={secondaryColor} strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {pointsAdm.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={mainColor} stroke="var(--bg-secondary)" strokeWidth="2">
              <title>{`${p.name}: ${p.val} Admissions`}</title>
            </circle>
            <circle cx={pointsReg[i].x} cy={pointsReg[i].y} r="4" fill={secondaryColor} stroke="var(--bg-secondary)" strokeWidth="2">
              <title>{`${p.name}: ${pointsReg[i].val} Registrations`}</title>
            </circle>
            {(data.length < 8 || i % 2 === 0 || i === data.length - 1) && (
              <text
                x={p.x}
                y={height - padding + 18}
                textAnchor="middle"
                className="chart-text"
                style={{ fontWeight: 500 }}
              >
                {p.name}
              </text>
            )}
          </g>
        ))}

        <g transform={`translate(${width - 240}, 15)`}>
          <circle cx="6" cy="6" r="5" fill={mainColor} />
          <text x="18" y="10" className="chart-text" style={{ fill: 'var(--text-primary)' }}>Admissions Done</text>
          
          <circle cx="126" cy="6" r="5" fill={secondaryColor} />
          <text x="138" y="10" className="chart-text" style={{ fill: 'var(--text-primary)' }}>Registrations</text>
        </g>
      </svg>
    );
  };

  // Render University Bar Chart using responsive SVG
  const renderUniversityChart = () => {
    const data = universityStats || [];
    if (data.length === 0) return <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No university data available</div>;

    if (uniChartType === 'donut') return renderPieOrDonutChart(data, true);
    if (uniChartType === 'pie') return renderPieOrDonutChart(data, false);
    if (uniChartType === 'line') return renderLineChart(data, '#3b82f6', '#818cf8');

    const width = 500;
    const height = 220;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data.map(d => Math.max(d.admissions, d.registrations)), 1);
    
    // Y-Axis ticks
    const ticksCount = 4;
    const yTicks = Array.from({ length: ticksCount + 1 }, (_, i) => Math.round((maxVal / ticksCount) * i));

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = height - padding - (tick / maxVal) * chartHeight;
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} className="chart-gridline" />
              <text x={padding - 10} y={y + 4} textAnchor="end" className="chart-text">{tick}</text>
            </g>
          );
        })}

        {/* Vertical bars */}
        {data.map((d, index) => {
          const barCount = data.length;
          const sectionWidth = chartWidth / barCount;
          const xCenter = padding + sectionWidth * index + sectionWidth / 2;
          const barWidth = Math.min(18, sectionWidth / 3);

          const admHeight = (d.admissions / maxVal) * chartHeight;
          const regHeight = (d.registrations / maxVal) * chartHeight;

          const admY = height - padding - admHeight;
          const regY = height - padding - regHeight;

          return (
            <g key={index}>
              {/* Admissions Bar (Blue) */}
              <rect
                x={xCenter - barWidth - 2}
                y={admY}
                width={barWidth}
                height={admHeight}
                fill="url(#blueGradient)"
                rx="3"
                className="chart-bar"
              >
                <title>{`${d.name}: ${d.admissions} Admissions`}</title>
              </rect>

              {/* Registrations Bar (Indigo) */}
              <rect
                x={xCenter + 2}
                y={regY}
                width={barWidth}
                height={regHeight}
                fill="url(#indigoGradient)"
                rx="3"
                className="chart-bar"
              >
                <title>{`${d.name}: ${d.registrations} Registrations`}</title>
              </rect>

              {/* X-axis labels */}
              <text
                x={xCenter}
                y={height - padding + 18}
                textAnchor="middle"
                className="chart-text"
                style={{ fontWeight: 500 }}
              >
                {d.name}
              </text>
            </g>
          );
        })}

        {/* Legends */}
        <g transform={`translate(${width - 240}, 15)`}>
          <rect width="12" height="12" fill="#3b82f6" rx="2" />
          <text x="18" y="10" className="chart-text" style={{ fill: 'var(--text-primary)' }}>Admissions Done</text>
          
          <rect x="120" width="12" height="12" fill="#818cf8" rx="2" />
          <text x="138" y="10" className="chart-text" style={{ fill: 'var(--text-primary)' }}>Registrations</text>
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Render Course Bar Chart using responsive SVG
  const renderCourseChart = () => {
    const data = courseStats || [];
    if (data.length === 0) return <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No course data available</div>;

    if (courseChartType === 'donut') return renderPieOrDonutChart(data, true);
    if (courseChartType === 'pie') return renderPieOrDonutChart(data, false);
    if (courseChartType === 'line') return renderLineChart(data, '#10b981', '#a855f7');

    const width = 500;
    const height = 220;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...data.map(d => Math.max(d.admissions, d.registrations)), 1);
    
    // Y-Axis ticks
    const ticksCount = 4;
    const yTicks = Array.from({ length: ticksCount + 1 }, (_, i) => Math.round((maxVal / ticksCount) * i));

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = height - padding - (tick / maxVal) * chartHeight;
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} className="chart-gridline" />
              <text x={padding - 10} y={y + 4} textAnchor="end" className="chart-text">{tick}</text>
            </g>
          );
        })}

        {/* Vertical bars */}
        {data.map((d, index) => {
          const barCount = data.length;
          const sectionWidth = chartWidth / barCount;
          const xCenter = padding + sectionWidth * index + sectionWidth / 2;
          const barWidth = Math.min(18, sectionWidth / 3);

          const admHeight = (d.admissions / maxVal) * chartHeight;
          const regHeight = (d.registrations / maxVal) * chartHeight;

          const admY = height - padding - admHeight;
          const regY = height - padding - regHeight;

          return (
            <g key={index}>
              {/* Admissions Bar (Emerald) */}
              <rect
                x={xCenter - barWidth - 2}
                y={admY}
                width={barWidth}
                height={admHeight}
                fill="url(#emeraldGradient)"
                rx="3"
                className="chart-bar"
              >
                <title>{`${d.name}: ${d.admissions} Admissions`}</title>
              </rect>

              {/* Registrations Bar (Purple) */}
              <rect
                x={xCenter + 2}
                y={regY}
                width={barWidth}
                height={regHeight}
                fill="url(#purpleGradient)"
                rx="3"
                className="chart-bar"
              >
                <title>{`${d.name}: ${d.registrations} Registrations`}</title>
              </rect>

              {/* X-axis labels */}
              <text
                x={xCenter}
                y={height - padding + 18}
                textAnchor="middle"
                className="chart-text"
                style={{ fontWeight: 500 }}
              >
                {d.name}
              </text>
            </g>
          );
        })}

        {/* Legends */}
        <g transform={`translate(${width - 240}, 15)`}>
          <rect width="12" height="12" fill="#10b981" rx="2" />
          <text x="18" y="10" className="chart-text" style={{ fill: 'var(--text-primary)' }}>Admissions Done</text>
          
          <rect x="120" width="12" height="12" fill="#a855f7" rx="2" />
          <text x="138" y="10" className="chart-text" style={{ fill: 'var(--text-primary)' }}>Registrations</text>
        </g>

        {/* Gradients */}
        <defs>
          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Render Line Chart for daily/weekly/monthly revenue trend
  const renderTrendChart = () => {
    const data = trends?.daily || [];
    if (data.length === 0) return <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No revenue trend data available</div>;

    const width = 1000;
    const height = 250;
    const paddingLeft = 60;
    const paddingRight = 40;
    const paddingTop = 30;
    const paddingBottom = 40;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...data.map(d => d.amount), 50000); // minimum scale limit
    
    // Y-Axis ticks
    const ticksCount = 4;
    const yTicks = Array.from({ length: ticksCount + 1 }, (_, i) => Math.round((maxVal / ticksCount) * i));

    // Construct coordinates
    const points = data.map((d, index) => {
      const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
      const x = paddingLeft + step * index;
      const y = height - paddingBottom - (d.amount / maxVal) * chartHeight;
      return { x, y, amount: d.amount, date: d.date };
    });

    // Create Path String
    let pathD = '';
    let areaD = '';
    
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      
      // For filling area under line
      areaD = pathD + ` L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => {
          const y = height - paddingBottom - (tick / maxVal) * chartHeight;
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-gridline" />
              <text x={paddingLeft - 12} y={y + 4} textAnchor="end" className="chart-text">
                Rs. {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
              </text>
            </g>
          );
        })}

        {/* Fill Area Gradient */}
        {points.length > 0 && (
          <path d={areaD} fill="url(#trendAreaGradient)" />
        )}

        {/* Trend Line */}
        {points.length > 0 && (
          <path d={pathD} className="chart-line" />
        )}

        {/* Data points & labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" className="chart-dot">
              <title>{`${p.date}: Rs. ${p.amount.toLocaleString('en-IN')}`}</title>
            </circle>
            
            {/* Show short label every other item or if array is small to prevent clutter */}
            {(points.length < 8 || i % 2 === 0 || i === points.length - 1) && (
              <text
                x={p.x}
                y={height - paddingBottom + 18}
                textAnchor="middle"
                className="chart-text"
              >
                {p.date}
              </text>
            )}
          </g>
        ))}

        {/* Gradients */}
        <defs>
          <linearGradient id="trendAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  const renderTargetTracker = (showSlabsAndCalculator = true) => {
    if (!stats || !stats.incentiveConfig || !stats.targetMetrics) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
          No target metrics config available. Please set this up in Admin settings.
        </div>
      );
    }

    const { targetMetrics, incentiveConfig, activeMonthlyTarget } = stats;
    const monthlyTarget = activeMonthlyTarget || incentiveConfig.monthlyTarget || 250000;
    const ranges = targetMetrics.ranges || {};

    const isTeamTracker = !selectedCounsellor || selectedCounsellor.startsWith('team:');
    const targetCounsellor = (selectedCounsellor && !selectedCounsellor.startsWith('team:'))
      ? selectedCounsellor
      : (currentUser?.role === 'counsellor' ? currentUser.name : null);
    const isSelf = (currentUser?.role === 'counsellor' && targetCounsellor && currentUser.name.trim().toLowerCase() === targetCounsellor.trim().toLowerCase()) ||
                   (isTeamTracker && currentUser?.role === 'tl' && (!selectedCounsellor || selectedCounsellor === `team:${currentUser.username}` || selectedCounsellor === currentUser.name));

    const trackerClaimant = (() => {
      if (targetCounsellor) return targetCounsellor;
      let activeTlUsername = currentUser?.role === 'tl' ? currentUser.username : '';
      if (selectedCounsellor && selectedCounsellor.startsWith('team:')) {
        activeTlUsername = selectedCounsellor.substring(5);
      }
      if (activeTlUsername) {
        const u = fullSettings?.users?.find(x => x.username.toLowerCase() === activeTlUsername.toLowerCase());
        return u ? u.name : null;
      }
      return null;
    })();

    const isTargetCounsellorTL = (() => {
      if (!targetCounsellor) return false;
      if (currentUser && currentUser.name && currentUser.name.trim().toLowerCase() === targetCounsellor.trim().toLowerCase()) {
        return currentUser.role?.toLowerCase() === 'tl';
      }
      const uObj = fullSettings?.users?.find(u => u.name && u.name.trim().toLowerCase() === targetCounsellor.trim().toLowerCase());
      return uObj?.role?.toLowerCase() === 'tl';
    })();

    const getCounsellorTotalEarned = () => {
      const claimant = trackerClaimant;
      if (!claimant) return 0;
      const periodKeys = ['monthly', 'quarterly', 'halfYearly', 'annual'];
      return incentiveRequests
        .filter(r => 
          r.status === 'approved' && 
          periodKeys.includes(r.periodId) &&
          r.counsellorName && 
          r.counsellorName.trim().toLowerCase() === claimant.trim().toLowerCase()
        )
        .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    };

    const handleSendRequest = async (period) => {
      if (submittingRequestId !== null) return;
      setSubmittingRequestId(period.id);
      
      const { percentage, amount } = getEligibility(period.revenue, period.target, period.slabs);
      
      try {
        const res = await fetch('/api/incentive-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            counsellorName: currentUser.name,
            counsellorUsername: currentUser.username,
            periodId: period.id,
            range: period.range,
            target: period.target,
            revenue: period.revenue,
            percentage: Number(percentage.toFixed(2)),
            amount: Number(amount)
          })
        });
        if (res.ok) {
          await fetchIncentiveRequests();
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to submit incentive request');
        }
      } catch (err) {
        alert('Error submitting request: ' + err.message);
      } finally {
        setSubmittingRequestId(null);
      }
    };

    const teamSlabs = incentiveConfig.teamSlabs || {
      monthly: [
        { min: 100, max: 109.99, amount: 5000 },
        { min: 110, max: 119.99, amount: 10000 },
        { min: 120, max: 129.99, amount: 15000 },
        { min: 130, max: 99999, amount: 20000 }
      ],
      quarterly: [
        { min: 100, max: 119.99, amount: 20000 },
        { min: 120, max: 149.99, amount: 40000 },
        { min: 150, max: 99999, amount: 60000 }
      ],
      halfYearly: [
        { min: 100, max: 119.99, amount: 40000 },
        { min: 120, max: 149.99, amount: 75000 },
        { min: 150, max: 99999, amount: 100000 }
      ],
      annual: [
        { min: 100, max: 119.99, amount: 75000 },
        { min: 120, max: 149.99, amount: 125000 },
        { min: 150, max: 99999, amount: 200000 }
      ]
    };

    const getTargetForCalculator = (optionValue) => {
      const defaultTarget = incentiveConfig?.monthlyTarget || 250000;
      if (optionValue === 'default') {
        return defaultTarget;
      }
      if (!optionValue) {
        const members = (fullSettings?.users || [])
          .filter(u => u.role === 'counsellor' || u.role === 'tl')
          .map(u => u.name)
          .filter(Boolean);
        if (members && members.length > 0) {
          return members.reduce((sum, m) => sum + getTargetForCalculator(m), 0);
        }
        return defaultTarget;
      }
      
      if (optionValue.startsWith('team:')) {
        const username = optionValue.substring(5);
        const tlUser = fullSettings?.users?.find(u => u.username.toLowerCase() === username.toLowerCase());
        const members = [];
        if (tlUser) {
          if (tlUser.name) members.push(tlUser.name);
          if (tlUser.counsellors && Array.isArray(tlUser.counsellors)) {
            tlUser.counsellors.forEach(cUsername => {
              const match = fullSettings.users?.find(u => u.username.toLowerCase() === cUsername.toLowerCase());
              if (match && match.name) members.push(match.name);
            });
          }
        }
        if (members.length > 0) {
          return members.reduce((sum, m) => sum + getTargetForCalculator(m), 0);
        }
        return defaultTarget;
      }
      
      if (fullSettings) {
        const dateObj = new Date();
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const match = (fullSettings.counsellorTargets || []).find(t => 
          t.counsellorName && 
          t.counsellorName.trim().toLowerCase() === optionValue.trim().toLowerCase() &&
          dateStr >= t.startDate &&
          dateStr <= t.endDate
        );
        
        return match ? Number(match.targetAmount) : defaultTarget;
      }
      
      return defaultTarget;
    };

    const checkPeriodEligibility = (joinDateStr, rangeStr) => {
      if (!joinDateStr || !rangeStr) return true;
      const parts = rangeStr.split(' - ');
      if (parts.length !== 2) return true;
      const parseDateParts = (dStr) => {
        const dp = dStr.split('/');
        if (dp.length !== 3) return null;
        return new Date(Number(dp[2]), Number(dp[1]) - 1, Number(dp[0]));
      };
      const start = parseDateParts(parts[0]);
      const end = parseDateParts(parts[1]);
      if (!start || !end) return true;

      const duration = end.getTime() - start.getTime();
      const midpoint = new Date(start.getTime() + duration / 2);
      const joinDate = new Date(joinDateStr);
      return joinDate <= midpoint;
    };

    const calculatePeriodTarget = (periodId, rangeStr) => {
      const defaultTarget = incentiveConfig?.monthlyTarget || 250000;
      if (!rangeStr) {
        const multiplier = periodId === 'quarterly' ? 3 : periodId === 'halfYearly' ? 6 : periodId === 'annual' ? 12 : 1;
        return monthlyTarget * multiplier;
      }
      const parts = rangeStr.split(' - ');
      if (parts.length !== 2) {
        const multiplier = periodId === 'quarterly' ? 3 : periodId === 'halfYearly' ? 6 : periodId === 'annual' ? 12 : 1;
        return monthlyTarget * multiplier;
      }
      const parseDateParts = (dStr) => {
        const dp = dStr.split('/');
        if (dp.length !== 3) return null;
        return new Date(Number(dp[2]), Number(dp[1]) - 1, Number(dp[0]));
      };
      const start = parseDateParts(parts[0]);
      const end = parseDateParts(parts[1]);
      if (!start || !end) {
        const multiplier = periodId === 'quarterly' ? 3 : periodId === 'halfYearly' ? 6 : periodId === 'annual' ? 12 : 1;
        return monthlyTarget * multiplier;
      }
      const months = [];
      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      const limit = new Date(end.getFullYear(), end.getMonth(), 1);
      while (current <= limit) {
        months.push({ year: current.getFullYear(), month: current.getMonth() });
        current.setMonth(current.getMonth() + 1);
      }
      let members = [];
      if (targetCounsellor) {
        members = [targetCounsellor];
      } else {
        let activeTlUsername = currentUser?.role === 'tl' ? currentUser.username : '';
        if (selectedCounsellor && selectedCounsellor.startsWith('team:')) {
          activeTlUsername = selectedCounsellor.substring(5);
        }
        
        if (activeTlUsername) {
          const tlUser = fullSettings?.users?.find(u => u.username.toLowerCase() === activeTlUsername.toLowerCase());
          if (tlUser) {
            if (tlUser.name) members.push(tlUser.name);
            if (tlUser.counsellors && Array.isArray(tlUser.counsellors)) {
              tlUser.counsellors.forEach(cUsername => {
                const cUser = fullSettings?.users?.find(u => u.username.toLowerCase() === cUsername.toLowerCase());
                if (cUser && cUser.name) members.push(cUser.name);
              });
            }
          }
        } else {
          members = (fullSettings?.users || [])
            .filter(u => u.role === 'counsellor' || u.role === 'tl')
            .map(u => u.name)
            .filter(Boolean);
        }
      }
      let totalTarget = 0;
      for (const m of months) {
        const startOfMonth = new Date(m.year, m.month, 1);
        const endOfMonth = new Date(m.year, m.month + 1, 0, 23, 59, 59, 999);
        const midMonthStr = `${m.year}-${String(m.month + 1).padStart(2, '0')}-15`;
        
        for (const memberName of members) {
          const userObj = fullSettings?.users?.find(u => u.name && u.name.trim().toLowerCase() === memberName.trim().toLowerCase());
          if (userObj) {
            // 1. Date of Joining check
            if (userObj.dateOfJoining) {
              const joinDate = new Date(userObj.dateOfJoining);
              if (joinDate > endOfMonth) {
                continue; // Not joined yet in this month, skip
              }
            }
            // 2. Last Working Date check (if deactivated)
            if (userObj.status === 'deactivated' && userObj.lastWorkingDate) {
              const leaveDate = new Date(userObj.lastWorkingDate);
              if (leaveDate < startOfMonth) {
                continue; // Already left before this month, skip
              }
            }
          }
          const match = (fullSettings?.counsellorTargets || []).find(t => 
            t.counsellorName && 
            t.counsellorName.trim().toLowerCase() === memberName.trim().toLowerCase() &&
            midMonthStr >= t.startDate &&
            midMonthStr <= t.endDate
          );
          totalTarget += match ? Number(match.targetAmount) : defaultTarget;
        }
      }
      return totalTarget;
    };

    const periods = [
      {
        id: 'monthly',
        label: isTeamTracker ? 'Monthly Team Target' : 'Monthly Target',
        target: calculatePeriodTarget('monthly', ranges.monthly),
        revenue: targetMetrics.monthlyRevenue || 0,
        slabs: isTeamTracker ? (teamSlabs.monthly || []) : (incentiveConfig.monthly || []),
        range: ranges.monthly
      },
      {
        id: 'quarterly',
        label: isTeamTracker ? 'Quarterly Team Target' : 'Quarterly Target',
        isQuarterly: true,
        target: calculatePeriodTarget('quarterly', ranges.quarterly),
        revenue: targetMetrics.quarterlyRevenue || 0,
        slabs: isTeamTracker ? (teamSlabs.quarterly || []) : (incentiveConfig.quarterly || []),
        range: ranges.quarterly
      },
      {
        id: 'halfYearly',
        label: isTeamTracker ? 'Half-Yearly Team Target' : 'Half-Yearly Target',
        isHalfYearly: true,
        target: calculatePeriodTarget('halfYearly', ranges.halfYearly),
        revenue: targetMetrics.halfYearlyRevenue || 0,
        slabs: isTeamTracker ? (teamSlabs.halfYearly || []) : (incentiveConfig.halfYearly || []),
        range: ranges.halfYearly
      },
      {
        id: 'annual',
        label: isTeamTracker ? 'Annual Team Target' : 'Annual Target',
        target: calculatePeriodTarget('annual', ranges.annual),
        revenue: targetMetrics.annualRevenue || 0,
        slabs: isTeamTracker ? (teamSlabs.annual || []) : (incentiveConfig.annual || []),
        range: ranges.annual
      }
    ];

    const getEligibility = (revenue, target, slabs) => {
      if (!target) return { eligible: false, amount: 0, percentage: 0 };
      const percentage = (revenue / target) * 100;
      if (!slabs || slabs.length === 0) {
        return { eligible: false, amount: 0, percentage };
      }
      
      const sorted = [...slabs].sort((a, b) => a.min - b.min);
      let matchedSlab = null;
      for (const slab of sorted) {
        if (percentage >= slab.min && percentage <= slab.max) {
          matchedSlab = slab;
        }
      }
      
      if (!matchedSlab && percentage > 0) {
        const highest = sorted[sorted.length - 1];
        if (percentage >= highest.min) {
          matchedSlab = highest;
        }
      }
      
      const amount = matchedSlab ? matchedSlab.amount : 0;
      return {
        eligible: amount > 0,
        amount,
        percentage
      };
    };

    const handleStartDateChange = async (newDate) => {
      setCalcStartDate(newDate);
      setSelectedMonth('');

      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const config = await res.json();
          if (!config.incentiveConfig) config.incentiveConfig = {};
          config.incentiveConfig.calculationStartDate = newDate;
          
          await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          });
        }
      } catch (err) {
        console.error('Failed to save start date:', err);
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
        {/* Start Date Selector & Total Earned Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Calculation Start Date:</span>
            <input
              type="date"
              className="filter-select"
              style={{ padding: '4px 8px', height: '30px', fontSize: '0.8rem', minWidth: '130px', margin: 0 }}
              value={calcStartDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Globally aligns periods.
            </span>
          </div>

          {(selectedCounsellor || currentUser?.role === 'counsellor' || (isTeamTracker && currentUser?.role === 'tl')) && (
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', minWidth: '220px', flex: '0 1 auto' }}>
              <Award size={20} style={{ color: 'var(--emerald)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total Incentive Earned</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--emerald)' }}>
                  Rs. {getCounsellorTotalEarned().toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2x2 Tracker Grid */}
        <div className="target-tracker-grid">
          {periods.map((p) => {
            let { eligible, amount, percentage } = getEligibility(p.revenue, p.target, p.slabs);
            if (isTargetCounsellorTL) {
              eligible = false;
              amount = 0;
            }

            let claimantUser = null;
            if (targetCounsellor) {
              claimantUser = fullSettings?.users?.find(u => u.name && u.name.trim().toLowerCase() === targetCounsellor.trim().toLowerCase());
            } else if (isTeamTracker) {
              let activeTlUsername = currentUser?.role === 'tl' ? currentUser.username : '';
              if (selectedCounsellor && selectedCounsellor.startsWith('team:')) {
                activeTlUsername = selectedCounsellor.substring(5);
              }
              if (activeTlUsername) {
                claimantUser = fullSettings?.users?.find(u => u.username.toLowerCase() === activeTlUsername.toLowerCase());
              }
            }
            
            let joinDateCutoffPassed = false;
            let formattedJoinDate = '';
            let formattedMidpoint = '';
            let formattedNextStart = '';

            if (claimantUser && claimantUser.dateOfJoining) {
              if (!checkPeriodEligibility(claimantUser.dateOfJoining, p.range)) {
                eligible = false;
                amount = 0;
                joinDateCutoffPassed = true;

                const parts = p.range?.split(' - ');
                if (parts && parts.length === 2) {
                  const parseDateParts = (dStr) => {
                    const dp = dStr.split('/');
                    if (dp.length !== 3) return null;
                    return new Date(Number(dp[2]), Number(dp[1]) - 1, Number(dp[0]));
                  };
                  const start = parseDateParts(parts[0]);
                  const end = parseDateParts(parts[1]);
                  if (start && end) {
                    const duration = end.getTime() - start.getTime();
                    const midpoint = new Date(start.getTime() + duration / 2);
                    const joinDate = new Date(claimantUser.dateOfJoining);
                    const pad = (num) => String(num).padStart(2, '0');
                    const formatDt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
                    formattedJoinDate = formatDt(joinDate);
                    formattedMidpoint = formatDt(midpoint);
                    
                    const nextStartDate = new Date(end.getTime() + 24 * 60 * 60 * 1000);
                    formattedNextStart = formatDt(nextStartDate);
                  }
                }
              }
            }

            let eligibilityReason = '';
            if (eligible) {
              eligibilityReason = `Eligible! Achievement is ${percentage.toFixed(1)}% of target. Payout: Rs. ${amount.toLocaleString('en-IN')}.`;
            } else {
              if (isTargetCounsellorTL) {
                eligibilityReason = "TLs are only eligible for team-level target incentives.";
              } else if (joinDateCutoffPassed) {
                eligibilityReason = `Joined on ${formattedJoinDate} (after 50% midpoint ${formattedMidpoint} of period). Next eligible period starts on ${formattedNextStart}.`;
              } else if (p.revenue < p.target) {
                const deficit = p.target - p.revenue;
                eligibilityReason = `Achievement: ${percentage.toFixed(1)}%. Deficit: Rs. ${deficit.toLocaleString('en-IN')} (Target: Rs. ${p.target.toLocaleString('en-IN')}).`;
              } else if (amount === 0) {
                eligibilityReason = "Revenue achieved target but does not meet minimum incentive slab percentages.";
              }
            }

            const barColor = percentage >= 100 ? 'var(--emerald)' : percentage >= 80 ? 'var(--accent-primary)' : 'var(--text-muted)';
            const request = incentiveRequests.find(r => 
              r.periodId === p.id && 
              r.range === p.range &&
              r.counsellorName &&
              trackerClaimant &&
              r.counsellorName.trim().toLowerCase() === trackerClaimant.trim().toLowerCase()
            );
            
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', padding: '14px 16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minHeight: '160px', gap: '10px' }}>
                
                {/* Row 1: Title & Eligibility Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {p.isQuarterly ? 'Quarterly Target' : p.isHalfYearly ? 'Half-Yearly Target' : p.id === 'monthly' ? 'Monthly Target' : p.label}
                  </span>
                  <span className={`badge ${eligible ? 'badge-done' : 'badge-followup'}`} style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>
                    {eligible ? `Eligible: Rs. ${amount.toLocaleString('en-IN')}` : 'Not Eligible (Nil)'}
                  </span>
                </div>
                
                {/* Row 2: Selector Dropdown (if applicable) & Date Range */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  {p.isQuarterly ? (
                    <select
                      className="filter-select"
                      style={{ padding: '2px 6px', height: '26px', fontSize: '0.75rem', minWidth: '105px', margin: 0, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                    >
                      <option value="1">1st Quarter</option>
                      <option value="2">2nd Quarter</option>
                      <option value="3">3rd Quarter</option>
                      <option value="4">4th Quarter</option>
                    </select>
                  ) : p.isHalfYearly ? (
                    <select
                      className="filter-select"
                      style={{ padding: '2px 6px', height: '26px', fontSize: '0.75rem', minWidth: '105px', margin: 0, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}
                      value={selectedHalfYear}
                      onChange={(e) => setSelectedHalfYear(e.target.value)}
                    >
                      <option value="1">1st Half Year</option>
                      <option value="2">2nd Half Year</option>
                    </select>
                  ) : p.id === 'monthly' ? (
                    <select
                      className="filter-select"
                      style={{ padding: '2px 6px', height: '26px', fontSize: '0.75rem', minWidth: '115px', margin: 0, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xs)' }}
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                      {getMonthsOfFiscalYear().map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ height: '26px' }}></div> /* Spacer to keep card heights consistent */
                  )}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    ({p.range || ''})
                  </span>
                </div>
                
                {/* Row 3: Revenue / Target amounts */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Rs. <strong style={{ color: 'var(--text-primary)' }}>{p.revenue.toLocaleString('en-IN')}</strong> / Rs. {p.target.toLocaleString('en-IN')}
                </div>

                {/* Row 4: Progress Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(percentage, 100)}%`, height: '100%', backgroundColor: barColor, borderRadius: '3px', transition: 'width 0.3s ease-in-out' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Row 5: Eligibility Reasoning Detail */}
                {eligibilityReason && (
                  <div style={{ fontSize: '0.68rem', color: eligible ? 'var(--emerald)' : 'var(--text-secondary)', marginTop: '4px', padding: '6px 8px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-xs)', borderLeft: `3px solid ${eligible ? 'var(--emerald)' : 'var(--text-muted)'}`, textAlign: 'left', lineHeight: '1.25' }}>
                    {eligibilityReason}
                  </div>
                )}

                {/* Incentive Claim Action / Status */}
                {eligible && (targetCounsellor || (isTeamTracker && currentUser?.role === 'tl')) && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {!request ? (
                      isSelf ? (
                        <button
                          className="btn-action-sm primary"
                          style={{ margin: 0, width: '100%', padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          onClick={() => handleSendRequest(p)}
                          disabled={submittingRequestId !== null}
                        >
                          {submittingRequestId === p.id ? (
                            <RefreshCw className="animate-spin" size={12} />
                          ) : (
                            <Award size={12} />
                          )}
                          Send Incentive Request
                        </button>
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Incentive claim not requested yet.
                        </div>
                      )
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Request Status:</span>
                          <span className={`badge ${
                            request.status === 'approved' ? 'badge-done' : request.status === 'rejected' ? 'badge-refund' : 'badge-pending'
                          }`} style={{ fontSize: '0.65rem', padding: '1px 6px', textTransform: 'uppercase' }}>
                            {request.status === 'pending' ? '⌛ Pending' : request.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                          </span>
                        </div>
                        
                        {/* Display Comment if present */}
                        {request.comment && (
                          <div style={{ padding: '6px 8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-secondary)', wordBreak: 'break-word', textAlign: 'left' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Admin Comment:</span> {request.comment}
                          </div>
                        )}
                        
                        {/* If rejected, let them request again */}
                        {request.status === 'rejected' && isSelf && (
                          <button
                            className="btn-action-sm primary"
                            style={{ margin: '4px 0 0 0', width: '100%', padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            onClick={() => handleSendRequest(p)}
                            disabled={submittingRequestId !== null}
                          >
                            {submittingRequestId === p.id ? (
                              <RefreshCw className="animate-spin" size={12} />
                            ) : (
                              <RotateCcw size={12} />
                            )}
                            Re-Send Incentive Request
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider & Bottom Section */}
        {showSlabsAndCalculator && (
          <>
            <hr style={{ border: 'none', borderTop: '1px dashed var(--border-color)', margin: '16px 0' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
              {/* Left: Slabs Reference Grid */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📊 Incentive Slabs Reference Chart
                </h4>
                <div className="slabs-reference-grid">
                  {[
                    { label: isTeamTracker ? 'Monthly Team Slabs' : 'Monthly Slabs', slabs: isTeamTracker ? (teamSlabs.monthly || []) : (incentiveConfig.monthly || []) },
                    { label: isTeamTracker ? 'Quarterly Team Slabs' : 'Quarterly Slabs', slabs: isTeamTracker ? (teamSlabs.quarterly || []) : (incentiveConfig.quarterly || []) },
                    { label: isTeamTracker ? 'Half-Yearly Team Slabs' : 'Half-Yearly Slabs', slabs: isTeamTracker ? (teamSlabs.halfYearly || []) : (incentiveConfig.halfYearly || []) },
                    { label: isTeamTracker ? 'Annual Team Slabs' : 'Annual Slabs', slabs: isTeamTracker ? (teamSlabs.annual || []) : (incentiveConfig.annual || []) }
                  ].map(pSlab => (
                    <div key={pSlab.label} style={{ padding: '10px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', marginTop: 0, marginBottom: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                          {pSlab.label}
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {pSlab.slabs?.map((s, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              <span>{s.min}% - {s.max >= 99999 ? '150%+' : `${s.max}%`}</span>
                              <span style={{ fontWeight: 600, color: s.amount > 0 ? 'var(--emerald)' : 'var(--text-muted)' }}>
                                Rs. {s.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          ))}
                          {(!pSlab.slabs || pSlab.slabs.length === 0) && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>No slabs configured</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Interactive Calculator */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🧮</span> Interactive Incentive Calculator
                </h4>
                {(() => {
                  const resolvedMonthlyTarget = getTargetForCalculator(calcTargetType);
                  const isCalcTeam = !calcTargetType || calcTargetType.startsWith('team:');
                  
                  const targetMap = {
                    monthly: resolvedMonthlyTarget,
                    quarterly: resolvedMonthlyTarget * 3,
                    halfYearly: resolvedMonthlyTarget * 6,
                    annual: resolvedMonthlyTarget * 12
                  };
                  
                  const slabMap = {
                    monthly: isCalcTeam ? (teamSlabs.monthly || []) : (incentiveConfig.monthly || []),
                    quarterly: isCalcTeam ? (teamSlabs.quarterly || []) : (incentiveConfig.quarterly || []),
                    halfYearly: isCalcTeam ? (teamSlabs.halfYearly || []) : (incentiveConfig.halfYearly || []),
                    annual: isCalcTeam ? (teamSlabs.annual || []) : (incentiveConfig.annual || [])
                  };
                  
                  const activeTarget = targetMap[calcPeriod] || resolvedMonthlyTarget;
                  const activeSlabs = slabMap[calcPeriod] || [];
                  const revenueVal = Number(calcRevenue) || 0;
                  const calcResult = getEligibility(revenueVal, activeTarget, activeSlabs);
                  
                  return (
                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1, justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Reference</label>
                          <select
                            className="filter-select"
                            style={{ width: '100%', height: '34px', padding: '0 10px', fontSize: '0.8rem', margin: 0 }}
                            value={calcTargetType}
                            onChange={(e) => setCalcTargetType(e.target.value)}
                          >
                            {currentUser?.role === 'counsellor' ? (
                              <option value={currentUser.name}>
                                My Target (Rs. {getTargetForCalculator(currentUser.name).toLocaleString('en-IN')})
                              </option>
                            ) : (
                              <>
                                <option value="">
                                  {currentUser?.role === 'tl' ? 'My Team' : 'All Team'} (Rs. {getTargetForCalculator('').toLocaleString('en-IN')})
                                </option>
                                {getDropdownOptions().map((opt, i) => {
                                  const targetVal = getTargetForCalculator(opt.value);
                                  return (
                                    <option key={i} value={opt.value}>
                                      {opt.label} (Rs. {targetVal.toLocaleString('en-IN')})
                                    </option>
                                  );
                                })}
                              </>
                            )}
                          </select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Period</label>
                            <select
                              className="filter-select"
                              style={{ width: '100%', height: '34px', padding: '0 10px', fontSize: '0.8rem', margin: 0 }}
                              value={calcPeriod}
                              onChange={(e) => setCalcPeriod(e.target.value)}
                            >
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="halfYearly">Half-Yearly</option>
                              <option value="annual">Annual</option>
                            </select>
                          </div>
                          <div style={{ flex: 1.5 }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Revenue Amount (Rs.)</label>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="e.g. 300000"
                              style={{ height: '34px', padding: '0 10px', fontSize: '0.85rem', margin: 0 }}
                              value={calcRevenue}
                              onChange={(e) => setCalcRevenue(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', marginTop: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          <span>Target for Period:</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rs. {activeTarget.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          <span>Achievement:</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{calcResult.percentage.toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-color)', paddingTop: '4px', marginTop: '4px' }}>
                          <span>Estimated Incentive:</span>
                          <span style={{ fontWeight: 'bold', color: calcResult.amount > 0 ? 'var(--emerald)' : 'var(--text-muted)' }}>
                            Rs. {calcResult.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (onlyShowTargetTracker) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card chart-card" style={{ padding: '32px', minHeight: '400px' }}>
          <div className="chart-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
              <Award size={22} style={{ color: 'var(--accent-primary)' }} />
              {selectedCounsellor 
                ? `Target & Incentive Tracker (${getCounsellorDisplayName(selectedCounsellor)})` 
                : currentUser?.role === 'tl' 
                  ? 'My Team Target & Incentive Tracker' 
                  : 'Overall Team Target & Incentive Tracker'}
            </h3>
            
            {currentUser?.role !== 'counsellor' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Counsellor:</span>
                <select
                  className="filter-select"
                  style={{ height: '32px', padding: '0 10px', minWidth: '160px', margin: 0 }}
                  value={selectedCounsellor}
                  onChange={(e) => setSelectedCounsellor(e.target.value)}
                >
                  <option value="">{currentUser?.role === 'tl' ? 'My Team' : 'All Counsellors'}</option>
                  {getDropdownOptions().map((opt, i) => (
                    <option key={i} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={{ minHeight: '320px' }}>
            {renderTargetTracker()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Date & Counsellor Filter Selection Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }} className="animate-fade-in">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Date buttons group */}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <button 
              className={`btn-action-sm ${dateFilter === 'overall' ? 'primary' : ''}`} 
              style={{ margin: 0, padding: '6px 16px', border: 'none' }}
              onClick={() => setDateFilter('overall')}
            >
              Overall
            </button>
            <button 
              className={`btn-action-sm ${dateFilter === 'week' ? 'primary' : ''}`} 
              style={{ margin: 0, padding: '6px 16px', border: 'none' }}
              onClick={() => setDateFilter('week')}
            >
              This Week
            </button>
            <button 
              className={`btn-action-sm ${dateFilter === 'month' ? 'primary' : ''}`} 
              style={{ margin: 0, padding: '6px 16px', border: 'none' }}
              onClick={() => setDateFilter('month')}
            >
              This Month
            </button>
            <button 
              className={`btn-action-sm ${dateFilter === 'last-month' ? 'primary' : ''}`} 
              style={{ margin: 0, padding: '6px 16px', border: 'none' }}
              onClick={() => setDateFilter('last-month')}
            >
              Last Month
            </button>
            <button 
              className={`btn-action-sm ${dateFilter === 'custom' ? 'primary' : ''}`} 
              style={{ margin: 0, padding: '6px 16px', border: 'none' }}
              onClick={() => setDateFilter('custom')}
            >
              Custom Range
            </button>
          </div>

          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="animate-fade-in">
              <input 
                type="date" 
                className="filter-select" 
                style={{ padding: '6px 12px', height: '34px', backgroundColor: 'var(--bg-secondary)' }}
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>to</span>
              <input 
                type="date" 
                className="filter-select" 
                style={{ padding: '6px 12px', height: '34px', backgroundColor: 'var(--bg-secondary)' }}
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
              />
            </div>
          )}

          {/* Custom Saved Periods dropdown */}
          {fullSettings?.customDateFilters && fullSettings.customDateFilters.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Saved Period:</span>
              <select
                className="filter-select"
                style={{ height: '34px', padding: '0 12px', minWidth: '150px' }}
                value={dateFilter === 'custom-period' ? selectedCustomPeriodId : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setSelectedCustomPeriodId(val);
                    setDateFilter('custom-period');
                  } else {
                    setDateFilter('overall');
                  }
                }}
              >
                <option value="">-- Select Period --</option>
                {fullSettings.customDateFilters.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Counsellor selection */}
          {currentUser?.role !== 'counsellor' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Counsellor:</span>
              <select
                className="filter-select"
                style={{ height: '34px', padding: '0 12px', minWidth: '150px' }}
                value={selectedCounsellor}
                onChange={(e) => setSelectedCounsellor(e.target.value)}
              >
                <option value="">All Counsellors</option>
                {getDropdownOptions().map((opt, i) => (
                  <option key={i} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading && stats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
            <RefreshCw className="animate-spin" size={14} />
            <span>Updating analytics...</span>
          </div>
        )}
      </div>

      {/* Daily Thought Bulletin */}
      {(() => {
        if (!fullSettings?.dailyThought) return null;
        const { mode, same, counsellor, tl } = fullSettings.dailyThought;
        let activeThought = null;
        if (!mode || mode === 'same') {
          activeThought = fullSettings.dailyThought.text ? fullSettings.dailyThought : same;
        } else if (mode === 'role-specific') {
          if (currentUser?.role === 'counsellor') {
            activeThought = counsellor;
          } else if (currentUser?.role === 'tl') {
            activeThought = tl;
          } else {
            activeThought = same;
          }
        }
        if (!activeThought?.text) return null;

        return (
          <div className="glass-card daily-thought-banner animate-fade-in" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '16px 24px',
            marginBottom: '24px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'left'
          }}>
            <div className="thought-emoji-wrapper" style={{
              fontSize: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-primary)',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '2px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0
            }}>
              💡
            </div>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activeThought.title && (
                <h4 style={{ 
                  margin: 0, 
                  color: 'var(--emerald)', 
                  fontSize: '1rem', 
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)'
                }}>
                  {activeThought.title}
                </h4>
              )}
              <p style={{ 
                margin: 0, 
                color: 'var(--accent-primary)', 
                fontSize: '0.9rem', 
                fontWeight: 500,
                lineHeight: '1.4'
              }}>
                {activeThought.text}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Metrics Header */}
      <div className="metrics-grid">
        {/* Total Revenue */}
        <div className="metric-card glass-card animate-fade-in">
          <div className="metric-card-info">
            <h3>Total Revenue</h3>
            <div className="value" style={{ color: 'var(--emerald)' }}>
              Rs. {summary.totalRevenue.toLocaleString('en-IN')}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Admissions Completed Only</p>
          </div>
          <div className="metric-card-icon" style={{ backgroundColor: 'var(--emerald-bg)' }}>
            <IndianRupee size={22} style={{ color: 'var(--emerald)' }} />
          </div>
        </div>

        {/* Total Admissions */}
        <div className="metric-card glass-card animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="metric-card-info">
            <h3>Admissions Completed</h3>
            <div className="value">{summary.totalAdmissions}</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Status: "Admission Done"</p>
            <button className="click-to-check-btn" onClick={() => handleCardClick({ status: 'Admission Done' })}>
              Click to check →
            </button>
          </div>
          <div className="metric-card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Users size={22} />
          </div>
        </div>

        {/* Part Payments */}
        <div className="metric-card glass-card animate-fade-in" style={{ animationDelay: '0.08s' }}>
          <div className="metric-card-info">
            <h3>Part Payments</h3>
            <div className="value" style={{ color: 'var(--accent-light)' }}>
              {summary.totalPartPayments}
              <span style={{ fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '6px', color: 'var(--text-secondary)' }}>
                (Rs. {summary.totalPartPaymentsAmount.toLocaleString('en-IN')})
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Status: "Part Payment"</p>
            <button className="click-to-check-btn" onClick={() => handleCardClick({ status: 'Part Payment' })}>
              Click to check →
            </button>
          </div>
          <div className="metric-card-icon" style={{ backgroundColor: 'rgba(147, 197, 253, 0.1)' }}>
            <CreditCard size={22} style={{ color: 'var(--accent-light)' }} />
          </div>
        </div>

        {/* Total Registrations */}
        <div className="metric-card glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="metric-card-info">
            <h3>Registrations</h3>
            <div className="value" style={{ color: '#c084fc' }}>
              {summary.totalRegistrations}
              <span style={{ fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '6px', color: 'var(--text-secondary)' }}>
                (Rs. {summary.totalRegistrationsAmount.toLocaleString('en-IN')})
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Status: "Registration"</p>
            <button className="click-to-check-btn" onClick={() => handleCardClick({ status: 'Registration' })}>
              Click to check →
            </button>
          </div>
          <div className="metric-card-icon" style={{ backgroundColor: 'rgba(192, 132, 252, 0.1)' }}>
            <Layers size={22} />
          </div>
        </div>

        {/* Refunds */}
        <div className="metric-card glass-card animate-fade-in" style={{ animationDelay: '0.12s' }}>
          <div className="metric-card-info">
            <h3>Refunds</h3>
            <div className="value" style={{ color: 'var(--rose)' }}>
              {summary.totalRefunds} 
              <span style={{ fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '6px', color: 'var(--text-secondary)' }}>
                (Rs. {summary.totalRefundedAmount.toLocaleString('en-IN')})
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Status: "Refund" series</p>
            <button className="click-to-check-btn" onClick={() => handleCardClick({ status: 'Refund ProcessStarted' })}>
              Click to check →
            </button>
          </div>
          <div className="metric-card-icon" style={{ backgroundColor: 'var(--rose-bg)' }}>
            <RotateCcw size={22} style={{ color: 'var(--rose)' }} />
          </div>
        </div>

        {/* Today's Productivity */}
        <div className="metric-card glass-card animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="metric-card-info">
            <h3>Today's Productivity</h3>
            <div className="value">{summary.todaysAdmissions}</div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>New submissions today</p>
            <button className="click-to-check-btn" onClick={() => handleCardClick({ startDate: getTodayStr(), endDate: getTodayStr() })}>
              Click to check →
            </button>
          </div>
          <div className="metric-card-icon" style={{ backgroundColor: 'var(--amber-bg)' }}>
            <Calendar size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Leaderboard */}
      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Revenue Trends (Only visible in overall view) */}
          {!selectedCounsellor && (
            <div className="glass-card chart-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="chart-header">
                <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} style={{ color: 'var(--accent-primary)' }} />
                  Revenue Trends (Last 10 Days)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated real-time</span>
              </div>
              <div style={{ height: '250px' }}>
                {renderTrendChart()}
              </div>
            </div>
          )}

          {/* Target & Incentive Tracker (Visible on dashboard overview for all roles, with slabs and calculator hidden) */}
          <div className="glass-card chart-card animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <div className="chart-header">
              <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--accent-primary)' }} />
                {selectedCounsellor 
                  ? `Target & Incentive Tracker (${getCounsellorDisplayName(selectedCounsellor)})` 
                  : currentUser?.role === 'tl' 
                    ? 'My Team Target & Incentive Tracker' 
                    : 'Overall Team Target & Incentive Tracker'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated real-time</span>
            </div>
            <div style={{ minHeight: '320px' }}>
              {renderTargetTracker(false)}
            </div>
          </div>
        </div>

        {/* Top Counsellors Leaderboard */}
        <div className="glass-card chart-card animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} style={{ color: 'var(--amber)' }} />
              Top Counsellors
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By Revenue Generated</span>
          </div>

          <div className="leaderboard-list" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No counsellor records found</div>
            ) : (
              leaderboard.map((counsellor, index) => {
                let highestTitle = null;
                if (counsellor.achievements?.skyRatna) highestTitle = { label: 'Sky Ratna', emoji: '💎', color: '#f43f5e' };
                else if (counsellor.achievements?.skyCommander) highestTitle = { label: 'Sky Commander', emoji: '👑', color: '#60a5fa' };
                else if (counsellor.achievements?.skyWarrior) highestTitle = { label: 'Sky Warrior', emoji: '⚔️', color: '#c084fc' };
                else if (counsellor.achievements?.skyStriker) highestTitle = { label: 'Sky Striker', emoji: '🏹', color: 'var(--amber)' };

                const achievementPills = [];
                const ach = counsellor.achievements || {};
                if (ach.doubleStrike > 0) achievementPills.push({ label: 'Double Strike', emoji: '⚡', count: ach.doubleStrike, color: 'var(--amber)' });
                if (ach.hattrickHero > 0) achievementPills.push({ label: 'Hattrick Hero', emoji: '🔥', count: ach.hattrickHero, color: 'var(--rose)' });
                if (ach.skyStorm > 0) achievementPills.push({ label: 'Sky Storm', emoji: '🚀', count: ach.skyStorm, color: '#a855f7' });
                if (ach.skyTsunami > 0) achievementPills.push({ label: 'Sky Tsunami', emoji: '🌊', count: ach.skyTsunami, color: '#3b82f6' });
                if (ach.consistencyChampion > 0) achievementPills.push({ label: 'Consistency Champ', emoji: '🎯', count: ach.consistencyChampion, color: 'var(--emerald)' });

                return (
                  <div key={index} className="leaderboard-item animate-fade-in" style={{ animationDelay: `${0.3 + index * 0.05}s` }}>
                    {index < 3 ? (
                      <div className={`rank-badge-medal ${index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    ) : (
                      <div className="rank-badge">{index + 1}</div>
                    )}
                    <div className="leaderboard-details">
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        <span>{counsellor.name}</span>
                        {highestTitle && (
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: `1px solid ${highestTitle.color}`,
                            color: highestTitle.color,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            marginLeft: '4px'
                          }}>
                            <span>{highestTitle.emoji}</span>
                            <span>{highestTitle.label}</span>
                          </span>
                        )}
                      </div>
                      <div className="leaderboard-admissions" style={{ marginTop: '2px' }}>
                        {counsellor.admissions} Adm. | {counsellor.registrations} Reg. | {counsellor.partPayments || 0} Part | {counsellor.refunds || 0} Ref.
                      </div>
                      {achievementPills.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {achievementPills.map((pill, pIdx) => (
                            <span key={pIdx} style={{
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-secondary)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              <span>{pill.emoji}</span>
                              <span>{pill.label}</span>
                              <span style={{ color: pill.color, fontWeight: 'bold', marginLeft: '1px' }}>x{pill.count}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="leaderboard-revenue">
                      <div style={{ fontSize: '0.9rem', color: 'var(--emerald)' }}>
                        Rs. {counsellor.revenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* University & Course Stats Charts */}
      <div className="charts-dashboard-grid">
        <div className="glass-card chart-card animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
              University-wise Admissions
            </h3>
            <select 
              className="filter-select" 
              style={{ minWidth: '120px', height: '30px', padding: '0 8px', fontSize: '0.8rem', margin: 0 }} 
              value={uniChartType} 
              onChange={(e) => setUniChartType(e.target.value)}
            >
              <option value="bar">Bar Chart</option>
              <option value="donut">Donut Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
          <div style={{ height: '220px' }}>
            {renderUniversityChart()}
          </div>
        </div>

        <div className="glass-card chart-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BookOpen size={18} style={{ color: 'var(--emerald)' }} />
              Course-wise Admissions
            </h3>
            <select 
              className="filter-select" 
              style={{ minWidth: '120px', height: '30px', padding: '0 8px', fontSize: '0.8rem', margin: 0 }} 
              value={courseChartType} 
              onChange={(e) => setCourseChartType(e.target.value)}
            >
              <option value="bar">Bar Chart</option>
              <option value="donut">Donut Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
          <div style={{ height: '220px' }}>
            {renderCourseChart()}
          </div>
        </div>
      </div>
    </div>
  );
}
