const express = require('express');
const router = express.Router();
const { getStrategy, chat } = require('../controllers/aiController');

router.get('/strategy', getStrategy);
router.post('/chat', chat);

module.exports = router;