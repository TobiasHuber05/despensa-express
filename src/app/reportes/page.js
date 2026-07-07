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
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Reportes</h1>

      {cargando && <p className="text-gray-400 text-sm">Cargando...</p>}

      {!cargando && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => cambiarMes(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 text-gray-600"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-900">
              {MESES[mesActual.mes]} {mesActual.anio}
            </span>
            <button
              onClick={() => cambiarMes(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 text-gray-600"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">
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
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative active:scale-95 transition
                    ${tieneVentas ? 'bg-gray-900 text-white font-medium' : 'text-gray-700 hover:bg-gray-100'}
                    ${esHoy(dia) && !tieneVentas ? 'border border-gray-900' : ''}
                  `}
                >
                  {dia}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {diaSeleccionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl max-h-[85vh] flex flex-col shadow-xl">
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
              <button
                onClick={() => setDiaSeleccionado(null)}
                className="text-gray-500 text-sm flex items-center gap-1"
              >
                ← Volver
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <h2 className="text-base font-semibold text-gray-900 mb-1 capitalize">
                {formatearFechaLarga(diaSeleccionado)}
              </h2>

              {ventasDelDiaSeleccionado.length === 0 ? (
                <p className="text-sm text-gray-400 mt-3">No hubo ventas este día</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Total a recibir:{' '}
                    <span className="font-semibold text-gray-900">
                      {formatearMoneda(totalDelDia(ventasDelDiaSeleccionado))}
                    </span>{' '}
                    · {ventasDelDiaSeleccionado.length} venta{ventasDelDiaSeleccionado.length > 1 ? 's' : ''}
                  </p>

                  <div className="space-y-2">
                    {ventasDelDiaSeleccionado
                      .slice()
                      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                      .map((venta) => (
                        <div key={venta.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-400">{formatearHora(venta.fecha)}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {formatearMoneda(venta.total)}
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

            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setDiaSeleccionado(null)}
                className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium active:scale-95 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}