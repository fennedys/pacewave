-- =====================================================================
-- PaceWave Library - Supabase PostgreSQL Schema
-- =====================================================================
-- Run this SQL in the Supabase SQL Editor (Dashboard -> SQL -> New query).
-- It creates all tables, indexes, RLS policies, triggers and seed data.
-- =====================================================================

-- Enable UUID generation (built into Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1) CATEGORIES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

-- ---------------------------------------------------------------------
-- 2) ADMINS
-- This mirrors the Supabase `auth.users` table. We link the admin row to
-- the Supabase Auth user id so that admins log in via Supabase Auth and
-- the app can read extra metadata (name) from here.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL UNIQUE,
    name        TEXT,
    role        TEXT NOT NULL DEFAULT 'admin',          -- 'admin' | 'super'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (email);

-- ---------------------------------------------------------------------
-- 3) BOOKS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title          TEXT NOT NULL,
    author         TEXT NOT NULL,
    description    TEXT NOT NULL DEFAULT '',
    category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
    cover_url      TEXT,                                  -- URL in Supabase Storage
    is_featured    BOOLEAN NOT NULL DEFAULT false,
    is_new_arrival BOOLEAN NOT NULL DEFAULT false,
    views          INTEGER NOT NULL DEFAULT 0,            -- total read views
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_title      ON books (title);
CREATE INDEX IF NOT EXISTS idx_books_author     ON books (author);
CREATE INDEX IF NOT EXISTS idx_books_category   ON books (category_id);
CREATE INDEX IF NOT EXISTS idx_books_featured   ON books (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_books_newarrival ON books (is_new_arrival) WHERE is_new_arrival = true;
CREATE INDEX IF NOT EXISTS idx_books_created    ON books (created_at DESC);

-- ---------------------------------------------------------------------
-- 4) CHAPTERS
-- Chapters are stored as plain text in the database (not PDFs).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chapters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    content     TEXT NOT NULL DEFAULT '',
    chapter_no  INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (book_id, chapter_no)
);

CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters (book_id, chapter_no);

-- ---------------------------------------------------------------------
-- 5) FEATURED BOOKS (homepage "Featured" carousel / grid order)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS featured_books (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id    UUID NOT NULL UNIQUE REFERENCES books(id) ON DELETE CASCADE,
    position   INTEGER NOT NULL DEFAULT 0,                -- ordering on homepage
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_featured_position ON featured_books (position);

-- ---------------------------------------------------------------------
-- 6) READING PROGRESS
-- Tracks where a reader left off per book.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_progress (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reader_id   UUID,                                     -- public reader id (nullable)
    book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chapter_id  UUID REFERENCES chapters(id) ON DELETE SET NULL,
    progress_pct REAL NOT NULL DEFAULT 0,                 -- 0..100
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (reader_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_reader ON reading_progress (reader_id);
CREATE INDEX IF NOT EXISTS idx_progress_book   ON reading_progress (book_id);

-- ---------------------------------------------------------------------
-- AUTO-UPDATE `updated_at` TRIGGERS
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_books_updated    ON books;
DROP TRIGGER IF EXISTS trg_chapters_updated ON chapters;

CREATE TRIGGER trg_books_updated
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_chapters_updated
    BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------
-- VIEW STATISTICS: increment `books.views` every time a reader opens a book
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_book_views(p_book_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE books SET views = views + 1 WHERE id = p_book_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Public read access to everything needed by the website; write access is
-- ONLY allowed through the service role used by the backend (RLS is bypassed
-- by service_role). Anon / authenticated users cannot mutate library data.
-- ---------------------------------------------------------------------
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE books           ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters        ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_books  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Public SELECT for browsing the library
CREATE POLICY "Public read categories"       ON categories       FOR SELECT USING (true);
CREATE POLICY "Public read books"            ON books            FOR SELECT USING (true);
CREATE POLICY "Public read chapters"         ON chapters         FOR SELECT USING (true);
CREATE POLICY "Public read featured"         ON featured_books   FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE for public (the backend uses the service role key,
-- which bypasses RLS entirely). This is the strictest, safest default.

-- Admins may view their own admin row (for the dashboard user display).
CREATE POLICY "Admins view own profile" ON admins
    FOR SELECT USING (auth.uid() = id);

-- Reading progress: allow public insert/update by anyone (progress tracking is
-- non-sensitive). This keeps the reader experience working without an account.
CREATE POLICY "Public insert progress" ON reading_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update progress" ON reading_progress FOR UPDATE USING (true);
CREATE POLICY "Public read progress"   ON reading_progress FOR SELECT USING (true);

-- ---------------------------------------------------------------------
-- SEED DATA - categories
-- ---------------------------------------------------------------------
INSERT INTO categories (name, slug, description) VALUES
    ('Fiction',        'fiction',        'Novels and imaginative storytelling.'),
    ('Non-Fiction',    'non-fiction',    'Factual books on real events and topics.'),
    ('Science',        'science',        'Science, technology and discovery.'),
    ('Business',       'business',       'Entrepreneurship, leadership and money.'),
    ('Technology',     'technology',     'Coding, computers and digital life.'),
    ('Self-Help',      'self-help',      'Personal development and wellbeing.'),
    ('Fantasy',        'fantasy',        'Magic, myth and imaginary worlds.'),
    ('Biography',      'biography',      'The lives of remarkable people.')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- NOTE ON ADMIN CREATION
-- ---------------------------------------------------------------------
-- Create an admin in Supabase Auth first (Dashboard -> Authentication ->
-- Users -> Add user). Then grab that user's UUID and run:
--
--   INSERT INTO admins (id, email, name)
--   VALUES ('<AUTH_USER_UUID>', 'you@example.com', 'Your Name')
--   ON CONFLICT (id) DO NOTHING;
--
-- The backend's login endpoint will also auto-create the admin row on first
-- successful sign-in (see backend/controllers/auth.js).
-- =====================================================================
