"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

export function SiteFooter() {
  const router = useRouter()

  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <div className="logo">PaceWave</div>
          <p style={{ color: "var(--muted)", marginTop: 10 }}>
            Premium reading, redefined
            <button
              className="hidden-footer-btn"
              type="button"
              onClick={() => router.push("/admin")}
              aria-label="Open admin page"
            >
              .
            </button>
          </p>
        </div>
        <div>
          <h4>Company</h4>
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact Us</Link>
        </div>
        <div>
          <h4>Legal</h4>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms &amp; Conditions</Link>
        </div>
      </div>
      <p style={{ textAlign: "center", color: "var(--muted)", marginTop: 30 }}>
        {"\u00A9"} 2026 PaceWave. All rights reserved.
      </p>
    </footer>
  )
}
