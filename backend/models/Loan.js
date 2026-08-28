const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  loanType: {
    type:     String,
    enum:     ['personal', 'home', 'vehicle', 'education', 'business'],
    required: [true, 'Loan type is required'],
  },
  lenderName: {
    type:     String,
    required: [true, 'Lender name is required'],
    trim:     true,
  },
  principalAmount: {
    type:     Number,
    required: [true, 'Principal amount is required'],
    min:      [1, 'Amount must be greater than 0'],
  },
  disbursedAmount: {
    type:    Number,
    default: 0,
  },
  outstandingBalance: {
    type:     Number,
    required: true,
  },
  interestRate: {
    type:     Number,
    required: [true, 'Interest rate is required'],
    min:      0,
    max:      100,
  },
  tenureMonths: {
    type:     Number,
    required: [true, 'Tenure is required'],
    min:      1,
  },
  emiAmount: {
    type:     Number,
    required: [true, 'EMI amount is required'],
  },
  disbursementDate: {
    type:     Date,
    required: [true, 'Disbursement date is required'],
  },
  nextEmiDate: {
    type:     Date,
    required: [true, 'Next EMI date is required'],
  },
  utilizationScore: {
    type:    Number,
    default: 100,
    min:     0,
    max:     100,
  },
  status: {
    type:    String,
    enum:    ['active', 'closed', 'npa', 'restructured'],
    default: 'active',
  },
}, { timestamps: true });

// Index for fast queries
loanSchema.index({ userId: 1 });
loanSchema.index({ status: 1 });

module.exports = mongoose.model('Loan', loanSchema);
