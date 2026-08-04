# ⚡ PaceWave Library

A full-stack online reading platform — browse books, read chapter by chapter, and manage everything from a secure admin dashboard. Built with **Express + Supabase + Vanilla JS**.

> Modern glassmorphism UI · purple/blue gradient · fully responsive · deployment-ready.
> **Flat structure** — every file sits directly in one folder (no subfolders).

---

## ✨ Features

### Public website
- **Homepage** — hero ("Read Books Anytime, Anywhere"), stats, featured carousel, new arrivals, category grid.
- **Library** — browse with search (title/author/category), category filters, pagination.
- **Reader** — chapter-by-chapter reading, prev/next nav, reading progress bar, resumable progress, adjustable font size, light/dark mode, responsive layout.
- **Search** — dedicated live search page.

### Admin dashboard (`login.html`)
- Secure admin login (Supabase Auth).
- **Statistics** — total books, categories, readers, views + recently added books.
- Full **book CRUD** — title, author, category, description, cover upload, featured/new-arrival flags.
- **Dynamic chapter editor** — add unlimited chapters stored as text in the database.
- Manage **categories**, homepage **featured** order, and **new arrivals**.
- Search books from the dashboard.

### Backend API
RESTful Express API with `GET / POST / PUT / DELETE` covering auth, books, chapters, categories, featured, new arrivals, reading progress and statistics. See [`API.md`](API.md).

---

## 🗂 Project structure (single flat folder)

```
pacewave-library/
├── server.js  package.json  .gitignore  .env.example  schema.sql
├── index.html  library.html  reader.html  search.html  categories.html
├── app.js  style.css
├── login.html  dashboard.html  admin.css  admin.js
├── auth.js  books.js  chapters.js  categories.js  featured.js  progress.js  stats.js   # routes
├── authController.js  booksController.js  chaptersController.js  categoriesController.js
├── featuredController.js  progressController.js  statsController.js  storage.js        # controllers
├── authMiddleware.js  errorMiddleware.js  validateMiddleware.js                          # middleware
├── supabaseClient.js  upload.js                                                          # config
└── API.md  SETUP.md
```

---

## 🚀 Quick start

See [`SETUP.md`](SETUP.md) for the full walkthrough.

```bash
# 1. Create a Supabase project and run schema.sql
# 2. Configure env
cp .env.example .env   # fill in Supabase keys

# 3. Install & run
npm install
npm run dev        # http://localhost:4000
```

- Public site: `http://localhost:4000/`
- Admin login: `http://localhost:4000/login.html`

---

## 🗄 Database (Supabase / PostgreSQL)

Tables: `admins`, `books`, `chapters`, `categories`, `featured_books`, `reading_progress`.
Includes primary/foreign keys, indexes, an `updated_at` trigger, a view-counter function, **Row Level Security** policies and seed categories — all in [`schema.sql`](schema.sql).

---

## 🔐 Security

- Admin routes protected by Supabase JWT verification (`authMiddleware`).
- **RLS** blocks public writes; the server uses the service-role key only.
- Login rate-limited; uploads validated by type & 5 MB size cap.
- Central error handling hides internal errors.
- Secrets live in `.env` (never committed).

---

## 🧪 Tests

The backend was verified with an end-to-end test against a mocked Supabase client covering health, listing, search, featured/new arrivals, categories, book detail, chapter nav, auth (valid + invalid), book/chapter/featured/category CRUD, stats, progress, and delete — all passing on the flat build.

---

## 📄 License

MIT — free to use, expand, and deploy.
