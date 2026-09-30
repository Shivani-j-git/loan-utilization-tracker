const Loan = require('../models/Loan');

// ========================================
// HELPER: GET USER LOAN SUMMARY
// ========================================

const getLoanSummary = async (userId) => {
  const loans = await Loan.find({
    userId: userId,
  });

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

  const nextLoan = [...loans]
    .filter((loan) => loan.nextEmiDate)
    .sort(
      (a, b) =>
        new Date(a.nextEmiDate) -
        new Date(b.nextEmiDate)
    )[0];

  return {
    loans,
    loanCount: loans.length,
    totalLoan,
    outstandingAmount,
    repaidAmount,
    utilization,
    repaymentProgress,
    totalMonthlyEMI,
    nextLoan,
  };
};

// ========================================
// GET AI STRATEGY
// ========================================

exports.getStrategy = async (req, res) => {
  try {
    const summary = await getLoanSummary(req.user.id);

    const {
      loans,
      loanCount,
      totalLoan,
      outstandingAmount,
      repaidAmount,
      utilization,
      repaymentProgress,
      totalMonthlyEMI,
      nextLoan,
    } = summary;

    // No loans
    if (loanCount === 0) {
      return res.json({
        strategy:
          'No loans are currently recorded. Add your loan details to receive personalized repayment guidance.',
      });
    }

    let strategy = '';

    // High outstanding balance
    if (utilization >= 75) {
      strategy +=
        'A large portion of your original loan balance is still outstanding. Focus on consistent EMI payments and avoid unnecessary additional debt. ';
    }

    // Moderate outstanding balance
    else if (utilization >= 40) {
      strategy +=
        'Your loan balance is progressing through repayment. Continue making your EMI payments consistently and monitor your outstanding balance. ';
    }

    // Low outstanding balance
    else {
      strategy +=
        'You have made substantial progress on your loan repayment. Continue your regular EMI payments and monitor the remaining balance. ';
    }

    // EMI advice
    if (totalMonthlyEMI > 0) {
      strategy += `Your current combined monthly EMI is approximately ₹${totalMonthlyEMI.toLocaleString(
        'en-IN'
      )}. Keep this amount available before the respective due dates. `;
    }

    // Repayment progress
    strategy += `You have repaid approximately ₹${repaidAmount.toLocaleString(
      'en-IN'
    )}, representing ${repaymentProgress.toFixed(
      1
    )}% of your original loan amount. `;

    // Next EMI
    if (nextLoan) {
      const nextDate = new Date(
        nextLoan.nextEmiDate
      ).toLocaleDateString('en-IN');

      strategy += `Your next recorded EMI is due on ${nextDate}.`;
    }

    res.json({
      strategy,

      summary: {
        loanCount,
        totalLoan,
        outstandingAmount,
        repaidAmount,
        utilization: Number(
          utilization.toFixed(2)
        ),
        repaymentProgress: Number(
          repaymentProgress.toFixed(2)
        ),
        totalMonthlyEMI,
      },
    });
  } catch (err) {
    console.error(
      'AI strategy error:',
      err
    );

    res.status(500).json({
      message:
        'Error generating personalized strategy',
    });
  }
};

// ========================================
// AI CHAT
// ========================================

exports.chat = async (req, res) => {
  try {
    const message = (
      req.body.message || ''
    ).toLowerCase();

    if (!message.trim()) {
      return res.status(400).json({
        message:
          'Please enter a question.',
      });
    }

    const summary = await getLoanSummary(
      req.user.id
    );

    const {
      loans,
      loanCount,
      totalLoan,
      outstandingAmount,
      repaidAmount,
      utilization,
      repaymentProgress,
      totalMonthlyEMI,
      nextLoan,
    } = summary;

    let reply = '';

    // ====================================
    // GREETING
    // ====================================

    if (
      message.includes('hello') ||
      message.includes('hi') ||
      message.includes('hey')
    ) {
      reply =
        'Hello! 👋 I can help you understand your loan balance, repayment progress, EMI and upcoming payments.';
    }

    // ====================================
    // REMAINING / OUTSTANDING
    // ====================================

    else if (
      message.includes('remaining') ||
      message.includes('outstanding') ||
      message.includes('left')
    ) {
      reply = `You currently have ₹${outstandingAmount.toLocaleString(
        'en-IN'
      )} outstanding across ${loanCount} loan(s).`;
    }

    // ====================================
    // TOTAL LOAN
    // ====================================

    else if (
      message.includes('total loan') ||
      message.includes('loan amount')
    ) {
      reply = `Your total original loan amount is ₹${totalLoan.toLocaleString(
        'en-IN'
      )}.`;
    }

    // ====================================
    // UTILIZATION
    // ====================================

    else if (
      message.includes('utilization') ||
      message.includes('used')
    ) {
      reply = `Your current outstanding loan utilization is ${utilization.toFixed(
        1
      )}%. You have ₹${outstandingAmount.toLocaleString(
        'en-IN'
      )} outstanding from an original ₹${totalLoan.toLocaleString(
        'en-IN'
      )}.`;
    }

    // ====================================
    // REPAYMENT PROGRESS
    // ====================================

    else if (
      message.includes('repaid') ||
      message.includes('paid') ||
      message.includes('progress')
    ) {
      reply = `You have repaid approximately ₹${repaidAmount.toLocaleString(
        'en-IN'
      )}. Your repayment progress is ${repaymentProgress.toFixed(
        1
      )}%.`;
    }

    // ====================================
    // EMI
    // ====================================

    else if (
      message.includes('emi') ||
      message.includes('monthly payment')
    ) {
      reply = `Your combined monthly EMI is approximately ₹${totalMonthlyEMI.toLocaleString(
        'en-IN'
      )}. Make sure the required funds are available before your EMI due dates.`;
    }

    // ====================================
    // NEXT PAYMENT
    // ====================================

    else if (
      message.includes('next') &&
      (
        message.includes('payment') ||
        message.includes('emi') ||
        message.includes('due')
      )
    ) {
      if (nextLoan) {
        const nextDate = new Date(
          nextLoan.nextEmiDate
        ).toLocaleDateString('en-IN');

        reply = `Your next recorded EMI is for ${
          nextLoan.lenderName ||
          'your loan'
        } and is due on ${nextDate}.`;
      } else {
        reply =
          'I could not find an upcoming EMI date in your loan records.';
      }
    }

    // ====================================
    // NUMBER OF LOANS
    // ====================================

    else if (
      message.includes('how many') &&
      message.includes('loan')
    ) {
      reply = `You currently have ${loanCount} loan(s) recorded in your account.`;
    }

    // ====================================
    // EXPENSE / SPENDING
    // ====================================

    else if (
      message.includes('expense') ||
      message.includes('spending') ||
      message.includes('spend')
    ) {
      reply =
        'Your current loan records track loan and repayment information. To analyze exactly how much of each loan was spent, the application will need a separate expense or transaction tracking feature.';
    }

    // ====================================
    // GENERIC EMI ADVICE
    // ====================================

    else if (
      message.includes('advice') ||
      message.includes('strategy') ||
      message.includes('what should')
    ) {
      reply = `You currently have ₹${outstandingAmount.toLocaleString(
        'en-IN'
      )} outstanding, with approximately ₹${totalMonthlyEMI.toLocaleString(
        'en-IN'
      )} in combined monthly EMIs. Focus on timely EMI payments and monitor your repayment progress.`;
    }

    // ====================================
    // DEFAULT
    // ====================================

    else {
      reply =
        'I can answer questions about your total loan, outstanding balance, repayment progress, utilization, EMI and upcoming payments. Try asking: "How much loan do I have remaining?"';
    }

    res.json({
      reply,

      data: {
        loanCount,
        totalLoan,
        outstandingAmount,
        repaidAmount,
        utilization: Number(
          utilization.toFixed(2)
        ),
        repaymentProgress: Number(
          repaymentProgress.toFixed(2)
        ),
        totalMonthlyEMI,
      },
    });
  } catch (err) {
    console.error(
      'AI chat error:',
      err
    );

    res.status(500).json({
      message:
        'Error processing AI chat',
    });
  }
};
