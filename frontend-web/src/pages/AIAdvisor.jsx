import React, { useState } from 'react';
import axios from 'axios';

const AIAdvisor = () => {
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const fetchStrategy = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/ai/strategy');
      setStrategy(res.data.strategy);
    } catch (err) {
      setStrategy('Focus on paying off your highest interest loans first using the Avalanche method to save on interest overall.');
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    try {
      const res = await axios.post('http://localhost:8000/api/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { text: res.data.reply, sender: 'bot' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Make sure to pay your monthly EMI on time to keep a healthy credit score!', sender: 'bot' }]);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>🤖 AI Financial Advisor</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3>💡 Repayment Strategy</h3>
          <p style={{ color: '#64748b' }}>Get AI powered advice on which loan to pay first</p>
          <button onClick={fetchStrategy} style={{ background: '#2563eb', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
            {loading ? 'Analyzing...' : '🚀 Get AI Strategy'}
          </button>
          {strategy && <div style={{ marginTop: '15px', padding: '12px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>{strategy}</div>}
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '400px' }}>
          <h3>💬 AI Chat Assistant</h3>
          <div style={{ flex: 1, overflowY: 'auto', margin: '15px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', background: m.sender === 'user' ? '#1e3a8a' : '#f1f5f9', color: m.sender === 'user' ? '#fff' : '#0f172a', padding: '10px 14px', borderRadius: '12px', maxWidth: '80%' }}>{m.text}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder='Ask about your loans...' style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <button onClick={handleSend} style={{ background: '#2563eb', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AIAdvisor;