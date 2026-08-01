"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "@/lib/use-theme"

export function SiteHeader({ onOpenLibrary }: { onOpenLibrary?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { toggleTheme } = useTheme()
  const router = useRouter()

  return (
    <header className="site-header">
      <div className="container nav">
        <div className="logo">PaceWave</div>
        <nav className={`nav-links${menuOpen ? " show" : ""}`}>
          <Link href="/#home">Home</Link>
          <a
            role="button"
            tabIndex={0}
            onClick={() => {
              setMenuOpen(false)
              onOpenLibrary?.()
            }}
          >
            My Library
          </a>
        </nav>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" onClick={() => router.push("/reader?id=1")}>
            Read Now
          </button>
          <button
            onClick={toggleTheme}
            className="icon-btn"
            aria-label="Toggle theme"
          >
            {"\u{1F313}"}
          </button>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {"\u2630"}
          </button>
        </div>
      </div>
    </header>
  )
}
