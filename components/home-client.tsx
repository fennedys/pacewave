"use client"

import { useEffect, useRef, useState } from "react"
import { books, categories, type Book } from "@/lib/books"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookCard } from "@/components/book-card"

// Keep the admin dashboard in sync with the homepage catalog (same behaviour as the original site).
function syncDataToAdmin() {
  try {
    const adminCats = categories.map((cat, idx) => ({ id: idx + 1, name: cat }))
    const stats = {
      totalBooks: books.length,
      totalReads: 0,
      activeUsers: 247,
    }
    localStorage.setItem("pacewave_books", JSON.stringify(books))
    localStorage.setItem("pacewave_cats", JSON.stringify(adminCats))
    localStorage.setItem("pacewave_stats", JSON.stringify(stats))
  } catch {}
}

function Carousel({ items }: { items: Book[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let pos = 0
    const timer = setInterval(() => {
      pos += 220
      if (pos > el.scrollWidth) pos = 0
      el.scrollTo({ left: pos, behavior: "smooth" })
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="carousel" ref={ref}>
      {items.map((b) => (
        <BookCard key={b.id} book={b} />
      ))}
    </div>
  )
}

export function HomeClient() {
  const [floats, setFloats] = useState<{ left: string; top: string; delay: string }[]>([])
  const [showBackTop, setShowBackTop] = useState(false)

  // Books view (search results / category browsing)
  const [viewTitle, setViewTitle] = useState<string | null>(null)
  const [viewBooks, setViewBooks] = useState<Book[]>([])
  const [query, setQuery] = useState("")
  const booksViewRef = useRef<HTMLElement>(null)

  useEffect(() => {
    syncDataToAdmin()
    setFloats(
      Array.from({ length: 8 }, (_, i) => ({
        left: `${Math.random() * 90}%`,
        top: `${Math.random() * 90}%`,
        delay: `${i}s`,
      })),
    )
    const onScroll = () => setShowBackTop(window.scrollY > 400)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const showAllBooks = () => {
    setViewTitle("All Books")
    setViewBooks(books)
    setTimeout(() => booksViewRef.current?.scrollIntoView({ behavior: "smooth" }), 0)
  }

  const openCategory = (cat: string) => {
    setViewTitle(cat)
    setViewBooks(books.filter((b) => b.cat === cat))
    setTimeout(() => booksViewRef.current?.scrollIntoView({ behavior: "smooth" }), 0)
  }

  const liveSearch = (q: string) => {
    setQuery(q)
    if (!q) {
      setViewTitle(null)
      setViewBooks([])
      return
    }
    const lower = q.toLowerCase()
    const res = books.filter(
      (b) =>
        b.title.toLowerCase().includes(lower) ||
        b.author.toLowerCase().includes(lower) ||
        b.cat.toLowerCase().includes(lower),
    )
    setViewTitle("Search Results")
    setViewBooks(res)
  }

  return (
    <>
      <SiteHeader onOpenLibrary={showAllBooks} />

      <main id="app">
        {/* Hero */}
        <section className="hero" id="home">
          <div className="floating-books" aria-hidden="true">
            {floats.map((f, i) => (
              <div
                key={i}
                className="book-float"
                style={{ left: f.left, top: f.top, animationDelay: f.delay }}
              />
            ))}
          </div>
          <div className="container">
            <h1>Read at your own Pace</h1>
            <p>
              Discover thousands of premium books. Clean reading, zero
              distractions, full control.
            </p>
            <div className="search glass">
              <input
                type="text"
                value={query}
                placeholder="Search by title, author, or category..."
                onChange={(e) => liveSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    liveSearch(query)
                  }
                }}
              />
              <button
                className="enter-btn"
                onClick={() => liveSearch(query)}
                aria-label="Search"
                title="Search"
              >
                <span className="icon" aria-hidden="true">
                  {"\u{1F50E}"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="container">
          <h2 className="section-title">Featured Books</h2>
          <Carousel items={books.slice(0, 5)} />
        </section>

        {/* New Arrivals */}
        <section className="container">
          <h2 className="section-title">New Arrivals</h2>
          <Carousel items={books.slice(3)} />
        </section>

        {/* Categories */}
        <section className="container" id="categories">
          <h2 className="section-title">Browse Categories</h2>
          <div className="cat-grid">
            {categories.map((cat) => (
              <button
                key={cat}
                className="btn"
                type="button"
                onClick={() => openCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Books view / Search results */}
        {viewTitle && (
          <section className="container" id="booksView" ref={booksViewRef}>
            <h2 className="section-title">{viewTitle}</h2>
            {viewBooks.length > 0 ? (
              <div className="books-grid">
                {viewBooks.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--muted)" }}>No books found.</p>
            )}
          </section>
        )}
      </main>

      <SiteFooter />

      {showBackTop && (
        <button
          className="back-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          {"\u2191"}
        </button>
      )}
    </>
  )
}
