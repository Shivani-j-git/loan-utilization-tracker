const express = require('express');
const router = express.Router();

const { getStrategy, chat } = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth');

// Protect all AI routes
router.use(verifyToken);

router.get('/strategy', getStrategy);
router.post('/chat', chat);

module.exports = router;
