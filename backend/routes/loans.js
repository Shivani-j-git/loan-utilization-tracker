const express        = require('express');
const router         = express.Router();
const loanController = require('../controllers/loanController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/',                    loanController.getLoans);
router.get('/:id',                 loanController.getLoan);
router.post('/',                   loanController.createLoan);
router.put('/:id',                 loanController.updateLoan);
router.delete('/:id',              loanController.deleteLoan);
router.post('/repayment/record',   loanController.recordRepayment);
router.get('/repayments/:loanId',  loanController.getRepayments);
router.post('/prepayment/simulate',loanController.simulatePrepayment);

module.exports = router;
