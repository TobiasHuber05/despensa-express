'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Solo activar el Service Worker en producción, nunca en desarrollo local
    if (process.env.NODE_ENV !== 'production') return

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return null
}