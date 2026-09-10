import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, AlertTriangle, Send, RefreshCw, X } from 'lucide-react';

export default function CounsellorForm({ currentUser }) {
  const [dropdowns, setDropdowns] = useState(null);
  const [formData, setFormData] = useState({
    session: '',
    studentName: '',
    mobileNumber: '',
    universityName: '',
    course: '',
    feesType: '',
    paymentMode: '',
    amountPaid: '',
    dateOfAdmission: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })(), // Prefill with today's date
    counsellorName: currentUser.role === 'counsellor' ? currentUser.name : '',
    leadSource: '',
    remarks: '',
    status: 'Admission Done'
  });

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load dropdown config from settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        
        let filteredCounsellors = data.dropdowns?.counsellors || [];
        if (currentUser.role === 'tl') {
          const tlUser = data.users?.find(u => u.username.toLowerCase() === currentUser.username.toLowerCase());
          if (tlUser) {
            const teamNames = [];
            if (tlUser.name) teamNames.push(tlUser.name);
            if (tlUser.counsellors && Array.isArray(tlUser.counsellors)) {
              tlUser.counsellors.forEach(cUsername => {
                const match = data.users?.find(u => u.username.toLowerCase() === cUsername.toLowerCase());
                if (match && match.name) {
                  teamNames.push(match.name);
                }
              });
            }
            filteredCounsellors = [...new Set(teamNames)];
          }
        }
        
        setDropdowns({
          ...(data.dropdowns || {}),
          counsellors: filteredCounsellors
        });
        
        // Auto-select first dropdown values if they are empty
        setFormData(prev => ({
          ...prev,
          session: data.dropdowns?.sessions?.[0] || '',
          universityName: data.dropdowns?.universities?.[0] || '',
          course: data.dropdowns?.courses?.[0] || '',
          feesType: data.dropdowns?.feesTypes?.[0] || '',
          paymentMode: data.dropdowns?.paymentModes?.[0] || '',
          leadSource: data.dropdowns?.leadSources?.[0] || '',
          status: data.dropdowns?.statuses?.[0] || 'Admission Done',
          counsellorName: currentUser.role === 'counsellor' ? currentUser.name : (filteredCounsellors[0] || '')
        }));
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  // Perform live duplicate mobile number detection
  useEffect(() => {
    if (formData.mobileNumber.length === 10) {
      const checkDuplicate = async () => {
        try {
          const response = await fetch(`/api/admissions/check-duplicate?mobile=${formData.mobileNumber}`);
          if (response.ok) {
            const data = await response.json();
            if (data.isDuplicate) {
              setDuplicateWarning(data);
            } else {
              setDuplicateWarning(null);
            }
          }
        } catch (err) {
          console.error('Duplicate check failed:', err);
        }
      };
      checkDuplicate();
    } else {
      setDuplicateWarning(null);
    }
  }, [formData.mobileNumber]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.studentName.trim()) newErrors.studentName = 'Student name is required';
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    }
    if (!formData.amountPaid) {
      newErrors.amountPaid = 'Amount paid is required';
    } else if (isNaN(formData.amountPaid) || Number(formData.amountPaid) < 0) {
      newErrors.amountPaid = 'Amount must be a positive number';
    }
    if (!formData.dateOfAdmission) newErrors.dateOfAdmission = 'Date of admission is required';
    if (!formData.counsellorName) newErrors.counsellorName = 'Counsellor name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          submitterRole: currentUser?.role,
          submitterUsername: currentUser?.username
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSubmittedRecord(result.data);
        setShowSuccessModal(true);
        // Reset form but retain some prefilled values like counsellor and session
        setFormData(prev => ({
          ...prev,
          studentName: '',
          mobileNumber: '',
          amountPaid: '',
          remarks: '',
          dateOfAdmission: (() => {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })()
        }));
        setDuplicateWarning(null);
      } else {
        alert(result.error || 'Failed to submit admission form');
      }
    } catch (err) {
      alert('Error submitting form. Please check backend connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppTemplate = (record) => {
    if (!record) return '';
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
  };

  if (!dropdowns) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '10px' }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent-primary)' }} />
        <span>Loading Form Configuration...</span>
      </div>
    );
  }

  return (
    <div className="entry-form-container glass-card animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div className="success-icon-wrapper" style={{ margin: 0, width: '40px', height: '40px' }}>
          <UserCheck size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Student Admission Entry</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enter admission details to register and trigger sync</p>
        </div>
      </div>

      {duplicateWarning && (
        <div className="duplicate-alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Warning: Duplicate Student Detected!</strong> This mobile number is already registered for student <strong>{duplicateWarning.studentName}</strong>, handled by counsellor <strong>{duplicateWarning.counsellorName}</strong> on <strong>{duplicateWarning.date}</strong> (Status: <em>{duplicateWarning.status}</em>).
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Session Dropdown */}
          <div className="form-group">
            <label>Session *</label>
            <select name="session" className="form-control" value={formData.session} onChange={handleInputChange}>
              {dropdowns.sessions.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Student Name */}
          <div className="form-group">
            <label>Student Name *</label>
            <input
              type="text"
              name="studentName"
              placeholder="Full Name"
              className={`form-control ${errors.studentName ? 'invalid' : ''}`}
              value={formData.studentName}
              onChange={handleInputChange}
            />
            {errors.studentName && <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>{errors.studentName}</span>}
          </div>

          {/* Mobile Number */}
          <div className="form-group">
            <label>Mobile Number (10 digits) *</label>
            <input
              type="text"
              name="mobileNumber"
              placeholder="e.g. 9876543210"
              maxLength={10}
              className={`form-control ${errors.mobileNumber ? 'invalid' : ''}`}
              value={formData.mobileNumber}
              onChange={handleInputChange}
            />
            {errors.mobileNumber && <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>{errors.mobileNumber}</span>}
          </div>

          {/* University Dropdown */}
          <div className="form-group">
            <label>University Name *</label>
            <select name="universityName" className="form-control" value={formData.universityName} onChange={handleInputChange}>
              {dropdowns.universities.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Course Dropdown */}
          <div className="form-group">
            <label>Course *</label>
            <select name="course" className="form-control" value={formData.course} onChange={handleInputChange}>
              {dropdowns.courses.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Fees Type Dropdown */}
          <div className="form-group">
            <label>Fees Type *</label>
            <select name="feesType" className="form-control" value={formData.feesType} onChange={handleInputChange}>
              {dropdowns.feesTypes.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode Dropdown */}
          <div className="form-group">
            <label>Payment Mode *</label>
            <select name="paymentMode" className="form-control" value={formData.paymentMode} onChange={handleInputChange}>
              {dropdowns.paymentModes.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Amount Paid */}
          <div className="form-group">
            <label>Amount Paid (INR) *</label>
            <input
              type="number"
              name="amountPaid"
              placeholder="e.g. 25000"
              className={`form-control ${errors.amountPaid ? 'invalid' : ''}`}
              value={formData.amountPaid}
              onChange={handleInputChange}
            />
            {errors.amountPaid && <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>{errors.amountPaid}</span>}
          </div>

          {/* Date of Admission */}
          <div className="form-group">
            <label>Date of Admission *</label>
            <input
              type="date"
              name="dateOfAdmission"
              className={`form-control ${errors.dateOfAdmission ? 'invalid' : ''}`}
              value={formData.dateOfAdmission}
              onChange={handleInputChange}
            />
            {errors.dateOfAdmission && <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>{errors.dateOfAdmission}</span>}
          </div>

          {/* Counsellor Name */}
          <div className="form-group">
            <label>Counsellor Name *</label>
            {currentUser.role === 'counsellor' ? (
              <input
                type="text"
                className="form-control"
                value={formData.counsellorName}
                disabled
              />
            ) : (
              <select name="counsellorName" className="form-control" value={formData.counsellorName} onChange={handleInputChange}>
                <option value="">-- Select Counsellor --</option>
                {/* Dynamically list counsellors from settings or active ones */}
                {dropdowns.counsellors?.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                )) || (
                  <>
                    <option value="Anshika">Anshika</option>
                    <option value="Deepa Gupta">Deepa Gupta</option>
                  </>
                )}
              </select>
            )}
            {errors.counsellorName && <span style={{ fontSize: '0.75rem', color: 'var(--rose)' }}>{errors.counsellorName}</span>}
          </div>

          {/* Lead Source */}
          <div className="form-group">
            <label>Lead Source *</label>
            <select name="leadSource" className="form-control" value={formData.leadSource} onChange={handleInputChange}>
              {dropdowns.leadSources.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="form-group">
            <label>Status *</label>
            <select name="status" className="form-control" value={formData.status} onChange={handleInputChange}>
              {dropdowns.statuses?.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              )) || (
                <>
                  <option value="Admission Done">Admission Done</option>
                  <option value="Registration">Registration</option>
                  <option value="Pending">Pending</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Refund">Refund</option>
                  <option value="Refund ProcessStarted">Refund ProcessStarted</option>
                </>
              )}
            </select>
          </div>

          {/* Remarks */}
          <div className="form-group form-full-width">
            <label>Remarks / Notes</label>
            <textarea
              name="remarks"
              rows={3}
              placeholder="Enter special requirements, payment details or follow-up notes..."
              className="form-control"
              value={formData.remarks}
              onChange={handleInputChange}
            ></textarea>
          </div>
        </div>

        <button type="submit" className="btn-submit" style={{ width: '100%' }} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              Saving Student Details...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit Admission Record
            </>
          )}
        </button>
      </form>

      {/* Success Modal */}
      {showSuccessModal && submittedRecord && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>
                {submittedRecord.pendingApproval ? "Submitted for Approval!" : "Admission Recorded!"}
              </h3>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="success-icon-wrapper">
              <CheckCircle2 size={32} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '1.15rem' }}>{submittedRecord.studentName}</h4>
              {submittedRecord.pendingApproval ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--amber)', marginTop: '8px', lineHeight: '1.4' }}>
                  Your entry is queued. It will show up in analytics and the ledger once approved by the Administrator.
                </p>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  S.No: #{submittedRecord.sNo} | Code: Sky-{submittedRecord.sNo}
                </p>
              )}
            </div>

            <div className="details-list">
              <div className="details-row">
                <span className="details-label">Mobile Number</span>
                <span className="details-value">{submittedRecord.mobileNumber}</span>
              </div>
              <div className="details-row">
                <span className="details-label">University</span>
                <span className="details-value">{submittedRecord.universityName}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Course</span>
                <span className="details-value">{submittedRecord.course}</span>
              </div>
              <div className="details-row">
                <span className="details-label">Fees Paid</span>
                <span className="details-value" style={{ color: 'var(--emerald)', fontWeight: 700 }}>
                  Rs. {submittedRecord.amountPaid.toLocaleString('en-IN')}
                </span>
              </div>
            </div>



            {/* Manual WhatsApp Copy Section */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  📋 WhatsApp Message (Copy & Paste):
                </span>
                <button
                  className="btn-action-sm"
                  style={{ 
                    margin: 0, 
                    padding: '4px 10px', 
                    fontSize: '0.75rem', 
                    backgroundColor: copied ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-secondary)', 
                    borderColor: copied ? 'var(--emerald)' : 'var(--border-color)', 
                    color: copied ? 'var(--emerald)' : 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(getWhatsAppTemplate(submittedRecord));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? 'Copied!' : 'Copy Message'}
                </button>
              </div>
              <pre style={{ 
                backgroundColor: 'var(--bg-primary)', 
                border: '1px solid var(--border-color)', 
                padding: '10px', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '0.75rem', 
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                maxHeight: '130px',
                overflowY: 'auto',
                color: 'var(--text-secondary)',
                margin: 0
              }}>{getWhatsAppTemplate(submittedRecord)}</pre>
            </div>

            <button className="btn-submit" style={{ width: '100%', marginTop: '20px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }} onClick={() => setShowSuccessModal(false)}>
              Done & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
