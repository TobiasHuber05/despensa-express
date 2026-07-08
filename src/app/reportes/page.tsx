'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/Spinner'
import { formatearMoneda } from '@/lib/formato'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export default function Reportes() {
  const router = useRouter()
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mesActual, setMesActual] = useState(() => {
    const hoy = new Date()
    return { anio: hoy.getFullYear(), mes: hoy.getMonth() }
  })
  const [diaSeleccionado, setDiaSeleccionado] = useState<any>(null)
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  useEffect(() => {
    try {
      const data = localStorage.getItem('usuario')
      if (data) {
        const u = JSON.parse(data)
        if (u.rol !== 'admin') {
          router.push('/')
          return
        }
      } else {
        router.push('/login')
        return
      }
    } catch { router.push('/login'); return }

    async function cargar() {
      const params = new URLSearchParams()
      if (filtroUsuario) params.set('usuarioPin', filtroUsuario)
      if (fechaDesde) params.set('fechaDesde', fechaDesde)
      if (fechaHasta) params.set('fechaHasta', fechaHasta)

      const url = `/api/ventas${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url)
      const data = await res.json()
      setVentas(data)

      setCargando(false)
    }
    cargar()
  }, [filtroUsuario, fechaDesde, fechaHasta])

  const gruposPorDia: Record<string, any[]> = {}
  ventas.forEach((venta: any) => {
    const fecha = new Date(venta.fecha)
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    if (!gruposPorDia[clave]) gruposPorDia[clave] = []
    gruposPorDia[clave].push(venta)
  })

  function totalDelDia(ventasDelDia: any[]) {
    return ventasDelDia.reduce((acc: number, v: any) => acc + Number(v.total), 0)
  }

  async function deshacerVenta(ventaId: number) {
    if (!confirm('¿Estás seguro de que querés deshacer esta venta?')) return

    try {
      const res = await fetch(`/api/ventas/${ventaId}`, { method: 'DELETE' })

      if (res.ok) {
        const params = new URLSearchParams()
        if (filtroUsuario) params.set('usuarioPin', filtroUsuario)
        if (fechaDesde) params.set('fechaDesde', fechaDesde)
        if (fechaHasta) params.set('fechaHasta', fechaHasta)
        const url = `/api/ventas${params.toString() ? '?' + params.toString() : ''}`
        const resVentas = await fetch(url)
        const data = await resVentas.json()
        setVentas(data)
        alert('Venta anulada correctamente')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch {
      alert('Error al anular venta')
    }
  }

  function exportarReporte(tipo: string = 'dia') {
    let url = '/api/reportes/export?'

    if (tipo === 'dia' && diaSeleccionado) {
      url += `fecha=${diaSeleccionado}`
    } else if (tipo === 'mes') {
      url += `mes=${mesActual.mes + 1}&anio=${mesActual.anio}`
    }

    if (filtroUsuario) url += `&usuarioPin=${filtroUsuario}`

    window.location.href = url
  }

  const primerDiaDelMes = new Date(mesActual.anio, mesActual.mes, 1)
  const cantidadDias = new Date(mesActual.anio, mesActual.mes + 1, 0).getDate()
  const primerDiaSemana = (primerDiaDelMes.getDay() + 6) % 7

  const celdas: (number | null)[] = []
  for (let i = 0; i < primerDiaSemana; i++) celdas.push(null)
  for (let dia = 1; dia <= cantidadDias; dia++) celdas.push(dia)

  function claveDelDia(dia: number) {
    return `${mesActual.anio}-${String(mesActual.mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  function cambiarMes(delta: number) {
    setMesActual((prev) => {
      let mes = prev.mes + delta
      let anio = prev.anio
      if (mes < 0) { mes = 11; anio -= 1 }
      else if (mes > 11) { mes = 0; anio += 1 }
      return { anio, mes }
    })
  }

  const hoy = new Date()
  const esHoy = (dia: number) =>
    dia === hoy.getDate() && mesActual.mes === hoy.getMonth() && mesActual.anio === hoy.getFullYear()

  const ventasDelDiaSeleccionado = diaSeleccionado ? gruposPorDia[diaSeleccionado] || [] : []

  function formatearHora(fechaIso: string) {
    return new Date(fechaIso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  function formatearFechaLarga(clave: string) {
    const [anio, mes, dia] = clave.split('-').map(Number)
    const fecha = new Date(anio, mes - 1, dia)
    return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold text-white mb-4">Reportes</h1>

      {cargando && <Spinner texto="Cargando reportes..." />}

      {!cargando && (
        <>
          <div className="bg-white/95 border border-gray-300 rounded-xl p-3 mb-4 shadow-md space-y-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Filtrar por usuario</label>
              <select
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los usuarios</option>
                <option value="6035">Admin (6035)</option>
                <option value="0000">Vendedor 1 (0000)</option>
                <option value="1111">Vendedor 2 (1111)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-700 block mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-700 block mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white/95 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

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
                <div key={d} className="text-center text-xs text-gray-600 font-bold py-1">{d}</div>
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
        </>
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
                    Total:{' '}
                    <span className="font-bold text-blue-600">
                      {formatearMoneda(totalDelDia(ventasDelDiaSeleccionado))}
                    </span>{' '}
                    · {ventasDelDiaSeleccionado.length} venta{ventasDelDiaSeleccionado.length > 1 ? 's' : ''}
                  </p>

                  <div className="space-y-2">
                    {ventasDelDiaSeleccionado
                      .slice()
                      .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .map((venta: any) => (
                        <div key={venta.id} className="bg-white border border-gray-300 rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-700">{formatearHora(venta.fecha)}</span>
                            <div className="flex gap-2 items-center">
                              <span className="text-xs font-semibold text-gray-500">{venta.usuario?.nombre || venta.usuarioPin}</span>
                              <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {venta.tipoPago === 'otro' && venta.otroPagoDescripcion
                                  ? venta.otroPagoDescripcion
                                  : venta.tipoPago}
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
                            {(venta.detalles || []).map((d: any) => `${d.producto?.nombre || '?'} x${d.cantidad}`).join(', ')}
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
