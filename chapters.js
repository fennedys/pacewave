// =====================================================================
// Chapters routes (standalone chapter operations)
// ---------------------------------------------------------------------
// Public:  get one chapter
// Private: update, delete
// =====================================================================
const express = require('express');
const router = express.Router();
const chaptersController = require('./chaptersController');
const { requireAuth } = require('./authMiddleware');
const { asyncHandler } = require('./errorMiddleware');

// Public
router.get('/:id', asyncHandler(chaptersController.getChapter));

// Protected
router.put('/:id', requireAuth, asyncHandler(chaptersController.updateChapter));
router.delete('/:id', requireAuth, asyncHandler(chaptersController.deleteChapter));

module.exports = router;
