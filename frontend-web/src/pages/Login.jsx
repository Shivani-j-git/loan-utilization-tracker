import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

export default function Login() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/api/auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:       '100vh',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      background:      'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
      fontFamily:      'Arial, sans-serif',
    }}>
      <div style={{
        background:   'white',
        borderRadius: '16px',
        boxShadow:    '0 20px 60px rgba(0,0,0,0.3)',
        padding:      '40px',
        width:        '100%',
        maxWidth:     '420px',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '48px' }}>🏦</span>
        </div>

        {/* Title */}
        <h1 style={{
          textAlign:   'center',
          color:       '#1e3a5f',
          fontSize:    '24px',
          fontWeight:  'bold',
          margin:      '0 0 4px 0',
        }}>
          Loan Tracker
        </h1>

        <p style={{
          textAlign:    'center',
          color:        '#6b7280',
          fontSize:     '14px',
          marginBottom: '28px',
        }}>
          Sign in to your account
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            background:   '#fef2f2',
            border:       '1px solid #fca5a5',
            borderRadius: '8px',
            color:        '#dc2626',
            padding:      '12px',
            marginBottom: '16px',
            fontSize:     '14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display:      'block',
              fontSize:     '14px',
              fontWeight:   '500',
              color:        '#374151',
              marginBottom: '6px',
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="rakesh@gmail.com"
              required
              style={{
                width:        '100%',
                border:       '1.5px solid #d1d5db',
                borderRadius: '8px',
                padding:      '10px 14px',
                fontSize:     '14px',
                outline:      'none',
                boxSizing:    'border-box',
                transition:   'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e  => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display:      'block',
              fontSize:     '14px',
              fontWeight:   '500',
              color:        '#374151',
              marginBottom: '6px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              style={{
                width:        '100%',
                border:       '1.5px solid #d1d5db',
                borderRadius: '8px',
                padding:      '10px 14px',
                fontSize:     '14px',
                outline:      'none',
                boxSizing:    'border-box',
                transition:   'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e  => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:        '100%',
              background:   loading ? '#93c5fd' : '#1e3a5f',
              color:        'white',
              border:       'none',
              borderRadius: '8px',
              padding:      '12px',
              fontSize:     '16px',
              fontWeight:   '600',
              cursor:       loading ? 'not-allowed' : 'pointer',
              transition:   'background 0.2s',
            }}
            onMouseEnter={e => {
              if (!loading) e.target.style.background = '#2563eb';
            }}
            onMouseLeave={e => {
              if (!loading) e.target.style.background = '#1e3a5f';
            }}
          >
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          textAlign:  'center',
          margin:     '20px 0',
          color:      '#9ca3af',
          fontSize:   '13px',
        }}>
          ── or ──
        </div>

        {/* Register Link */}
        <p style={{
          textAlign: 'center',
          fontSize:  '14px',
          color:     '#6b7280',
          margin:    0,
        }}>
          No account?{' '}
          <Link
            to="/register"
            style={{
              color:          '#2563eb',
              fontWeight:     '600',
              textDecoration: 'none',
            }}
          >
            Register here
          </Link>
        </p>

        {/* Demo credentials hint */}
        <div style={{
          marginTop:    '20px',
          background:   '#f0f9ff',
          border:       '1px solid #bae6fd',
          borderRadius: '8px',
          padding:      '12px',
          fontSize:     '12px',
          color:        '#0369a1',
        }}>
          <strong>Demo:</strong> rakesh@gmail.com / password123
        </div>

      </div>
    </div>
  );
}
