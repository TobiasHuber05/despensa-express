'use client'

import { useEffect, useState } from 'react'

export default function Reportes() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargar() {
      const res = await fetch('/api/ventas')
      const data = await res.json()
      setVentas(data)
      setCargando(false)
    }
    cargar()
  }, [])

  const hoy = new Date().toDateString()
  const ventasHoy = ventas.filter((v) => new Date(v.fecha).toDateString() === hoy)

  const totalHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total), 0)

  // Productos más vendidos (de todas las ventas)
  const conteoProductos = {}
  ventas.forEach((venta) => {
    venta.detalles.forEach((d) => {
      const nombre = d.producto.nombre
      conteoProductos[nombre] = (conteoProductos[nombre] || 0) + d.cantidad
    })
  })
  const masVendidos = Object.entries(conteoProductos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Reportes</h1>

      {cargando && <p className="text-gray-400 text-sm">Cargando...</p>}

      {!cargando && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500">Ventas hoy</div>
              <div className="text-lg font-semibold">${totalHoy.toFixed(2)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500">Cant. de ventas hoy</div>
              <div className="text-lg font-semibold">{ventasHoy.length}</div>
            </div>
          </div>

          <h2 className="text-sm text-gray-500 mb-2">Más vendidos</h2>
          {masVendidos.length === 0 && (
            <p className="text-gray-400 text-sm mb-6">Todavía no hay ventas</p>
          )}
          <div className="space-y-2 mb-6">
            {masVendidos.map(([nombre, cantidad]) => (
              <div
                key={nombre}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between"
              >
                <span className="text-sm">{nombre}</span>
                <span className="text-sm text-gray-500">{cantidad} u.</span>
              </div>
            ))}
          </div>

          <h2 className="text-sm text-gray-500 mb-2">Últimas ventas</h2>
          {ventas.length === 0 && (
            <p className="text-gray-400 text-sm">Todavía no hay ventas</p>
          )}
          <div className="space-y-2">
            {ventas.slice(0, 10).map((venta) => (
              <div
                key={venta.id}
                className="bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-400">
                    {new Date(venta.fecha).toLocaleString('es-AR')}
                  </span>
                  <span className="text-sm font-medium">
                    ${Number(venta.total).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {venta.detalles.map((d) => `${d.producto.nombre} x${d.cantidad}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}