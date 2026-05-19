import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Ensure this points to the correct context file!
import { useAppContext } from '../context/AppContext.jsx'; 

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setUser } = useAppContext(); // Changed from login to setUser based on our recent AppContext update
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const user = await res.json();
      
      if (res.ok) {
        setUser(user); // Pass the user object to global context
        navigate('/'); // Go to Dashboard
      } else {
        setError(user.detail || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Is your Python backend running?');
    }
    setIsLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Hit your new FastAPI signup route!
      const res = await fetch('http://127.0.0.1:8000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const user = await res.json();
      
      if (res.ok) {
        // 2. If signup is successful, log them right in!
        setUser(user); 
        navigate('/'); 
      } else {
        setError(user.detail || 'Signup failed');
      }
    } catch (error) {
      setError('Network error. Is your Python backend running?');
    }
    setIsLoading(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '20px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              fontSize: '16px',
              background: 'linear-gradient(135deg, #5b8dee, #5beec5)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '700',
            }}
          >
            A
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
            Acad<span style={{ color: 'var(--mint)' }}>Web</span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: '700' }}>
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isSignup ? 'Sign up to get started' : 'Sign in to your account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              background: 'rgba(249,112,104,0.1)',
              border: '1px solid var(--coral)',
              color: 'var(--coral)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '0.85rem',
              whiteSpace: 'pre-line'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={isSignup ? handleSignup : handleLogin}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: '16px' }}
            disabled={isLoading}
          >
            {isLoading ?  'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
              setUsername('');
              setPassword('');
              setConfirmPassword('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--mint)',
              cursor: 'pointer',
              fontWeight: '600',
              textDecoration: 'underline',
            }}
          >
            {/* {isSignup ? 'Sign In' : 'Sign Up'} */}
          </button>
        </div>

        {/* Demo Credentials */}
      </div>
    </div>
  );
}