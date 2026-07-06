'use client'

import { useState } from 'react'

export default function CargarProducto() {
  const [codigoBarra, setCodigoBarra] = useState('')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stockActual, setStockActual] = useState('')
  const [mensaje, setMensaje] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMensaje('Guardando...')

    try {
      const res = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigoBarra: codigoBarra || null,
          nombre,
          precio: parseFloat(precio),
          stockActual: parseInt(stockActual) || 0,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMensaje(`Error: ${data.error}`)
        return
      }

      setMensaje(`Producto "${data.nombre}" guardado correctamente`)
      setCodigoBarra('')
      setNombre('')
      setPrecio('')
      setStockActual('')
    } catch (error) {
      setMensaje('Error al conectar con el servidor')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20 }}>
      <h1>Cargar producto</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Código de barras (opcional)"
          value={codigoBarra}
          onChange={(e) => setCodigoBarra(e.target.value)}
        />
        <input
          type="text"
          placeholder="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Cantidad en stock"
          value={stockActual}
          onChange={(e) => setStockActual(e.target.value)}
        />
        <button type="submit">Guardar producto</button>
      </form>
      {mensaje && <p style={{ marginTop: 16 }}>{mensaje}</p>}
    </div>
  )
}