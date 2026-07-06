'use client'

import { useState } from 'react'
import EscanerCodigoBarras from '@/components/EscanerCodigoBarras'

export default function Vender() {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [carrito, setCarrito] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [escaneando, setEscaneando] = useState(false)

  async function buscarProducto(e) {
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
      const data = await res.json()

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
    } catch (error) {
      setMensaje('Error al buscar producto')
    } finally {
      setBuscando(false)
    }
  }

  async function buscarPorCodigoDetectado(codigo) {
    setEscaneando(false)
    setMensaje('')

    try {
      const res = await fetch(`/api/productos?codigo=${codigo}`)
      const data = await res.json()

      if (!res.ok) {
        setMensaje(data.error || 'Producto no encontrado')
      } else {
        agregarAlCarrito(data)
      }
    } catch (error) {
      setMensaje('Error al buscar producto')
    }
  }

  function agregarAlCarrito(producto) {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === producto.id)
      if (existe) {
        return prev.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      return [...prev, { ...producto, cantidad: 1 }]
    })
    setResultados([])
    setBusqueda('')
  }

  function cambiarCantidad(id, delta) {
    setCarrito((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, cantidad: item.cantidad + delta } : item
        )
        .filter((item) => item.cantidad > 0)
    )
  }

  function quitarDelCarrito(id) {
    setCarrito((prev) => prev.filter((item) => item.id !== id))
  }

  const total = carrito.reduce(
    (acc, item) => acc + Number(item.precio) * item.cantidad,
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
          items: carrito.map((item) => ({
            productoId: item.id,
            cantidad: item.cantidad,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje(`Error: ${data.error}`)
        return
      }

      setMensaje(`Venta registrada: $${total.toFixed(2)}`)
      setCarrito([])
    } catch (error) {
      setMensaje('Error al conectar con el servidor')
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Vender</h1>

      <form onSubmit={buscarProducto} className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Código de barras o nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={buscando}
          className="bg-gray-900 text-white px-4 rounded-lg text-sm font-medium"
        >
          Buscar
        </button>
      </form>

      <button
        onClick={() => setEscaneando(true)}
        className="w-full mb-4 border border-gray-300 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2"
      >
        📷 Escanear código de barras
      </button>

      {escaneando && (
        <EscanerCodigoBarras
          onDetectado={buscarPorCodigoDetectado}
          onCerrar={() => setEscaneando(false)}
        />
      )}

      {resultados.length > 0 && (
        <div className="mb-4 space-y-2">
          {resultados.map((producto) => (
            <div
              key={producto.id}
              onClick={() => agregarAlCarrito(producto)}
              className="bg-white border border-gray-200 rounded-lg p-3 text-sm cursor-pointer active:bg-gray-100"
            >
              <div className="font-medium">{producto.nombre}</div>
              <div className="text-gray-500 text-xs">
                ${Number(producto.precio).toFixed(2)} · stock: {producto.stockActual}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm text-gray-500 mb-2">Carrito</h2>

      {carrito.length === 0 && (
        <p className="text-gray-400 text-sm mb-4">Todavía no agregaste productos</p>
      )}

      <div className="space-y-2 mb-4">
        {carrito.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-medium">{item.nombre}</div>
              <div className="text-xs text-gray-500">
                ${Number(item.precio).toFixed(2)} x {item.cantidad}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarCantidad(item.id, -1)}
                className="w-7 h-7 rounded-full border border-gray-300 text-sm"
              >
                −
              </button>
              <span className="w-5 text-center text-sm">{item.cantidad}</span>
              <button
                onClick={() => cambiarCantidad(item.id, 1)}
                className="w-7 h-7 rounded-full border border-gray-300 text-sm"
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

      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm">Total</span>
        <span className="text-2xl font-semibold">${total.toFixed(2)}</span>
      </div>

      <button
        onClick={confirmarVenta}
        disabled={carrito.length === 0}
        className="w-full bg-gray-900 disabled:bg-gray-300 text-white rounded-lg py-3 font-medium"
      >
        Confirmar venta
      </button>

      {mensaje && (
        <p className="mt-3 text-sm text-center text-gray-600">{mensaje}</p>
      )}
    </div>
  )
}