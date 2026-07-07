'use client'

import { useState } from 'react'
import EscanerCodigoBarras from '@/components/EscanerCodigoBarras'
import { formatearMoneda } from '@/lib/formato'

function IconoEscanear() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="8" x2="7" y2="16" />
      <line x1="10" y1="8" x2="10" y2="16" />
      <line x1="13" y1="8" x2="13" y2="16" />
      <line x1="16" y1="8" x2="16" y2="16" />
    </svg>
  )
}

export default function Vender() {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [escaneando, setEscaneando] = useState(false)
  const [tipoPago, setTipoPago] = useState('efectivo')

  async function buscarProducto(e: React.FormEvent) {
    e.preventDefault()
    if (!busqueda.trim()) return

    setBuscando(true)
    setMensaje('')

    try {
      const esCodigo = /^\d+$/.test(busqueda.trim())
      const url = esCodigo
        ? `/api/productos?codigo=${busqueda.trim()}`
        : `/api/productos?nombre=${busqueda.trim()}`

      const res = await fetch(url)
      let data
      try {
        data = await res.json()
      } catch {
        data = {}
      }

      if (!res.ok) {
        setResultados([])
        setMensaje(data.error || 'No se encontró el producto')
      } else {
        if (esCodigo) {
          agregarAlCarrito(data)
        } else {
          setResultados(data)
        }
      }
    } catch {
      setMensaje('Error de red: no se pudo conectar al servidor')
    } finally {
      setBuscando(false)
    }
  }

  async function buscarPorCodigoDetectado(codigo: string) {
    setEscaneando(false)
    setMensaje('')

    try {
      const res = await fetch(`/api/productos?codigo=${codigo}`)
      let data
      try {
        data = await res.json()
      } catch {
        data = {}
      }

      if (!res.ok) {
        setMensaje(data.error || 'Producto no encontrado')
      } else {
        agregarAlCarrito(data)
      }
    } catch {
      setMensaje('Error de red: no se pudo conectar al servidor')
    }
  }

  function agregarAlCarrito(producto: any) {
    setCarrito((prev: any[]) => {
      const existe = prev.find((item: any) => item.id === producto.id)
      if (existe) {
        return prev.map((item: any) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      return [...prev, { ...producto, cantidad: 1 }]
    })
    setResultados([])
    setBusqueda('')
  }

  function cambiarCantidad(id: number, delta: number) {
    setCarrito((prev: any[]) =>
      prev
        .map((item: any) =>
          item.id === id ? { ...item, cantidad: item.cantidad + delta } : item
        )
        .filter((item: any) => item.cantidad > 0)
    )
  }

  function quitarDelCarrito(id: number) {
    setCarrito((prev: any[]) => prev.filter((item: any) => item.id !== id))
  }

  const total = carrito.reduce(
    (acc: number, item: any) => acc + Number(item.precio) * item.cantidad,
    0
  )

  async function confirmarVenta() {
    if (carrito.length === 0) return

    setMensaje('Guardando venta...')

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carrito.map((item: any) => ({
            productoId: item.id,
            cantidad: item.cantidad,
          })),
          tipoPago,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje(`Error: ${data.error}`)
        return
      }

      setMensaje(`Venta registrada: ${formatearMoneda(total)} (${tipoPago})`)
      setCarrito([])
    } catch {
      setMensaje('Error de red: no se pudo conectar al servidor')
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Vender</h1>

      <form onSubmit={buscarProducto} className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Código de barras o nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
        />
        <button
          type="submit"
          disabled={buscando}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm font-bold active:scale-95 transition"
        >
          Buscar
        </button>
      </form>

      <button
        onClick={() => setEscaneando(true)}
        className="w-full mb-4 bg-white/95 border border-gray-300 rounded-lg py-2.5 text-sm font-bold text-gray-900 flex items-center justify-center gap-2 active:scale-95 transition shadow-md"
      >
        <IconoEscanear />
        Escanear código de barras
      </button>

      {escaneando && (
        <EscanerCodigoBarras
          onDetectado={buscarPorCodigoDetectado}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      {resultados.length > 0 && (
        <div className="mb-4 space-y-2">
          {resultados.map((producto: any) => (
            <div
              key={producto.id}
              onClick={() => agregarAlCarrito(producto)}
              className="bg-white/95 border border-gray-300 rounded-xl p-3 text-sm cursor-pointer active:bg-blue-50 transition shadow-md hover:shadow-lg"
            >
              <div className="font-bold text-gray-900">{producto.nombre}</div>
              <div className="text-gray-700 text-xs font-semibold">
                {formatearMoneda(producto.precio)} · stock: {producto.stockActual}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm font-bold text-white mb-2">Carrito</h2>

      {carrito.length === 0 && (
        <p className="text-white/70 text-sm mb-4">Todavía no agregaste productos</p>
      )}

      <div className="space-y-2 mb-4">
        {carrito.map((item: any) => (
          <div
            key={item.id}
            className="bg-white/95 border border-gray-300 rounded-xl p-3 flex items-center justify-between shadow-md"
          >
            <div>
              <div className="text-sm font-bold text-gray-900">{item.nombre}</div>
              <div className="text-xs text-gray-700 font-semibold">
                {formatearMoneda(item.precio)} x {item.cantidad}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarCantidad(item.id, -1)}
                className="w-7 h-7 rounded-full border border-gray-300 text-sm active:scale-95 transition"
              >
                −
              </button>
              <span className="w-5 text-center text-sm text-gray-900">{item.cantidad}</span>
              <button
                onClick={() => cambiarCantidad(item.id, 1)}
                className="w-7 h-7 rounded-full border border-gray-300 text-sm active:scale-95 transition"
              >
                +
              </button>
              <button
                onClick={() => quitarDelCarrito(item.id)}
                className="text-red-500 text-xs ml-1"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3 bg-white/95 rounded-lg p-3 shadow-md">
        <span className="text-gray-700 text-sm font-bold">Total</span>
        <span className="text-2xl font-bold text-blue-600">{formatearMoneda(total)}</span>
      </div>

      <div className="mb-3 bg-white/95 rounded-lg p-3 shadow-md">
        <label className="text-sm font-bold text-gray-700 block mb-2">Tipo de pago</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipoPago('efectivo')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              tipoPago === 'efectivo'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            💵 Efectivo
          </button>
          <button
            type="button"
            onClick={() => setTipoPago('tarjeta')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
              tipoPago === 'tarjeta'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            💳 Tarjeta
          </button>
        </div>
      </div>

      <button
        onClick={confirmarVenta}
        disabled={carrito.length === 0}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg py-3 font-bold active:scale-95 transition shadow-lg"
      >
        Confirmar venta
      </button>

      {mensaje && (
        <p className="mt-3 text-sm text-center text-white/80 bg-white/10 rounded-lg p-2">{mensaje}</p>
      )}
    </div>
  )
}
