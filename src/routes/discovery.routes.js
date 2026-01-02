const express = require('express');
const router = express.Router();
const DiscoveryController = require('../controllers/discovery.controller');

// GET /api/discovery/search?q=
router.get('/search', DiscoveryController.search);

// GET /api/discovery/trending
router.get('/trending', DiscoveryController.getTrending);

module.exports = router;

