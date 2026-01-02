const express = require('express');
const router = express.Router();
const ModerationController = require('../controllers/moderation.controller');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/moderation/flag
router.post('/flag', authenticate, ModerationController.flag);

// GET /api/moderation/pending
router.get('/pending', authenticate, ModerationController.getPending);

module.exports = router;

