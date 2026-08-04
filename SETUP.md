# PaceWave Library — Setup & Deployment Guide

> **Flat structure version** — every file lives directly in one folder (no subfolders).

```
pacewave-library/                 ← your project folder (single, flat)
├── README.md
├── package.json
├── .gitignore
├── .env.example
├── schema.sql                    # Supabase PostgreSQL schema
├── server.js                     # Express entry point
├── app.js                        # shared frontend logic
├── style.css                     # shared styles
├── index.html                    # homepage
├── library.html  search.html  categories.html  reader.html
├── login.html  dashboard.html  admin.css  admin.js
├── auth.js  books.js  chapters.js  categories.js  featured.js  progress.js  stats.js     # routes
├── authController.js  booksController.js  chaptersController.js  categoriesController.js
├── featuredController.js  progressController.js  statsController.js  storage.js        # controllers
├── authMiddleware.js  errorMiddleware.js  validateMiddleware.js                            # middleware
├── supabaseClient.js  upload.js                                                            # config
├── API.md                # API reference
└── SETUP.md              # this file
```

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Note your **Project URL** and keys under **Project Settings → API**:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (secret — backend only)
   - `SUPABASE_JWT_SECRET`

3. Run the database schema:
   - Open **SQL Editor → New query**.
   - Paste the contents of `schema.sql` and click **Run**.
   - This creates all tables, indexes, triggers, RLS policies and seed categories.

4. Create your admin user:
   - **Authentication → Users → Add user**, enter an email + password.
   - Grab the new user's **UUID**.
   - Run this SQL (SQL Editor):
     ```sql
     INSERT INTO admins (id, email, name) VALUES
     ('<THE_USER_UUID>', 'you@example.com', 'Your Name');
     ```
   - The backend also auto-creates the admin row on first login, so this step is optional.

5. Optional — create the storage bucket:
   - **Storage → New bucket → name `covers` → Public**.
   - The backend creates it automatically if missing.

---

## 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the Supabase values (see step 1).

---

## 3. Install & run locally

```bash
npm install
npm run dev        # starts API on http://localhost:4000
```

The server serves everything from this one folder:
- Public site → `http://localhost:4000/`
- Admin login → `http://localhost:4000/login.html`

---

## 4. Using the admin dashboard

1. Open `http://localhost:4000/login.html`.
2. Log in with the Supabase Auth email/password from step 1.
3. On the dashboard you can:
   - Add/edit/delete books (title, author, category, description, cover upload).
   - Add unlimited chapters with the dynamic chapter editor.
   - Mark books **Featured** and **New Arrival**.
   - Manage categories.
   - Manage homepage featured order.
   - View stats + recent books.
   - Search books.

---

## 5. Deploy to GitHub + Render/Railway/Fly.io

### Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - PaceWave Library"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pacewave-library.git
git push -u origin main
```
`.gitignore` already excludes `.env` and `node_modules`.

### Deploy the Node service
1. On Render/Railway create a **Web Service** pointing at the repo.
   - Build command: `npm install`
   - Start command: `npm start`
2. Set all environment variables from `.env` in the host's dashboard.
3. Deploy. The site + admin + API all live behind one URL.

---

## 6. Security notes

- The **service role key** is only used by the server and never exposed.
- Admin routes are protected by `authMiddleware` (Supabase JWT verification).
- Row Level Security blocks public writes to all library tables.
- Login is rate-limited to slow brute-force attempts.
- Uploads are validated by type and size (5 MB cap).
- Central error handling (`errorMiddleware`) hides internal errors.

---

## 7. Expanding later

- Add a public reader-account system by enabling Supabase Auth for readers.
- Add full-text search with PostgreSQL `tsvector`.
- Add per-chapter ratings and comments.
- Serve covers via Supabase's CDN URLs (already the case).
