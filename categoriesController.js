// =====================================================================
// Categories controller
// ---------------------------------------------------------------------
// Public read access + admin create/update/delete. Category IDs are used
// to tag books, so deletion must be safe (books keep category_id NULL via
// ON DELETE SET NULL).
// =====================================================================
const { supabaseAdmin } = require('./supabaseClient');
const { asyncHandler } = require('./errorMiddleware');

// Slugify helper for pretty URLs.
function slugify(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/categories  - list all categories (with optional book counts)
const listCategories = asyncHandler(async (req, res) => {
  const withCounts = req.query.with_books === 'true';

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*, books(count)')
    .order('name');

  if (error) return res.status(500).json({ error: error.message });

  const categories = (data || []).map((c) => ({
    ...c,
    book_count: withCounts ? (c.books?.[0]?.count ?? 0) : undefined,
    books: undefined,
  }));

  res.json({ categories });
});

// GET /api/categories/:id  - single category
const getCategory = asyncHandler(async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('categories').select('*').eq('id', req.params.id).single();
  if (error || !data) return res.status(404).json({ error: 'Category not found.' });
  res.json({ category: data });
});

// POST /api/categories  - create
const createCategory = asyncHandler(async (req, res) => {
  const { name, description = '' } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ name: name.trim(), slug: slugify(name), description })
    .select()
    .single();

  if (error) {
    return res.status(409).json({ error: 'A category with that name already exists.' });
  }
  res.status(201).json({ category: data });
});

// PUT /api/categories/:id  - update
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const patch = {};
  if (name !== undefined) {
    if (name.trim() === '') return res.status(400).json({ error: 'Name is required.' });
    patch.name = name.trim();
    patch.slug = slugify(name);
  }
  if (description !== undefined) patch.description = description;

  const { data, error } = await supabaseAdmin
    .from('categories').update(patch).eq('id', req.params.id).select().single();
  if (error || !data) return res.status(404).json({ error: 'Category not found.' });
  res.json({ category: data });
});

// DELETE /api/categories/:id - delete
const deleteCategory = asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('categories').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Category deleted.', id: req.params.id });
});

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
