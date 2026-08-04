// =====================================================================
// Books controller
// ---------------------------------------------------------------------
// Handles full CRUD for books, cover image upload, search, featured /
// new-arrival flags, and view counting. Chapters are managed separately
// in chapters.js but loaded here for convenience on detail views.
// =====================================================================
const { supabaseAdmin } = require('./supabaseClient');
const { uploadCover, deleteCover } = require('./storage');
const { asyncHandler } = require('./errorMiddleware');

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------
// Build a query with optional category & search filters, plus pagination.
function buildBookQuery(req) {
  let q = supabaseAdmin
    .from('books')
    .select('*, category:categories(id, name, slug), chapters(id, chapter_no)', { count: 'exact' });

  const { category, search, featured, newArrival, page = 1, per_page = 12 } = req.query;
  const limit = Math.min(Number(per_page) || 12, 50);
  const from = (Math.max(Number(page) || 1, 1) - 1) * limit;

  if (category) q = q.eq('category_id', category);
  if (featured === 'true') q = q.eq('is_featured', true);
  if (newArrival === 'true') q = q.eq('is_new_arrival', true);
  if (search) {
    // Filter across title / author / category name using OR.
    q = q.or(
      `title.ilike.%${search}%,author.ilike.%${search}%,category.name.ilike.%${search}%`
    );
  }

  q = q.order('created_at', { ascending: false }).range(from, from + limit - 1);
  return q;
}

// Count a chapter array and attach it (used in list views).
function withChapterCount(book) {
  return { ...book, chapter_count: book.chapters ? book.chapters.length : 0 };
}

// ---------------------------------------------------------------------
// GET /api/books            - list books (with filters + pagination)
// GET /api/books/featured   - homepage featured books
// GET /api/books/new-arrivals
// GET /api/books/:id        - single book detail (+ chapters)
// GET /api/books/search?q=  - quick search
// ---------------------------------------------------------------------
const listBooks = asyncHandler(async (req, res) => {
  const { data, error, count } = await buildBookQuery(req);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ books: data.map(withChapterCount), total: count ?? data.length });
});

const featuredBooks = asyncHandler(async (req, res) => {
  // Pull the featured_books ordering then join book rows.
  const { data: featured, error: fErr } = await supabaseAdmin
    .from('featured_books')
    .select('book_id, position')
    .order('position');

  if (fErr) return res.status(500).json({ error: fErr.message });

  const ids = featured.map((f) => f.book_id);
  if (!ids.length) return res.json({ books: [] });

  const { data, error } = await supabaseAdmin
    .from('books')
    .select('*, category:categories(id, name, slug), chapters(id, chapter_no)')
    .in('id', ids);

  if (error) return res.status(500).json({ error: error.message });

  // Preserve the custom homepage ordering.
  const orderMap = new Map(featured.map((f, i) => [f.book_id, i]));
  data.sort((a, b) => orderMap.get(a.id) - orderMap.get(b.id));

  res.json({ books: data.map(withChapterCount) });
});

const newArrivals = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('books')
    .select('*, category:categories(id, name, slug), chapters(id, chapter_no)')
    .eq('is_new_arrival', true)
    .order('created_at', { ascending: false })
    .limit(Number(req.query.limit) || 8);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ books: data.map(withChapterCount) });
});

const getBook = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('books')
    .select('*, category:categories(id, name, slug), chapters(id, title, chapter_no, updated_at)')
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Book not found.' });
  }

  // Sort chapters numerically.
  data.chapters.sort((a, b) => a.chapter_no - b.chapter_no);

  // Increment views (fire and forget - don't fail the request on it).
  supabaseAdmin.rpc('increment_book_views', { p_book_id: id }).catch(() => {});

  res.json({ book: data });
});

const searchBooks = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json({ books: [] });

  const { data, error } = await supabaseAdmin
    .from('books')
    .select('*, category:categories(id, name, slug), chapters(id, chapter_no)')
    .or(
      `title.ilike.%${q}%,author.ilike.%${q}%,category.name.ilike.%${q}%`
    )
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ books: data.map(withChapterCount), query: q });
});

// ---------------------------------------------------------------------
// POST /api/books           - create book (+ optional cover)
// ---------------------------------------------------------------------
const createBook = asyncHandler(async (req, res) => {
  const { title, author, description = '', category_id = null, is_featured = false, is_new_arrival = false } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required.' });
  }

  let cover_url = null;
  // If a cover file was uploaded with the request, store it first.
  if (req.file) {
    cover_url = await uploadCover(req.file.buffer, req.file.mimetype, req.file.originalname);
  }

  const { data, error } = await supabaseAdmin
    .from('books')
    .insert({
      title,
      author,
      description,
      category_id: category_id || null,
      cover_url,
      is_featured: is_featured === true || is_featured === 'true',
      is_new_arrival: is_new_arrival === true || is_new_arrival === 'true',
    })
    .select()
    .single();

  if (error) {
    if (cover_url) await deleteCover(cover_url).catch(() => {});
    return res.status(500).json({ error: error.message });
  }

  // If the book is flagged featured, add it to the featured_books ordering.
  if (data.is_featured) {
    await supabaseAdmin.from('featured_books').upsert(
      { book_id: data.id, position: 0 },
      { onConflict: 'book_id' }
    );
  }

  res.status(201).json({ book: data });
});

// ---------------------------------------------------------------------
// PUT /api/books/:id        - update book (+ optional new cover)
// ---------------------------------------------------------------------
const updateBook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, author, description, category_id, is_featured, is_new_arrival, cover_url } = req.body;

  // Load the existing record to compare flags and clean up old covers.
  const { data: existing, error: loadErr } = await supabaseAdmin
    .from('books').select('*').eq('id', id).single();
  if (loadErr || !existing) return res.status(404).json({ error: 'Book not found.' });

  const patch = {};
  if (title !== undefined) patch.title = title;
  if (author !== undefined) patch.author = author;
  if (description !== undefined) patch.description = description;
  if (category_id !== undefined) patch.category_id = category_id || null;
  if (is_featured !== undefined) patch.is_featured = is_featured === true || is_featured === 'true';
  if (is_new_arrival !== undefined) patch.is_new_arrival = is_new_arrival === true || is_new_arrival === 'true';

  // New cover uploaded -> replace old one.
  if (req.file) {
    const newUrl = await uploadCover(req.file.buffer, req.file.mimetype, req.file.originalname);
    patch.cover_url = newUrl;
  } else if (cover_url !== undefined) {
    patch.cover_url = cover_url || null;
  }

  const { data, error } = await supabaseAdmin
    .from('books').update(patch).eq('id', id).select().single();

  if (error) {
    if (patch.cover_url && patch.cover_url !== existing.cover_url) {
      await deleteCover(patch.cover_url).catch(() => {});
    }
    return res.status(500).json({ error: error.message });
  }

  // Remove the OLD cover from storage if it was replaced.
  if (req.file && existing.cover_url) {
    await deleteCover(existing.cover_url).catch(() => {});
  }

  // Sync featured_books table with the flag.
  if (data.is_featured) {
    await supabaseAdmin.from('featured_books').upsert(
      { book_id: data.id, position: 0 },
      { onConflict: 'book_id' }
    );
  } else {
    await supabaseAdmin.from('featured_books').delete().eq('book_id', data.id);
  }

  res.json({ book: data });
});

// ---------------------------------------------------------------------
// DELETE /api/books/:id     - delete book (+ chapters + cover + featured)
// ---------------------------------------------------------------------
const deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: existing, error: loadErr } = await supabaseAdmin
    .from('books').select('*').eq('id', id).single();
  if (loadErr || !existing) return res.status(404).json({ error: 'Book not found.' });

  // Chapters and featured_books rows cascade via FK ON DELETE CASCADE.
  const { error } = await supabaseAdmin.from('books').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  // Clean up the stored cover image (best effort).
  await deleteCover(existing.cover_url).catch(() => {});

  res.json({ message: 'Book deleted successfully.', id });
});

// ---------------------------------------------------------------------
// POST /api/books/:id/view  - manual view increment
// ---------------------------------------------------------------------
const incrementView = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error } = await supabaseAdmin.rpc('increment_book_views', { p_book_id: id });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'View recorded.' });
});

module.exports = {
  listBooks,
  featuredBooks,
  newArrivals,
  getBook,
  searchBooks,
  createBook,
  updateBook,
  deleteBook,
  incrementView,
};
