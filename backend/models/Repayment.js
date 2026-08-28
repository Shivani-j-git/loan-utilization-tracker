const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema({
  loanId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Loan',
    required: true,
  },
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  paymentDate: {
    type:     Date,
    required: [true, 'Payment date is required'],
  },
  amountPaid: {
    type:     Number,
    required: [true, 'Amount paid is required'],
    min:      [1, 'Amount must be greater than 0'],
  },
  principalComponent: {
    type:     Number,
    required: true,
  },
  interestComponent: {
    type:     Number,
    required: true,
  },
  paymentMode: {
    type:     String,
    enum:     ['online', 'cheque', 'neft', 'upi'],
    required: [true, 'Payment mode is required'],
  },
  receiptNumber: {
    type: String,
    trim: true,
  },
  isOnTime: {
    type:    Boolean,
    default: true,
  },
}, { timestamps: true });

// Indexes for fast queries
repaymentSchema.index({ loanId: 1 });
repaymentSchema.index({ userId: 1 });
repaymentSchema.index({ loanId: 1, userId: 1 });

module.exports = mongoose.model('Repayment', repaymentSchema);
