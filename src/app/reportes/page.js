'use client'

import { useEffect, useState } from 'react'
import { formatearMoneda } from '@/lib/formato'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function Reportes() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date()
    return { anio: hoy.getFullYear(), mes: hoy.getMonth() }
  })
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)

  useEffect(() => {
    async function cargar() {
      const res = await fetch('/api/ventas')
      const data = await res.json()
      setVentas(data)
      setCargando(false)
    }
    cargar()
  }, [])

  const gruposPorDia = {}
  ventas.forEach((venta) => {
    const fecha = new Date(venta.fecha)
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    if (!gruposPorDia[clave]) gruposPorDia[clave] = []
    gruposPorDia[clave].push(venta)
  })

  function totalDelDia(ventasDelDia) {
    return ventasDelDia.reduce((acc, v) => acc + Number(v.total), 0)
  }

  async function deshacerVenta(ventaId) {
    if (!confirm('¿Estás seguro de que querés deshacer esta venta?')) return

    try {
      const res = await fetch(`/api/ventas/${ventaId}`, { method: 'DELETE' })

      if (res.ok) {
        const resVentas = await fetch('/api/ventas')
        const data = await resVentas.json()
        setVentas(data)
        alert('Venta anulada correctamente')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Error al anular venta')
    }
  }

  function exportarReporte(tipo = 'dia') {
    let url = '/api/reportes/export?'

    if (tipo === 'dia' && diaSeleccionado) {
      url += `fecha=${diaSeleccionado}`
    } else if (tipo === 'mes') {
      url += `mes=${mesActual.mes + 1}&anio=${mesActual.anio}`
    }

    window.location.href = url
  }

  const primerDiaDelMes = new Date(mesActual.anio, mesActual.mes, 1)
  const cantidadDias = new Date(mesActual.anio, mesActual.mes + 1, 0).getDate()
  const primerDiaSemana = (primerDiaDelMes.getDay() + 6) % 7

  const celdas = []
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null)
  for (let dia = 1; dia <= cantidadDias; dia++) celdas.push(dia)

  function claveDelDia(dia) {
    return `${mesActual.anio}-${String(mesActual.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  function cambiarMes(delta) {
    setMesActual((prev) => {
      let mes = prev.mes + delta
      let anio = prev.anio
      if (mes < 0) {
        mes = 11
        anio -= 1
      } else if (mes > 11) {
        mes = 0
        anio += 1
      }
      return { anio, mes }
    })
  }

  const hoy = new Date()
  const esHoy = (dia) =>
    dia === hoy.getDate() && mesActual.mes === hoy.getMonth() && mesActual.anio === hoy.getFullYear()

  const ventasDelDiaSeleccionado = diaSeleccionado ? gruposPorDia[diaSeleccionado] || [] : []

  function formatearHora(fechaIso) {
    return new Date(fechaIso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatearFechaLarga(clave) {
    const [anio, mes, dia] = clave.split('-').map(Number)
    const fecha = new Date(anio, mes - 1, dia)
    return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Reportes</h1>

      {cargando && <p className="text-white/70 text-sm">Cargando...</p>}

      {!cargando && (
        <div className="space-y-3">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => exportarReporte('mes')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 text-xs font-bold active:scale-95 transition shadow-md"
            >
              📥 Exportar mes
            </button>
            <button
              onClick={() => window.location.href = '/cierre-caja'}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-xs font-bold active:scale-95 transition shadow-md"
            >
              🔐 Cierre caja
            </button>
          </div>

          <div className="bg-white/95 border border-gray-300 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => cambiarMes(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-200 text-gray-900 font-bold"
                aria-label="Mes anterior"
              >
                ‹
              </button>
              <span className="text-sm font-bold text-gray-900">
                {MESES[mesActual.mes]} {mesActual.anio}
              </span>
              <button
                onClick={() => cambiarMes(1)}
                className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-200 text-gray-900 font-bold"
                aria-label="Mes siguiente"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs text-gray-600 font-bold py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {celdas.map((dia, i) => {
                if (dia === null) return <div key={`vacio-${i}`} />

                const clave = claveDelDia(dia)
                const ventasDia = gruposPorDia[clave]
                const tieneVentas = ventasDia && ventasDia.length > 0

                return (
                  <button
                    key={clave}
                    onClick={() => setDiaSeleccionado(clave)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-bold relative active:scale-95 transition
                      ${tieneVentas ? 'bg-blue-600 text-white shadow-md' : 'text-gray-900 hover:bg-gray-100'}
                      ${esHoy(dia) && !tieneVentas ? 'border-2 border-blue-600' : ''}
                    `}
                  >
                    {dia}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {diaSeleccionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white/98 w-full max-w-sm rounded-2xl max-h-[85vh] flex flex-col shadow-xl">
            <div className="flex items-center gap-2 p-4 border-b border-gray-200">
              <button
                onClick={() => setDiaSeleccionado(null)}
                className="text-gray-900 text-sm font-bold flex items-center gap-1"
              >
                ← Volver
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <h2 className="text-base font-bold text-gray-900 mb-1 capitalize">
                {formatearFechaLarga(diaSeleccionado)}
              </h2>

              {ventasDelDiaSeleccionado.length === 0 ? (
                <p className="text-sm text-gray-600 font-semibold mt-3">No hubo ventas este día</p>
              ) : (
                <>
                  <p className="text-sm text-gray-700 font-semibold mb-4">
                    Total a recibir:{' '}
                    <span className="font-bold text-blue-600">
                      {formatearMoneda(totalDelDia(ventasDelDiaSeleccionado))}
                    </span>{' '}
                    · {ventasDelDiaSeleccionado.length} venta{ventasDelDiaSeleccionado.length > 1 ? 's' : ''}
                  </p>

                  <div className="space-y-2">
                    {ventasDelDiaSeleccionado
                      .slice()
                      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                      .map((venta) => (
                        <div key={venta.id} className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-700">{formatearHora(venta.fecha)}</span>
                            <div className="flex gap-2 items-center">
                              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {venta.tipoPago}
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                {formatearMoneda(venta.total)}
                              </span>
                              <button
                                onClick={() => deshacerVenta(venta.id)}
                                className="text-xs font-bold text-red-600 hover:text-red-800 active:scale-95 transition"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-gray-700">
                            {venta.detalles.map((d) => `${d.producto.nombre} x${d.cantidad}`).join(', ')}
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => exportarReporte('dia')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-bold active:scale-95 transition shadow-md"
                >
                  📥 Exportar día
                </button>
                <button
                  onClick={() => setDiaSeleccionado(null)}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white rounded-lg py-2.5 text-sm font-bold active:scale-95 transition shadow-md"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}