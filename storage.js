// =====================================================================
// Supabase Storage helper for book covers
// ---------------------------------------------------------------------
// Uploads a cover image buffer to the 'covers' bucket and returns a public
// URL. Bucket name is configurable via env (defaults to 'covers').
// =====================================================================
const { supabaseAdmin, supabaseUrl } = require('./supabaseClient');

const BUCKET = process.env.SUPABASE_BUCKET || 'covers';

// Ensure the storage bucket exists (idempotent).
async function ensureBucket() {
  const { data, error } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (error || !data) {
    // Bucket missing -> create it as public so covers are served directly.
    await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    });
  }
}

/**
 * Upload a cover image.
 * @param {Buffer} buffer  - image bytes
 * @param {string} mimetype - image mime type
 * @param {string} filename - desired filename (unique)
 * @returns {Promise<string>} public URL
 */
async function uploadCover(buffer, mimetype, filename) {
  await ensureBucket();

  // Unique storage path to avoid collisions.
  const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimetype, upsert: false });

  if (error) {
    throw Object.assign(new Error('Failed to upload cover image'), {
      status: 500,
      details: error.message,
    });
  }

  // Public bucket -> deterministic public URL.
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * Delete a cover image given its public URL.
 */
async function deleteCover(url) {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = url.slice(idx + marker.length);
  await supabaseAdmin.storage.from(BUCKET).remove([path]);
}

module.exports = { uploadCover, deleteCover, BUCKET };
