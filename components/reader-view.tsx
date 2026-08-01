"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getBookById, getChapters, type Book, type Chapter } from "@/lib/books"
import { useTheme } from "@/lib/use-theme"

const FONT_MAP: Record<string, string> = {
  Inter: "var(--font-sans), system-ui, sans-serif",
  Georgia: "Georgia, serif",
  Merriweather: "Merriweather, Georgia, serif",
}

export function ReaderView() {
  const params = useSearchParams()
  const router = useRouter()
  const { toggle } = useTheme()

  const [book, setBook] = useState<Book | null | undefined>(undefined)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapterIndex, setChapterIndex] = useState(0)
  const [fontFamily, setFontFamily] = useState("Inter")
  const [fontSize, setFontSize] = useState(18)
  const [search, setSearch] = useState("")
  const [progress, setProgress] = useState(0)

  const textRef = useRef<HTMLDivElement>(null)

  // Load book by id from the shared store.
  useEffect(() => {
    const id = Number.parseInt(params.get("id") || "", 10)
    if (!id) {
      setBook(null)
      return
    }
    const b = getBookById(id)
    setBook(b ?? null)
    if (b) setChapters(getChapters(b))

    const savedSize = Number.parseInt(window.localStorage.getItem("fontSize") || "", 10)
    if (savedSize) setFontSize(savedSize)

    const reading = JSON.parse(window.localStorage.getItem("reading") || "{}")
    if (b && typeof reading[b.id] === "number") setChapterIndex(reading[b.id])
  }, [params])

  // Persist reading position.
  useEffect(() => {
    if (!book) return
    const reading = JSON.parse(window.localStorage.getItem("reading") || "{}")
    reading[book.id] = chapterIndex
    window.localStorage.setItem("reading", JSON.stringify(reading))
    window.scrollTo(0, 0)
  }, [book, chapterIndex])

  // Progress bar tied to scroll.
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0)
    }
    window.addEventListener("scroll", onScroll)
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [chapterIndex, book])

  function changeSize(size: number) {
    setFontSize(size)
    window.localStorage.setItem("fontSize", String(size))
  }

  const currentText = chapters[chapterIndex]?.content ?? ""
  const currentTitle = chapters[chapterIndex]?.title ?? `Chapter ${chapterIndex + 1}`

  // Highlight search matches without dangerouslySetInnerHTML.
  const renderedText = useMemo(() => {
    if (!search) return currentText
    const parts = currentText.split(new RegExp(`(${escapeRegExp(search)})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} style={{ background: "var(--purple)", color: "white", padding: "0 2px" }}>
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      ),
    )
  }, [currentText, search])

  if (book === undefined) {
    return (
      <div className="wrap">
        <div className="reader">Loading...</div>
      </div>
    )
  }

  if (book === null) {
    return (
      <div className="wrap">
        <div className="reader">
          <p>No book selected or book not found. Please return to the library.</p>
          <button className="rbtn" style={{ marginTop: 16 }} onClick={() => router.push("/")}>
            {"\u2190"} Back to Library
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="topbar">
        <div className="brand">PaceWave Reader</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="rbtn" onClick={toggle}>
            {"\u{1F313}"} Theme
          </button>
          <button className="rbtn" onClick={() => router.push("/")}>
            {"\u2190"} Back to Library
          </button>
        </div>
      </div>

      <div className="wrap">
        <div className="reader-header">
          <h2>{book.title}</h2>
          <p>
            by {book.author} {"\u2022"} {currentTitle}
          </p>
        </div>

        <div className="controls">
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} aria-label="Font family">
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
            aria-label="Font size"
          />
          <span style={{ padding: 8, color: "var(--muted)" }}>{fontSize}px</span>

          <input
            type="text"
            placeholder="Search in chapter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search in chapter"
          />
        </div>

        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <article className="reader">
          <div ref={textRef} style={{ fontFamily: FONT_MAP[fontFamily], fontSize: `${fontSize}px` }}>
            <p>{renderedText}</p>
          </div>
        </article>

        <div className="controls" style={{ marginTop: 30, justifyContent: "center" }}>
          <button
            className="rbtn"
            onClick={() => setChapterIndex((i) => Math.max(0, i - 1))}
            disabled={chapterIndex === 0}
          >
            {"\u2190"} Previous
          </button>
          <select
            value={chapterIndex}
            onChange={(e) => setChapterIndex(Number.parseInt(e.target.value, 10))}
            style={{ flex: 0.5 }}
            aria-label="Select chapter"
          >
            {chapters.map((c, i) => (
              <option key={i} value={i}>
                {c.title || `Chapter ${i + 1}`}
              </option>
            ))}
          </select>
          <button
            className="rbtn"
            onClick={() => setChapterIndex((i) => Math.min(chapters.length - 1, i + 1))}
            disabled={chapterIndex >= chapters.length - 1}
          >
            Next {"\u2192"}
          </button>
        </div>
      </div>
    </>
  )
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
