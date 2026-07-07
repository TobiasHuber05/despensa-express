'use client'

import { useEffect, useState } from 'react'
import EscanerCodigoBarras from '@/components/EscanerCodigoBarras'
import { formatearMoneda } from '@/lib/formato'
import Link from 'next/link'

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

export default function Stock() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [escaneando, setEscaneando] = useState(false)
  const [reposicionAbierta, setReposicionAbierta] = useState(false)

  const [codigoBarra, setCodigoBarra] = useState('')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stockActual, setStockActual] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function cargarProductos() {
    setCargando(true)
    const res = await fetch('/api/productos')
    const data = await res.json()
    setProductos(data)
    setCargando(false)
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  function abrirNuevo() {
    setEditando(null)
    setCodigoBarra('')
    setNombre('')
    setPrecio('')
    setStockActual('')
    setMensaje('')
    setMostrarForm(true)
  }

  function abrirEdicion(producto) {
    setEditando(producto)
    setCodigoBarra(producto.codigoBarra || '')
    setNombre(producto.nombre)
    setPrecio(String(producto.precio))
    setStockActual(String(producto.stockActual))
    setMensaje('')
    setMostrarForm(true)
  }

  function onCodigoEscaneado(codigo) {
    setEscaneando(false)
    setCodigoBarra(codigo)
  }

  async function guardar(e) {
    e.preventDefault()
    setMensaje('Guardando...')

    const body = {
      codigoBarra: codigoBarra || null,
      nombre,
      precio: parseFloat(precio),
      stockActual: parseInt(stockActual) || 0,
    }

    try {
      const res = editando
        ? await fetch(`/api/productos/${editando.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      const data = await res.json()

      if (!res.ok) {
        setMensaje(`Error: ${data.error}`)
        return
      }

      setMostrarForm(false)
      cargarProductos()
    } catch (error) {
      setMensaje('Error al conectar con el servidor')
    }
  }

  async function desactivar(id) {
    if (!confirm('¿Sacar este producto de la lista de stock? (no se pierde el historial de ventas)')) return
    await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    cargarProductos()
  }

  const stockBajo = productos.filter((p) => p.stockActual < 5)

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Stock</h1>
        <div className="flex gap-2">
          <Link
            href="/stock/importar"
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-2 rounded-lg font-bold shadow-md active:scale-95 transition"
          >
            📤
          </Link>
          <button
            onClick={abrirNuevo}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-lg font-bold shadow-md active:scale-95 transition"
          >
            + Producto
          </button>
        </div>
      </div>

      {stockBajo.length > 0 && (
        <div className="mb-4 bg-white/95 border border-red-300 rounded-xl overflow-hidden shadow-md">
          <button
            onClick={() => setReposicionAbierta((v) => !v)}
            className="w-full flex items-center justify-between p-3"
          >
            <span className="text-sm font-bold text-red-700">
              Ver reposición urgente ({stockBajo.length})
            </span>
            <span className="text-red-600 text-xs font-bold">{reposicionAbierta ? '▲' : '▼'}</span>
          </button>

          {reposicionAbierta && (
            <div className="border-t border-red-200 p-3 space-y-2 bg-red-50">
              {stockBajo.map((producto) => (
                <div
                  key={producto.id}
                  className="bg-white border border-red-300 rounded-lg p-3 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <div className="text-sm font-bold text-gray-900">{producto.nombre}</div>
                    <div className="text-xs font-semibold text-red-700">
                      Quedan {producto.stockActual} unidades
                    </div>
                  </div>
                  <button
                    onClick={() => abrirEdicion(producto)}
                    className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg px-3 py-1.5 active:scale-95 transition"
                  >
                    Reponer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {cargando && <p className="text-white/70 text-sm">Cargando...</p>}

      {!cargando && productos.length === 0 && (
        <p className="text-white/70 text-sm">No hay productos cargados todavía</p>
      )}

      <h2 className="text-sm font-bold text-white mb-2">Todos los productos</h2>
      <div className="space-y-2">
        {productos.map((producto) => (
          <div
            key={producto.id}
            className="bg-white/95 border border-gray-300 rounded-xl p-3 flex items-center justify-between shadow-md"
          >
            <div>
              <div className="text-sm font-bold text-gray-900">{producto.nombre}</div>
              <div className="text-xs text-gray-700 font-semibold">
                {formatearMoneda(producto.precio)} · stock: {producto.stockActual}
              </div>
              {producto.codigoBarra && (
                <div className="text-xs text-gray-400">{producto.codigoBarra}</div>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => abrirEdicion(producto)}
                aria-label="Editar"
                className="w-9 h-9 flex items-center justify-center text-blue-600 rounded-full active:bg-blue-50 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                onClick={() => desactivar(producto.id)}
                aria-label="Quitar de la lista"
                className="w-9 h-9 flex items-center justify-center text-red-500 rounded-full active:bg-red-50 transition"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white/98 w-full max-w-sm rounded-2xl max-h-[85vh] flex flex-col shadow-xl">
            <div className="p-4 overflow-y-auto flex-1">
              <h2 className="text-lg font-bold mb-3 text-gray-900">
                {editando ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <form id="form-producto" onSubmit={guardar} className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Código de barras (opcional)"
                    value={codigoBarra}
                    onChange={(e) => setCodigoBarra(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setEscaneando(true)}
                    className="border border-gray-300 rounded-lg px-3 text-gray-700 active:scale-95 transition flex items-center justify-center bg-white/95"
                    aria-label="Escanear código"
                  >
                    <IconoEscanear />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Nombre del producto"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  required
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                />
                <input
                  type="number"
                  placeholder="Cantidad en stock"
                  value={stockActual}
                  onChange={(e) => setStockActual(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
                />

                {mensaje && <p className="text-sm text-red-600 font-semibold">{mensaje}</p>}
              </form>
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm font-bold text-gray-900 active:scale-95 transition bg-white/95"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="form-producto"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-bold active:scale-95 transition shadow-md"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {escaneando && (
        <EscanerCodigoBarras
          onDetectado={onCodigoEscaneado}
          onCerrar={() => setEscaneando(false)}
        />
      )}
    </div>
  )
}