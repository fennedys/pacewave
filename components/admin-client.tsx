"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type AdminBook = {
  id: number
  title: string
  author: string
  category?: string | number
  cat?: string
  desc?: string
  chapters?: { title: string; content: string }[]
  featured?: boolean
  views?: number
  createdAt?: number
}

type Category = { id: number; name: string }

type Settings = {
  activeUsers?: number
  announcement?: string
  about?: string
  privacy?: string
  terms?: string
}

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: "\u{1F4CA}" },
  { id: "books", label: "Books", icon: "\u{1F4DA}" },
  { id: "categories", label: "Categories", icon: "\u{1F4C1}" },
  { id: "homepage", label: "Homepage", icon: "\u{1F3E0}" },
  { id: "search", label: "Search", icon: "\u{1F50D}" },
  { id: "analytics", label: "Analytics", icon: "\u{1F4C8}" },
  { id: "content", label: "Content", icon: "\u{1F4DD}" },
  { id: "backup", label: "Backup", icon: "\u{1F4BE}" },
]

export function AdminClient() {
  const [books, setBooks] = useState<AdminBook[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [settings, setSettings] = useState<Settings>({})
  const [section, setSection] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [lastRebuild, setLastRebuild] = useState("Never")
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Book form state
  const [form, setForm] = useState({
    title: "",
    author: "",
    category: "",
    desc: "",
    featured: false,
  })
  const [chapters, setChapters] = useState<{ title: string; content: string }[]>([
    { title: "", content: "" },
  ])
  const [catName, setCatName] = useState("")

  // Content forms
  const [about, setAbout] = useState("PaceWave is your digital reading library...")
  const [privacy, setPrivacy] = useState("Your privacy is important to us...")
  const [terms, setTerms] = useState("By using PaceWave, you agree to...")
  const [announcement, setAnnouncement] = useState("")

  // Load from localStorage on mount.
  useEffect(() => {
    try {
      const b = JSON.parse(localStorage.getItem("pacewave_books") || "[]")
      const c = JSON.parse(localStorage.getItem("pacewave_cats") || "[]")
      const s = JSON.parse(localStorage.getItem("pacewave_settings") || "{}")
      const stats = JSON.parse(localStorage.getItem("pacewave_stats") || "{}")
      setBooks(Array.isArray(b) ? b : [])
      setCategories(Array.isArray(c) ? c : [])
      setSettings({ ...s, activeUsers: s.activeUsers ?? stats.activeUsers })
      setAnnouncement(s.announcement || "")
      if (s.about) setAbout(s.about)
      if (s.privacy) setPrivacy(s.privacy)
      if (s.terms) setTerms(s.terms)
    } catch {}
  }, [])

  const showToast = (msg = "Saved successfully!") => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2000)
  }

  const persist = (
    nextBooks = books,
    nextCats = categories,
    nextSettings = settings,
  ) => {
    try {
      localStorage.setItem("pacewave_books", JSON.stringify(nextBooks))
      localStorage.setItem("pacewave_cats", JSON.stringify(nextCats))
      localStorage.setItem("pacewave_settings", JSON.stringify(nextSettings))
    } catch {}
    showToast()
  }

  const getCatName = (id: string | number | undefined) => {
    const c = categories.find((x) => String(x.id) === String(id))
    return c ? c.name : "-"
  }

  const totalViews = useMemo(
    () => books.reduce((a, b) => a + (b.views || 0), 0),
    [books],
  )

  const addChapterField = () =>
    setChapters((prev) => [...prev, { title: "", content: "" }])

  const updateChapter = (idx: number, key: "title" | "content", value: string) =>
    setChapters((prev) =>
      prev.map((ch, i) => (i === idx ? { ...ch, [key]: value } : ch)),
    )

  const addBook = () => {
    if (!form.title || !form.author) {
      alert("Please fill title and author")
      return
    }
    const book: AdminBook = {
      id: Date.now(),
      title: form.title,
      author: form.author,
      category: form.category,
      desc: form.desc,
      chapters: chapters.filter((ch) => ch.title || ch.content),
      featured: form.featured,
      views: Math.floor(Math.random() * 500),
      createdAt: Date.now(),
    }
    const next = [...books, book]
    setBooks(next)
    persist(next)
    setForm({ title: "", author: "", category: "", desc: "", featured: false })
    setChapters([{ title: "", content: "" }])
  }

  const deleteBook = (id: number) => {
    if (!confirm("Delete this book?")) return
    const next = books.filter((b) => b.id !== id)
    setBooks(next)
    persist(next)
  }

  const addCategory = () => {
    if (!catName) {
      alert("Enter category name")
      return
    }
    const next = [...categories, { id: Date.now(), name: catName }]
    setCategories(next)
    setCatName("")
    persist(books, next)
  }

  const deleteCat = (id: number) => {
    if (!confirm("Delete category?")) return
    const next = categories.filter((c) => c.id !== id)
    setCategories(next)
    persist(books, next)
  }

  const saveAnnouncement = () => {
    const next = { ...settings, announcement }
    setSettings(next)
    persist(books, categories, next)
  }

  const saveContent = (key: "about" | "privacy" | "terms", value: string) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    persist(books, categories, next)
  }

  const rebuildIndex = () => {
    setLastRebuild(new Date().toLocaleString())
    showToast()
  }

  const exportData = () => {
    const data = { books, categories, settings }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pacewave_backup_${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showToast()
  }

  const featuredBooks = books.filter((b) => b.featured)
  const recentBooks = [...books].slice(-5).reverse()

  const navigate = (id: string) => {
    setSection(id)
    if (typeof window !== "undefined" && window.innerWidth < 768) setSidebarOpen(false)
  }

  return (
    <div className="admin-body">
      <button className="admin-menu-toggle" onClick={() => setSidebarOpen((v) => !v)}>
        {"\u2630"}
      </button>

      <div className={`sidebar${sidebarOpen ? " show" : ""}`}>
        <h2>PaceWave Admin</h2>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            className={section === s.id ? "active" : ""}
            onClick={() => navigate(s.id)}
          >
            {s.icon} {s.label}
          </a>
        ))}
      </div>

      <div className="admin-main">
        {/* DASHBOARD */}
        {section === "dashboard" && (
          <>
            <div className="admin-topbar">
              <h1>Dashboard</h1>
            </div>
            <div className="grid grid-4">
              <div className="stat-card">
                <b>{books.length}</b>
                <div>Total Books</div>
              </div>
              <div className="stat-card">
                <b>{categories.length}</b>
                <div>Total Categories</div>
              </div>
              <div className="stat-card">
                <b>{totalViews}</b>
                <div>Total Reads</div>
              </div>
              <div className="stat-card">
                <b>{settings.activeUsers || 0}</b>
                <div>Active Users</div>
              </div>
            </div>
            <div className="admin-card">
              <h3>Quick Actions</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <button className="admin-btn" onClick={() => navigate("books")}>
                  + Add Book
                </button>
                <button className="admin-btn btn-secondary" onClick={() => navigate("categories")}>
                  + Add Category
                </button>
                <button className="admin-btn btn-secondary" onClick={rebuildIndex}>
                  Rebuild Search Index
                </button>
                <button className="admin-btn btn-secondary" onClick={exportData}>
                  Export Data
                </button>
              </div>
            </div>
            <div className="admin-card">
              <h3>Recently Added Books</h3>
              <table>
                <tbody>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                  </tr>
                  {recentBooks.map((b) => (
                    <tr key={b.id}>
                      <td>{b.title}</td>
                      <td>{b.author}</td>
                      <td>{b.cat || getCatName(b.category)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* BOOKS */}
        {section === "books" && (
          <>
            <div className="admin-topbar">
              <h1>Book Management</h1>
            </div>
            <div className="admin-card">
              <h3>Add New Book</h3>
              <label>
                Book Title
                <input
                  value={form.title}
                  placeholder="The Great Novel"
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label>
                Author
                <input
                  value={form.author}
                  placeholder="John Doe"
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </label>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Description
                <textarea
                  value={form.desc}
                  placeholder="Book description..."
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                />
              </label>

              <h4 style={{ marginTop: 16 }}>Chapters</h4>
              {chapters.map((ch, i) => (
                <div className="chapter-block" key={i}>
                  <label>
                    Chapter {i + 1} Title
                    <input
                      value={ch.title}
                      placeholder="Chapter title"
                      onChange={(e) => updateChapter(i, "title", e.target.value)}
                    />
                  </label>
                  <label>
                    Chapter Content
                    <textarea
                      value={ch.content}
                      placeholder="Paste chapter text here..."
                      onChange={(e) => updateChapter(i, "content", e.target.value)}
                    />
                  </label>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn btn-secondary"
                style={{ marginTop: 10 }}
                onClick={addChapterField}
              >
                + Add Chapter
              </button>

              <div className="toggle">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
                <label style={{ margin: 0 }}>Mark as Featured</label>
              </div>
              <button className="admin-btn" onClick={addBook} style={{ marginTop: 16 }}>
                Add Book
              </button>
            </div>

            <div className="admin-card">
              <h3>All Books</h3>
              <table>
                <tbody>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                  {books.map((b) => (
                    <tr key={b.id}>
                      <td>{b.title}</td>
                      <td>{b.author}</td>
                      <td>{b.cat || getCatName(b.category)}</td>
                      <td>{b.featured ? <span className="badge">Featured</span> : ""}</td>
                      <td>
                        <button className="admin-btn btn-danger" onClick={() => deleteBook(b.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* CATEGORIES */}
        {section === "categories" && (
          <>
            <div className="admin-topbar">
              <h1>Category Management</h1>
            </div>
            <div className="admin-card">
              <h3>Add Category</h3>
              <input
                value={catName}
                placeholder="Category name"
                onChange={(e) => setCatName(e.target.value)}
              />
              <button className="admin-btn" style={{ marginTop: 12 }} onClick={addCategory}>
                Create Category
              </button>
            </div>
            <div className="admin-card">
              <table>
                <tbody>
                  <tr>
                    <th>Category Name</th>
                    <th>Books</th>
                    <th>Actions</th>
                  </tr>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{books.filter((b) => String(b.category) === String(c.id)).length}</td>
                      <td>
                        <button className="admin-btn btn-danger" onClick={() => deleteCat(c.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* HOMEPAGE */}
        {section === "homepage" && (
          <>
            <div className="admin-topbar">
              <h1>Homepage Management</h1>
            </div>
            <div className="admin-card">
              <h3>Featured Books</h3>
              <p style={{ color: "var(--muted)", marginBottom: 12 }}>
                Books marked as featured in Books section
              </p>
              {featuredBooks.length ? (
                featuredBooks.map((b) => (
                  <p key={b.id}>
                    {"\u2B50"} {b.title} by {b.author}
                  </p>
                ))
              ) : (
                <p style={{ color: "var(--muted)" }}>No featured books</p>
              )}
            </div>
            <div className="admin-card">
              <h3>New Arrivals</h3>
              <p style={{ color: "var(--muted)", marginBottom: 12 }}>Last 5 books added</p>
              {recentBooks.length ? (
                recentBooks.map((b) => (
                  <p key={b.id}>
                    {"\u{1F195}"} {b.title} by {b.author}
                  </p>
                ))
              ) : (
                <p style={{ color: "var(--muted)" }}>No books yet</p>
              )}
            </div>
            <div className="admin-card">
              <h3>Homepage Announcement</h3>
              <textarea
                value={announcement}
                placeholder="New books added this week!"
                onChange={(e) => setAnnouncement(e.target.value)}
              />
              <button className="admin-btn" style={{ marginTop: 12 }} onClick={saveAnnouncement}>
                Update Announcement
              </button>
            </div>
          </>
        )}

        {/* SEARCH */}
        {section === "search" && (
          <>
            <div className="admin-topbar">
              <h1>Search Management</h1>
            </div>
            <div className="admin-card">
              <h3>Search Index</h3>
              <button className="admin-btn" onClick={rebuildIndex}>
                Rebuild Search Index
              </button>
              <p style={{ color: "var(--muted)", marginTop: 12 }}>
                Last rebuilt: <span>{lastRebuild}</span>
              </p>
            </div>
            <div className="admin-card">
              <h3>Search Settings</h3>
              <div className="toggle">
                <input type="checkbox" defaultChecked />
                <label style={{ margin: 0 }}>Search in Book Titles</label>
              </div>
              <div className="toggle">
                <input type="checkbox" defaultChecked />
                <label style={{ margin: 0 }}>Search in Authors</label>
              </div>
              <div className="toggle">
                <input type="checkbox" />
                <label style={{ margin: 0 }}>Search in Descriptions</label>
              </div>
            </div>
          </>
        )}

        {/* ANALYTICS */}
        {section === "analytics" && (
          <>
            <div className="admin-topbar">
              <h1>Reading Analytics</h1>
            </div>
            <div className="grid grid-2">
              <div className="admin-card">
                <h3>Most Read Books</h3>
                {[...books]
                  .sort((a, b) => (b.views || 0) - (a.views || 0))
                  .slice(0, 5)
                  .map((b) => (
                    <p key={b.id} style={{ marginTop: 8 }}>
                      {b.title} <span className="badge">{b.views || 0} reads</span>
                    </p>
                  ))}
                {books.length === 0 && <p style={{ color: "var(--muted)" }}>No data</p>}
              </div>
              <div className="admin-card">
                <h3>Category Distribution</h3>
                {categories.map((c) => (
                  <p key={c.id} style={{ marginTop: 8 }}>
                    {c.name}: {books.filter((b) => String(b.category) === String(c.id)).length}
                  </p>
                ))}
                {categories.length === 0 && <p style={{ color: "var(--muted)" }}>No data</p>}
              </div>
            </div>
            <div className="admin-card">
              <h3>Daily Reads</h3>
              <p style={{ color: "var(--muted)" }}>
                Total recorded reads: {totalViews}
              </p>
            </div>
          </>
        )}

        {/* CONTENT */}
        {section === "content" && (
          <>
            <div className="admin-topbar">
              <h1>Website Content</h1>
            </div>
            <div className="admin-card">
              <h3>About Us</h3>
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} />
              <button
                className="admin-btn"
                style={{ marginTop: 12 }}
                onClick={() => saveContent("about", about)}
              >
                Save
              </button>
            </div>
            <div className="admin-card">
              <h3>Privacy Policy</h3>
              <textarea value={privacy} onChange={(e) => setPrivacy(e.target.value)} />
              <button
                className="admin-btn"
                style={{ marginTop: 12 }}
                onClick={() => saveContent("privacy", privacy)}
              >
                Save
              </button>
            </div>
            <div className="admin-card">
              <h3>Terms of Service</h3>
              <textarea value={terms} onChange={(e) => setTerms(e.target.value)} />
              <button
                className="admin-btn"
                style={{ marginTop: 12 }}
                onClick={() => saveContent("terms", terms)}
              >
                Save
              </button>
            </div>
          </>
        )}

        {/* BACKUP */}
        {section === "backup" && (
          <>
            <div className="admin-topbar">
              <h1>Backup &amp; Restore</h1>
            </div>
            <div className="admin-card">
              <h3>Export Data</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <button className="admin-btn" onClick={exportData}>
                  Export Library Data
                </button>
                <button
                  className="admin-btn btn-secondary"
                  onClick={() => alert("Books backup exported")}
                >
                  Backup Books
                </button>
              </div>
            </div>
            <div className="admin-card">
              <h3>Restore</h3>
              <input type="file" accept=".json" />
              <button
                className="admin-btn btn-danger"
                style={{ marginTop: 12 }}
                onClick={() => alert("Restore feature: Upload JSON backup file")}
              >
                Restore From Backup
              </button>
            </div>
          </>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
