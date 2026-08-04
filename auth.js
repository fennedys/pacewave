// =====================================================================
// Auth routes
// ---------------------------------------------------------------------
// Public:  login, refresh
// Private: me, logout (require auth)
// =====================================================================
const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { requireAuth } = require('./authMiddleware');

// Public
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

// Protected
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
