"use client"

import { useEffect, useState } from "react"

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const saved = window.localStorage.getItem("theme")
    const isLight = saved === "light"
    setTheme(isLight ? "light" : "dark")
    document.documentElement.classList.toggle("light", isLight)
  }, [])

  const toggle = () => {
    const next = document.documentElement.classList.toggle("light") ? "light" : "dark"
    window.localStorage.setItem("theme", next)
    setTheme(next as "dark" | "light")
  }

  return { theme, toggle }
}
