const express = require('express');
const router = express.Router();
const PortfolioController = require('../controllers/portfolio.controller');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/portfolios/:artistId
router.get('/:artistId', PortfolioController.get);

// PUT /api/portfolios/:artistId
router.put('/:artistId', authenticate, PortfolioController.update);

module.exports = router;

