import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: exportar reportes en CSV
// ?fecha=2026-07-06 para día específico
// ?mes=7&anio=2026 para mes específico
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const mes = searchParams.get('mes')
    const anio = searchParams.get('anio')

    let whereClause = {}
    let titulo = 'Reporte de Ventas'

    if (fecha) {
      // Reporte de día específico
      const [year, month, day] = fecha.split('-')
      const fechaInicio = new Date(year, month - 1, day, 0, 0, 0)
      const fechaFin = new Date(year, month - 1, day, 23, 59, 59)

      whereClause.fecha = {
        gte: fechaInicio,
        lte: fechaFin,
      }
      titulo = `Reporte de Ventas - ${fecha}`
    } else if (mes && anio) {
      // Reporte de mes específico
      const fechaInicio = new Date(anio, mes - 1, 1, 0, 0, 0)
      const fechaFin = new Date(anio, mes, 0, 23, 59, 59)

      whereClause.fecha = {
        gte: fechaInicio,
        lte: fechaFin,
      }
      titulo = `Reporte de Ventas - ${mes}/${anio}`
    }

    const ventas = await prisma.venta.findMany({
      where: whereClause,
      orderBy: { fecha: 'desc' },
      include: {
        detalles: {
          include: { producto: true },
        },
      },
    })

    // Generar CSV
    let csv = `${titulo}\nGenerado: ${new Date().toLocaleString('es-AR')}\n\n`
    csv += 'Fecha,Hora,Tipo Pago,Total\n'

    let totalGeneral = 0
    let cantidadVentas = 0
    let totalEfectivo = 0
    let totalTarjeta = 0

    ventas.forEach((venta) => {
      const fecha = new Date(venta.fecha)
      const fechaStr = fecha.toLocaleDateString('es-AR')
      const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
      const monto = Number(venta.total)

      csv += `${fechaStr},${horaStr},"${venta.tipoPago}",${monto.toFixed(2)}\n`

      totalGeneral += monto
      cantidadVentas++

      if (venta.tipoPago === 'efectivo') {
        totalEfectivo += monto
      } else if (venta.tipoPago === 'tarjeta') {
        totalTarjeta += monto
      }
    })

    csv += '\n--- RESUMEN ---\n'
    csv += `Total de Ventas,${cantidadVentas}\n`
    csv += `Total Efectivo,${totalEfectivo.toFixed(2)}\n`
    csv += `Total Tarjeta,${totalTarjeta.toFixed(2)}\n`
    csv += `Total General,${totalGeneral.toFixed(2)}\n`

    // Enviar como descarga
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reporte_${fecha || `${mes}-${anio}`}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error al exportar:', error)
    return NextResponse.json({ error: 'Error al exportar reporte' }, { status: 500 })
  }
}
