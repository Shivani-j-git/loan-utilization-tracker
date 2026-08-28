const express    = require('express');
const router     = express.Router();
const Loan       = require('../models/Loan');
const Repayment  = require('../models/Repayment');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/summary', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all loans
    const loans = await Loan.find({ userId });

    // Total outstanding
    const totalOutstanding = loans.reduce(
      (s, l) => s + l.outstandingBalance, 0
    );

    // Average health score
    const avgScore = loans.length
      ? Math.round(
          loans.reduce((s, l) => s + l.utilizationScore, 0)
          / loans.length
        )
      : 0;

    // By loan type
    const byType = await Loan.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
      { $group: {
          _id:              '$loanType',
          totalOutstanding: { $sum: '$outstandingBalance' },
          count:            { $sum: 1 },
      }},
      { $project: {
          loanType:         '$_id',
          totalOutstanding: 1,
          count:            1,
      }},
    ]);

    // Monthly repayments (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyPayments = await Repayment.aggregate([
      {
        $match: {
          userId:      require('mongoose').Types.ObjectId(userId),
          paymentDate: { $gte: sixMonthsAgo },
        }
      },
      {
        $group: {
          _id: {
            year:  { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
          },
          totalPaid:      { $sum: '$amountPaid' },
          totalPrincipal: { $sum: '$principalComponent' },
          totalInterest:  { $sum: '$interestComponent' },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' }, '-',
              { $toString: '$_id.month' },
            ]
          },
          totalPaid:      1,
          totalPrincipal: 1,
          totalInterest:  1,
        }
      },
    ]);

    res.json({
      totalLoans:       loans.length,
      totalOutstanding,
      avgScore,
      atRiskCount:      loans.filter(l => l.utilizationScore < 60).length,
      byType,
      monthlyPayments,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
