// =====================================================================
// Statistics routes (admin dashboard)
// ---------------------------------------------------------------------
// Private: GET /api/admin/stats
// =====================================================================
const express = require('express');
const router = express.Router();
const statsController = require('./statsController');
const { requireAuth } = require('./authMiddleware');
const { asyncHandler } = require('./errorMiddleware');

router.get('/', requireAuth, asyncHandler(statsController.getStats));

module.exports = router;
