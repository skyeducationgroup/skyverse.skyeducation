import React, { useState, useEffect } from 'react';
import { Check, X, Clock, User, RefreshCw, AlertCircle, Award } from 'lucide-react';

export default function ApprovalsPanel({ currentUser, onApprovalProcessed }) {
  const [approvals, setApprovals] = useState([]);
  const [incentiveRequests, setIncentiveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingIncentives, setLoadingIncentives] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [activeQueueTab, setActiveQueueTab] = useState('admissions');
  const [comments, setComments] = useState({});

  useEffect(() => {
    fetchApprovals();
    fetchIncentives();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
      } else {
        throw new Error('Failed to load pending approvals');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncentives = async () => {
    try {
      setLoadingIncentives(true);
      setError(null);
      const res = await fetch('/api/incentive-requests');
      if (res.ok) {
        const data = await res.json();
        const pending = data.filter(r => r.status === 'pending');
        setIncentiveRequests(pending);
      } else {
        throw new Error('Failed to load pending incentives');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingIncentives(false);
    }
  };

  const handleApprove = async (id, studentName) => {
    const confirmApprove = window.confirm(`Are you sure you want to APPROVE the admission of ${studentName}? This will save it to the database, update all metrics, and trigger automated integrations (Google Sheets & WhatsApp notification).`);
    if (!confirmApprove) return;

    setProcessingId(id);
    try {
      const res = await fetch(`/api/approvals/${id}/approve`, {
        method: 'POST'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setApprovals(prev => prev.filter(item => item.id !== id));
        if (onApprovalProcessed) {
          onApprovalProcessed();
        }
      } else {
        alert(result.error || 'Failed to approve record');
      }
    } catch (err) {
      alert('Error communicating with server for approval: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, studentName) => {
    const confirmReject = window.confirm(`Are you sure you want to REJECT the entry for ${studentName}? This record will be permanently deleted and cannot be recovered.`);
    if (!confirmReject) return;

    setProcessingId(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setApprovals(prev => prev.filter(item => item.id !== id));
        if (onApprovalProcessed) {
          onApprovalProcessed();
        }
      } else {
        alert(result.error || 'Failed to reject record');
      }
    } catch (err) {
      alert('Error communicating with server for rejection: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleIncentiveAction = async (id, status, counsellorName) => {
    const comment = comments[id] || '';
    if (!comment.trim() && status === 'rejected') {
      const confirmRejectWithoutComment = window.confirm('Are you sure you want to reject this request without providing a comment?');
      if (!confirmRejectWithoutComment) return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/incentive-requests/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          comment,
          processedBy: currentUser.username
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setIncentiveRequests(prev => prev.filter(item => item.id !== id));
        setComments(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        if (onApprovalProcessed) {
          onApprovalProcessed();
        }
      } else {
        alert(result.error || 'Failed to process request');
      }
    } catch (err) {
      alert('Error processing request: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '10px' }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent-primary)' }} />
        <span>Loading Pending Approvals...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="duplicate-alert" style={{ backgroundColor: 'var(--rose-bg)', borderColor: 'var(--rose-border)', color: 'var(--rose)' }}>
        <AlertCircle size={20} />
        <span>Error: {error}</span>
      </div>
    );
  }

  const handleRefreshAll = () => {
    fetchApprovals();
    fetchIncentives();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Review student admissions entries and counselor incentive claim requests.
        </span>
        <button className="btn-action-sm" onClick={handleRefreshAll} style={{ margin: 0, padding: '6px 12px' }}>
          <RefreshCw size={14} style={{ marginRight: '6px' }} />
          Refresh Queues
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="settings-tabs" style={{ marginBottom: '4px' }}>
        <button
          className={`settings-tab-btn ${activeQueueTab === 'admissions' ? 'active' : ''}`}
          onClick={() => setActiveQueueTab('admissions')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <User size={16} />
          Admissions Approvals ({approvals.length})
        </button>
        <button
          className={`settings-tab-btn ${activeQueueTab === 'incentives' ? 'active' : ''}`}
          onClick={() => setActiveQueueTab('incentives')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Award size={16} />
          Incentive Claims ({incentiveRequests.length})
        </button>
      </div>

      {activeQueueTab === 'admissions' && (
        approvals.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Clock size={40} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>No Pending Approvals</h3>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>All submitted admissions have been processed.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {approvals.map((item) => (
              <div key={item.id} className="glass-card animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--amber)' }}>
                
                {/* Header Meta Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Submitted by: <span style={{ color: 'var(--accent-light)' }}>{item.counsellorName}</span> ({item.submitterUsername || 'N/A'})
                    </span>
                    <span className={`badge badge-pending`} style={{ textTransform: 'uppercase', fontSize: '0.65rem', padding: '1px 6px' }}>
                      {item.submitterRole}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} />
                    <span>Punched: {item.date} {item.time}</span>
                  </div>
                </div>

                {/* Data Fields Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Student Name</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '2px 0 0 0' }}>{item.studentName}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mobile Number</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 500, margin: '2px 0 0 0', fontFamily: 'monospace' }}>{item.mobileNumber}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>University & Course</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 500, margin: '2px 0 0 0' }}>{item.universityName} | {item.course}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fees & Payment Mode</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 500, margin: '2px 0 0 0' }}>{item.feesType} ({item.paymentMode})</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Amount Paid</span>
                    <p style={{ fontSize: '1rem', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--emerald)' }}>Rs. {item.amountPaid.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Status</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '2px 0 0 0' }}>{item.status}</p>
                  </div>
                </div>

                {/* Remarks block if any */}
                {item.remarks && (
                  <div style={{ padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Remarks:</span>
                    {item.remarks}
                  </div>
                )}

                {/* Actions Approve / Reject */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                  <button 
                    className="btn-action-sm" 
                    style={{ margin: 0, padding: '8px 16px', backgroundColor: 'var(--rose-bg)', borderColor: 'var(--rose-border)', color: 'var(--rose)' }}
                    onClick={() => handleReject(item.id, item.studentName)}
                    disabled={processingId !== null}
                  >
                    <X size={16} style={{ marginRight: '6px' }} />
                    Reject & Discard
                  </button>
                  <button 
                    className="btn-action-sm primary" 
                    style={{ margin: 0, padding: '8px 16px', backgroundColor: 'var(--emerald)', borderColor: 'var(--emerald-border)', color: 'white' }}
                    onClick={() => handleApprove(item.id, item.studentName)}
                    disabled={processingId !== null}
                  >
                    {processingId === item.id ? (
                      <RefreshCw className="animate-spin" size={16} style={{ marginRight: '6px' }} />
                    ) : (
                      <Check size={16} style={{ marginRight: '6px' }} />
                    )}
                    Approve Entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeQueueTab === 'incentives' && (
        incentiveRequests.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Clock size={40} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>No Pending Incentive Claims</h3>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>All incentive requests have been processed.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {incentiveRequests.map((item) => (
              <div key={item.id} className="glass-card animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--emerald)' }}>
                
                {/* Header Meta Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={16} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Requested by: <span style={{ color: 'var(--accent-light)' }}>{item.counsellorName}</span> ({item.counsellorUsername || 'N/A'})
                    </span>
                    <span className="badge badge-done" style={{ textTransform: 'uppercase', fontSize: '0.65rem', padding: '1px 6px' }}>
                      Claim Request
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} />
                    <span>Requested: {new Date(item.requestedAt).toLocaleDateString('en-IN')} {new Date(item.requestedAt).toLocaleTimeString('en-IN')}</span>
                  </div>
                </div>

                {/* Data Fields Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Period</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '2px 0 0 0', textTransform: 'capitalize' }}>{item.periodId} Target</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Period Range</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 500, margin: '2px 0 0 0' }}>{item.range}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target vs Achieved</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 500, margin: '2px 0 0 0' }}>Rs. {item.target.toLocaleString('en-IN')} / Rs. {item.revenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Achievement Percentage</span>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '2px 0 0 0', color: 'var(--accent-light)' }}>{item.percentage}%</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Eligible Incentive Amount</span>
                    <p style={{ fontSize: '1.05rem', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--emerald)' }}>Rs. {item.amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Comment / Reason Input Box */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Reason/Comment:</span>
                  <input
                    type="text"
                    className="filter-select"
                    placeholder="Enter approval/rejection comment (e.g. verified stats)..."
                    style={{ flex: 1, minWidth: '220px', height: '32px', padding: '4px 10px', fontSize: '0.8rem', margin: 0, backgroundColor: 'var(--bg-primary)' }}
                    value={comments[item.id] || ''}
                    onChange={(e) => setComments(prev => ({ ...prev, [item.id]: e.target.value }))}
                  />
                </div>

                {/* Actions Approve / Reject */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                  <button 
                    className="btn-action-sm" 
                    style={{ margin: 0, padding: '8px 16px', backgroundColor: 'var(--rose-bg)', borderColor: 'var(--rose-border)', color: 'var(--rose)' }}
                    onClick={() => handleIncentiveAction(item.id, 'rejected', item.counsellorName)}
                    disabled={processingId !== null}
                  >
                    <X size={16} style={{ marginRight: '6px' }} />
                    Reject Claim
                  </button>
                  <button 
                    className="btn-action-sm primary" 
                    style={{ margin: 0, padding: '8px 16px', backgroundColor: 'var(--emerald)', borderColor: 'var(--emerald-border)', color: 'white' }}
                    onClick={() => handleIncentiveAction(item.id, 'approved', item.counsellorName)}
                    disabled={processingId !== null}
                  >
                    {processingId === item.id ? (
                      <RefreshCw className="animate-spin" size={16} style={{ marginRight: '6px' }} />
                    ) : (
                      <Check size={16} style={{ marginRight: '6px' }} />
                    )}
                    Approve Claim
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
