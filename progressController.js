// =====================================================================
// Reading progress controller
// ---------------------------------------------------------------------
// Lets readers save their position per book (public, no auth needed) so
// they can resume where they left off. Non-sensitive data.
// =====================================================================
const { supabaseAdmin } = require('./supabaseClient');
const { asyncHandler } = require('./errorMiddleware');

// PUT /api/progress/:bookId - save/update progress  { reader_id, chapter_id, progress_pct }
const saveProgress = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { reader_id, chapter_id = null, progress_pct = 0 } = req.body;

  if (!reader_id) {
    return res.status(400).json({ error: 'reader_id is required to save progress.' });
  }

  const pct = Math.max(0, Math.min(100, Number(progress_pct) || 0));

  const { data, error } = await supabaseAdmin
    .from('reading_progress')
    .upsert(
      {
        reader_id,
        book_id: bookId,
        chapter_id: chapter_id || null,
        progress_pct: pct,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: 'reader_id,book_id' }
    )
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ progress: data });
});

// GET /api/progress/:bookId?reader_id= - get progress
const getProgress = asyncHandler(async (req, res) => {
  const { bookId } = req.params;
  const { reader_id } = req.query;
  if (!reader_id) return res.json({ progress: null });

  const { data, error } = await supabaseAdmin
    .from('reading_progress')
    .select('*')
    .eq('book_id', bookId)
    .eq('reader_id', reader_id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ progress: data });
});

module.exports = { saveProgress, getProgress };
