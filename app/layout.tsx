import type { Metadata, Viewport } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "PaceWave - Modern Digital Reading Platform",
  description:
    "PaceWave: Premium digital reading library with a smooth experience, dark mode, and curated books.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0c10",
}

// Apply the saved theme before paint to avoid a flash of the wrong theme.
const themeScript = `
(function(){
  try {
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
