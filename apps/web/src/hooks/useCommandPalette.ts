"use client"

import { useEffect, useState } from "react"

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        setOpen((prev) => !prev)
      }

      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", down)

    return () => {
      window.removeEventListener("keydown", down)
    }
  }, [])

  return {
    open,
    setOpen,
  }
}
