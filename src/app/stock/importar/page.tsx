'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ImportarProductos() {
  const [archivo, setArchivo] = useState<any>(null)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [mensaje, setMensaje] = useState('')

  async function descargarPlantilla() {
    try {
      const res = await fetch('/api/productos/importar')
      if (!res.ok) {
        setMensaje('Error al descargar la plantilla')
        return
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla_productos.csv'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch {
      setMensaje('Error al descargar la plantilla')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!archivo) {
      setMensaje('Por favor selecciona un archivo')
      return
    }

    setCargando(true)
    setMensaje('Cargando productos...')

    try {
      const formData = new FormData()
      formData.append('archivo', archivo)

      const res = await fetch('/api/productos/importar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje(`Error: ${data.error}`)
      } else {
        setResultado(data)
        setMensaje(
          `✅ Carga completada: ${data.exitosas} productos exitosos${
            data.errores.length > 0 ? `, ${data.errores.length} con errores` : ''
          }`
        )
      }
    } catch {
      setMensaje('Error al conectar con el servidor')
    } finally {
      setCargando(false)
      setArchivo(null)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Cargar Productos</h1>
        <Link href="/stock" className="text-white text-sm hover:underline">
          ← Volver
        </Link>
      </div>

      <div className="bg-white/95 rounded-lg p-4 shadow-md mb-4">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Instrucciones</h2>
        <p className="text-xs text-gray-700 mb-3">
          Descarga la plantilla CSV, complétala con tus productos y luego sube el archivo. El formato debe ser:
        </p>
        <div className="bg-gray-100 p-2 rounded text-xs font-mono text-gray-900 mb-3">
          codigo,nombre,precio,stock
          <br />
          123,Pan,2.50,50
        </div>
        <button
          onClick={descargarPlantilla}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-bold text-sm mb-3"
        >
          📥 Descargar plantilla
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/95 rounded-lg p-4 shadow-md mb-4">
        <label className="text-sm font-bold text-gray-900 block mb-2">Seleccionar archivo CSV</label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setArchivo(e.target.files?.[0])}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
          disabled={cargando}
        />

        {archivo && (
          <p className="text-xs text-gray-700 mt-2">
            Archivo: <span className="font-bold">{archivo.name}</span>
          </p>
        )}

        {mensaje && (
          <p
            className={`text-sm mt-3 p-2 rounded ${
              resultado?.exitosas ? 'bg-green-50 text-green-700 font-semibold' : 'bg-red-50 text-red-700 font-semibold'
            }`}
          >
            {mensaje}
          </p>
        )}

        <button
          type="submit"
          disabled={!archivo || cargando}
          className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg py-2 font-bold text-sm"
        >
          {cargando ? 'Cargando...' : '📤 Cargar productos'}
        </button>
      </form>

      {resultado?.errores && resultado.errores.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h3 className="text-sm font-bold text-red-700 mb-2">Errores encontrados:</h3>
          <div className="space-y-1">
            {resultado.errores.slice(0, 5).map((error: any, i: number) => (
              <div key={i} className="text-xs text-red-600">
                Línea {error.linea}: {error.error}
              </div>
            ))}
            {resultado.errores.length > 5 && (
              <div className="text-xs text-red-600">
                ... y {resultado.errores.length - 5} errores más
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
