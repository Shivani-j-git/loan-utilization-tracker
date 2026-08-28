import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import API from '../api/axios';

const COLORS = ['#1e3a5f','#d97706','#dc2626','#16a34a','#7c3aed'];

export default function Analytics() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    API.get('/api/analytics/summary')
       .then(r => setSummary(r.data))
       .catch(() => setSummary({}));
  }, []);

  if (!summary) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '80vh',
      fontSize: '18px', color: '#6b7280',
    }}>
      ⏳ Loading analytics...
    </div>
  );

  const pieData = (summary.byType || []).map(t => ({
    name: t.loanType, value: t.totalOutstanding,
  }));

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <h1 style={{
        fontSize: '24px', fontWeight: 'bold',
        color: '#1e3a5f', marginBottom: '24px',
      }}>
        📈 Analytics Dashboard
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}>

        {/* Pie */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }}>
          <h2 style={{
            fontSize: '15px', fontWeight: '700',
            color: '#1e3a5f', marginBottom: '16px',
          }}>
            Portfolio by Loan Type
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value"
                   outerRadius={80} label={({ name }) => name}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={v => `Rs.${(v/100000).toFixed(1)}L`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar */}
        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }}>
          <h2 style={{
            fontSize: '15px', fontWeight: '700',
            color: '#1e3a5f', marginBottom: '16px',
          }}>
            Monthly Repayments
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary.monthlyPayments || []}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`}
                     tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => `Rs.${v.toLocaleString()}`} />
              <Bar dataKey="totalPaid" fill="#1e3a5f" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
