const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

// GET /api/users/:id
router.get('/:id', UserController.getById);

module.exports = router;

