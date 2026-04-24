'use client';
import { useState, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, customName })
      });
      const data = await res.json();
      if (data.success) {
        // Use replace instead of push to prevent back-button navigation to login
        if (data.user.role === 'DOCTOR') router.replace('/dashboard/doctor');
        else if (data.user.role === 'NURSE') router.replace('/dashboard/nursing');
        else if (data.user.role === 'RECEPTIONIST') router.replace('/dashboard/reception');
        else if (data.user.role === 'PHARMACIST') router.replace('/dashboard/pharmacy');
        else if (data.user.role === 'LAB_TECH') router.replace('/dashboard/lab');
        else if (data.user.role === 'ADMIN') router.replace('/dashboard/admin');
        else router.replace('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        if (data.success) {
          const role = data.user.role;
          let path = '/dashboard';
          if (role === 'DOCTOR') path = '/dashboard/doctor';
          else if (role === 'NURSE') path = '/dashboard/nursing';
          else if (role === 'RECEPTIONIST') path = '/dashboard/reception';
          else if (role === 'PHARMACIST') path = '/dashboard/pharmacy';
          else if (role === 'LAB_TECH') path = '/dashboard/lab';
          else if (role === 'ADMIN') path = '/dashboard/admin';
          router.replace(path);
        } else {
          setCheckingSession(false);
        }
      } catch (err) {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router]);

  if (checkingSession) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', padding: '20px' }}>
      <div className="glass-card" style={{ width: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--primary)', borderRadius: '50%', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '24px' }}>M</div>
          <h1 style={{ fontSize: '24px', color: 'var(--primary)' }}>Malar Hospital</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Staff Internal Portal</p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="nurse@malar.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-input" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Your Name (Mandatory)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. John Doe" 
              value={customName} 
              onChange={e => setCustomName(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          Contact IT Support if you forgot your credentials.
        </div>
      </div>
    </div>
  );
}
