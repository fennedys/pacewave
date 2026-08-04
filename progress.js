// =====================================================================
// Reading progress routes
// ---------------------------------------------------------------------
// Public: GET (fetch) and PUT (save) progress per book.
// =====================================================================
const express = require('express');
const router = express.Router();
const progressController = require('./progressController');
const { asyncHandler } = require('./errorMiddleware');

router.get('/:bookId', asyncHandler(progressController.getProgress));
router.put('/:bookId', asyncHandler(progressController.saveProgress));

module.exports = router;
