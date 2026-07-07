'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatearMoneda } from '@/lib/formato'

export default function Inicio() {
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function cargar() {
      const [resProductos, resVentas] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/ventas'),
      ])
      setProductos(await resProductos.json())
      setVentas(await resVentas.json())
      setCargando(false)
    }
    cargar()
  }, [])

  async function salir() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const hoy = new Date().toDateString()
  const ventasHoy = ventas.filter((v) => new Date(v.fecha).toDateString() === hoy)
  const totalHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0)
  const promedioHoy = ventasHoy.length > 0 ? totalHoy / ventasHoy.length : 0
  const stockBajo = productos.filter((p) => p.stockActual < 5)

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-900">Despensa Express</h1>
        <button
          onClick={salir}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg active:scale-95 transition"
        >
          Salir
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">Resumen de hoy</p>

      {cargando && <p className="text-gray-400 text-sm">Cargando...</p>}

      {!cargando && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="text-xs text-gray-500">Ventas hoy</div>
              <div className="text-lg font-semibold text-gray-900">{formatearMoneda(totalHoy)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="text-xs text-gray-500">Cant. de ventas</div>
              <div className="text-lg font-semibold text-gray-900">{ventasHoy.length}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="text-xs text-gray-500">Promedio por venta</div>
              <div className="text-lg font-semibold text-gray-900">{formatearMoneda(promedioHoy)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
              <div className="text-xs text-gray-500">Productos cargados</div>
              <div className="text-lg font-semibold text-gray-900">{productos.length}</div>
            </div>
          </div>

          {stockBajo.length > 0 && (
            <Link href="/stock">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-red-700">
                    {stockBajo.length} producto{stockBajo.length > 1 ? 's' : ''} con stock bajo
                  </div>
                  <div className="text-xs text-red-500">Tocá para ver y reponer</div>
                </div>
                <span className="text-red-500">→</span>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/vender"
              className="bg-gray-900 text-white rounded-xl py-4 text-center font-medium text-sm active:scale-95 transition"
            >
              Vender
            </Link>
            <Link
              href="/stock"
              className="bg-white border border-gray-300 text-gray-900 rounded-xl py-4 text-center font-medium text-sm active:scale-95 transition"
            >
              Ver stock
            </Link>
          </div>
        </>
      )}
    </div>
  )
}