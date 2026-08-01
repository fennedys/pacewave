import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HomeView } from "@/components/home-view"
import { BackToTop } from "@/components/back-to-top"

export default function Page() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <HomeView />
      </Suspense>
      <SiteFooter />
      <BackToTop />
    </>
  )
}
