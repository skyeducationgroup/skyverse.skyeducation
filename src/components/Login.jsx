import React, { useState, useEffect, useRef } from 'react';
import { LogIn, User, Lock, BookOpen, RefreshCw, Shield } from 'lucide-react';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // 'admin', 'it', 'counsellor'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  // Captcha states
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const canvasRef = useRef(null);

  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghkmnpqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaValue(result);
    setCaptchaInput('');
    setError('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (captchaValue && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 120, 40);
      
      // Draw background noise lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * 120, Math.random() * 40);
        ctx.lineTo(Math.random() * 120, Math.random() * 40);
        ctx.stroke();
      }
      
      // Draw random dots for noise
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 30; i++) {
        ctx.fillRect(Math.random() * 120, Math.random() * 40, 1.5, 1.5);
      }
      
      // Draw text characters with different rotations/baselines
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#60a5fa'; // Bright light blue text
      ctx.textBaseline = 'middle';
      
      const charArray = captchaValue.split('');
      charArray.forEach((char, index) => {
        const x = 12 + index * 20;
        const y = 20 + (Math.random() - 0.5) * 8;
        const angle = (Math.random() - 0.5) * 0.4;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      });
    }
  }, [captchaValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!show2FA && captchaInput.toLowerCase() !== captchaValue.toLowerCase()) {
      setError('Verification code is incorrect');
      generateCaptcha();
      return;
    }

    if (show2FA && (!otpInput || otpInput.length !== 6 || isNaN(Number(otpInput)))) {
      setError('Please enter a valid 6-digit Google Authenticator code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = { username, password, role };
      if (show2FA) {
        payload.otpCode = otpInput;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.requires2FA) {
          setShow2FA(true);
          setError('');
          setOtpInput('');
        } else {
          onLogin(data.user);
        }
      } else {
        setError(data.message || 'Invalid username or password for selected role');
        if (!show2FA) generateCaptcha();
      }
    } catch (err) {
      setError('Connection error. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-card animate-fade-in">
        <div className="auth-logo">
          <img 
            src="/logo.png" 
            alt="Sky Education Group Logo" 
            style={{ width: '130px', height: 'auto', marginBottom: '16px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} 
          />
          <h2>Sky Education <span style={{ color: 'var(--emerald)' }}>Group</span></h2>
          <p className="user-role" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Performance & Rewards Portal
          </p>
        </div>

        {error && (
          <div className="duplicate-alert" style={{ backgroundColor: 'var(--rose-bg)', borderColor: 'var(--rose-border)', color: 'var(--rose)' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!show2FA ? (
            <>
              {/* Account Type Selector buttons */}
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select Account Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {['admin', 'it', 'tl', 'counsellor'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRole(type)}
                      className={`btn-action-sm ${role === type ? 'primary' : ''}`}
                      style={{ 
                        height: '38px', 
                        margin: 0, 
                        textTransform: 'uppercase', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="username"
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '40px' }}
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    style={{ paddingLeft: '40px' }}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* CAPTCHA Field */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="captcha" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} style={{ color: 'var(--accent-primary)' }} />
                  Verification Code (CAPTCHA)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '2px', display: 'flex', alignItems: 'center', height: '40px' }}>
                    <canvas ref={canvasRef} width="120" height="40" style={{ display: 'block', borderRadius: 'var(--radius-sm)' }} />
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="btn-action-icon"
                      style={{ width: '30px', height: '30px', border: 'none', background: 'transparent' }}
                      title="Refresh Verification Code"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  
                  <input
                    id="captcha"
                    type="text"
                    className="form-control"
                    style={{ height: '44px', fontFamily: 'monospace', letterSpacing: '2px', textAlign: 'center', fontSize: '1.1rem' }}
                    placeholder="Code"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    maxLength={5}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="form-group animate-fade-in" style={{ marginBottom: '24px' }}>
              <label htmlFor="otp" style={{ color: 'var(--amber)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} style={{ color: 'var(--amber)' }} />
                Google Authenticator OTP (2FA)
              </label>
              <input
                id="otp"
                type="text"
                className="form-control"
                placeholder="Enter 6-digit OTP code"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                maxLength={6}
                required
                style={{ letterSpacing: '2px', fontFamily: 'monospace', fontSize: '1.25rem', textAlign: 'center', height: '44px' }}
                autoFocus
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                Enter the code generated by your Google Authenticator app.
              </p>
            </div>
          )}

          <button type="submit" className="btn-submit" style={{ width: '100%' }} disabled={isLoading}>
            <LogIn size={18} />
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {show2FA && (
            <button
              type="button"
              className="logout-btn"
              style={{ marginTop: '12px', width: '100%', border: '1px solid var(--border-color)' }}
              onClick={() => {
                setShow2FA(false);
                setOtpInput('');
                generateCaptcha();
              }}
            >
              Back to Credentials Login
            </button>
          )}
        </form>


      </div>
    </div>
  );
}

