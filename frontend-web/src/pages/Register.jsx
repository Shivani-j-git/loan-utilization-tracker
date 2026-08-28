import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({
    name:         '',
    email:        '',
    password:     '',
    mobileNumber: '',
    role:         'borrower',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/api/auth/register', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width:        '100%',
    border:       '1.5px solid #d1d5db',
    borderRadius: '8px',
    padding:      '10px 14px',
    fontSize:     '14px',
    outline:      'none',
    boxSizing:    'border-box',
  };

  const labelStyle = {
    display:      'block',
    fontSize:     '14px',
    fontWeight:   '500',
    color:        '#374151',
    marginBottom: '6px',
  };

  return (
    <div style={{
      minHeight:      'min-h-screen',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
      fontFamily:     'Arial, sans-serif',
      padding:        '20px',
    }}>
      <div style={{
        background:   'white',
        borderRadius: '16px',
        boxShadow:    '0 20px 60px rgba(0,0,0,0.3)',
        padding:      '40px',
        width:        '100%',
        maxWidth:     '440px',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '40px' }}>🏦</span>
          <h1 style={{
            color:      '#1e3a5f',
            fontSize:   '22px',
            fontWeight: 'bold',
            margin:     '8px 0 4px',
          }}>
            Create Account
          </h1>
          <p style={{ color: '#6b7280', fontSize: '13px' }}>
            Start tracking your loans today
          </p>
        </div>

        {/* Error */}
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

        <form onSubmit={handleSubmit}>

          {/* Name */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Rakesh Kumar"
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e  => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="rakesh@gmail.com"
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e  => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Mobile */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Mobile Number</label>
            <input
              type="tel"
              value={form.mobileNumber}
              onChange={e => setForm({ ...form, mobileNumber: e.target.value })}
              placeholder="9876543210"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e  => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e  => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Role */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>I am a</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              style={{
                ...inputStyle,
                background: 'white',
                cursor:     'pointer',
              }}
            >
              <option value="borrower">Borrower (I have loans)</option>
              <option value="lender">Lender / Bank Admin</option>
            </select>
          </div>

          {/* Submit */}
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
            }}
          >
            {loading ? '⏳ Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={{
          textAlign:  'center',
          fontSize:   '14px',
          color:      '#6b7280',
          marginTop:  '20px',
        }}>
          Already have account?{' '}
          <Link
            to="/login"
            style={{
              color:          '#2563eb',
              fontWeight:     '600',
              textDecoration: 'none',
            }}
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
