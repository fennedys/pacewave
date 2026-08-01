"use client"

import { useCallback, useEffect, useState } from "react"

export function useTheme() {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"))
  }, [])

  const toggleTheme = useCallback(() => {
    const nowLight = document.documentElement.classList.toggle("light")
    try {
      localStorage.setItem("theme", nowLight ? "light" : "dark")
    } catch {}
    setIsLight(nowLight)
  }, [])

  return { isLight, toggleTheme }
}
