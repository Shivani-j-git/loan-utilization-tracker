const Loan      = require('../models/Loan');
const Repayment = require('../models/Repayment');

// ─── CALCULATE HEALTH SCORE ───────────────────────
const calculateHealthScore = async (loan) => {
  const repayments = await Repayment.find({ loanId: loan._id });
  if (repayments.length === 0) return 100;

  // Component 1: Consistency (40 points)
  const onTime      = repayments.filter(r => r.isOnTime).length;
  const consistency = (onTime / repayments.length) * 40;

  // Component 2: Efficiency (30 points)
  const elapsed   = (new Date() - loan.disbursementDate)
                    / (1000 * 60 * 60 * 24 * 30);
  const expected  = elapsed * loan.emiAmount;
  const actual    = repayments.reduce((s, r) => s + r.amountPaid, 0);
  const efficiency = Math.min((actual / (expected || 1)) * 30, 30);

  // Component 3: Trajectory (30 points)
  const principalRepaidPct = 1 - (loan.outstandingBalance
                              / loan.principalAmount);
  const tenureElapsedPct   = elapsed / loan.tenureMonths;
  const trajectory = principalRepaidPct >= tenureElapsedPct
    ? 30
    : (principalRepaidPct / (tenureElapsedPct || 1)) * 30;

  return Math.round(consistency + efficiency + trajectory);
};

// ─── GET ALL LOANS ────────────────────────────────
exports.getLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.id })
                            .sort({ nextEmiDate: 1 });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET SINGLE LOAN ──────────────────────────────
exports.getLoan = async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id:    req.params.id,
      userId: req.user.id,
    });
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── CREATE LOAN ──────────────────────────────────
exports.createLoan = async (req, res) => {
  try {
    const loan = new Loan({
      ...req.body,
      userId:             req.user.id,
      outstandingBalance: req.body.principalAmount,
    });
    await loan.save();
    res.status(201).json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ─── UPDATE LOAN ──────────────────────────────────
exports.updateLoan = async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    res.json(loan);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ─── DELETE LOAN ──────────────────────────────────
exports.deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user.id,
    });
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    // Delete related repayments
    await Repayment.deleteMany({ loanId: req.params.id });
    res.json({ message: 'Loan deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── RECORD REPAYMENT ─────────────────────────────
exports.recordRepayment = async (req, res) => {
  try {
    const loan = await Loan.findOne({
      _id:    req.body.loanId,
      userId: req.user.id,
    });
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Calculate principal and interest components
    const monthlyRate      = loan.interestRate / 12 / 100;
    const interestComponent = Math.round(
      loan.outstandingBalance * monthlyRate
    );
    const principalComponent = Math.round(
      req.body.amountPaid - interestComponent
    );

    // Check if payment is on time
    const isOnTime = new Date(req.body.paymentDate)
                     <= new Date(loan.nextEmiDate);

    // Create repayment record
    const repayment = new Repayment({
      ...req.body,
      userId:             req.user.id,
      principalComponent,
      interestComponent,
      isOnTime,
    });
    await repayment.save();

    // Update loan outstanding balance
    loan.outstandingBalance = Math.max(
      0,
      loan.outstandingBalance - principalComponent
    );

    // Update next EMI date
    const nextDate = new Date(loan.nextEmiDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    loan.nextEmiDate = nextDate;

    // Check if loan is fully paid
    if (loan.outstandingBalance === 0) {
      loan.status = 'closed';
    }

    // Recalculate health score
    loan.utilizationScore = await calculateHealthScore(loan);
    await loan.save();

    res.status(201).json({
      message:    'Repayment recorded successfully',
      repayment,
      loan,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── GET REPAYMENT HISTORY ────────────────────────
exports.getRepayments = async (req, res) => {
  try {
    const repayments = await Repayment.find({
      loanId: req.params.loanId,
      userId: req.user.id,
    }).sort({ paymentDate: -1 });
    res.json(repayments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PREPAYMENT SIMULATOR ─────────────────────────
exports.simulatePrepayment = async (req, res) => {
  try {
    const { loanId, prepaymentAmount } = req.body;
    const loan = await Loan.findOne({
      _id:    loanId,
      userId: req.user.id,
    });
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const monthlyRate = loan.interestRate / 12 / 100;
    const newBalance  = loan.outstandingBalance - prepaymentAmount;

    // Calculate new tenure
    const newTenure = Math.ceil(
      -Math.log(1 - (newBalance * monthlyRate / loan.emiAmount))
      / Math.log(1 + monthlyRate)
    );

    // Calculate old tenure remaining
    const oldTenure = Math.ceil(
      -Math.log(1 - (loan.outstandingBalance * monthlyRate / loan.emiAmount))
      / Math.log(1 + monthlyRate)
    );

    const monthsSaved    = oldTenure - newTenure;
    const interestSaved  = Math.round(monthsSaved * loan.emiAmount);
    const newDebtFreeDate = new Date();
    newDebtFreeDate.setMonth(
      newDebtFreeDate.getMonth() + newTenure
    );

    res.json({
      currentOutstanding: loan.outstandingBalance,
      newOutstanding:     newBalance,
      oldTenureMonths:    oldTenure,
      newTenureMonths:    newTenure,
      monthsSaved,
      interestSaved,
      newDebtFreeDate,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
