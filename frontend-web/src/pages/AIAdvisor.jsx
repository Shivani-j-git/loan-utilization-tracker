import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const AIAdvisor = () => {
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const [loans, setLoans] = useState([]);
  const [loanLoading, setLoanLoading] = useState(true);
  const [loanError, setLoanError] = useState('');

  // =========================
  // FETCH REAL LOAN DATA
  // =========================

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoanLoading(true);
      setLoanError('');

      const res = await API.get('/api/loans');

      setLoans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching loans:', err);

      setLoanError(
        err.response?.data?.message ||
          'Unable to load your loan data.'
      );

      setLoans([]);
    } finally {
      setLoanLoading(false);
    }
  };

  // =========================
  // CALCULATE LOAN SUMMARY
  // =========================

  const totalLoan = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.principalAmount || 0),
    0
  );

  const outstandingAmount = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.outstandingBalance || 0),
    0
  );

  const repaidAmount = Math.max(
    totalLoan - outstandingAmount,
    0
  );

  /*
    Here utilization means:
    outstanding loan / original loan

    Example:
    Original = ₹2,00,000
    Outstanding = ₹1,35,000

    Utilization = 67.5%
  */

  const utilization =
    totalLoan > 0
      ? (outstandingAmount / totalLoan) * 100
      : 0;

  const repaymentProgress =
    totalLoan > 0
      ? (repaidAmount / totalLoan) * 100
      : 0;

  const totalMonthlyEMI = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.emiAmount || 0),
    0
  );

  // Find next EMI
  const nextLoan = [...loans]
    .filter((loan) => loan.nextEmiDate)
    .sort(
      (a, b) =>
        new Date(a.nextEmiDate) -
        new Date(b.nextEmiDate)
    )[0];

  const utilizationWidth = Math.min(
    Math.max(utilization, 0),
    100
  );

  // =========================
  // AI STRATEGY
  // =========================

  const fetchStrategy = async () => {
    setLoading(true);

    try {
      const res = await API.get('/api/ai/strategy');

      setStrategy(
        res.data.strategy ||
          'Review your loan repayment progress and keep enough funds reserved for upcoming EMIs.'
      );
    } catch (err) {
      console.error('Strategy error:', err);

      setStrategy(
        `You currently have ₹${outstandingAmount.toLocaleString(
          'en-IN'
        )} outstanding across ${
          loans.length
        } loan(s). Your repayment progress is ${repaymentProgress.toFixed(
          1
        )}%. Keep upcoming EMI funds reserved and review your repayment plan regularly.`
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CHAT
  // =========================

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        text: userMsg,
        sender: 'user',
      },
    ]);

    setInput('');

    try {
      const res = await API.post(
        '/api/ai/chat',
        {
          message: userMsg,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          text:
            res.data.reply ||
            'I could not generate a response right now.',
          sender: 'bot',
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);

      const question = userMsg.toLowerCase();

      let reply =
        'I can help you understand your loan balance, repayment progress and EMI information.';

      // Remaining / outstanding
      if (
        question.includes('remaining') ||
        question.includes('outstanding') ||
        question.includes('left')
      ) {
        reply = `You currently have ₹${outstandingAmount.toLocaleString(
          'en-IN'
        )} outstanding across ${
          loans.length
        } loan(s).`;
      }

      // Utilization
      else if (
        question.includes('utilization') ||
        question.includes('used')
      ) {
        reply = `Your current outstanding loan utilization is ${utilization.toFixed(
          1
        )}%. You have ₹${outstandingAmount.toLocaleString(
          'en-IN'
        )} outstanding from an original loan amount of ₹${totalLoan.toLocaleString(
          'en-IN'
        )}.`;
      }

      // Repayment progress
      else if (
        question.includes('repaid') ||
        question.includes('progress') ||
        question.includes('paid')
      ) {
        reply = `You have repaid approximately ₹${repaidAmount.toLocaleString(
          'en-IN'
        )}, which is ${repaymentProgress.toFixed(
          1
        )}% of your original loan amount.`;
      }

      // EMI
      else if (
        question.includes('emi') ||
        question.includes('payment')
      ) {
        reply = `Your total monthly EMI across your current loans is approximately ₹${totalMonthlyEMI.toLocaleString(
          'en-IN'
        )}. Keep the required EMI amount available before the due dates.`;
      }

      // Loan count
      else if (
        question.includes('how many') ||
        question.includes('number of loan') ||
        question.includes('loans')
      ) {
        reply = `You currently have ${loans.length} loan(s) recorded in your account.`;
      }

      // Next EMI
      else if (
        question.includes('next') &&
        question.includes('due')
      ) {
        if (nextLoan) {
          reply = `Your next recorded EMI is for ${
            nextLoan.lenderName || 'your loan'
          } on ${new Date(
            nextLoan.nextEmiDate
          ).toLocaleDateString('en-IN')}.`;
        } else {
          reply =
            'I could not find a recorded upcoming EMI date.';
        }
      }

      // Expense
      else if (
        question.includes('spend') ||
        question.includes('expense')
      ) {
        reply =
          'Try recording every loan-related expense and compare your actual spending with the original purpose of the loan.';
      }

      setMessages((prev) => [
        ...prev,
        {
          text: reply,
          sender: 'bot',
        },
      ]);
    }
  };

  // =========================
  // QUICK QUESTIONS
  // =========================

  const askQuickQuestion = (question) => {
    setInput(question);

    setTimeout(() => {
      handleQuickSend(question);
    }, 0);
  };

  const handleQuickSend = async (question) => {
    setMessages((prev) => [
      ...prev,
      {
        text: question,
        sender: 'user',
      },
    ]);

    try {
      const res = await API.post(
        '/api/ai/chat',
        {
          message: question,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          text:
            res.data.reply ||
            'I could not generate a response right now.',
          sender: 'bot',
        },
      ]);
    } catch (err) {
      console.error('Quick chat error:', err);

      let reply =
        'Your loan data is being analyzed.';

      if (
        question
          .toLowerCase()
          .includes('remaining')
      ) {
        reply = `You have ₹${outstandingAmount.toLocaleString(
          'en-IN'
        )} outstanding.`;
      } else if (
        question
          .toLowerCase()
          .includes('utilization')
      ) {
        reply = `Your current outstanding loan utilization is ${utilization.toFixed(
          1
        )}%.`;
      } else if (
        question
          .toLowerCase()
          .includes('emi')
      ) {
        reply = `Your total monthly EMI is approximately ₹${totalMonthlyEMI.toLocaleString(
          'en-IN'
        )}.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          text: reply,
          sender: 'bot',
        },
      ]);
    }
  };

  // =========================
  // LOADING SCREEN
  // =========================

  if (loanLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#475569',
          fontSize: '18px',
        }}
      >
        🤖 Loading your loan data...
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '30px',
      }}
    >
      <div
        style={{
          maxWidth: '1150px',
          margin: '0 auto',
        }}
      >

        {/* HEADER */}

        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-block',
              background: '#dbeafe',
              color: '#1d4ed8',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '700',
              marginBottom: '10px',
            }}
          >
            AI POWERED
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: '32px',
              color: '#0f172a',
            }}
          >
            🤖 AI Loan Advisor
          </h1>

          <p
            style={{
              color: '#64748b',
              marginTop: '8px',
            }}
          >
            Understand your loan repayment and
            get personalized financial guidance.
          </p>
        </div>

        {/* ERROR */}

        {loanError && (
          <div
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '20px',
            }}
          >
            ⚠️ {loanError}
          </div>
        )}

        {/* NO LOANS */}

        {!loanError && loans.length === 0 && (
          <div
            style={{
              background: '#fff7ed',
              color: '#9a3412',
              border: '1px solid #fed7aa',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '20px',
            }}
          >
            💡 No loans found yet. Add a loan from
            the Loans page to start using the AI Advisor.
          </div>
        )}

        {/* SUMMARY CARDS */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
            marginBottom: '22px',
          }}
        >

          {/* TOTAL */}

          <div style={cardStyle}>
            <div style={{ color: '#64748b' }}>
              Total Loan
            </div>

            <div
              style={{
                fontSize: '27px',
                fontWeight: '800',
                marginTop: '8px',
                color: '#0f172a',
              }}
            >
              ₹{totalLoan.toLocaleString('en-IN')}
            </div>
          </div>

          {/* OUTSTANDING */}

          <div style={cardStyle}>
            <div style={{ color: '#64748b' }}>
              Outstanding
            </div>

            <div
              style={{
                fontSize: '27px',
                fontWeight: '800',
                marginTop: '8px',
                color: '#2563eb',
              }}
            >
              ₹{outstandingAmount.toLocaleString(
                'en-IN'
              )}
            </div>
          </div>

          {/* REPAID */}

          <div style={cardStyle}>
            <div style={{ color: '#64748b' }}>
              Amount Repaid
            </div>

            <div
              style={{
                fontSize: '27px',
                fontWeight: '800',
                marginTop: '8px',
                color: '#059669',
              }}
            >
              ₹{repaidAmount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* EMI */}

          <div style={cardStyle}>
            <div style={{ color: '#64748b' }}>
              Monthly EMI
            </div>

            <div
              style={{
                fontSize: '27px',
                fontWeight: '800',
                marginTop: '8px',
                color: '#7c3aed',
              }}
            >
              ₹{totalMonthlyEMI.toLocaleString(
                'en-IN'
              )}
            </div>
          </div>
        </div>

        {/* UTILIZATION */}

        <div
          style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            marginBottom: '22px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  color: '#0f172a',
                }}
              >
                📊 Outstanding Loan Utilization
              </h3>

              <p
                style={{
                  margin: '5px 0 0',
                  color: '#64748b',
                  fontSize: '14px',
                }}
              >
                Outstanding balance compared with
                original loan amount
              </p>
            </div>

            <strong
              style={{
                fontSize: '24px',
                color: '#2563eb',
              }}
            >
              {utilization.toFixed(1)}%
            </strong>
          </div>

          <div
            style={{
              height: '14px',
              background: '#e2e8f0',
              borderRadius: '20px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${utilizationWidth}%`,
                height: '100%',
                background:
                  'linear-gradient(90deg, #2563eb, #3b82f6)',
                borderRadius: '20px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          <div
            style={{
              marginTop: '10px',
              color: '#64748b',
              fontSize: '13px',
            }}
          >
            Repayment progress:{' '}
            <strong>
              {repaymentProgress.toFixed(1)}%
            </strong>
          </div>
        </div>

        {/* MAIN GRID */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '22px',
          }}
        >

          {/* AI INSIGHT */}

          <div
            style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: '#0f172a',
              }}
            >
              💡 AI Insight
            </h3>

            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px',
                color: '#1e3a8a',
                lineHeight: '1.6',
              }}
            >
              You have{' '}
              <strong>
                ₹{outstandingAmount.toLocaleString(
                  'en-IN'
                )}
              </strong>{' '}
              outstanding across{' '}
              <strong>{loans.length}</strong>{' '}
              loan(s).

              <br />

              Your repayment progress is{' '}
              <strong>
                {repaymentProgress.toFixed(1)}%
              </strong>.
            </div>

            <button
              onClick={fetchStrategy}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '18px',
                padding: '13px',
                background: loading
                  ? '#94a3b8'
                  : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: loading
                  ? 'not-allowed'
                  : 'pointer',
                fontWeight: '700',
                fontSize: '15px',
              }}
            >
              {loading
                ? 'Analyzing...'
                : '🚀 Get AI Strategy'}
            </button>

            {strategy && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '15px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  color: '#166534',
                  lineHeight: '1.6',
                }}
              >
                {strategy}
              </div>
            )}

            <div style={{ marginTop: '22px' }}>
              <h4 style={{ color: '#334155' }}>
                Smart Suggestions
              </h4>

              <p>
                ✓ Track every loan-related expense
              </p>

              <p>
                ✓ Keep upcoming EMI funds reserved
              </p>

              <p>
                ✓ Review repayment progress regularly
              </p>

              <p>
                ✓ Avoid missing EMI due dates
              </p>
            </div>
          </div>

          {/* CHAT */}

          <div
            style={{
              background: '#ffffff',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '520px',
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: '#0f172a',
              }}
            >
              💬 Ask Your AI Advisor
            </h3>

            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
              }}
            >
              Ask questions about your loans,
              repayment or EMI.
            </p>

            {/* MESSAGES */}

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                margin: '15px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                minHeight: '200px',
              }}
            >
              {messages.length === 0 && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '18px',
                    borderRadius: '12px',
                    color: '#64748b',
                    textAlign: 'center',
                  }}
                >
                  👋 Hello! Ask me something about
                  your loan.
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf:
                      m.sender === 'user'
                        ? 'flex-end'
                        : 'flex-start',
                    background:
                      m.sender === 'user'
                        ? '#1e3a8a'
                        : '#f1f5f9',
                    color:
                      m.sender === 'user'
                        ? '#ffffff'
                        : '#0f172a',
                    padding: '11px 14px',
                    borderRadius: '14px',
                    maxWidth: '82%',
                    lineHeight: '1.5',
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {/* QUICK QUESTIONS */}

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <button
                onClick={() =>
                  askQuickQuestion(
                    'How much loan do I have remaining?'
                  )
                }
                style={quickButton}
              >
                💰 Remaining
              </button>

              <button
                onClick={() =>
                  askQuickQuestion(
                    'What is my loan utilization?'
                  )
                }
                style={quickButton}
              >
                📊 Utilization
              </button>

              <button
                onClick={() =>
                  askQuickQuestion(
                    'Give me EMI advice'
                  )
                }
                style={quickButton}
              >
                📅 EMI Advice
              </button>

              <button
                onClick={() =>
                  askQuickQuestion(
                    'How much have I repaid?'
                  )
                }
                style={quickButton}
              >
                💳 Repaid
              </button>
            </div>

            {/* INPUT */}

            <div
              style={{
                display: 'flex',
                gap: '8px',
              }}
            >
              <input
                value={input}
                onChange={(e) =>
                  setInput(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSend();
                  }
                }}
                placeholder="Ask about your loans..."
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '14px',
                }}
              />

              <button
                onClick={handleSend}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '10px 18px',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================
// REUSABLE CARD STYLE
// =========================

const cardStyle = {
  background: '#ffffff',
  padding: '22px',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
};

// =========================
// QUICK BUTTON STYLE
// =========================

const quickButton = {
  background: '#f8fafc',
  color: '#334155',
  border: '1px solid #cbd5e1',
  borderRadius: '20px',
  padding: '7px 12px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '600',
};

export default AIAdvisor;
