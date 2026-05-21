'use client'

import { useEffect } from 'react'

export const THEME_KEY = 'job-tracker-theme'

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(THEME_KEY, theme)
}

export default function ThemeHydrator() {
  useEffect(() => {
    const theme = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    applyTheme(theme)
  }, [])

  return null
}
