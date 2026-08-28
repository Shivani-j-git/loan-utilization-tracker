import { useEffect, useState } from 'react';
import API from '../api/axios';

export default function Loans() {
  const [loans,   setLoans]   = useState([]);
  const [showForm,setShowForm] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [form, setForm] = useState({
    loanType: 'personal', lenderName: '',
    principalAmount: '', interestRate: '',
    tenureMonths: '', emiAmount: '',
    disbursementDate: '', nextEmiDate: '',
  });

  const fetchLoans = () => {
    API.get('/api/loans').then(r => setLoans(r.data))
       .catch(() => setLoans([]));
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/api/loans', form);
      setShowForm(false);
      setForm({
        loanType: 'personal', lenderName: '',
        principalAmount: '', interestRate: '',
        tenureMonths: '', emiAmount: '',
        disbursementDate: '', nextEmiDate: '',
      });
      fetchLoans();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding loan');
    } finally {
      setLoading(false);
    }
  };

  const deleteLoan = async (id) => {
    if (!window.confirm('Delete this loan?')) return;
    await API.delete(`/api/loans/${id}`);
    fetchLoans();
  };

  const inputStyle = {
    width:        '100%',
    border:       '2px solid #e5e7eb',
    borderRadius: '8px',
    padding:      '10px 12px',
    fontSize:     '14px',
    outline:      'none',
    boxSizing:    'border-box',
    color:        '#1f2937',
  };

  const labelStyle = {
    display:      'block',
    fontSize:     '12px',
    fontWeight:   '600',
    color:        '#6b7280',
    marginBottom: '4px',
    textTransform:'uppercase',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '24px',
      }}>
        <div>
          <h1 style={{
            fontSize:   '24px',
            fontWeight: 'bold',
            color:      '#1e3a5f',
            margin:     '0 0 4px',
          }}>
            🏦 My Loans
          </h1>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
            Manage all your loan accounts
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background:   'linear-gradient(135deg, #1e3a5f, #2563eb)',
            color:        'white',
            border:       'none',
            borderRadius: '10px',
            padding:      '12px 20px',
            fontSize:     '14px',
            fontWeight:   '600',
            cursor:       'pointer',
            boxShadow:    '0 4px 12px rgba(37,99,235,0.3)',
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add New Loan'}
        </button>
      </div>

      {/* Add Loan Form */}
      {showForm && (
        <div style={{
          background:   'white',
          borderRadius: '16px',
          padding:      '24px',
          marginBottom: '24px',
          boxShadow:    '0 4px 20px rgba(0,0,0,0.1)',
          border:       '2px solid #dbeafe',
        }}>
          <h2 style={{
            fontSize:     '18px',
            fontWeight:   '700',
            color:        '#1e3a5f',
            marginBottom: '20px',
          }}>
            ➕ Add New Loan
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{
              display:             'grid',
              gridTemplateColumns: '1fr 1fr',
              gap:                 '16px',
              marginBottom:        '16px',
            }}>

              {/* Loan Type */}
              <div>
                <label style={labelStyle}>Loan Type</label>
                <select
                  value={form.loanType}
                  onChange={e => setForm({ ...form, loanType: e.target.value })}
                  style={{ ...inputStyle, background: 'white' }}
                >
                  <option value="personal">Personal Loan</option>
                  <option value="home">Home Loan</option>
                  <option value="vehicle">Vehicle Loan</option>
                  <option value="education">Education Loan</option>
                  <option value="business">Business Loan</option>
                </select>
              </div>

              {/* Lender */}
              <div>
                <label style={labelStyle}>Lender / Bank Name</label>
                <input
                  type="text"
                  value={form.lenderName}
                  onChange={e => setForm({ ...form, lenderName: e.target.value })}
                  placeholder="SBI, HDFC, ICICI..."
                  required
                  style={inputStyle}
                />
              </div>

              {/* Principal */}
              <div>
                <label style={labelStyle}>Principal Amount (Rs.)</label>
                <input
                  type="number"
                  value={form.principalAmount}
                  onChange={e => setForm({ ...form, principalAmount: e.target.value })}
                  placeholder="500000"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label style={labelStyle}>Interest Rate (% per year)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.interestRate}
                  onChange={e => setForm({ ...form, interestRate: e.target.value })}
                  placeholder="12.5"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Tenure */}
              <div>
                <label style={labelStyle}>Tenure (Months)</label>
                <input
                  type="number"
                  value={form.tenureMonths}
                  onChange={e => setForm({ ...form, tenureMonths: e.target.value })}
                  placeholder="60"
                  required
                  style={inputStyle}
                />
              </div>

              {/* EMI */}
              <div>
                <label style={labelStyle}>Monthly EMI (Rs.)</label>
                <input
                  type="number"
                  value={form.emiAmount}
                  onChange={e => setForm({ ...form, emiAmount: e.target.value })}
                  placeholder="11122"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Disbursement Date */}
              <div>
                <label style={labelStyle}>Disbursement Date</label>
                <input
                  type="date"
                  value={form.disbursementDate}
                  onChange={e => setForm({ ...form, disbursementDate: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>

              {/* Next EMI Date */}
              <div>
                <label style={labelStyle}>Next EMI Date</label>
                <input
                  type="date"
                  value={form.nextEmiDate}
                  onChange={e => setForm({ ...form, nextEmiDate: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background:   loading
                               ? '#93c5fd'
                               : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                color:        'white',
                border:       'none',
                borderRadius: '10px',
                padding:      '12px 28px',
                fontSize:     '15px',
                fontWeight:   '600',
                cursor:       loading ? 'not-allowed' : 'pointer',
                boxShadow:    '0 4px 12px rgba(37,99,235,0.3)',
              }}
            >
              {loading ? '⏳ Saving...' : '✅ Save Loan'}
            </button>
          </form>
        </div>
      )}

      {/* Loans List */}
      {loans.length === 0 ? (
        <div style={{
          background:     'white',
          borderRadius:   '16px',
          padding:        '60px 24px',
          textAlign:      'center',
          boxShadow:      '0 2px 10px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏦</div>
          <h3 style={{ color: '#1e3a5f', marginBottom: '8px' }}>
            No loans added yet
          </h3>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Click "Add New Loan" to start tracking
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loans.map(loan => (
            <div key={loan._id} style={{
              background:   'white',
              borderRadius: '16px',
              padding:      '20px 24px',
              boxShadow:    '0 2px 10px rgba(0,0,0,0.08)',
              display:      'flex',
              justifyContent: 'space-between',
              alignItems:   'center',
              borderLeft:   `5px solid ${
                loan.utilizationScore > 75 ? '#16a34a'
                : loan.utilizationScore > 50 ? '#d97706'
                : '#dc2626'
              }`,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{
                    background:    '#eff6ff',
                    color:         '#1e40af',
                    padding:       '3px 10px',
                    borderRadius:  '20px',
                    fontSize:      '12px',
                    fontWeight:    '700',
                    textTransform: 'capitalize',
                  }}>
                    {loan.loanType}
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: '#1e3a5f' }}>
                    {loan.lenderName}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#6b7280' }}>
                  <span>💰 Outstanding: <strong style={{ color: '#1e3a5f' }}>
                    Rs.{loan.outstandingBalance?.toLocaleString()}
                  </strong></span>
                  <span>📅 EMI: <strong style={{ color: '#1e3a5f' }}>
                    Rs.{loan.emiAmount?.toLocaleString()}
                  </strong></span>
                  <span>🗓 Next Due: <strong style={{ color: '#1e3a5f' }}>
                    {new Date(loan.nextEmiDate).toLocaleDateString('en-IN')}
                  </strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize:   '22px',
                    fontWeight: 'bold',
                    color:      loan.utilizationScore > 75 ? '#16a34a'
                                : loan.utilizationScore > 50 ? '#d97706'
                                : '#dc2626',
                  }}>
                    {loan.utilizationScore}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Health Score
                  </div>
                </div>
                <button
                  onClick={() => deleteLoan(loan._id)}
                  style={{
                    background:   '#fee2e2',
                    color:        '#dc2626',
                    border:       'none',
                    borderRadius: '8px',
                    padding:      '8px 14px',
                    fontSize:     '13px',
                    fontWeight:   '600',
                    cursor:       'pointer',
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
