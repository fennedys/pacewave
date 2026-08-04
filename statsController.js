// =====================================================================
// Statistics controller (admin dashboard)
// ---------------------------------------------------------------------
// Aggregates dashboard numbers: total books, categories, readers, views,
// plus recently added books. "Readers" is an estimate based on distinct
// reading_progress rows (i.e. distinct readers who have opened books).
// =====================================================================
const { supabaseAdmin } = require('./supabaseClient');
const { asyncHandler } = require('./errorMiddleware');

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  // Total books
  const { count: total_books } = await supabaseAdmin
    .from('books').select('*', { count: 'exact', head: true });

  // Total categories
  const { count: total_categories } = await supabaseAdmin
    .from('categories').select('*', { count: 'exact', head: true });

  // Total readers = distinct reader ids with progress
  const { count: total_readers } = await supabaseAdmin
    .from('reading_progress').select('*', { count: 'exact', head: true });

  // Total views = sum of books.views
  const { data: viewsData } = await supabaseAdmin
    .from('books').select('views');
  const total_views = (viewsData || []).reduce((sum, b) => sum + (b.views || 0), 0);

  // Featured + new arrivals counts
  const { count: featured_count } = await supabaseAdmin
    .from('featured_books').select('*', { count: 'exact', head: true });
  const { count: new_arrivals_count } = await supabaseAdmin
    .from('books').select('*', { count: 'exact', head: true }).eq('is_new_arrival', true);

  // Recently added books (latest 8)
  const { data: recent_books } = await supabaseAdmin
    .from('books')
    .select('*, category:categories(id, name, slug), chapters(id)')
    .order('created_at', { ascending: false })
    .limit(8);

  res.json({
    stats: {
      total_books,
      total_categories,
      total_readers,
      total_views,
      featured_count,
      new_arrivals_count,
    },
    recent_books: (recent_books || []).map((b) => ({
      ...b,
      chapter_count: b.chapters ? b.chapters.length : 0,
    })),
  });
});

module.exports = { getStats };
