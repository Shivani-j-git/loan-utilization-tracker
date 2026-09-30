import React, { useEffect, useMemo, useState } from 'react';
import API from '../api/axios';

export default function AIAdvisor() {
  const [loans, setLoans] = useState([]);
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(true);
  const [strategyLoading, setStrategyLoading] = useState(true);
  const [error, setError] = useState('');

  const [message, setMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! 👋 I can analyze your loan data and help you understand your repayment plan.'
    }
  ]);

  // --------------------------------------------------
  // Fetch user's loans
  // --------------------------------------------------
  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.get('/api/loans');

      setLoans(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error loading loans:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load your loan data.'
      );

      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Fetch AI strategy
  // --------------------------------------------------
  const fetchStrategy = async () => {
    try {
      setStrategyLoading(true);

      const response = await API.get('/api/ai/strategy');

      setStrategy(
        response.data?.strategy ||
        'No repayment strategy is available yet.'
      );
    } catch (err) {
      console.error('Error loading AI strategy:', err);

      setStrategy(
        'Unable to generate your repayment strategy right now.'
      );
    } finally {
      setStrategyLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchStrategy();
  }, []);

  // --------------------------------------------------
  // Dynamic calculations
  // --------------------------------------------------
  const summary = useMemo(() => {
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

    const totalMonthlyEMI = loans.reduce(
      (sum, loan) =>
        sum + Number(loan.emiAmount || 0),
      0
    );

    const repaidAmount = Math.max(
      totalLoan - outstandingAmount,
      0
    );

    const repaymentProgress =
      totalLoan > 0
        ? (repaidAmount / totalLoan) * 100
        : 0;

    const outstandingUtilization =
      totalLoan > 0
        ? (outstandingAmount / totalLoan) * 100
        : 0;

    const activeLoans = loans.filter(
      loan => loan.status === 'active'
    );

    const nextLoan = [...activeLoans]
      .filter(loan => loan.nextEmiDate)
      .sort(
        (a, b) =>
          new Date(a.nextEmiDate) -
          new Date(b.nextEmiDate)
      )[0];

    const averageHealth =
      loans.length > 0
        ? loans.reduce(
            (sum, loan) =>
              sum +
              Number(loan.utilizationScore ?? 100),
            0
          ) / loans.length
        : 0;

    return {
      totalLoan,
      outstandingAmount,
      totalMonthlyEMI,
      repaidAmount,
      repaymentProgress,
      outstandingUtilization,
      activeLoans,
      nextLoan,
      averageHealth
    };
  }, [loans]);

  // --------------------------------------------------
  // Currency formatter
  // --------------------------------------------------
  const formatCurrency = value => {
    return `₹${Number(value || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 0
    })}`;
  };

  // --------------------------------------------------
  // Date formatter
  // --------------------------------------------------
  const formatDate = date => {
    if (!date) return 'Not available';

    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // --------------------------------------------------
  // Send chat message
  // --------------------------------------------------
  const sendMessage = async text => {
    const question = (text || message).trim();

    if (!question || chatLoading) return;

    setMessages(prev => [
      ...prev,
      {
        sender: 'user',
        text: question
      }
    ]);

    setMessage('');
    setChatLoading(true);

    try {
      const response = await API.post('/api/ai/chat', {
        message: question
      });

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text:
            response.data?.reply ||
            'I could not generate a response.'
        }
      ]);
    } catch (err) {
      console.error('Chat error:', err);

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text:
            err.response?.data?.message ||
            'Sorry, I could not process your question right now.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    sendMessage();
  };

  // --------------------------------------------------
  // Quick questions
  // --------------------------------------------------
  const quickQuestions = [
    'How much have I repaid?',
    'How much is outstanding?',
    'What is my monthly EMI?',
    'When is my next EMI?',
    'Which loan has the highest interest?',
    'Show my payment history.'
  ];

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 w-96 bg-gray-200 rounded mb-8"></div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(item => (
                <div
                  key={item}
                  className="h-32 bg-white rounded-xl shadow-sm"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Error state
  // --------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-700 mb-2">
              Unable to load AI Advisor
            </h2>

            <p className="text-red-600 mb-4">
              {error}
            </p>

            <button
              onClick={() => {
                fetchLoans();
                fetchStrategy();
              }}
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Main page
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Financial Advisor 🤖
              </h1>

              <p className="text-gray-500 mt-1">
                Personalized insights based on your actual loan data
              </p>
            </div>

            <button
              onClick={() => {
                fetchLoans();
                fetchStrategy();
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              🔄 Refresh Data
            </button>

          </div>
        </div>


        {/* No loans */}
        {loans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mb-8">

            <div className="text-5xl mb-4">
              💰
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Loans Found
            </h2>

            <p className="text-gray-500">
              Add a loan from the Loans page to unlock personalized AI insights.
            </p>

          </div>
        ) : (

          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

              {/* Total Loan */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Total Loan
                    </p>

                    <h2 className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(summary.totalLoan)}
                    </h2>
                  </div>

                  <div className="text-3xl">
                    💰
                  </div>
                </div>
              </div>


              {/* Outstanding */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Outstanding
                    </p>

                    <h2 className="text-2xl font-bold text-orange-600 mt-1">
                      {formatCurrency(summary.outstandingAmount)}
                    </h2>
                  </div>

                  <div className="text-3xl">
                    📊
                  </div>
                </div>
              </div>


              {/* Monthly EMI */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Monthly EMI
                    </p>

                    <h2 className="text-2xl font-bold text-blue-600 mt-1">
                      {formatCurrency(summary.totalMonthlyEMI)}
                    </h2>
                  </div>

                  <div className="text-3xl">
                    📅
                  </div>
                </div>
              </div>


              {/* Repayment Progress */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Repaid
                    </p>

                    <h2 className="text-2xl font-bold text-green-600 mt-1">
                      {summary.repaymentProgress.toFixed(1)}%
                    </h2>
                  </div>

                  <div className="text-3xl">
                    ✅
                  </div>
                </div>

                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        summary.repaymentProgress,
                        100
                      )}%`
                    }}
                  ></div>
                </div>

              </div>

            </div>


            {/* Two-column section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

              {/* AI Strategy */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                    🤖
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      AI Strategy
                    </h2>

                    <p className="text-sm text-gray-500">
                      Based on your current loan portfolio
                    </p>
                  </div>
                </div>

                {strategyLoading ? (
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {strategy}
                    </p>
                  </div>
                )}

              </div>


              {/* Next EMI */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">

                <h2 className="text-xl font-bold text-gray-900 mb-5">
                  📅 Next EMI
                </h2>

                {summary.nextLoan ? (
                  <div>

                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          Lender
                        </p>

                        <p className="text-lg font-bold text-gray-900">
                          {summary.nextLoan.lenderName}
                        </p>
                      </div>

                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
                        {summary.nextLoan.loanType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">

                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500">
                          EMI Amount
                        </p>

                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(
                            summary.nextLoan.emiAmount
                          )}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500">
                          Due Date
                        </p>

                        <p className="text-lg font-bold text-gray-800">
                          {formatDate(
                            summary.nextLoan.nextEmiDate
                          )}
                        </p>
                      </div>

                    </div>

                  </div>
                ) : (
                  <p className="text-gray-500">
                    No upcoming EMI found.
                  </p>
                )}

              </div>

            </div>


            {/* Repayment Progress */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">

              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Repayment Progress
                  </h2>

                  <p className="text-sm text-gray-500">
                    Amount repaid compared with original principal
                  </p>
                </div>

                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(summary.repaidAmount)}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">

                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(
                      summary.repaymentProgress,
                      100
                    )}%`
                  }}
                ></div>

              </div>

              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>
                  0%
                </span>

                <span>
                  {summary.repaymentProgress.toFixed(1)}%
                </span>

                <span>
                  100%
                </span>
              </div>

            </div>


            {/* Loan Health */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">

              <h2 className="text-xl font-bold text-gray-900 mb-5">
                📈 Loan Health
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-sm text-gray-500">
                    Active Loans
                  </p>

                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {summary.activeLoans.length}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-sm text-gray-500">
                    Outstanding Utilization
                  </p>

                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {summary.outstandingUtilization.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-5">
                  <p className="text-sm text-gray-500">
                    Repayment Health
                  </p>

                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {summary.averageHealth.toFixed(0)}/100
                  </p>
                </div>

              </div>

            </div>


            {/* Loan Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">

              <h2 className="text-xl font-bold text-gray-900 mb-5">
                💳 Your Loans
              </h2>

              <div className="overflow-x-auto">

                <table className="w-full text-left">

                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-sm text-gray-500">
                        Lender
                      </th>

                      <th className="pb-3 text-sm text-gray-500">
                        Type
                      </th>

                      <th className="pb-3 text-sm text-gray-500">
                        Principal
                      </th>

                      <th className="pb-3 text-sm text-gray-500">
                        Outstanding
                      </th>

                      <th className="pb-3 text-sm text-gray-500">
                        Interest
                      </th>

                      <th className="pb-3 text-sm text-gray-500">
                        EMI
                      </th>

                      <th className="pb-3 text-sm text-gray-500">
                        Health
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {loans.map(loan => (
                      <tr
                        key={loan._id}
                        className="border-b border-gray-100"
                      >

                        <td className="py-4 font-medium text-gray-900">
                          {loan.lenderName}
                        </td>

                        <td className="py-4 capitalize text-gray-600">
                          {loan.loanType}
                        </td>

                        <td className="py-4 text-gray-700">
                          {formatCurrency(
                            loan.principalAmount
                          )}
                        </td>

                        <td className="py-4 font-medium text-orange-600">
                          {formatCurrency(
                            loan.outstandingBalance
                          )}
                        </td>

                        <td className="py-4 text-gray-700">
                          {loan.interestRate}%
                        </td>

                        <td className="py-4 text-blue-600 font-medium">
                          {formatCurrency(
                            loan.emiAmount
                          )}
                        </td>

                        <td className="py-4">

                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            {Number(
                              loan.utilizationScore ?? 100
                            ).toFixed(0)}
                          </span>

                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>

            </div>


            {/* Chat */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

              <div className="p-6 border-b border-gray-200">

                <h2 className="text-xl font-bold text-gray-900">
                  💬 Ask Your AI Advisor
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Ask questions about your actual loan data
                </p>

              </div>


              {/* Messages */}
              <div className="p-6 max-h-96 overflow-y-auto space-y-4">

                {messages.map((item, index) => (

                  <div
                    key={index}
                    className={`flex ${
                      item.sender === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >

                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        item.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.text}
                    </div>

                  </div>

                ))}

                {chatLoading && (
                  <div className="flex justify-start">

                    <div className="bg-gray-100 px-4 py-3 rounded-2xl text-gray-500">
                      AI is analyzing your data...
                    </div>

                  </div>
                )}

              </div>


              {/* Quick Questions */}
              <div className="px-6 pb-4">

                <p className="text-sm text-gray-500 mb-2">
                  Quick questions:
                </p>

                <div className="flex flex-wrap gap-2">

                  {quickQuestions.map(question => (

                    <button
                      key={question}
                      onClick={() => sendMessage(question)}
                      disabled={chatLoading}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition disabled:opacity-50"
                    >
                      {question}
                    </button>

                  ))}

                </div>

              </div>


              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="p-6 border-t border-gray-200"
              >

                <div className="flex gap-3">

                  <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Ask about your loans..."
                    disabled={chatLoading}
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={!message.trim() || chatLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {chatLoading ? '...' : 'Send'}
                  </button>

                </div>

              </form>

            </div>

          </>
        )}

      </div>

    </div>
  );
}
