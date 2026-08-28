const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── REPAYMENT STRATEGY ADVISOR ───────────────────
exports.getRepaymentAdvice = async (loans) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const loanSummary = loans.map(l =>
      `- ${l.loanType} loan from ${l.lenderName}:\n` +
      `  Outstanding: Rs.${l.outstandingBalance}\n` +
      `  Interest Rate: ${l.interestRate}% per year\n` +
      `  Monthly EMI: Rs.${l.emiAmount}\n` +
      `  Health Score: ${l.utilizationScore}/100\n` +
      `  Status: ${l.status}`
    ).join('\n\n');

    const prompt = `
You are an expert financial advisor specializing in
personal debt management for Indian borrowers.

Analyze the following loan portfolio and provide
a clear, practical repayment strategy.

LOAN PORTFOLIO:
${loanSummary}

Please provide:
1. Recommended repayment priority order with clear reasons
2. Whether Debt Avalanche or Debt Snowball method suits better
3. Estimated total interest savings in rupees
4. Specific prepayment recommendations for each loan
5. Risk assessment for each loan based on health score
6. Simple action steps the borrower should take this month

Keep the advice specific, practical and in simple English.
Format the response clearly with headings.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (err) {
    console.error('Gemini API Error:', err.message);
    throw new Error('AI service temporarily unavailable');
  }
};

// ─── CONVERSATIONAL CHATBOT ───────────────────────
exports.chat = async (message, loans, history = []) => {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });

    const loanSummary = loans.length > 0
      ? loans.map(l =>
          `${l.loanType} loan (${l.lenderName}): ` +
          `Rs.${l.outstandingBalance} outstanding, ` +
          `${l.interestRate}% rate, ` +
          `Rs.${l.emiAmount} EMI, ` +
          `Score: ${l.utilizationScore}/100`
        ).join(' | ')
      : 'No active loans found';

    const chat = model.startChat({
      history,
      systemInstruction: `
You are a helpful and friendly loan management assistant
for an Indian borrower. You have access to their
loan portfolio data.

BORROWER'S LOAN PORTFOLIO:
${loanSummary}

Guidelines:
- Answer questions specifically about their loans
- Give advice in simple, clear English
- Use Indian currency format (Rs. or Lakhs/Crores)
- Be encouraging and supportive
- If asked about EMI calculations show the formula
- Keep responses concise and helpful
      `,
    });

    const result = await chat.sendMessage(message);
    return result.response.text();

  } catch (err) {
    console.error('Gemini Chat Error:', err.message);
    throw new Error('AI chat temporarily unavailable');
  }
};
