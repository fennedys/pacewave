// =====================================================================
// Books routes
// ---------------------------------------------------------------------
// Public:  list, featured, new-arrivals, search, get by id, chapters of book
// Private: create, update, delete, view increment
// =====================================================================
const express = require('express');
const router = express.Router();
const booksController = require('./booksController');
const chaptersController = require('./chaptersController');
const { requireAuth } = require('./authMiddleware');
const upload = require('./upload');
const { asyncHandler } = require('./errorMiddleware');

// Public
router.get('/', asyncHandler(booksController.listBooks));
router.get('/featured', asyncHandler(booksController.featuredBooks));
router.get('/new-arrivals', asyncHandler(booksController.newArrivals));
router.get('/search', asyncHandler(booksController.searchBooks));
router.get('/:id', asyncHandler(booksController.getBook));
router.get('/:bookId/chapters', asyncHandler(chaptersController.listChapters));
router.get('/:bookId/chapters/:chapterNo', asyncHandler(chaptersController.getChapterByNumber));

// Protected (admin)
router.post('/', requireAuth, upload.single('cover'), asyncHandler(booksController.createBook));
router.put('/:id', requireAuth, upload.single('cover'), asyncHandler(booksController.updateBook));
router.delete('/:id', requireAuth, asyncHandler(booksController.deleteBook));
router.post('/:id/view', requireAuth, asyncHandler(booksController.incrementView));

// Chapters under a book (admin)
router.post('/:bookId/chapters', requireAuth, asyncHandler(chaptersController.createChapter));

module.exports = router;
