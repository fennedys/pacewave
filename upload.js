// =====================================================================
// Upload configuration
// ---------------------------------------------------------------------
// Configures Multer to accept cover-image uploads in memory (no temp
// file on disk), so we can stream the buffer straight to Supabase Storage.
// =====================================================================
const multer = require('multer');

// Keep file in memory so we can upload the Buffer to Supabase.
const storage = multer.memoryStorage();

// Allowed image types for book covers.
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Unsupported image type. Allowed: ' + allowedTypes.join(', ')
      ),
      false
    );
  }
};

// 5 MB cap on cover uploads.
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
