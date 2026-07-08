'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/Spinner'
import { formatearMoneda } from '@/lib/formato'

export default function Inicio() {
  const [productos, setProductos] = useState([])
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [usuario] = useState<any>(() => {
    if (typeof window === 'undefined') return null
    try {
      const data = localStorage.getItem('usuario')
      return data ? JSON.parse(data) : null
    } catch { return null }
  })
  const router = useRouter()

  useEffect(() => {
    if (!usuario) { router.push('/login'); return }

    let montado = true
    async function cargar() {
      try {
        const [resProductos, resVentas] = await Promise.all([
          fetch('/api/productos'),
          fetch('/api/ventas'),
        ])
        if (!montado) return
        let prodData, ventData
        try { prodData = await resProductos.json() } catch { prodData = [] }
        try { ventData = await resVentas.json() } catch { ventData = [] }
        setProductos(Array.isArray(prodData) ? prodData : [])
        setVentas(Array.isArray(ventData) ? ventData : [])
      } catch {
        if (montado) {
          setProductos([])
          setVentas([])
        }
      } finally {
        if (montado) setCargando(false)
      }
    }
    cargar()
    return () => { montado = false }
  }, [usuario, router])

  async function salir() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    localStorage.removeItem('usuario')
    router.push('/login')
  }

  const hoy = new Date().toDateString()
  const ventasHoy = Array.isArray(ventas) ? ventas.filter((v: any) => new Date(v.fecha).toDateString() === hoy) : []
  const totalHoy = ventasHoy.reduce((acc: number, v: any) => acc + Number(v.total), 0)
  const promedioHoy = ventasHoy.length > 0 ? totalHoy / ventasHoy.length : 0
  const stockBajo = Array.isArray(productos) ? productos.filter((p: any) => p.stockActual < 5) : []
  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-start justify-between mb-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Despensa Express</h1>
          <p className="text-xs text-white/60 mt-0.5">
            {usuario?.nombre} {usuario?.rol === 'admin' ? '(Admin)' : '(Vendedor)'}
          </p>
        </div>
        <button
          onClick={salir}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg active:scale-95 transition"
        >
          Salir
        </button>
      </div>
      <p className="text-sm text-white/80 mb-2 px-1">Resumen de hoy</p>

      {cargando && <Spinner texto="Cargando resumen..." />}

      {!cargando && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gradient-to-br from-blue-500/80 to-blue-600/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-blue-400/30">
              <div className="text-xs text-blue-100 font-medium">Ventas hoy</div>
              <div className="text-lg font-bold text-white mt-1">{formatearMoneda(totalHoy)}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/80 to-purple-600/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-400/30">
              <div className="text-xs text-purple-100 font-medium">Cant. de ventas</div>
              <div className="text-lg font-bold text-white mt-1">{ventasHoy.length}</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/80 to-emerald-600/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-emerald-400/30">
              <div className="text-xs text-emerald-100 font-medium">Promedio por venta</div>
              <div className="text-lg font-bold text-white mt-1">{formatearMoneda(promedioHoy)}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/80 to-orange-600/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-orange-400/30">
              <div className="text-xs text-orange-100 font-medium">Productos cargados</div>
              <div className="text-lg font-bold text-white mt-1">{productos.length}</div>
            </div>
          </div>

          {stockBajo.length > 0 && (
            <Link href="/stock">
              <div className="bg-red-500/80 backdrop-blur-sm border border-red-300/50 rounded-xl p-4 mb-3 flex items-center justify-between shadow-lg active:scale-95 transition">
                <div>
                  <div className="text-sm font-bold text-white">
                    {stockBajo.length} producto{stockBajo.length > 1 ? 's' : ''} con stock bajo
                  </div>
                  <div className="text-xs text-red-100 mt-1">Tocá para ver y reponer</div>
                </div>
                <span className="text-white text-xl">→</span>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/vender"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl py-4 text-center font-bold text-sm active:scale-95 transition shadow-lg border border-blue-500/50"
            >
              🛒 Vender
            </Link>
            <Link
                href="/stock"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl py-4 text-center font-bold text-sm active:scale-95 transition shadow-lg border border-emerald-500/50"
              >
                📦 Ver stock
              </Link>
          </div>
        </>
      )}
    </div>
  )
}
