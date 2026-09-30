const Loan = require('../models/Loan');
const Repayment = require('../models/Repayment');

/*
  Get complete financial summary for the logged-in user
*/
const getUserFinancialData = async (userId) => {
  const loans = await Loan.find({ userId }).sort({ nextEmiDate: 1 });

  const repayments = await Repayment.find({ userId })
    .sort({ paymentDate: -1 });

  const totalLoanAmount = loans.reduce(
    (sum, loan) => sum + Number(loan.principalAmount || 0),
    0
  );

  const outstandingAmount = loans.reduce(
    (sum, loan) => sum + Number(loan.outstandingBalance || 0),
    0
  );

  const totalRepaidAmount = repayments.reduce(
    (sum, repayment) => sum + Number(repayment.principalComponent || 0),
    0
  );

  const totalPayments = repayments.reduce(
    (sum, repayment) => sum + Number(repayment.amountPaid || 0),
    0
  );

  const totalInterestPaid = repayments.reduce(
    (sum, repayment) => sum + Number(repayment.interestComponent || 0),
    0
  );

  const totalMonthlyEMI = loans.reduce(
    (sum, loan) => sum + Number(loan.emiAmount || 0),
    0
  );

  const onTimePayments = repayments.filter(
    repayment => repayment.isOnTime === true
  ).length;

  const latePayments = repayments.filter(
    repayment => repayment.isOnTime === false
  ).length;

  const repaymentRate =
    totalLoanAmount > 0
      ? ((totalLoanAmount - outstandingAmount) / totalLoanAmount) * 100
      : 0;

  return {
    loans,
    repayments,
    totalLoanAmount,
    outstandingAmount,
    totalRepaidAmount,
    totalPayments,
    totalInterestPaid,
    totalMonthlyEMI,
    onTimePayments,
    latePayments,
    repaymentRate,
  };
};


/*
  GET /api/ai/strategy
*/
exports.getStrategy = async (req, res) => {
  try {
    const userId = req.user.id;

    const data = await getUserFinancialData(userId);

    if (data.loans.length === 0) {
      return res.json({
        strategy:
          'You do not have any loans recorded yet. Add your loan details to receive personalized repayment guidance.'
      });
    }

    const activeLoans = data.loans.filter(
      loan => loan.status === 'active'
    );

    if (activeLoans.length === 0) {
      return res.json({
        strategy:
          'Your recorded loans are not currently active. Keep your repayment records updated to continue monitoring your loan health.'
      });
    }

    const highestInterestLoan = [...activeLoans].sort(
      (a, b) => Number(b.interestRate) - Number(a.interestRate)
    )[0];

    const nextLoan = [...activeLoans].sort(
      (a, b) =>
        new Date(a.nextEmiDate) - new Date(b.nextEmiDate)
    )[0];

    let strategy =
      `You have ${activeLoans.length} active loan(s) with ` +
      `₹${data.outstandingAmount.toLocaleString('en-IN')} outstanding. `;

    strategy +=
      `Your total monthly EMI is approximately ₹${data.totalMonthlyEMI.toLocaleString('en-IN')}. `;

    if (highestInterestLoan) {
      strategy +=
        `Among your active loans, ${highestInterestLoan.lenderName} ` +
        `(${highestInterestLoan.loanType} loan) has the highest interest rate ` +
        `at ${highestInterestLoan.interestRate}%. `;
    }

    if (nextLoan) {
      strategy +=
        `Your next EMI is scheduled for ` +
        `${new Date(nextLoan.nextEmiDate).toLocaleDateString('en-IN')}.`;
    }

    return res.json({ strategy });

  } catch (err) {
    console.error('AI strategy error:', err);

    res.status(500).json({
      message: 'Error generating repayment strategy'
    });
  }
};


/*
  POST /api/ai/chat
*/
exports.chat = async (req, res) => {
  try {
    const userId = req.user.id;

    const message = (req.body.message || '').trim();

    if (!message) {
      return res.status(400).json({
        message: 'Please enter a question.'
      });
    }

    const msg = message.toLowerCase();

    const data = await getUserFinancialData(userId);

    /*
      No loans
    */
    if (data.loans.length === 0) {
      return res.json({
        reply:
          'You do not have any loans recorded yet. Add your loan details first, and I can help analyze your repayment situation.'
      });
    }


    /*
      Greeting
    */
    if (
      msg.includes('hello') ||
      msg.includes('hi') ||
      msg.includes('hey')
    ) {
      return res.json({
        reply:
          `Hello! 👋 You currently have ${data.loans.length} loan(s) recorded. ` +
          `Your outstanding balance is ₹${data.outstandingAmount.toLocaleString('en-IN')}. ` +
          `How can I help you understand your repayment plan?`
      });
    }


    /*
      Total loan amount
    */
    if (
      msg.includes('total loan') ||
      msg.includes('loan amount') ||
      msg.includes('borrowed')
    ) {
      return res.json({
        reply:
          `Your total recorded principal loan amount is ₹${data.totalLoanAmount.toLocaleString('en-IN')}.`
      });
    }


    /*
      Outstanding balance
    */
    if (
      msg.includes('outstanding') ||
      msg.includes('remaining') ||
      msg.includes('left to pay')
    ) {
      return res.json({
        reply:
          `Your current outstanding loan balance is approximately ₹${data.outstandingAmount.toLocaleString('en-IN')}.`
      });
    }


    /*
      Repaid amount
    */
    if (
      msg.includes('repaid') ||
      msg.includes('paid so far') ||
      msg.includes('how much have i paid')
    ) {
      return res.json({
        reply:
          `Based on your loan balances, you have repaid approximately ₹${Math.max(
            data.totalLoanAmount - data.outstandingAmount,
            0
          ).toLocaleString('en-IN')} of the original principal.`
      });
    }


    /*
      Monthly EMI
    */
    if (
      msg.includes('emi') ||
      msg.includes('monthly payment') ||
      msg.includes('monthly installment')
    ) {
      return res.json({
        reply:
          `Your combined monthly EMI is approximately ₹${data.totalMonthlyEMI.toLocaleString('en-IN')}.`
      });
    }


    /*
      Next EMI
    */
    if (
      msg.includes('next emi') ||
      msg.includes('emi date') ||
      msg.includes('due date') ||
      msg.includes('when should i pay')
    ) {
      const nextLoan = [...data.loans]
        .filter(loan => loan.status === 'active')
        .sort(
          (a, b) =>
            new Date(a.nextEmiDate) - new Date(b.nextEmiDate)
        )[0];

      if (!nextLoan) {
        return res.json({
          reply: 'There is no active loan with a scheduled EMI.'
        });
      }

      return res.json({
        reply:
          `Your next EMI is for ${nextLoan.lenderName}. ` +
          `The scheduled date is ${new Date(
            nextLoan.nextEmiDate
          ).toLocaleDateString('en-IN')} ` +
          `and the EMI amount is approximately ₹${Number(
            nextLoan.emiAmount
          ).toLocaleString('en-IN')}.`
      });
    }


    /*
      Interest
    */
    if (
      msg.includes('interest') ||
      msg.includes('highest interest')
    ) {
      const highestInterestLoan = [...data.loans].sort(
        (a, b) =>
          Number(b.interestRate) - Number(a.interestRate)
      )[0];

      return res.json({
        reply:
          `Your highest-interest recorded loan is with ${highestInterestLoan.lenderName}. ` +
          `Its interest rate is ${highestInterestLoan.interestRate}%.`
      });
    }


    /*
      Payment history
    */
    if (
      msg.includes('payment history') ||
      msg.includes('payments') ||
      msg.includes('repayment history')
    ) {
      return res.json({
        reply:
          `You have recorded ${data.repayments.length} repayment(s). ` +
          `${data.onTimePayments} were marked on time and ` +
          `${data.latePayments} were marked late.`
      });
    }


    /*
      Interest paid
    */
    if (
      msg.includes('interest paid') ||
      msg.includes('how much interest')
    ) {
      return res.json({
        reply:
          `Your recorded repayments contain approximately ₹${data.totalInterestPaid.toLocaleString('en-IN')} in interest payments.`
      });
    }


    /*
      Repayment progress
    */
    if (
      msg.includes('progress') ||
      msg.includes('repaid percentage') ||
      msg.includes('repayment percentage')
    ) {
      return res.json({
        reply:
          `Your repayment progress is approximately ${Math.max(
            0,
            Math.min(100, data.repaymentRate)
          ).toFixed(1)}% based on your original principal and current outstanding balance.`
      });
    }


    /*
      Avalanche strategy
    */
    if (
      msg.includes('avalanche') ||
      msg.includes('pay first') ||
      msg.includes('which loan')
    ) {
      const activeLoans = data.loans.filter(
        loan => loan.status === 'active'
      );

      if (activeLoans.length === 0) {
        return res.json({
          reply: 'You currently have no active loans.'
        });
      }

      const highestInterestLoan = [...activeLoans].sort(
        (a, b) =>
          Number(b.interestRate) - Number(a.interestRate)
      )[0];

      return res.json({
        reply:
          `For an interest-focused repayment strategy, the loan with the highest ` +
          `interest rate is ${highestInterestLoan.lenderName} at ` +
          `${highestInterestLoan.interestRate}%.`
      });
    }


    /*
      Credit score
    */
    if (
      msg.includes('credit score') ||
      msg.includes('credit')
    ) {
      return res.json({
        reply:
          `Your tracker currently records repayment behavior rather than your actual credit score. ` +
          `You have ${data.onTimePayments} on-time payment(s) and ` +
          `${data.latePayments} late payment(s). Paying EMIs on time can help maintain good repayment history.`
      });
    }


    /*
      General fallback
    */
    return res.json({
      reply:
        `I can help you with your loan data. Try asking: ` +
        `"How much have I repaid?", ` +
        `"How much is outstanding?", ` +
        `"What is my EMI?", ` +
        `"When is my next EMI?", ` +
        `"Which loan has the highest interest?", or ` +
        `"Show my payment history."`
    });

  } catch (err) {
    console.error('AI chat error:', err);

    res.status(500).json({
      message: 'Error processing chat'
    });
  }
};
