import React, { useState, useEffect } from 'react';
import { Phone, Calendar, User, BookOpen, RefreshCw, MessageSquare, Check, Save } from 'lucide-react';

export default function FollowUpTracker() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Quick update state variables
  const [remarkInputs, setRemarkInputs] = useState({});
  const [statusInputs, setStatusInputs] = useState({});
  const [statusesOpt, setStatusesOpt] = useState([]);

  useEffect(() => {
    fetchFollowUps();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.dropdowns && data.dropdowns.statuses) {
          setStatusesOpt(data.dropdowns.statuses);
        }
      }
    } catch (err) {
      console.error('Failed to load settings in tracker:', err);
    }
  };

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admissions');
      if (response.ok) {
        const data = await response.json();
        // Filter out only Pending & Follow-up
        const followUps = data.filter(item => item.status === 'Pending' || item.status === 'Follow-up');
        setRecords(followUps);
        
        // Initialize inputs
        const initialRemarks = {};
        const initialStatuses = {};
        followUps.forEach(item => {
          initialRemarks[item.sNo] = '';
          initialStatuses[item.sNo] = item.status;
        });
        setRemarkInputs(initialRemarks);
        setStatusInputs(initialStatuses);
      } else {
        throw new Error('Failed to load pending tracker');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (sNo, field, val) => {
    if (field === 'remark') {
      setRemarkInputs(prev => ({ ...prev, [sNo]: val }));
    } else if (field === 'status') {
      setStatusInputs(prev => ({ ...prev, [sNo]: val }));
    }
  };

  const handleSaveFollowUp = async (sNo, existingRecord) => {
    setUpdatingId(sNo);
    const newRemark = remarkInputs[sNo];
    const newStatus = statusInputs[sNo];

    // Append new remark to existing remarks
    const updatedRemarks = existingRecord.remarks 
      ? `${existingRecord.remarks}\n[Follow-up ${new Date().toLocaleDateString()}]: ${newRemark}`
      : `[Follow-up ${new Date().toLocaleDateString()}]: ${newRemark}`;

    try {
      const response = await fetch(`/api/admissions/${sNo}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: newRemark.trim() ? updatedRemarks : existingRecord.remarks
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        // Remove from list if status became anything other than Pending or Follow-up, otherwise update locally
        if (newStatus !== 'Pending' && newStatus !== 'Follow-up') {
          setRecords(prev => prev.filter(item => item.sNo !== sNo));
        } else {
          setRecords(prev => prev.map(item => item.sNo === sNo ? result.data : item));
          // Clear input box
          setRemarkInputs(prev => ({ ...prev, [sNo]: '' }));
        }
      } else {
        alert(result.error || 'Failed to update record');
      }
    } catch (err) {
      alert('Error updating. Please check server.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAsDone = async (sNo) => {
    setUpdatingId(sNo);
    try {
      const response = await fetch(`/api/admissions/${sNo}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Admission Done' })
      });
      if (response.ok) {
        setRecords(prev => prev.filter(item => item.sNo !== sNo));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '10px' }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent-primary)' }} />
        <span>Sorting pending items & follow-up queues...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="duplicate-alert" style={{ backgroundColor: 'var(--rose-bg)', borderColor: 'var(--rose-border)', color: 'var(--rose)' }}>
        <span>Error loading pending list: {error}</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Pending Follow-up Tracker</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          You have <strong>{records.length}</strong> active follow-up cases. Mark them completed as students finalize admissions.
        </p>
      </div>

      {records.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Check size={48} style={{ color: 'var(--emerald)', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>All caught up!</h3>
          <p>There are no students with "Pending" or "Follow-up" status.</p>
        </div>
      ) : (
        <div className="tracker-grid">
          {records.map((item) => (
            <div key={item.sNo} className="glass-card tracker-card animate-fade-in">
              <div className="tracker-card-header">
                <div>
                  <span className={`badge ${item.status === 'Pending' ? 'badge-pending' : 'badge-followup'}`} style={{ marginBottom: '8px' }}>
                    {item.status}
                  </span>
                  <h3 className="tracker-card-name">{item.studentName}</h3>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>#{item.sNo}</span>
              </div>

              <div className="tracker-card-meta">
                <Phone size={14} />
                <span>{item.mobileNumber}</span>
              </div>

              <div className="tracker-card-meta">
                <BookOpen size={14} />
                <span>{item.universityName} — {item.course}</span>
              </div>

              <div className="tracker-card-meta">
                <User size={14} />
                <span>Counsellor: <strong>{item.counsellorName}</strong></span>
              </div>

              <div className="tracker-card-meta">
                <Calendar size={14} />
                <span>Admission Target: {item.dateOfAdmission}</span>
              </div>

              {item.remarks && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageSquare size={12} />
                    Current Remarks Ledger:
                  </span>
                  <div className="tracker-card-remarks">
                    {item.remarks.split('\n').map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Update Forms */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.75rem' }}>Append Follow-up Note</label>
                  <input
                    type="text"
                    placeholder="Enter discussion update..."
                    className="form-control"
                    style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    value={remarkInputs[item.sNo] || ''}
                    onChange={(e) => handleInputChange(item.sNo, 'remark', e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div className="form-group" style={{ marginBottom: 0, flexGrow: 1 }}>
                    <select
                      className="form-control"
                      style={{ padding: '6px 10px', fontSize: '0.85rem', height: '34px' }}
                      value={statusInputs[item.sNo] || item.status}
                      onChange={(e) => handleInputChange(item.sNo, 'status', e.target.value)}
                    >
                      <option value="Follow-up">Keep as Follow-up</option>
                      <option value="Pending">Keep as Pending</option>
                      {statusesOpt
                        .filter(s => s !== 'Pending' && s !== 'Follow-up')
                        .map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))
                      }
                    </select>
                  </div>

                  <button
                    className="btn-action-sm primary"
                    style={{ height: '34px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => handleSaveFollowUp(item.sNo, item)}
                    disabled={updatingId === item.sNo}
                  >
                    {updatingId === item.sNo ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Save
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn-action-sm"
                  style={{ width: '100%', borderColor: 'var(--emerald-border)', color: 'var(--emerald)', backgroundColor: 'var(--emerald-bg)', fontSize: '0.75rem', padding: '6px' }}
                  onClick={() => handleMarkAsDone(item.sNo)}
                  disabled={updatingId === item.sNo}
                >
                  Quick Mark Admission Done
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
