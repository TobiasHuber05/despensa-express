'use client'

import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function EscanerCodigoBarras({ onDetectado, onCerrar }) {
  const scannerRef = useRef(null)
  const corriendoRef = useRef(false)
  const detectadoRef = useRef(false)
  const contenedorId = 'lector-codigo-barras'

  useEffect(() => {
    const scanner = new Html5Qrcode(contenedorId)
    scannerRef.current = scanner
    detectadoRef.current = false

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (textoDecodificado) => {
          if (detectadoRef.current) return
          detectadoRef.current = true
          onDetectado(textoDecodificado)
        },
        () => {
          // Se llama constantemente cuando NO detecta nada, no hace falta hacer nada acá
        }
      )
      .then(() => {
        corriendoRef.current = true
      })
      .catch((error) => {
        console.error('No se pudo iniciar la cámara:', error)
      })

    return () => {
      const scannerActual = scannerRef.current
      if (scannerActual && corriendoRef.current) {
        corriendoRef.current = false
        scannerActual
          .stop()
          .then(() => scannerActual.clear())
          .catch(() => {})
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4">
        <span className="text-white font-medium">Escanear código de barras</span>
        <button onClick={onCerrar} className="text-white text-2xl px-2">
          ×
        </button>
      </div>
      <div id={contenedorId} className="flex-1" />
    </div>
  )
}