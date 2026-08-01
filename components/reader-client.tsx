"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getBookById } from "@/lib/books"
import { useTheme } from "@/lib/use-theme"

const CHAPTERS = 5
const FONT_MAP: Record<string, string> = {
  Inter: "var(--font-sans)",
  Georgia: "Georgia, serif",
  Merriweather: "Merriweather, serif",
}

// Highlight search matches without dangerouslySetInnerHTML.
function highlight(text: string, query: string) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="search-hit">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export function ReaderClient() {
  const router = useRouter()
  const params = useSearchParams()
  const { toggleTheme } = useTheme()

  const bookId = Number.parseInt(params.get("id") || "", 10)
  const book = useMemo(() => (Number.isNaN(bookId) ? undefined : getBookById(bookId)), [bookId])

  const [chapter, setChapter] = useState(0)
  const [fontKey, setFontKey] = useState("Inter")
  const [fontSize, setFontSize] = useState(18)
  const [search, setSearch] = useState("")
  const [progress, setProgress] = useState(0)
  const textRef = useRef<HTMLDivElement>(null)

  // Load saved font size preference.
  useEffect(() => {
    try {
      const saved = Number.parseInt(localStorage.getItem("fontSize") || "", 10)
      if (!Number.isNaN(saved)) setFontSize(saved)
    } catch {}
  }, [])

  // Persist reading progress per book.
  useEffect(() => {
    if (!book) return
    try {
      const reading = JSON.parse(localStorage.getItem("reading") || "{}")
      reading[book.id] = chapter
      localStorage.setItem("reading", JSON.stringify(reading))
    } catch {}
    window.scrollTo(0, 0)
  }, [book, chapter])

  // Scroll progress bar.
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0)
    }
    window.addEventListener("scroll", onScroll)
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [chapter])

  const chapterText = useMemo(() => {
    if (!book) return ""
    const size = book.content.length / CHAPTERS
    return book.content.substring(chapter * size, (chapter + 1) * size)
  }, [book, chapter])

  const changeSize = (size: number) => {
    setFontSize(size)
    try {
      localStorage.setItem("fontSize", String(size))
    } catch {}
  }

  return (
    <>
      <div className="reader-topbar">
        <div className="reader-brand">PaceWave Reader</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="reader-btn" onClick={toggleTheme}>
            {"\u{1F313}"} Theme
          </button>
          <button className="reader-btn" onClick={() => router.push("/")}>
            {"\u2190"} Back to Library
          </button>
        </div>
      </div>

      <div className="reader-wrap">
        <div className="reader-header">
          <h2>{book ? book.title : "Book not found"}</h2>
          <p>
            {book
              ? `by ${book.author} \u2022 Chapter ${chapter + 1}`
              : "Please return to the library."}
          </p>
        </div>

        {book && (
          <>
            <div className="reader-controls">
              <select value={fontKey} onChange={(e) => setFontKey(e.target.value)}>
                <option value="Inter">Inter</option>
                <option value="Georgia">Georgia</option>
                <option value="Merriweather">Merriweather</option>
              </select>

              <input
                type="range"
                min={14}
                max={26}
                value={fontSize}
                onChange={(e) => changeSize(Number.parseInt(e.target.value, 10))}
                style={{ width: "auto" }}
              />
              <span style={{ padding: 8, color: "var(--muted)" }}>{fontSize}px</span>

              <input
                type="text"
                placeholder="Search in chapter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="reader-progress">
              <div style={{ width: `${progress}%` }} />
            </div>

            <article className="reader-article">
              <div
                ref={textRef}
                style={{ fontFamily: FONT_MAP[fontKey], fontSize: `${fontSize}px` }}
              >
                <p>{highlight(chapterText, search)}</p>
              </div>
            </article>

            <div className="reader-controls" style={{ marginTop: 30, justifyContent: "center" }}>
              <button
                className="reader-btn"
                onClick={() => setChapter((c) => Math.max(0, c - 1))}
              >
                {"\u2190"} Previous
              </button>
              <select
                value={chapter}
                onChange={(e) => setChapter(Number.parseInt(e.target.value, 10))}
                style={{ flex: 0.5 }}
              >
                {Array.from({ length: CHAPTERS }, (_, i) => (
                  <option key={i} value={i}>
                    Chapter {i + 1}
                  </option>
                ))}
              </select>
              <button
                className="reader-btn"
                onClick={() => setChapter((c) => Math.min(CHAPTERS - 1, c + 1))}
              >
                Next {"\u2192"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
