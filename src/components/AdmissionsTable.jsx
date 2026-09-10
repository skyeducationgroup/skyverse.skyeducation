import React, { useState, useEffect } from 'react';
import { Search, Download, Upload, Edit2, RefreshCw, Filter, Calendar, Check, AlertCircle, X, Save, FileSpreadsheet, AlertTriangle, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

function MultiSelect({ label, options, selectedValues, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (val) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const displayText = selectedValues.length === 0 
    ? placeholder 
    : selectedValues.length === options.length
      ? `All ${label}s`
      : selectedValues.length === 1
        ? selectedValues[0]
        : `${selectedValues.length} Selected`;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        type="button" 
        className="filter-select" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: 'pointer',
          minWidth: '140px',
          textAlign: 'left',
          height: '34px',
          padding: '0 12px',
          margin: 0
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }}>
          {displayText}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '38px',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          maxHeight: '220px',
          overflowY: 'auto',
          padding: '8px',
          minWidth: '180px'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '4px 6px', 
            fontSize: '0.8rem', 
            fontWeight: 600, 
            cursor: 'pointer',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '4px',
            color: 'var(--text-primary)'
          }}>
            <input 
              type="checkbox" 
              checked={selectedValues.length === options.length && options.length > 0} 
              onChange={handleSelectAll}
              style={{ cursor: 'pointer' }}
            />
            <span>Select All</span>
          </label>
          
          {options.map((opt, idx) => {
            const isChecked = selectedValues.includes(opt);
            return (
              <label 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '4px 6px', 
                  fontSize: '0.8rem', 
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-xs)',
                  color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: isChecked ? 'var(--bg-tertiary)' : 'transparent'
                }}
                className="multiselect-option"
                onClick={(e) => {
                  if (e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    handleToggleOption(opt);
                  }
                }}
              >
                <input 
                  type="checkbox" 
                  checked={isChecked} 
                  onChange={() => handleToggleOption(opt)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdmissionsTable({ currentUser, initialFilters, clearInitialFilters }) {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters state
  const [filterSession, setFilterSession] = useState([]);
  const [filterCounsellor, setFilterCounsellor] = useState(() => {
    return currentUser?.role === 'counsellor' ? [currentUser.name] : [];
  });
  const [filterUniversity, setFilterUniversity] = useState([]);
  const [filterCourse, setFilterCourse] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterFeesType, setFilterFeesType] = useState([]);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [statusesOpt, setStatusesOpt] = useState([]);

  // Dropdown options lists
  const [sessionsOpt, setSessionsOpt] = useState([]);
  const [counsellorsOpt, setCounsellorsOpt] = useState([]);
  const [universitiesOpt, setUniversitiesOpt] = useState([]);
  const [coursesOpt, setCoursesOpt] = useState([]);
  const [feesTypesOpt, setFeesTypesOpt] = useState([]);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false);

  // Custom States for Role-based Edit & Success Whatsapp Modal
  const [fullSettings, setFullSettings] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState(null);
  const [copied, setCopied] = useState(false);

  // Excel Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1); // 1: Select File, 2: Map Columns, 3: Review Preview, 4: Importing
  const [importFile, setImportFile] = useState(null);
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [sheetRows, setSheetRows] = useState([]); // 2D array
  const [columnMappings, setColumnMappings] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState(null);

  const targetFields = [
    { key: 'studentName', label: 'Student Name *', required: true, synonyms: ['name', 'student', 'full name', 'student name', 'name of student'] },
    { key: 'mobileNumber', label: 'Mobile Number *', required: true, synonyms: ['mobile', 'phone', 'contact', 'number', 'mobile no.'] },
    { key: 'universityName', label: 'University Name', required: false, synonyms: ['university', 'uni', 'college', 'university name'] },
    { key: 'course', label: 'Course', required: false, synonyms: ['course', 'branch', 'program', 'degree'] },
    { key: 'session', label: 'Session', required: false, synonyms: ['session', 'batch', 'year', 'select session'] },
    { key: 'feesType', label: 'Fees Type', required: false, synonyms: ['fees type', 'fee type', 'paid fees for', 'type', 'fees paid for'] },
    { key: 'paymentMode', label: 'Payment Mode', required: false, synonyms: ['payment mode', 'mode', 'via', 'via from', 'pay mode'] },
    { key: 'amountPaid', label: 'Amount Paid', required: false, synonyms: ['amount', 'paid', 'fees paid', 'amount paid', 'price', 'paid fees', 'fees paid'] },
    { key: 'dateOfAdmission', label: 'Date of Admission', required: false, synonyms: ['date of admission', 'admission date', 'date'] },
    { key: 'counsellorName', label: 'Counsellor Name', required: false, synonyms: ['counsellor', 'counselor', 'handled by', 'staff', 'counsellor name'] },
    { key: 'leadSource', label: 'Lead Source', required: false, synonyms: ['lead source', 'source', 'channel'] },
    { key: 'remarks', label: 'Remarks', required: false, synonyms: ['remarks', 'remark', 'notes', 'comment'] },
    { key: 'status', label: 'Status', required: false, synonyms: ['status', 'stage'] }
  ];

  const autoMapColumns = (headers) => {
    const mappings = {};
    targetFields.forEach(field => {
      const matchedIndex = headers.findIndex(header => {
        const headerLower = String(header).toLowerCase().trim();
        
        // Strict exclusions to prevent cross-mapping amount and type
        if (field.key === 'amountPaid' && headerLower.includes('for')) {
          return false; // Skip "Paid Fees For" mapping to amount
        }
        if (field.key === 'feesType' && !headerLower.includes('for') && (headerLower === 'fees paid' || headerLower === 'paid fees' || headerLower === 'amount')) {
          return false; // Skip "Fees Paid" mapping to feesType
        }
        
        return field.synonyms.some(synonym => headerLower.includes(synonym) || synonym.includes(headerLower));
      });
      mappings[field.key] = matchedIndex !== -1 ? matchedIndex : '';
    });
    setColumnMappings(mappings);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to 2D array
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length === 0) {
          alert('Excel file is empty');
          return;
        }

        const headers = json[0];
        const rows = json.slice(1).filter(r => r.length > 0);

        setSheetHeaders(headers);
        setSheetRows(rows);
        autoMapColumns(headers);
        setImportStep(2); // Go to Step 2: Mapping
      } catch (err) {
        alert('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const generatePreview = () => {
    const studentNameMapped = columnMappings['studentName'] !== '';
    const mobileNumberMapped = columnMappings['mobileNumber'] !== '';

    if (!studentNameMapped || !mobileNumberMapped) {
      alert('Please map the required fields: Student Name and Mobile Number.');
      return;
    }

    const formatted = sheetRows.map((row) => {
      const record = {};
      targetFields.forEach(field => {
        const colIdx = columnMappings[field.key];
        let val = '';
        if (colIdx !== '' && colIdx !== undefined) {
          val = row[colIdx];
        }
        record[field.key] = val !== undefined ? String(val).trim() : '';
      });

      // Clean and normalize mobile number (strip spaces, country codes, dashes)
      if (record.mobileNumber) {
        let cleanMobile = record.mobileNumber.replace(/\D/g, '');
        if (cleanMobile.length === 12 && cleanMobile.startsWith('91')) {
          cleanMobile = cleanMobile.substring(2);
        } else if (cleanMobile.length === 11 && cleanMobile.startsWith('0')) {
          cleanMobile = cleanMobile.substring(1);
        }
        record.mobileNumber = cleanMobile;
      }

      // Normalize amount
      if (record.amountPaid) {
        record.amountPaid = Number(String(record.amountPaid).replace(/,/g, '')) || 0;
      } else {
        record.amountPaid = 0;
      }

      // Check duplicates
      const isDuplicateInDB = admissions.some(
        item => item.mobileNumber === record.mobileNumber
      );

      record.isDuplicate = isDuplicateInDB;
      record.isValid = record.studentName && record.mobileNumber && /^\d{10}$/.test(record.mobileNumber);

      return record;
    });

    setPreviewData(formatted);
    setImportStep(3); // Go to Step 3: Review Preview
  };

  const executeImport = async () => {
    setImportStep(4);
    setImportProgress(30);

    const recordsToImport = previewData.filter(item => item.isValid).map(item => ({
      session: item.session,
      studentName: item.studentName,
      mobileNumber: item.mobileNumber,
      universityName: item.universityName,
      course: item.course,
      feesType: item.feesType,
      paymentMode: item.paymentMode,
      amountPaid: item.amountPaid,
      dateOfAdmission: item.dateOfAdmission,
      counsellorName: item.counsellorName,
      leadSource: item.leadSource,
      remarks: item.remarks,
      status: item.status
    }));

    setImportProgress(60);

    try {
      const response = await fetch('/api/admissions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordsToImport)
      });

      const result = await response.json();
      setImportProgress(100);

      if (response.ok && result.success) {
        setImportSummary(result);
        fetchAdmissions(); // Refresh the table
      } else {
        alert(result.error || 'Import failed');
        setImportStep(3);
      }
    } catch (err) {
      alert('Error during bulk import');
      setImportStep(3);
    }
  };

  const resetImportState = () => {
    setShowImportModal(false);
    setImportStep(1);
    setImportFile(null);
    setSheetHeaders([]);
    setSheetRows([]);
    setColumnMappings({});
    setPreviewData([]);
    setImportProgress(0);
    setImportSummary(null);
  };

  useEffect(() => {
    fetchAdmissions();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.session !== undefined) setFilterSession(initialFilters.session ? [initialFilters.session] : []);
      if (initialFilters.counsellor !== undefined) {
        setFilterCounsellor(currentUser?.role === 'counsellor' ? [currentUser.name] : (initialFilters.counsellor ? [initialFilters.counsellor] : []));
      }
      if (initialFilters.university !== undefined) setFilterUniversity(initialFilters.university ? [initialFilters.university] : []);
      if (initialFilters.course !== undefined) setFilterCourse(initialFilters.course ? [initialFilters.course] : []);
      if (initialFilters.status !== undefined) setFilterStatus(initialFilters.status ? [initialFilters.status] : []);
      if (initialFilters.feesType !== undefined) setFilterFeesType(initialFilters.feesType ? [initialFilters.feesType] : []);
      if (initialFilters.startDate !== undefined) setFilterStartDate(initialFilters.startDate || '');
      if (initialFilters.endDate !== undefined) setFilterEndDate(initialFilters.endDate || '');
      
      if (clearInitialFilters) {
        clearInitialFilters();
      }
    }
  }, [initialFilters, clearInitialFilters, currentUser]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setFullSettings(data);
        if (data.dropdowns && data.dropdowns.statuses) {
          setStatusesOpt(data.dropdowns.statuses);
        }
      }
    } catch (err) {
      console.error('Failed to load settings in admissions ledger:', err);
    }
  };

  const canEdit = (record) => {
    if (!currentUser) return false;
    const role = currentUser.role?.toLowerCase();
    if (role === 'admin' || role === 'it') return true;
    if (role === 'counsellor') {
      return record.counsellorName && record.counsellorName.trim().toLowerCase() === currentUser.name?.trim().toLowerCase();
    }
    if (role === 'tl') {
      const tlUser = fullSettings?.users?.find(u => u.username.toLowerCase() === currentUser.username?.toLowerCase());
      if (tlUser) {
        const teamNames = [tlUser.name?.trim().toLowerCase()];
        if (tlUser.counsellors && Array.isArray(tlUser.counsellors)) {
          tlUser.counsellors.forEach(cUsername => {
            const cUser = fullSettings.users?.find(u => u.username.toLowerCase() === cUsername.toLowerCase());
            if (cUser && cUser.name) {
              teamNames.push(cUser.name.trim().toLowerCase());
            }
          });
        }
        return record.counsellorName && teamNames.includes(record.counsellorName.trim().toLowerCase());
      }
      return record.counsellorName && record.counsellorName.trim().toLowerCase() === currentUser.name?.trim().toLowerCase();
    }
    return false;
  };

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      let url = '/api/admissions';
      if (currentUser?.role === 'counsellor') {
        url += `?counsellorName=${encodeURIComponent(currentUser.name)}`;
      } else if (currentUser?.role === 'tl') {
        url += `?tlUsername=${encodeURIComponent(currentUser.username)}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Sort descending by S.No
        const sorted = data.sort((a, b) => b.sNo - a.sNo);
        setAdmissions(sorted);
        
        // Extract unique options for filters
        setSessionsOpt([...new Set(data.map(item => item.session).filter(Boolean))]);
        setCounsellorsOpt([...new Set(data.map(item => item.counsellorName).filter(Boolean))]);
        setUniversitiesOpt([...new Set(data.map(item => item.universityName).filter(Boolean))]);
        setCoursesOpt([...new Set(data.map(item => item.course).filter(Boolean))]);
        setFeesTypesOpt([...new Set(data.map(item => item.feesType).filter(Boolean))]);
      } else {
        throw new Error('Failed to load admission list');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Perform Manual Sync
  const handleSync = async (sNo) => {
    setSyncingId(sNo);
    try {
      const response = await fetch(`/api/admissions/${sNo}/sync`, { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update item locally
          setAdmissions(prev => prev.map(item => item.sNo === sNo ? result.data : item));
        }
      }
    } catch (err) {
      console.error('Failed to sync:', err);
    } finally {
      setSyncingId(null);
    }
  };

  // Pull and sync database records from Google Sheet
  const handleSyncPull = async () => {
    try {
      setSyncingGoogleSheets(true);
      const response = await fetch('/api/admissions/sync-pull', {
        method: 'POST'
      });
      const result = await response.json();
      if (response.ok && result.success) {
        alert(`Sync Complete!\n\nInserted: ${result.insertedCount} new records\nUpdated: ${result.updatedCount} existing records\nDeleted: ${result.deletedCount || 0} removed records\nTotal sheet records: ${result.totalCount}`);
        fetchAdmissions(); // Refresh the local database list
      } else {
        alert('Sync failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error connecting to backend for sync: ' + err.message);
    } finally {
      setSyncingGoogleSheets(false);
    }
  };

  // Handle inline edits submit
  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admissions/${editingRecord.sNo}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
          'x-user-username': currentUser?.username || ''
        },
        body: JSON.stringify(editingRecord)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAdmissions(prev => prev.map(item => item.sNo === editingRecord.sNo ? result.data : item));
        setSubmittedRecord(result.data);
        setShowSuccessModal(true);
        setEditingRecord(null);
      } else {
        alert(result.error || 'Failed to update record');
      }
    } catch (err) {
      alert('Error updating record. Check backend connection.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete admission record
  const handleDelete = async (sNo, studentName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the admission record of ${studentName} (S.No: ${sNo})?\nThis action will also delete the record from Google Sheets.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/admissions/${sNo}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setAdmissions(prev => prev.filter(item => item.sNo !== sNo));
      } else {
        alert(result.error || 'Failed to delete record');
      }
    } catch (err) {
      alert('Error connecting to backend for delete: ' + err.message);
    }
  };

  // Export Filtered Table to CSV (Excel compatible)
  const handleExport = () => {
    const headers = [
      'S.No', 'Date', 'Time', 'Session', 'Name Of Student', 'Mobile No.', 
      'University Name', 'Course', 'Paid Fees For', 'Via From', 
      'Fees Paid', 'Date of Admission', 'Counsellor Name', 'Lead Source', 
      'Remarks', 'Status'
    ];

    const rows = filteredAdmissions.map(item => [
      item.sNo,
      item.date,
      item.time,
      item.session,
      item.studentName,
      item.mobileNumber,
      item.universityName,
      item.course,
      item.feesType,
      item.paymentMode,
      item.amountPaid,
      item.dateOfAdmission,
      item.counsellorName,
      item.leadSource,
      item.remarks.replace(/\n/g, ' '),
      item.status
    ]);

    // Build CSV Content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sky_Education_Admissions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering Logic
  const filteredAdmissions = admissions.filter(item => {
    // Search query matching
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      item.studentName?.toLowerCase().includes(searchLower) ||
      item.mobileNumber?.toLowerCase().includes(searchLower) ||
      item.counsellorName?.toLowerCase().includes(searchLower) ||
      item.universityName?.toLowerCase().includes(searchLower) ||
      item.course?.toLowerCase().includes(searchLower) ||
      item.remarks?.toLowerCase().includes(searchLower);

    // Dropdown filters matching
    const matchesSession = filterSession.length === 0 || filterSession.includes(item.session);
    const matchesCounsellor = filterCounsellor.length === 0 || filterCounsellor.includes(item.counsellorName);
    const matchesUniversity = filterUniversity.length === 0 || filterUniversity.includes(item.universityName);
    const matchesCourse = filterCourse.length === 0 || filterCourse.includes(item.course);
    const matchesStatus = filterStatus.length === 0 || filterStatus.includes(item.status);
    const matchesFeesType = filterFeesType.length === 0 || filterFeesType.includes(item.feesType);

    // Date range filter matching
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      const recordDate = new Date(item.dateOfAdmission);
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        if (recordDate < start) matchesDate = false;
      }
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999); // Set to end of day
        if (recordDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesSession && matchesCounsellor && matchesUniversity && matchesCourse && matchesStatus && matchesFeesType && matchesDate;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'Admission Done': return 'badge-done';
      case 'Registration': return 'badge-registration';
      case 'Pending': return 'badge-pending';
      case 'Follow-up': return 'badge-followup';
      case 'Refund':
      case 'Refund ProcessStarted':
        return 'badge-refund';
      default: return 'badge-tag';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '10px' }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--accent-primary)' }} />
        <span>Loading Admissions Ledger...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="duplicate-alert" style={{ backgroundColor: 'var(--rose-bg)', borderColor: 'var(--rose-border)', color: 'var(--rose)' }}>
        <span>Error: {error}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Table Header Controls */}
      <div className="table-header-controls">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search student, mobile, university, remarks..."
            className="form-control search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {(currentUser?.role === 'admin' || currentUser?.role === 'it') && (
            <button 
              className="btn-export" 
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--emerald)' }} 
              onClick={handleSyncPull}
              disabled={syncingGoogleSheets}
            >
              <RefreshCw className={syncingGoogleSheets ? "animate-spin" : ""} size={18} />
              {syncingGoogleSheets ? "Syncing..." : "Sync Google Sheets"}
            </button>
          )}

          {(currentUser?.role === 'admin' || currentUser?.role === 'it') && (
            <button 
              className="btn-export" 
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)', color: 'var(--accent-light)' }} 
              onClick={() => setShowImportModal(true)}
            >
              <Upload size={18} />
              Import Excel/CSV
            </button>
          )}
          
          <button className="btn-export" onClick={handleExport} disabled={filteredAdmissions.length === 0}>
            <Download size={18} />
            Export to Excel (CSV)
          </button>
        </div>
      </div>

      {/* Filter Options Panel */}
      <div className="filters-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', marginRight: '8px' }}>
          <Filter size={16} />
          <span>Filters:</span>
        </div>

        {/* Date Ranges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="date"
            className="filter-select"
            style={{ minWidth: '120px', padding: '6px 10px' }}
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            className="filter-select"
            style={{ minWidth: '120px', padding: '6px 10px' }}
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
          />
        </div>

        {/* Session Filter */}
        <MultiSelect 
          label="Session" 
          options={sessionsOpt} 
          selectedValues={filterSession} 
          onChange={setFilterSession} 
          placeholder="All Sessions" 
        />

        {/* Counsellor Filter */}
        {currentUser?.role !== 'counsellor' && (
          <MultiSelect 
            label="Counsellor" 
            options={counsellorsOpt} 
            selectedValues={filterCounsellor} 
            onChange={setFilterCounsellor} 
            placeholder="All Counsellors" 
          />
        )}

        {/* University Filter */}
        <MultiSelect 
          label="University" 
          options={universitiesOpt} 
          selectedValues={filterUniversity} 
          onChange={setFilterUniversity} 
          placeholder="All Universities" 
        />

        {/* Course Filter */}
        <MultiSelect 
          label="Course" 
          options={coursesOpt} 
          selectedValues={filterCourse} 
          onChange={setFilterCourse} 
          placeholder="All Courses" 
        />

        {/* Fees Type Filter */}
        <MultiSelect 
          label="Fees Type" 
          options={feesTypesOpt} 
          selectedValues={filterFeesType} 
          onChange={setFilterFeesType} 
          placeholder="All Fees Types" 
        />

        {/* Status Filter */}
        <MultiSelect 
          label="Status" 
          options={statusesOpt} 
          selectedValues={filterStatus} 
          onChange={setFilterStatus} 
          placeholder="All Statuses" 
        />

        {/* Reset Filters button */}
        {(filterSession.length > 0 || (currentUser?.role === 'counsellor' ? false : filterCounsellor.length > 0) || filterUniversity.length > 0 || filterCourse.length > 0 || filterStatus.length > 0 || filterFeesType.length > 0 || filterStartDate || filterEndDate) && (
          <button 
            className="btn-action-sm" 
            style={{ padding: '6px 12px', borderColor: 'var(--rose-border)', color: 'var(--rose)', background: 'var(--rose-bg)', margin: 0 }}
            onClick={() => {
              setFilterSession([]);
              setFilterCounsellor(currentUser?.role === 'counsellor' ? [currentUser.name] : []);
              setFilterUniversity([]);
              setFilterCourse([]);
              setFilterStatus([]);
              setFilterFeesType([]);
              setFilterStartDate('');
              setFilterEndDate('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div style={{ marginBottom: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Showing <strong>{filteredAdmissions.length}</strong> of {admissions.length} records
      </div>

      {/* Main Table Grid */}
      <div className="table-container">
        <table className="crm-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>S.No</th>
              <th>Student Name</th>
              <th>Mobile</th>
              <th>University & Course</th>
              <th>Fees Details</th>
              <th>Date of Adm.</th>
              <th>Counsellor</th>
              <th>Sync</th>
              <th>Tags</th>
              <th>Status</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmissions.length === 0 ? (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No admission records found matching filters.
                </td>
              </tr>
            ) : (
              filteredAdmissions.map((item) => {
                const sheetSynced = item.syncStatus?.googleSheets === 'success';
                const whatsappSent = item.syncStatus?.whatsapp === 'success' || item.syncStatus?.whatsapp === 'simulated';

                return (
                  <tr key={item.sNo}>
                    <td style={{ fontWeight: 600 }}>#{item.sNo}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead: {item.leadSource}</div>
                    </td>
                    <td>{item.mobileNumber}</td>
                    <td>
                      <div>{item.universityName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.course} | {item.session}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--emerald)' }}>Rs. {item.amountPaid.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.feesType} ({item.paymentMode})</div>
                    </td>
                    <td>{item.dateOfAdmission}</td>
                    <td style={{ fontWeight: 500 }}>{item.counsellorName}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Sheets Sync */}
                        <div title={`Google Sheets: ${item.syncStatus?.googleSheets || 'Pending'}`}>
                          {sheetSynced ? (
                            <Check size={16} style={{ color: 'var(--emerald)' }} />
                          ) : (
                            <AlertCircle size={16} style={{ color: 'var(--rose)' }} />
                          )}
                        </div>

                        {/* WhatsApp Sync */}
                        <div title={`WhatsApp Notification: ${item.syncStatus?.whatsapp || 'Pending'}`}>
                          {whatsappSent ? (
                            <Check size={16} style={{ color: 'var(--emerald)' }} />
                          ) : (
                            <AlertCircle size={16} style={{ color: 'var(--rose)' }} />
                          )}
                        </div>

                        {/* Re-Sync Trigger Button if failed */}
                        {(!sheetSynced || !whatsappSent) && (
                          <button 
                            className="btn-action-icon"
                            style={{ width: '22px', height: '22px', padding: 0 }}
                            title="Trigger Manual Re-sync"
                            onClick={() => handleSync(item.sNo)}
                            disabled={syncingId === item.sNo}
                          >
                            <RefreshCw size={12} className={syncingId === item.sNo ? 'animate-spin' : ''} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {item.tags?.map((tag, i) => (
                          <span 
                            key={i} 
                            className="badge badge-tag" 
                            style={{ 
                              fontSize: '0.65rem', 
                              padding: '2px 6px',
                              borderColor: tag === 'Duplicate Contact' ? 'var(--rose-border)' : tag === 'High Value' ? 'var(--emerald-border)' : 'var(--border-color)',
                              color: tag === 'Duplicate Contact' ? 'var(--rose)' : tag === 'High Value' ? 'var(--emerald)' : 'var(--text-secondary)',
                              backgroundColor: tag === 'Duplicate Contact' ? 'var(--rose-bg)' : tag === 'High Value' ? 'var(--emerald-bg)' : 'var(--bg-tertiary)'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {canEdit(item) && (
                          <button 
                            className="btn-action-icon" 
                            title="Edit Student Record"
                            onClick={() => setEditingRecord(item)}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'it') && (
                          <button 
                            className="btn-action-icon" 
                            title="Delete Student Record"
                            style={{ color: 'var(--rose)' }}
                            onClick={() => handleDelete(item.sNo, item.studentName)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Table Summary Bar */}
      <div className="table-summary-bar" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 20px', 
        marginTop: '16px', 
        backgroundColor: 'var(--bg-secondary)', 
        borderRadius: 'var(--radius-sm)', 
        border: '1px solid var(--border-color)',
        fontSize: '0.9rem',
        fontWeight: 500,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          Total Filtered Records: <strong style={{ color: 'var(--accent-light)', fontSize: '1.05rem', marginLeft: '6px' }}>{filteredAdmissions.length}</strong>
        </div>
        <div>
          Total Fees Amount: <strong style={{ color: 'var(--emerald)', fontSize: '1.05rem', marginLeft: '6px' }}>Rs. {filteredAdmissions.reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0).toLocaleString('en-IN')}</strong>
        </div>
      </div>

      {/* Edit Record Modal overlay */}
      {editingRecord && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Edit Admission Details</h3>
              <button className="modal-close" onClick={() => setEditingRecord(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Student Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingRecord.studentName}
                    onChange={(e) => setEditingRecord({...editingRecord, studentName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingRecord.mobileNumber}
                    onChange={(e) => setEditingRecord({...editingRecord, mobileNumber: e.target.value})}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>University</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingRecord.universityName}
                    onChange={(e) => setEditingRecord({...editingRecord, universityName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Course</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingRecord.course}
                    onChange={(e) => setEditingRecord({...editingRecord, course: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Amount Paid (INR)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editingRecord.amountPaid}
                    onChange={(e) => setEditingRecord({...editingRecord, amountPaid: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Date of Admission</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editingRecord.dateOfAdmission || ''}
                    onChange={(e) => setEditingRecord({...editingRecord, dateOfAdmission: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={editingRecord.status}
                    onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
                  >
                    {statusesOpt.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group form-full-width">
                  <label>Remarks</label>
                  <textarea
                    rows={3}
                    className="form-control"
                    value={editingRecord.remarks}
                    onChange={(e) => setEditingRecord({...editingRecord, remarks: e.target.value})}
                  ></textarea>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn-action-sm" onClick={() => setEditingRecord(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-action-sm primary" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <RefreshCw className="animate-spin" size={14} style={{ marginRight: '6px' }} />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save size={14} style={{ marginRight: '6px' }} />
                      Save & Sync Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel / CSV Bulk Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={22} style={{ color: 'var(--accent-primary)' }} />
                Bulk Import Students (Excel/CSV)
              </h3>
              <button className="modal-close" onClick={resetImportState}>
                <X size={20} />
              </button>
            </div>

            {/* Step 1: Select File */}
            {importStep === 1 && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }} className="animate-fade-in">
                <div className="success-icon-wrapper" style={{ width: '80px', height: '80px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-light)', marginBottom: '20px' }}>
                  <Upload size={36} />
                </div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Select Spreadsheet File</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) formats.
                </p>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button className="btn-submit" style={{ pointerEvents: 'none' }}>
                    Choose Spreadsheet File
                  </button>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    style={{ position: 'absolute', left: 0, top: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Mapping columns */}
            {importStep === 2 && (
              <div className="animate-fade-in">
                <div style={{ backgroundColor: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
                  📄 File: <strong>{importFile?.name}</strong> ({sheetRows.length} rows detected). Map your Excel headers to the portal columns.
                </div>

                <div className="settings-double-grid" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px', gap: '16px', marginBottom: '20px' }}>
                  {targetFields.map((field) => (
                    <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>{field.label}</label>
                      <select
                        className="form-control"
                        style={{ height: '36px', padding: '6px 12px', fontSize: '0.85rem' }}
                        value={columnMappings[field.key] ?? ''}
                        onChange={(e) => setColumnMappings({ ...columnMappings, [field.key]: e.target.value !== '' ? Number(e.target.value) : '' })}
                      >
                        <option value="">-- Skip / Ignore Column --</option>
                        {sheetHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>
                            Column {idx + 1}: {header}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <button className="btn-action-sm" onClick={resetImportState}>Cancel</button>
                  <button className="btn-action-sm primary" onClick={generatePreview}>
                    Generate Preview & Validate
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review Preview */}
            {importStep === 3 && (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    Valid records to import: <strong style={{ color: 'var(--emerald)' }}>{previewData.filter(d => d.isValid).length}</strong> / {previewData.length}
                    {previewData.some(d => d.isDuplicate) && (
                      <span style={{ color: 'var(--amber)', marginLeft: '12px' }}>
                        ⚠️ {previewData.filter(d => d.isDuplicate).length} Duplicate Warning(s)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', maxHeight: '300px', marginBottom: '20px' }}>
                  <table className="crm-table" style={{ fontSize: '0.8rem' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      <tr>
                        <th>Status Check</th>
                        <th>Student Name</th>
                        <th>Mobile</th>
                        <th>University & Course</th>
                        <th>Fees Paid</th>
                        <th>Counsellor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, idx) => (
                        <tr key={idx} style={{ opacity: row.isValid ? 1 : 0.65, backgroundColor: row.isDuplicate ? 'rgba(245, 158, 11, 0.05)' : '' }}>
                          <td>
                            {row.isValid ? (
                              row.isDuplicate ? (
                                <span className="badge badge-pending" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>DUP WARNING</span>
                              ) : (
                                <span className="badge badge-done" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>VALID</span>
                              )
                            ) : (
                              <span className="badge badge-tag" style={{ color: 'var(--rose)', borderColor: 'var(--rose-border)', backgroundColor: 'var(--rose-bg)', fontSize: '0.6rem', padding: '2px 6px' }}>
                                INVALID ROW
                              </span>
                            )}
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.studentName || <span style={{ color: 'var(--rose)' }}>Missing Name</span>}</td>
                          <td>
                            {row.mobileNumber || <span style={{ color: 'var(--rose)' }}>Missing Mobile</span>}
                            {row.mobileNumber && !/^\d{10}$/.test(row.mobileNumber) && (
                              <span style={{ color: 'var(--rose)', display: 'block', fontSize: '0.7rem' }}>Must be 10 digits</span>
                            )}
                          </td>
                          <td>{row.universityName} — {row.course}</td>
                          <td style={{ color: 'var(--emerald)' }}>Rs. {Number(row.amountPaid || 0).toLocaleString('en-IN')}</td>
                          <td>{row.counsellorName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <button className="btn-action-sm" onClick={() => setImportStep(2)}>Back to Mapping</button>
                  <button 
                    className="btn-action-sm primary" 
                    onClick={executeImport}
                    disabled={previewData.filter(d => d.isValid).length === 0}
                  >
                    Confirm Import ({previewData.filter(d => d.isValid).length} Students)
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Importing / Result Summary */}
            {importStep === 4 && (
              <div style={{ textAlign: 'center', padding: '30px 20px' }} className="animate-fade-in">
                {!importSummary ? (
                  <div>
                    <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 16px', display: 'block' }} />
                    <h4>Importing Spreadsheet Records...</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      Registering profiles and triggering background Sheets synchronization...
                    </p>
                    <div style={{ width: '100%', maxWidth: '300px', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', margin: '20px auto 0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${importProgress}%`, backgroundColor: 'var(--accent-primary)', transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <div className="success-icon-wrapper" style={{ marginBottom: '20px' }}>
                      <Check size={32} />
                    </div>
                    <h4 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Bulk Import Completed!</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      Spreadsheet parsed and records successfully written to local database.
                    </p>
                    
                    <div className="details-list" style={{ maxWidth: '400px', margin: '0 auto 20px' }}>
                      <div className="details-row">
                        <span className="details-label">Total Records Processed</span>
                        <span className="details-value">{importSummary.importedCount}</span>
                      </div>
                      <div className="details-row">
                        <span className="details-label">Status</span>
                        <span className="details-value" style={{ color: 'var(--emerald)' }}>Success</span>
                      </div>
                    </div>

                    <button className="btn-action-sm primary" style={{ width: '100%', maxWidth: '200px', margin: '0 auto' }} onClick={resetImportState}>
                      Close & Reload Ledger
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Success/WhatsApp Copy Modal */}
      {showSuccessModal && submittedRecord && (
        <div className="modal-overlay">
          <div className="modal-content glass-card animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Admission Updated Successfully!</h3>
              <button className="modal-close" onClick={() => setShowSuccessModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="success-icon-wrapper" style={{ margin: '20px auto', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald)' }}>
              <Check size={32} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '1.15rem' }}>{submittedRecord.studentName}</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Status: <span className="badge badge-done" style={{ fontSize: '0.75rem', padding: '2px 8px', textTransform: 'uppercase' }}>{submittedRecord.status}</span>
              </p>
            </div>

            {/* Manual WhatsApp Copy Section */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  💬 WhatsApp Message (Copy & Paste):
                </span>
                <button
                  className="btn-action-sm"
                  style={{ 
                    margin: 0, 
                    padding: '4px 8px', 
                    fontSize: '0.7rem',
                    backgroundColor: copied ? 'var(--emerald-bg)' : 'transparent',
                    color: copied ? 'var(--emerald)' : 'var(--text-primary)',
                    borderColor: copied ? 'var(--emerald-border)' : 'var(--border-color)'
                  }}
                  onClick={() => {
                    const statusTitle = submittedRecord.status?.toLowerCase().endsWith('done') ? submittedRecord.status : `${submittedRecord.status} Done`;
                    const msg = `*Sky Education Group - ${statusTitle}*\n\n` +
                      `*Session:* ${submittedRecord.session}\n` +
                      `*Student Name:* ${submittedRecord.studentName}\n` +
                      `*Mobile Number:* ${submittedRecord.mobileNumber}\n\n` +
                      `*University:* ${submittedRecord.universityName}\n` +
                      `*Course:* ${submittedRecord.course}\n\n` +
                      `*Fees Type:* ${submittedRecord.feesType}\n` +
                      `*Payment Mode:* ${submittedRecord.paymentMode}\n` +
                      `*Amount Paid:* Rs. ${Number(submittedRecord.amountPaid).toLocaleString('en-IN')}\n\n` +
                      `*Date of Admission:* ${submittedRecord.dateOfAdmission}\n` +
                      `*Handled By:* ${submittedRecord.counsellorName}\n` +
                      `*Lead Source:* ${submittedRecord.leadSource}`;
                    navigator.clipboard.writeText(msg);
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
                borderRadius: 'var(--radius-sm)', 
                padding: '10px', 
                fontSize: '0.75rem', 
                maxHeight: '180px', 
                overflowY: 'auto', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                margin: 0,
                color: 'var(--text-primary)'
              }}>{(() => {
                const statusTitle = submittedRecord.status?.toLowerCase().endsWith('done') ? submittedRecord.status : `${submittedRecord.status} Done`;
                return `*Sky Education Group - ${statusTitle}*\n\n` +
                  `*Session:* ${submittedRecord.session}\n` +
                  `*Student Name:* ${submittedRecord.studentName}\n` +
                  `*Mobile Number:* ${submittedRecord.mobileNumber}\n\n` +
                  `*University:* ${submittedRecord.universityName}\n` +
                  `*Course:* ${submittedRecord.course}\n\n` +
                  `*Fees Type:* ${submittedRecord.feesType}\n` +
                  `*Payment Mode:* ${submittedRecord.paymentMode}\n` +
                  `*Amount Paid:* Rs. ${Number(submittedRecord.amountPaid).toLocaleString('en-IN')}\n\n` +
                  `*Date of Admission:* ${submittedRecord.dateOfAdmission}\n` +
                  `*Handled By:* ${submittedRecord.counsellorName}\n` +
                  `*Lead Source:* ${submittedRecord.leadSource}`;
              })()}</pre>
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
