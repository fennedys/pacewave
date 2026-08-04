# PaceWave Library — API Documentation

Base URL (local): `http://localhost:4000/api`

All JSON. Admin-protected endpoints require the header:

```
Authorization: Bearer <access_token>
```

---

## Authentication (`/api/auth`)

### POST `/auth/login`
Admin login. **Public**
```json
{ "email": "admin@pacewave.com", "password": "secret" }
```
**200 →**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "admin": { "id": "...", "email": "...", "name": "...", "role": "admin" }
}
```

### POST `/auth/refresh`
Refresh a session. **Public**
```json
{ "refresh_token": "eyJ..." }
```

### GET `/auth/me`
Current admin profile. **Protected**

### POST `/auth/logout`
Sign out. **Protected**

---

## Books (`/api/books`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/books` | Public | List books. Query: `category`, `search`, `featured`, `newArrival`, `page`, `per_page` |
| GET | `/books/featured` | Public | Homepage featured carousel |
| GET | `/books/new-arrivals` | Public | New arrivals. Query: `limit` |
| GET | `/books/search?q=` | Public | Quick search by title/author/category |
| GET | `/books/:id` | Public | Book detail + chapters (increments views) |
| GET | `/books/:bookId/chapters` | Public | All chapters of a book |
| GET | `/books/:bookId/chapters/:chapterNo` | Public | Chapter by number + prev/next nav |
| POST | `/books` | Protected | Create book (multipart, optional `cover` file) |
| PUT | `/books/:id` | Protected | Update book (multipart, optional `cover`) |
| DELETE | `/books/:id` | Protected | Delete book + chapters + cover |
| POST | `/books/:id/view` | Protected | Manually increment views |
| POST | `/books/:bookId/chapters` | Protected | Add chapter to book |

**Create/Update book form fields** (multipart/form-data):
- `title` (required), `author` (required), `description`, `category_id`, `is_featured` (`true`/`false`), `is_new_arrival`, `cover` (image file, ≤5 MB)

**List example:**
```
GET /api/books?category=<uuid>&search=space&featured=true&page=1&per_page=12
```

---

## Chapters (`/api/chapters`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/chapters/:id` | Public | Single chapter |
| PUT | `/chapters/:id` | Protected | Update title/content/chapter_no |
| DELETE | `/chapters/:id` | Protected | Delete chapter |

---

## Categories (`/api/categories`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/categories` | Public | List. Query: `with_books=true` for counts |
| GET | `/categories/:id` | Public | Single category |
| POST | `/categories` | Protected | Create `{ name, description }` |
| PUT | `/categories/:id` | Protected | Update |
| DELETE | `/categories/:id` | Protected | Delete |

---

## Featured (`/api/featured`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/featured` | Public | List featured books in order |
| POST | `/featured` | Protected | Add `{ book_id, position }` |
| PUT | `/featured/reorder` | Protected | Reorder `{ order: [bookId, ...] }` |
| DELETE | `/featured/:bookId` | Protected | Remove from featured |

---

## Reading Progress (`/api/progress`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PUT | `/progress/:bookId` | Public | Save `{ reader_id, chapter_id, progress_pct }` |
| GET | `/progress/:bookId?reader_id=` | Public | Get progress |

---

## Statistics (`/api/admin/stats`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Protected | Dashboard numbers + recent books |

**200 →**
```json
{
  "stats": {
    "total_books": 24,
    "total_categories": 8,
    "total_readers": 312,
    "total_views": 4120,
    "featured_count": 5,
    "new_arrivals_count": 4
  },
  "recent_books": [ { "id": "...", "title": "...", "...": "..." } ]
}
```

---

## Error format
All errors return:
```json
{ "error": "Human readable message", "details": "optional" }
```
Status codes: `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict, `500` server error.
