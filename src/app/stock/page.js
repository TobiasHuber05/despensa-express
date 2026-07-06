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

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Stock</h1>
        <button
          onClick={abrirNuevo}
          className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg font-medium"
        >
          + Producto
        </button>
      </div>

      {cargando && <p className="text-gray-400 text-sm">Cargando...</p>}

      {!cargando && productos.length === 0 && (
        <p className="text-gray-400 text-sm">No hay productos cargados todavía</p>
      )}

      <div className="space-y-2">
        {productos.map((producto) => (
          <div
            key={producto.id}
            className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-medium">{producto.nombre}</div>
              <div className="text-xs text-gray-500">
                ${Number(producto.precio).toFixed(2)} · stock: {producto.stockActual}
              </div>
              {producto.codigoBarra && (
                <div className="text-xs text-gray-400">{producto.codigoBarra}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => abrirEdicion(producto)}
                className="text-blue-600 text-xs font-medium"
              >
                Editar
              </button>
              <button
                onClick={() => eliminar(producto.id)}
                className="text-red-500 text-xs font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-40">
          <div className="bg-white w-full rounded-t-2xl p-4 max-w-md mx-auto">
            <h2 className="text-lg font-semibold mb-3">
              {editando ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <form onSubmit={guardar} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código de barras (opcional)"
                  value={codigoBarra}
                  onChange={(e) => setCodigoBarra(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setEscaneando(true)}
                  className="border border-gray-300 rounded-lg px-3 text-sm"
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
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Precio"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Cantidad en stock"
                value={stockActual}
                onChange={(e) => setStockActual(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />

              {mensaje && <p className="text-sm text-gray-600">{mensaje}</p>}

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium"
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