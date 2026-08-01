import { Suspense } from "react"
import { ReaderView } from "@/components/reader-view"

export default function ReaderPage() {
  return (
    <div className="reader-page">
      <Suspense fallback={<div className="wrap"><div className="reader">Loading...</div></div>}>
        <ReaderView />
      </Suspense>
    </div>
  )
}
