const express = require('express');
const router = express.Router();

const { getStrategy, chat } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/strategy', getStrategy);
router.post('/chat', chat);

module.exports = router;
