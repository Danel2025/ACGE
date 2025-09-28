'use client'

import { useEffect, useState } from 'react'

export function useAuthClientSideEffect(callback: () => void, deps: any[]) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    if (!mounted) return
    callback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, ...deps])
}


