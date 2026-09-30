```jsx
import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const AIAdvisor = () => {
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Demo loan data for now.
  // Later we will connect this to your real Loans/Transactions data.
  const totalLoan = 200000;
  const usedAmount = 135000;
  const remainingAmount = totalLoan - usedAmount;
  const utilization = (usedAmount / totalLoan) * 100;

  const fetchStrategy = async () => {
    setLoading(true);

    try {
      const res = await axios.get(
        'http://localhost:8000/api/ai/strategy'
      );

      setStrategy(
        res.data.strategy ||
          'Review your loan utilization and keep enough funds reserved for upcoming payments.'
      );
    } catch (err) {
      setStrategy(
        `Your loan utilization is ${utilization.toFixed(
          1
        )}%. You have ₹${remainingAmount.toLocaleString(
          'en-IN'
        )} remaining. Track your expenses carefully and keep your upcoming EMI amount reserved.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();

    setMessages((prev) => [
      ...prev,
      { text: userMsg, sender: 'user' },
    ]);

    setInput('');

    try {
      const res = await axios.post(
        'http://localhost:8000/api/ai/chat',
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
      let reply =
        'I can help you understand your loan utilization, spending and remaining balance.';

      const question = userMsg.toLowerCase();

      if (
        question.includes('remaining') ||
        question.includes('left')
      ) {
        reply = `You currently have approximately ₹${remainingAmount.toLocaleString(
          'en-IN'
        )} remaining from your ₹${totalLoan.toLocaleString(
          'en-IN'
        )} loan.`;
      } else if (
        question.includes('utilization') ||
        question.includes('used')
      ) {
        reply = `Your current loan utilization is ${utilization.toFixed(
          1
        )}%. You have used ₹${usedAmount.toLocaleString(
          'en-IN'
        )} out of ₹${totalLoan.toLocaleString('en-IN')}.`;
      } else if (
        question.includes('spend') ||
        question.includes('expense')
      ) {
        reply =
          'Try to record every loan-related expense and compare actual spending with your planned loan purpose.';
      } else if (
        question.includes('emi') ||
        question.includes('payment')
      ) {
        reply =
          'Keep your upcoming EMI amount available before making additional discretionary spending.';
      }

      setMessages((prev) => [
        ...prev,
        { text: reply, sender: 'bot' },
      ]);
    }
  };

  const askQuickQuestion = (question) => {
    setInput(question);

    setTimeout(() => {
      const fakeEvent = {
        preventDefault: () => {},
      };

      handleQuickSend(question, fakeEvent);
    }, 0);
  };

  const handleQuickSend = async (question) => {
    setMessages((prev) => [
      ...prev,
      { text: question, sender: 'user' },
    ]);

    try {
      const res = await axios.post(
        'http://localhost:8000/api/ai/chat',
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
      let reply =
        'Your loan data is being analyzed. Keep tracking your expenses regularly.';

      if (question.includes('remaining')) {
        reply = `You have ₹${remainingAmount.toLocaleString(
          'en-IN'
        )} remaining from your loan.`;
      } else if (question.includes('utilization')) {
        reply = `Your loan utilization is ${utilization.toFixed(
          1
        )}%.`;
      } else if (question.includes('EMI')) {
        reply =
          'Keep enough funds reserved for your upcoming EMI payments.';
      }

      setMessages((prev) => [
        ...prev,
        { text: reply, sender: 'bot' },
      ]);
    }
  };

  const utilizationWidth = Math.min(utilization, 100);

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
            Understand your loan utilization and get
            personalized financial guidance.
          </p>
        </div>

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
          <div
            style={{
              background: '#ffffff',
              padding: '22px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
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

          <div
            style={{
              background: '#ffffff',
              padding: '22px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ color: '#64748b' }}>
              Amount Used
            </div>

            <div
              style={{
                fontSize: '27px',
                fontWeight: '800',
                marginTop: '8px',
                color: '#2563eb',
              }}
            >
              ₹{usedAmount.toLocaleString('en-IN')}
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '22px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ color: '#64748b' }}>
              Remaining
            </div>

            <div
              style={{
                fontSize: '27px',
                fontWeight: '800',
                marginTop: '8px',
                color: '#059669',
              }}
            >
              ₹{remainingAmount.toLocaleString('en-IN')}
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
                📊 Loan Utilization
              </h3>

              <p
                style={{
                  margin: '5px 0 0',
                  color: '#64748b',
                  fontSize: '14px',
                }}
              >
                Amount of your loan currently utilized
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
              Your current utilization is{' '}
              <strong>
                {utilization.toFixed(1)}%
              </strong>
              . You have{' '}
              <strong>
                ₹{remainingAmount.toLocaleString('en-IN')}
              </strong>{' '}
              remaining from your loan.
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

              <p>✓ Track every loan-related expense</p>
              <p>✓ Keep upcoming EMI funds reserved</p>
              <p>✓ Review spending regularly</p>
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
              Ask questions about your loan,
              utilization or expenses.
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
```
