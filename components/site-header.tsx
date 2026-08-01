"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useTheme } from "@/lib/use-theme"

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const { toggle } = useTheme()
  const router = useRouter()

  return (
    <header>
      <div className="container nav">
        <Link href="/" className="logo">
          PaceWave
        </Link>
        <nav className={`nav-links${open ? " show" : ""}`}>
          <Link href="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          <Link href="/?view=all" onClick={() => setOpen(false)}>
            My Library
          </Link>
          <Link href="/about" onClick={() => setOpen(false)}>
            About
          </Link>
        </nav>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn" onClick={() => router.push("/reader?id=1")}>
            Read Now
          </button>
          <button onClick={toggle} className="icon-btn" aria-label="Toggle theme" title="Toggle theme">
            {"\u{1F313}"}
          </button>
          <button
            className="menu-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {"\u2630"}
          </button>
        </div>
      </div>
    </header>
  )
}
