import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  KeyRound,
  Building2,
  HardHat,
  BadgeDollarSign,
  Package,
  Layers
} from 'lucide-react';
import { ERPService } from '../../services/erpStorage';
import { DEFAULT_USER_PASSWORD } from '../../services/mockData';
import { User } from '../../types';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const members = ERPService.getMembers().filter((m) => m.status === 'Active');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      ERPService.login(email.trim(), password);
      // Small timeout for smooth feedback
      setTimeout(() => {
        setLoading(false);
        navigate(from, { replace: true });
      }, 300);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleQuickLogin = (demoMember: User) => {
    setError(null);
    setEmail(demoMember.email);
    const pwd = demoMember.password || DEFAULT_USER_PASSWORD;
    setPassword(pwd);
    setLoading(true);
    try {
      ERPService.login(demoMember.email, pwd);
      setTimeout(() => {
        setLoading(false);
        navigate(from, { replace: true });
      }, 250);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Quick login failed.');
    }
  };

  const handleFillDefaultPassword = () => {
    setPassword(DEFAULT_USER_PASSWORD);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#090d16',
        backgroundImage: `
          radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.12) 0%, transparent 40%),
          linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        color: '#f8fafc',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ width: '100%', maxWidth: 1040, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 20,
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#60a5fa',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
            }}
          >
            <ShieldCheck size={14} />
            <span>APEX ENTERPRISE RBAC & JOB SPINE v1.0.0</span>
          </div>

          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 900,
              margin: 0,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Apex Electrical Contracting ERP
          </h1>

          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem', maxWidth: 540 }}>
            Unified execution platform for electrical jobs, procurement, site material tracking, and role-enforced governance.
          </p>
        </div>

        {/* Main 2-Column Split: Login Form (Left) & Quick Persona Accounts (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {/* Card 1: Credentials Form */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: '32px 28px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 30px rgba(37, 99, 235, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Staff Sign In
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Enter your staff email and password
                  </p>
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <Lock size={20} />
                </div>
              </div>

              {/* Default Password Banner */}
              <div
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <KeyRound size={20} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#bfdbfe' }}>
                      Default Staff Password:
                    </span>
                    <code
                      style={{
                        backgroundColor: '#1e293b',
                        padding: '2px 8px',
                        borderRadius: 4,
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      {DEFAULT_USER_PASSWORD}
                    </code>
                  </div>
                  <p style={{ margin: '4px 0 6px 0', fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    Pre-configured across all employee profiles. Click below to quickly fill this into the password box.
                  </p>
                  <button
                    type="button"
                    onClick={handleFillDefaultPassword}
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#60a5fa',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>Auto-fill "{DEFAULT_USER_PASSWORD}"</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: '0.8rem',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Credentials Form */}
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    Work Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      color="#64748b"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@apex.in or kavitha.site@apex.in"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={handleFillDefaultPassword}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Use Default ({DEFAULT_USER_PASSWORD})
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      color="#64748b"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 38px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: 8,
                    padding: '12px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  {loading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      <span>Sign In to ERP</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.74rem',
                color: '#64748b',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={13} color="#22c55e" /> Session Secured
              </span>
              <span>Need help? Contact Admin</span>
            </div>
          </div>

          {/* Card 2: 1-Click Quick Demo Accounts */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: '32px 28px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={18} color="#f59e0b" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    Quick Demo Accounts
                  </h2>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Click any profile to immediately sign in with default credentials
                </p>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 4,
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                1-Click Sign In
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 8,
                maxHeight: 380,
                overflowY: 'auto',
                paddingRight: 4,
              }}
            >
              {members.map((m) => {
                const getRoleIcon = (role: string) => {
                  switch (role.toLowerCase()) {
                    case 'admin':
                      return <ShieldCheck size={16} color="#ef4444" />;
                    case 'site engineer':
                      return <Building2 size={16} color="#0284c7" />;
                    case 'site supervisor':
                      return <HardHat size={16} color="#f59e0b" />;
                    case 'accounts head':
                      return <BadgeDollarSign size={16} color="#10b981" />;
                    case 'storekeeper':
                      return <Package size={16} color="#6366f1" />;
                    default:
                      return <Layers size={16} color="#8b5cf6" />;
                  }
                };

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleQuickLogin(m)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#273549';
                      e.currentTarget.style.borderColor = '#38bdf8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1e293b';
                      e.currentTarget.style.borderColor = '#334155';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getRoleIcon(m.role)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#ffffff' }}>
                            {m.name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 4,
                              backgroundColor: 'rgba(56, 189, 248, 0.12)',
                              color: '#38bdf8',
                            }}
                          >
                            {m.role}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 2 }}>
                          {m.email} {m.department ? `· ${m.department}` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: '#60a5fa',
                          backgroundColor: 'rgba(37, 99, 235, 0.15)',
                          padding: '3px 8px',
                          borderRadius: 4,
                        }}
                      >
                        Sign In →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 'auto',
                paddingTop: 16,
                borderTop: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.74rem',
                color: '#64748b',
              }}
            >
              <span>Password for all: <code style={{ color: '#38bdf8' }}>{DEFAULT_USER_PASSWORD}</code></span>
              <span>7 Active Staff Accounts</span>
            </div>
          </div>
        </div>

        {/* Feature Badges Footer */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 20,
            fontSize: '0.75rem',
            color: '#64748b',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: 16,
          }}
        >
          <span>⚡ RBAC Enforced (30 Granular Privileges)</span>
          <span>•</span>
          <span>🏢 Client Site Allocation & Material Inward Flow</span>
          <span>•</span>
          <span>📑 Job-Centric Billing & Commercial Ledger</span>
          <span>•</span>
          <span>🔒 Persistent Auth Session</span>
        </div>
      </div>
    </div>
  );
};
