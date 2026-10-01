const Loan = require('../models/Loan');
const Repayment = require('../models/Repayment');

// Get user's financial data
async function getUserFinancialData(userId) {
  const loans = await Loan.find({ userId });

  const repayments = await Repayment.find({ userId });

  const totalLoan = loans.reduce(
    (sum, loan) => sum + (loan.principalAmount || 0),
    0
  );

  const outstandingAmount = loans.reduce(
    (sum, loan) => sum + (loan.outstandingBalance || 0),
    0
  );

  const totalEMI = loans.reduce(
    (sum, loan) => sum + (loan.emiAmount || 0),
    0
  );

  const totalRepaid = repayments.reduce(
    (sum, payment) => sum + (payment.amountPaid || 0),
    0
  );

  const totalInterestPaid = repayments.reduce(
    (sum, payment) => sum + (payment.interestComponent || 0),
    0
  );

  return {
    loans,
    repayments,
    totalLoan,
    outstandingAmount,
    totalEMI,
    totalRepaid,
    totalInterestPaid
  };
}


// ===============================
// AI REPAYMENT STRATEGY
// ===============================

exports.getStrategy = async (req, res) => {
  try {
    const data = await getUserFinancialData(req.user.id);

    if (data.loans.length === 0) {
      return res.json({
        strategy: 'You currently have no loans. Add a loan to receive a personalized repayment strategy.'
      });
    }

    const highestInterestLoan = [...data.loans].sort(
      (a, b) => b.interestRate - a.interestRate
    )[0];

    res.json({
      strategy:
        `You have ${data.loans.length} active loan(s). ` +
        `Your total outstanding balance is approximately ₹${data.outstandingAmount.toLocaleString('en-IN')}. ` +
        `Consider prioritizing "${highestInterestLoan.lenderName}" because it has the highest interest rate of ${highestInterestLoan.interestRate}%. ` +
        `This follows the Avalanche repayment method, which can reduce total interest over time.`
    });

  } catch (err) {
    console.error('AI Strategy Error:', err);

    res.status(500).json({
      message: 'Error generating strategy'
    });
  }
};


// ===============================
// AI CHAT
// ===============================

exports.chat = async (req, res) => {
  try {
    const msg = (req.body.message || '').toLowerCase().trim();

    const data = await getUserFinancialData(req.user.id);

    let reply;


    // Greeting
    if (
      msg === 'hi' ||
      msg === 'hello' ||
      msg === 'hey' ||
      msg.includes('good morning') ||
      msg.includes('good evening')
    ) {
      reply =
        'Hello! 👋 I can help you understand your loans, EMI, outstanding balance, repayments, interest and repayment strategy.';
    }


    // Outstanding balance
    else if (
      msg.includes('outstanding') ||
      msg.includes('remaining balance') ||
      msg.includes('balance left')
    ) {
      reply =
        `Your current outstanding loan balance is approximately ₹${data.outstandingAmount.toLocaleString('en-IN')}.`;
    }


    // Total loan
    else if (
      msg.includes('total loan') ||
      msg.includes('loan amount')
    ) {
      reply =
        `Your total original loan amount is approximately ₹${data.totalLoan.toLocaleString('en-IN')}.`;
    }


    // Repaid amount
    else if (
      msg.includes('how much have i repaid') ||
      msg.includes('how much repaid') ||
      msg.includes('total repaid') ||
      msg.includes('amount repaid')
    ) {
      reply =
        `You have repaid approximately ₹${data.totalRepaid.toLocaleString('en-IN')} so far.`;
    }


    // EMI
    else if (
      msg.includes('emi') ||
      msg.includes('monthly payment')
    ) {
      reply =
        `Your combined monthly EMI is approximately ₹${data.totalEMI.toLocaleString('en-IN')}.`;
    }


    // Interest paid
    else if (
      msg.includes('interest paid') ||
      msg.includes('how much interest')
    ) {
      reply =
        `Based on recorded repayments, you have paid approximately ₹${data.totalInterestPaid.toLocaleString('en-IN')} in interest.`;
    }


    // Highest interest loan
    else if (
      msg.includes('highest interest') ||
      msg.includes('which loan has the highest interest')
    ) {
      if (data.loans.length === 0) {
        reply = 'You currently have no loans.';
      } else {
        const highestInterestLoan = [...data.loans].sort(
          (a, b) => b.interestRate - a.interestRate
        )[0];

        reply =
          `Your highest-interest loan is with ${highestInterestLoan.lenderName}, ` +
          `with an interest rate of ${highestInterestLoan.interestRate}%.`;
      }
    }


    // What happens if I repay?
    else if (
      msg.includes('what will happen if i repay') ||
      msg.includes('what happens if i repay') ||
      msg.includes('if i repay') ||
      msg.includes('repay my loan') ||
      msg.includes('repay the loan') ||
      msg.includes('pay off my loan')
    ) {
      reply =
        `If you make a repayment, your outstanding balance will decrease. ` +
        `The payment will also be recorded in your repayment history. ` +
        `If you completely repay the remaining balance, the loan can eventually be marked as closed. ` +
        `Your current outstanding balance is approximately ₹${data.outstandingAmount.toLocaleString('en-IN')}.`;
    }


    // Repayment progress
    else if (
      msg.includes('progress') ||
      msg.includes('how much have i paid')
    ) {
      const progress =
        data.totalLoan > 0
          ? ((data.totalLoan - data.outstandingAmount) / data.totalLoan) * 100
          : 0;

      reply =
        `Your repayment progress is approximately ${Math.max(
          0,
          Math.min(100, progress)
        ).toFixed(1)}%.`;
    }


    // Next EMI
    else if (
      msg.includes('next emi') ||
      msg.includes('when is my emi') ||
      msg.includes('emi date')
    ) {
      if (data.loans.length === 0) {
        reply = 'You currently have no loans.';
      } else {
        const nextLoan = [...data.loans]
          .filter(loan => loan.nextEmiDate)
          .sort(
            (a, b) =>
              new Date(a.nextEmiDate) - new Date(b.nextEmiDate)
          )[0];

        if (nextLoan) {
          reply =
            `Your next EMI for ${nextLoan.lenderName} is scheduled around ` +
            `${new Date(nextLoan.nextEmiDate).toLocaleDateString('en-IN')}.`;
        } else {
          reply = 'I could not find a next EMI date in your loan data.';
        }
      }
    }


    // Payment history
    else if (
      msg.includes('payment history') ||
      msg.includes('repayment history')
    ) {
      if (data.repayments.length === 0) {
        reply = 'No repayment records are available yet.';
      } else {
        reply =
          `You have ${data.repayments.length} recorded repayment(s), ` +
          `totalling approximately ₹${data.totalRepaid.toLocaleString('en-IN')}.`;
      }
    }


    // Avalanche
    else if (
      msg.includes('avalanche') ||
      msg.includes('pay first') ||
      msg.includes('repayment strategy')
    ) {
      if (data.loans.length === 0) {
        reply = 'Add a loan first so I can create a repayment strategy.';
      } else {
        const highestInterestLoan = [...data.loans].sort(
          (a, b) => b.interestRate - a.interestRate
        )[0];

        reply =
          `The Avalanche method suggests focusing extra payments on ` +
          `${highestInterestLoan.lenderName}, which has the highest interest rate of ` +
          `${highestInterestLoan.interestRate}%.`;
      }
    }


    // Help
    else if (
      msg.includes('help') ||
      msg.includes('what can you do')
    ) {
      reply =
        'You can ask me about your outstanding balance, total loan, EMI, repayments, interest paid, next EMI, highest-interest loan, repayment progress, payment history, or what happens when you repay.';
    }


    // Default
    else {
      reply =
        `I can help with your loan information, but I didn't understand that question. ` +
        `Try asking about your EMI, outstanding balance, repayment progress, ` +
        `interest, next EMI, or what happens when you repay.`;
    }


    res.json({ reply });

  } catch (err) {
    console.error('AI Chat Error:', err);

    res.status(500).json({
      message: 'Error processing chat'
    });
  }
};
