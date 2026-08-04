// =====================================================================
// PaceWave Library - Express server
// ---------------------------------------------------------------------
// Entry point. Wires up middleware, mounts the REST API routes, serves
// the built frontend and starts listening.
// =====================================================================
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Middleware + routes
const { notFound, errorHandler } = require('./errorMiddleware');

const app = express();
const PORT = process.env.PORT || 4000;

// ---- Security headers (helmet) ----
app.use(
  helmet({
    contentSecurityPolicy: false, // allow inline styles used by the frontend
  })
);

// ---- CORS: allow the frontend origin(s) ----
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      // No origin (curl, same-origin) or allowed origin -> accept.
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ---- Body parsing ----
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Rate limiting: slow down brute-force login attempts ----
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
});

// ---- Static frontend (deployment: backend serves the built site) ----
// Prefer serving a dedicated `public/` directory. If it doesn't exist yet,
// fall back to the repository root but block access to sensitive files.
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
} else {
  // Block access to known sensitive files and directories before serving
  const forbiddenPatterns = [
    '.env', '.env.example', 'server.js', 'package.json', 'package-lock.json', 'node_modules', '.git', '.github'
  ];

  app.use((req, res, next) => {
    const p = req.path;
    for (const pat of forbiddenPatterns) {
      if (p === `/${pat}` || p.startsWith(`/${pat}/`) || p.includes(`/${pat}`) || p.includes(pat)) {
        return res.status(404).end();
      }
    }
    next();
  });

  // Serve the repository root as a temporary fallback (move frontend into ./public/ when ready)
  app.use(express.static(__dirname));
}


// ---- API routes ----
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'PaceWave Library API' }));

app.use('/api/auth', authLimiter, require('./auth'));
app.use('/api/books', require('./books'));
app.use('/api/chapters', require('./chapters'));
app.use('/api/categories', require('./categories'));
app.use('/api/featured', require('./featured'));
app.use('/api/progress', require('./progress'));
app.use('/api/admin/stats', require('./stats'));

// ---- 404 + error handler ----
app.use(notFound);
app.use(errorHandler);

// ---- Start ----
app.listen(PORT, '0.0.0.0', () => {
  const { configured } = require('./supabaseClient');
  console.log(`\n  PaceWave Library API running`);
  console.log(`  ➜ API:    http://localhost:${PORT}/api`);
  console.log(`  ➜ Site:   http://localhost:${PORT}/`);
  console.log(`  ➜ Admin:  http://localhost:${PORT}/login.html`);
  console.log(`  ➜ Supabase: ${configured ? 'CONFIGURED ✓' : 'NOT CONFIGURED (see .env)'}\n`);
});
