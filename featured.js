// =====================================================================
// Featured routes
// ---------------------------------------------------------------------
// Public:  list (homepage carousel)
// Private: add, reorder, remove
// =====================================================================
const express = require('express');
const router = express.Router();
const featuredController = require('./featuredController');
const { requireAuth } = require('./authMiddleware');
const { asyncHandler } = require('./errorMiddleware');

// Public
router.get('/', asyncHandler(featuredController.listFeatured));

// Protected
router.post('/', requireAuth, asyncHandler(featuredController.addFeatured));
router.put('/reorder', requireAuth, asyncHandler(featuredController.reorderFeatured));
router.delete('/:bookId', requireAuth, asyncHandler(featuredController.removeFeatured));

module.exports = router;
