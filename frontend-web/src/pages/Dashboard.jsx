import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/loans', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setLoans(res.data)).catch(() => {});
  }, []);

  const totalLoans = loans.length;
  const totalOutstanding = loans.reduce((sum, l) => sum + Number(l.outstandingAmount || l.amount || 0), 0);
  const atRiskLoans = loans.filter(l => (l.healthScore || 100) < 50).length;
  const avgHealth = totalLoans > 0 ? Math.round(loans.reduce((sum, l) => sum + Number(l.healthScore || 100), 0) / totalLoans) : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>Welcome back 👋</h2>
      <p style={{ color: '#64748b' }}>Here is your loan portfolio overview</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '24px 0' }}>
        <div style={{ background: '#1e40af', color: '#fff', padding: '20px', borderRadius: '12px' }}>
          <div>Total Loans</div>
          <h1 style={{ margin: '8px 0 0' }}>{totalLoans}</h1>
        </div>
        <div style={{ background: '#d97706', color: '#fff', padding: '20px', borderRadius: '12px' }}>
          <div>Total Outstanding</div>
          <h1 style={{ margin: '8px 0 0' }}>₹{(totalOutstanding / 100000).toFixed(1)}L</h1>
        </div>
        <div style={{ background: '#dc2626', color: '#fff', padding: '20px', borderRadius: '12px' }}>
          <div>At Risk Loans</div>
          <h1 style={{ margin: '8px 0 0' }}>{atRiskLoans}</h1>
        </div>
        <div style={{ background: '#16a34a', color: '#fff', padding: '20px', borderRadius: '12px' }}>
          <div>Avg Health Score</div>
          <h1 style={{ margin: '8px 0 0' }}>{avgHealth}/100</h1>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;