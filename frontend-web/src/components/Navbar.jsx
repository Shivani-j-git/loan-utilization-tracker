import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <span style={styles.logoIcon}>🏦</span>
        <span style={styles.logoText}>Loan Tracker</span>
      </div>
      <div style={styles.links}>
        <Link to='/' style={styles.link}>Dashboard</Link>
        <Link to='/loans' style={styles.link}>My Loans</Link>
        <Link to='/analytics' style={styles.link}>Analytics</Link>
        <Link to='/ai-advisor' style={styles.link}>AI Advisor</Link>
      </div>
      <div style={styles.userSection}>
        <span style={styles.username}>👋 {user?.name || 'User'}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
};

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' },
  brand: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700', color: '#0f172a' },
  logoIcon: { fontSize: '22px' },
  logoText: { color: '#2563eb' },
  links: { display: 'flex', gap: '24px', alignItems: 'center' },
  link: { textDecoration: 'none', color: '#475569', fontWeight: '600', fontSize: '15px' },
  userSection: { display: 'flex', alignItems: 'center', gap: '16px' },
  username: { fontWeight: '600', color: '#1e293b', fontSize: '14px' },
  logoutBtn: { backgroundColor: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }
};

export default Navbar;