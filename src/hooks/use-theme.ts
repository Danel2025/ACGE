'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function useThemeHook() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? theme : 'system'
  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && systemTheme === 'dark')
  const isLight = currentTheme === 'light' || (currentTheme === 'system' && systemTheme === 'light')

  const toggleTheme = () => {
    if (currentTheme === 'light') {
      setTheme('dark')
    } else if (currentTheme === 'dark') {
      setTheme('light')
    } else {
      // Si c'est 'system', on bascule vers 'light'
      setTheme('light')
    }
  }

  const setLightTheme = () => setTheme('light')
  const setDarkTheme = () => setTheme('dark')
  const setSystemTheme = () => setTheme('system')

  return {
    theme: currentTheme,
    systemTheme,
    isDark,
    isLight,
    mounted,
    setTheme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
  }
}
