import { Suspense } from "react"
import { ReaderClient } from "@/components/reader-client"

export default function ReaderPage() {
  return (
    <Suspense fallback={<div className="reader-wrap">Loading...</div>}>
      <ReaderClient />
    </Suspense>
  )
}
