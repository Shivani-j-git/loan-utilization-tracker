```js
const Loan = require('../models/Loan');
const Repayment = require('../models/Repayment');

/*
  Get complete financial data for logged-in user
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

  const totalMonthlyEMI = loans.reduce(
    (sum, loan) => sum + Number(loan.emiAmount || 0),
    0
  );

  const totalInterestPaid = repayments.reduce(
    (sum, repayment) =>
      sum + Number(repayment.interestComponent || 0),
    0
  );

  const onTimePayments = repayments.filter(
    repayment => repayment.isOnTime === true
  ).length;

  const latePayments = repayments.filter(
    repayment => repayment.isOnTime === false
  ).length;

  const repaidAmount = Math.max(
    totalLoanAmount - outstandingAmount,
    0
  );

  const repaymentProgress =
    totalLoanAmount > 0
      ? (repaidAmount / totalLoanAmount) * 100
      : 0;

  return {
    loans,
    repayments,
    totalLoanAmount,
    outstandingAmount,
    totalMonthlyEMI,
    totalInterestPaid,
    onTimePayments,
    latePayments,
    repaidAmount,
    repaymentProgress
  };
};


/*
  AI REPAYMENT STRATEGY
*/
exports.getStrategy = async (req, res) => {
  try {
    const userId = req.user.id;

    const data = await getUserFinancialData(userId);

    if (data.loans.length === 0) {
      return res.json({
        strategy:
          'You do not have any loans recorded yet. Add a loan to receive personalized repayment guidance.'
      });
    }

    const activeLoans = data.loans.filter(
      loan => loan.status === 'active'
    );

    if (activeLoans.length === 0) {
      return res.json({
        strategy:
          'You currently have no active loans. Keep your repayment records updated.'
      });
    }

    const highestInterestLoan = [...activeLoans].sort(
      (a, b) =>
        Number(b.interestRate) - Number(a.interestRate)
    )[0];

    return res.json({
      strategy:
        `Focus on paying off your highest-interest loan first using the ` +
        `Avalanche method. Your highest-interest active loan is ` +
        `${highestInterestLoan.lenderName} at ` +
        `${highestInterestLoan.interestRate}%. ` +
        `Your current outstanding balance across active loans is ` +
        `₹${data.outstandingAmount.toLocaleString('en-IN')}.`
    });

  } catch (error) {
    console.error('AI strategy error:', error);

    res.status(500).json({
      message: 'Error generating repayment strategy'
    });
  }
};


/*
  AI CHAT
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
          'You do not have any loans recorded yet. Add your loan details first and I can analyze them for you.'
      });
    }


    /*
      GREETING
    */
    if (
      msg === 'hi' ||
      msg === 'hello' ||
      msg === 'hey' ||
      msg.includes('good morning') ||
      msg.includes('good evening')
    ) {
      return res.json({
        reply:
          `Hello! 👋 You currently have ${data.loans.length} loan(s). ` +
          `Your outstanding balance is ₹${data.outstandingAmount.toLocaleString('en-IN')}. ` +
          `Ask me about your EMI, outstanding balance, repayment progress, interest or loan strategy.`
      });
    }


    /*
      WHAT HAPPENS IF I REPAY?
    */
    if (
      msg.includes('what will happen if i repay') ||
      msg.includes('what happens if i repay') ||
      msg.includes('if i repay') ||
      msg.includes('repay my loan') ||
      msg.includes('repay the loan') ||
      msg.includes('pay off my loan')
    ) {
      return res.json({
        reply:
          `If you repay your loan, your outstanding balance will decrease. ` +
          `If you completely repay the remaining balance, the loan can eventually be marked as closed. ` +
          `Your repayment history will also record the payment. ` +
          `Your current outstanding balance is approximately ₹${data.outstandingAmount.toLocaleString('en-IN')}.`
      });
    }


    /*
      OUTSTANDING
    */
    if (
      msg.includes('outstanding') ||
      msg.includes('remaining') ||
      msg.includes('left to pay')
    ) {
      return res.json({
        reply:
          `Your current outstanding balance is approximately ` +
          `₹${data.outstandingAmount.toLocaleString('en-IN')}.`
      });
    }


    /*
      TOTAL LOAN
    */
    if (
      msg.includes('total loan') ||
      msg.includes('loan amount') ||
      msg.includes('borrowed')
    ) {
      return res.json({
        reply:
          `Your total recorded principal loan amount is ` +
          `₹${data.totalLoanAmount.toLocaleString('en-IN')}.`
      });
    }


    /*
      REPAID
    */
    if (
      msg.includes('repaid') ||
      msg.includes('paid so far') ||
      msg.includes('how much have i paid')
    ) {
      return res.json({
        reply:
          `You have repaid approximately ` +
          `₹${data.repaidAmount.toLocaleString('en-IN')} ` +
          `of your original principal.`
      });
    }


    /*
      EMI
    */
    if (
      msg.includes('emi') ||
      msg.includes('monthly payment') ||
      msg.includes('monthly installment')
    ) {
      return res.json({
        reply:
          `Your combined monthly EMI is approximately ` +
          `₹${data.totalMonthlyEMI.toLocaleString('en-IN')}.`
      });
    }


    /*
      NEXT EMI
    */
    if (
      msg.includes('next emi') ||
      msg.includes('emi date') ||
      msg.includes('due date') ||
      msg.includes('when should i pay')
    ) {
      const activeLoans = data.loans.filter(
        loan => loan.status === 'active'
      );

      if (activeLoans.length === 0) {
        return res.json({
          reply: 'You currently have no active loans with a scheduled EMI.'
        });
      }

      const nextLoan = [...activeLoans].sort(
        (a, b) =>
          new Date(a.nextEmiDate) -
          new Date(b.nextEmiDate)
      )[0];

      return res.json({
        reply:
          `Your next EMI is for ${nextLoan.lenderName}. ` +
          `The scheduled date is ` +
          `${new Date(nextLoan.nextEmiDate).toLocaleDateString('en-IN')} ` +
          `and the EMI amount is approximately ` +
          `₹${Number(nextLoan.emiAmount).toLocaleString('en-IN')}.`
      });
    }


    /*
      HIGHEST INTEREST
    */
    if (
      msg.includes('interest') ||
      msg.includes('highest interest')
    ) {
      const highestInterestLoan = [...data.loans].sort(
        (a, b) =>
          Number(b.interestRate) -
          Number(a.interestRate)
      )[0];

      return res.json({
        reply:
          `Your highest-interest loan is with ` +
          `${highestInterestLoan.lenderName}. ` +
          `Its interest rate is ${highestInterestLoan.interestRate}%.`
      });
    }


    /*
      REPAYMENT PROGRESS
    */
    if (
      msg.includes('progress') ||
      msg.includes('percentage') ||
      msg.includes('how much is repaid')
    ) {
      return res.json({
        reply:
          `Your repayment progress is approximately ` +
          `${Math.max(
            0,
            Math.min(100, data.repaymentProgress)
          ).toFixed(1)}%.`
      });
    }


    /*
      PAYMENT HISTORY
    */
    if (
      msg.includes('payment history') ||
      msg.includes('repayment history') ||
      msg.includes('payments')
    ) {
      return res.json({
        reply:
          `You have recorded ${data.repayments.length} repayment(s). ` +
          `${data.onTimePayments} were marked on time and ` +
          `${data.latePayments} were marked late.`
      });
    }


    /*
      INTEREST PAID
    */
    if (
      msg.includes('interest paid') ||
      msg.includes('how much interest')
    ) {
      return res.json({
        reply:
          `Your recorded repayments contain approximately ` +
          `₹${data.totalInterestPaid.toLocaleString('en-IN')} ` +
          `in interest payments.`
      });
    }


    /*
      AVALANCHE
    */
    if (
      msg.includes('avalanche') ||
      msg.includes('which loan') ||
      msg.includes('pay first')
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
          Number(b.interestRate) -
          Number(a.interestRate)
      )[0];

      return res.json({
        reply:
          `For an interest-focused Avalanche strategy, ` +
          `the highest-interest active loan is ` +
          `${highestInterestLoan.lenderName} at ` +
          `${highestInterestLoan.interestRate}%.`
      });
    }


    /*
      CREDIT SCORE
    */
    if (
      msg.includes('credit score') ||
      msg === 'credit' ||
      msg.includes('credit')
    ) {
      return res.json({
        reply:
          `This tracker does not calculate your actual credit score. ` +
          `It records repayment behavior. You currently have ` +
          `${data.onTimePayments} on-time payment(s) and ` +
          `${data.latePayments} late payment(s).`
      });
    }


    /*
      HELP
    */
    if (
      msg.includes('help') ||
      msg.includes('what can you do')
    ) {
      return res.json({
        reply:
          `I can help you analyze your loans. Try asking: ` +
          `"What is my outstanding balance?", ` +
          `"What is my EMI?", ` +
          `"What happens if I repay?", ` +
          `"Which loan has the highest interest?", ` +
          `"When is my next EMI?", or ` +
          `"Show my payment history."`
      });
    }


    /*
      UNKNOWN MESSAGE
    */
    return res.json({
      reply:
        `I can help with your loan information, but I didn't understand that question. ` +
        `Try asking about your EMI, outstanding balance, repayment progress, ` +
        `interest, next EMI, or what happens when you repay.`
    });

  } catch (error) {
    console.error('AI chat error:', error);

    res.status(500).json({
      message: 'Error processing chat'
    });
  }
};
```
