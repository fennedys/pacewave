"use client"

import { useRouter } from "next/navigation"
import type { Book } from "@/lib/books"

export function BookCard({ book }: { book: Book }) {
  const router = useRouter()

  return (
    <div className="card fade show">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={book.cover || "/placeholder.svg"} loading="lazy" alt={`Cover of ${book.title}`} />
      <h3>{book.title}</h3>
      <p>{book.author}</p>
      <p className="rating">{"\u2605"} {book.rating}</p>
      <button
        className="btn"
        style={{ width: "100%", marginTop: 8 }}
        onClick={() => router.push(`/reader?id=${book.id}`)}
      >
        Read
      </button>
    </div>
  )
}
