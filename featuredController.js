// =====================================================================
// Featured controller
// ---------------------------------------------------------------------
// Manages the homepage "Featured" carousel. Admins can list the currently
// featured books, add/remove a book, and reorder them by position.
// =====================================================================
const { supabaseAdmin } = require('./supabaseClient');
const { asyncHandler } = require('./errorMiddleware');

// GET /api/featured  - list featured books in display order
const listFeatured = asyncHandler(async (req, res) => {
  const { data: featured, error: fErr } = await supabaseAdmin
    .from('featured_books')
    .select('book_id, position')
    .order('position', { ascending: true });

  if (fErr) return res.status(500).json({ error: fErr.message });

  const ids = (featured || []).map((f) => f.book_id);
  if (!ids.length) return res.json({ featured: [] });

  const { data, error } = await supabaseAdmin
    .from('books')
    .select('*, category:categories(id, name, slug), chapters(id, chapter_no)')
    .in('id', ids);
  if (error) return res.status(500).json({ error: error.message });

  const orderMap = new Map((featured || []).map((f, i) => [f.book_id, i]));
  const books = (data || []).sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));

  res.json({ featured: books.map((b) => ({ ...b, chapter_count: b.chapters.length })) });
});

// POST /api/featured  - add a book to featured  { book_id, position? }
const addFeatured = asyncHandler(async (req, res) => {
  const { book_id, position = 0 } = req.body;
  if (!book_id) return res.status(400).json({ error: 'book_id is required.' });

  // Verify the book exists.
  const { data: book } = await supabaseAdmin
    .from('books').select('id').eq('id', book_id).maybeSingle();
  if (!book) return res.status(404).json({ error: 'Book not found.' });

  await supabaseAdmin
    .from('featured_books')
    .upsert({ book_id, position: Number(position) || 0 }, { onConflict: 'book_id' });
  // Keep books.is_featured in sync.
  await supabaseAdmin.from('books').update({ is_featured: true }).eq('id', book_id);

  res.status(201).json({ message: 'Book added to featured.', book_id });
});

// PUT /api/featured/reorder  - reorder featured  { order: [bookId, ...] }
const reorderFeatured = asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array of book ids.' });
  }

  for (let i = 0; i < order.length; i++) {
    await supabaseAdmin
      .from('featured_books')
      .update({ position: i })
      .eq('book_id', order[i]);
  }
  res.json({ message: 'Featured order updated.' });
});

// DELETE /api/featured/:bookId  - remove from featured
const removeFeatured = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  await supabaseAdmin.from('featured_books').delete().eq('book_id', bookId);
  await supabaseAdmin.from('books').update({ is_featured: false }).eq('id', bookId);
  res.json({ message: 'Removed from featured.', book_id: bookId });
});

module.exports = { listFeatured, addFeatured, reorderFeatured, removeFeatured };
