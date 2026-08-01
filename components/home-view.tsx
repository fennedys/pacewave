"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { getBooks, getCategories, type Book, type Category } from "@/lib/books"
import { BookCard } from "@/components/book-card"

type ViewState = { visible: boolean; title: string; list: Book[] }

export function HomeView() {
  const params = useSearchParams()
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [query, setQuery] = useState("")
  const [view, setView] = useState<ViewState>({ visible: false, title: "All Books", list: [] })

  const featuredRef = useRef<HTMLDivElement>(null)
  const newRef = useRef<HTMLDivElement>(null)
  const booksViewRef = useRef<HTMLDivElement>(null)

  // Load data from the shared localStorage-backed store.
  useEffect(() => {
    const b = getBooks()
    setBooks(b)
    setCategories(getCategories())
    if (params.get("view") === "all") {
      setView({ visible: true, title: "All Books", list: b })
      setTimeout(() => booksViewRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [params])

  const featured = useMemo(() => {
    const f = books.filter((b) => b.featured)
    return (f.length ? f : books).slice(0, 5)
  }, [books])
  const newArrivals = useMemo(() => books.slice(-5).reverse(), [books])

  // Auto-scroll carousels.
  useEffect(() => {
    if (!books.length) return
    const timers: ReturnType<typeof setInterval>[] = []
    for (const ref of [featuredRef, newRef]) {
      let pos = 0
      const el = ref.current
      if (!el) continue
      timers.push(
        setInterval(() => {
          pos += 220
          if (pos > el.scrollWidth) pos = 0
          el.scrollTo({ left: pos, behavior: "smooth" })
        }, 4000),
      )
    }
    return () => timers.forEach(clearInterval)
  }, [books])

  // Fade-in on scroll.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("show")),
      { threshold: 0.1 },
    )
    document.querySelectorAll(".fade").forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [books, view])

  const floatSeeds = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({ left: Math.random() * 90, top: Math.random() * 90, delay: i })),
    [],
  )

  function liveSearch(q: string) {
    setQuery(q)
    if (!q) {
      setView((v) => ({ ...v, visible: false }))
      return
    }
    const ql = q.toLowerCase()
    const res = books.filter(
      (b) =>
        b.title.toLowerCase().includes(ql) ||
        b.author.toLowerCase().includes(ql) ||
        b.cat.toLowerCase().includes(ql),
    )
    setView({ visible: true, title: "Search Results", list: res })
  }

  function openCategory(cat: string) {
    setView({ visible: true, title: cat, list: books.filter((b) => b.cat === cat) })
    setTimeout(() => booksViewRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  return (
    <main>
      {/* Hero */}
      <section className="hero" id="home">
        <div className="floating-books" aria-hidden="true">
          {floatSeeds.map((f, i) => (
            <div
              key={i}
              className="book-float"
              style={{ left: `${f.left}%`, top: `${f.top}%`, animationDelay: `${f.delay}s` }}
            />
          ))}
        </div>
        <div className="container">
          <h1>Read at your own Pace</h1>
          <p>Discover thousands of premium books. Clean reading, zero distractions, full control.</p>
          <div className="search glass">
            <label htmlFor="searchInput" className="sr-only" style={{ position: "absolute", left: -9999 }}>
              Search books
            </label>
            <input
              id="searchInput"
              type="text"
              placeholder="Search by title, author, or category..."
              value={query}
              onChange={(e) => liveSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) liveSearch(query)
              }}
            />
            <button className="enter-btn" onClick={() => liveSearch(query)} aria-label="Search" title="Search">
              <span aria-hidden="true">{"\u{1F50E}"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container fade">
        <h2 className="section-title">Featured Books</h2>
        <div className="carousel" ref={featuredRef}>
          {featured.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="container fade">
        <h2 className="section-title">New Arrivals</h2>
        <div className="carousel" ref={newRef}>
          {newArrivals.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container fade" id="categories">
        <h2 className="section-title">Browse Categories</h2>
        <div className="cat-grid">
          {categories.map((c) => (
            <button key={c.id} className="btn" type="button" onClick={() => openCategory(c.name)}>
              {c.name}
            </button>
          ))}
        </div>
      </section>

      {/* Books view */}
      {view.visible && (
        <section className="container fade show" ref={booksViewRef}>
          <h2 className="section-title">{view.title}</h2>
          {view.list.length ? (
            <div className="carousel books-grid">
              {view.list.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--muted)" }}>No books found.</p>
          )}
        </section>
      )}
    </main>
  )
}
