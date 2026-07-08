'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Spinner from '@/components/Spinner'
import { formatearMoneda } from '@/lib/formato'

export default function CierreCaja() {
  const [cierres, setCierres] = useState([])
  const [cargando, setCargando] = useState(true)
  const [montoEfectivo, setMontoEfectivo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  useEffect(() => {
    let montado = true
    async function cargar() {
      try {
        const res = await fetch('/api/cierre-caja')
        const data = await res.json()
        if (montado) setCierres(Array.isArray(data) ? data : [])
      } catch {
        if (montado) setCierres([])
      } finally {
        if (montado) setCargando(false)
      }
    }
    cargar()
    return () => { montado = false }
  }, [])

  async function realizarCierre(e: React.FormEvent) {
    e.preventDefault()
    setMensaje('Creando cierre de caja...')

    try {
      const res = await fetch('/api/cierre-caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montoEfectivo: parseFloat(montoEfectivo),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje(`Error: ${data.error}`)
        return
      }

      setMensaje('Cierre de caja realizado correctamente')
      setMontoEfectivo('')
      setMostrarFormulario(false)

      try {
        const resCierres = await fetch('/api/cierre-caja')
        const nuevosCierres = await resCierres.json()
        setCierres(Array.isArray(nuevosCierres) ? nuevosCierres : [])
      } catch {

      }
    } catch {
      setMensaje('Error al crear cierre de caja')
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Cierre de Caja</h1>
        <Link href="/" className="text-white text-sm hover:underline">
          ← Volver
        </Link>
      </div>

      {!mostrarFormulario && (
        <button
          onClick={() => setMostrarFormulario(true)}
          className="w-full mb-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3 font-bold active:scale-95 transition shadow-lg"
        >
          + Realizar cierre de hoy
        </button>
      )}

      {mostrarFormulario && (
        <div className="mb-4 bg-white/95 rounded-lg p-4 shadow-md">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Cierre de Caja</h2>
          <form onSubmit={realizarCierre} className="space-y-3">
            <div>
              <label className="text-sm font-bold text-gray-700 block mb-1">
                Monto en efectivo en caja
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={montoEfectivo}
                onChange={(e) => setMontoEfectivo(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {mensaje && (
              <p className="text-sm text-green-600 font-semibold bg-green-50 p-2 rounded">
                {mensaje}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false)
                  setMensaje('')
                }}
                className="flex-1 bg-gray-400 text-white rounded-lg py-2 font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 font-bold text-sm"
              >
                Cerrar caja
              </button>
            </div>
          </form>
        </div>
      )}

      {cargando && <Spinner texto="Cargando cierres..." />}

      {!cargando && cierres.length === 0 && (
        <p className="text-white/70 text-sm text-center">No hay cierres de caja registrados</p>
      )}

      <h2 className="text-sm font-bold text-white mb-2 mt-4">Histórico de cierres</h2>
      <div className="space-y-2">
        {cierres.map((cierre: any) => {
          const fecha = new Date(cierre.fecha)
          const fechaStr = fecha.toLocaleDateString('es-AR')

          return (
            <div key={cierre.id} className="bg-white/95 border border-gray-300 rounded-lg p-3 shadow-md">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm font-bold text-gray-900">{fechaStr}</div>
                  <div className="text-xs text-gray-700 font-semibold">
                    {cierre.cantidad} venta{cierre.cantidad !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className="text-lg font-bold text-blue-600">{formatearMoneda(cierre.totalVentas)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-green-50 p-2 rounded border border-green-200">
                  <div className="text-green-700 font-semibold">Efectivo</div>
                  <div className="text-green-900 font-bold">{formatearMoneda(cierre.totalEfectivo)}</div>
                </div>
                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                  <div className="text-blue-700 font-semibold">Transferencia</div>
                  <div className="text-blue-900 font-bold">{formatearMoneda(cierre.totalTransferencia)}</div>
                </div>
                <div className="bg-purple-50 p-2 rounded border border-purple-200">
                  <div className="text-purple-700 font-semibold">Otro</div>
                  <div className="text-purple-900 font-bold">{formatearMoneda(cierre.totalOtro)}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
