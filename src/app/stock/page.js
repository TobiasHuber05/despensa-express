'use client'

import { useEffect, useState } from 'react'
import EscanerCodigoBarras from '@/components/EscanerCodigoBarras'

export default function Stock() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [escaneando, setEscaneando] = useState(false)

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

  async function eliminar(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    cargarProductos()
  }

  const stockBajo = productos.filter((p) => p.stockActual < 5)

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Stock</h1>
        <button
          onClick={abrirNuevo}
          className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg font-medium"
        >
          + Producto
        </button>
      </div>

      {stockBajo.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-medium text-red-600 mb-2">
            Reposición urgente ({stockBajo.length})
          </h2>
          <div className="space-y-2">
            {stockBajo.map((producto) => (
              <div
                key={producto.id}
                className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                  <div className="text-xs text-red-600">
                    Quedan {producto.stockActual} unidades
                  </div>
                </div>
                <button
                  onClick={() => abrirEdicion(producto)}
                  className="text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg px-2 py-1"
                >
                  Reponer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {cargando && <p className="text-gray-400 text-sm">Cargando...</p>}

      {!cargando && productos.length === 0 && (
        <p className="text-gray-400 text-sm">No hay productos cargados todavía</p>
      )}

      <h2 className="text-sm text-gray-500 mb-2">Todos los productos</h2>
      <div className="space-y-2">
        {productos.map((producto) => (
          <div
            key={producto.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
              <div className="text-xs text-gray-500">
                ${Number(producto.precio).toFixed(2)} · stock: {producto.stockActual}
              </div>
              {producto.codigoBarra && (
                <div className="text-xs text-gray-400">{producto.codigoBarra}</div>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => abrirEdicion(producto)}
                aria-label="Editar"
                className="w-8 h-8 flex items-center justify-center text-blue-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
                </svg>
              </button>
              <button
                onClick={() => eliminar(producto.id)}
                aria-label="Eliminar"
                className="w-8 h-8 flex items-center justify-center text-red-500"
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
        <div className="fixed inset-0 bg-black/40 flex items-end z-40">
          <div className="bg-white w-full rounded-t-2xl p-4 max-w-md mx-auto max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-3 text-gray-900">
              {editando ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <form onSubmit={guardar} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código de barras (opcional)"
                  value={codigoBarra}
                  onChange={(e) => setCodigoBarra(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setEscaneando(true)}
                  className="border border-gray-300 rounded-lg px-3 text-sm text-gray-700"
                >
                  📷
                </button>
              </div>
              <input
                type="text"
                placeholder="Nombre del producto"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Precio"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
              />
              <input
                type="number"
                placeholder="Cantidad en stock"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
              />

              {mensaje && <p className="text-sm text-gray-600">{mensaje}</p>}

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white rounded-lg py-2 text-sm font-medium"
                >
                  Guardar
                </button>
              </div>
            </form>
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