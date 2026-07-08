import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import PDFDocument from 'pdfkit'

function formatearMoneda(valor: number) {
  return `$${valor.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get('fecha')
    const mes = searchParams.get('mes')
    const anio = searchParams.get('anio')
    const usuarioPin = searchParams.get('usuarioPin')

    let whereClause: any = {}
    let titulo = 'Reporte de Ventas'

    if (fecha) {
      const [year, month, day] = fecha.split('-').map(Number)
      const fechaInicio = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
      const fechaFin = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0))
      whereClause.fecha = { gte: fechaInicio, lt: fechaFin }
      const fechaLocal = new Date(year, month - 1, day)
      titulo = `Reporte - ${fechaLocal.toLocaleDateString('es-AR')}`
    } else if (mes && anio) {
      const year = Number(anio)
      const month = Number(mes)
      const fechaInicio = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
      const fechaFin = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
      whereClause.fecha = { gte: fechaInicio, lt: fechaFin }
      titulo = `Reporte - ${month}/${year}`
    }

    if (usuarioPin) {
      whereClause.usuarioPin = usuarioPin
    }

    const ventas = await prisma.venta.findMany({
      where: whereClause,
      orderBy: { fecha: 'desc' },
      include: {
        detalles: { include: { producto: true } },
        usuario: { select: { pin: true, nombre: true } },
      },
    })

    const doc = new PDFDocument({ margin: 30, size: 'A4' })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))

    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve())
      generarPDF(doc, titulo, ventas)
      doc.end()
    })

    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_${fecha || `${mes}-${anio}`}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error al exportar:', error)
    return NextResponse.json({ error: 'Error al exportar reporte' }, { status: 500 })
  }
}

function generarPDF(doc: PDFKit.PDFDocument, titulo: string, ventas: any[]) {
  const pageWidth = doc.page.width - 60
  const leftMargin = 30

  // Header
  doc.font('Helvetica-Bold').fontSize(18).text('Despensa Express', leftMargin, 30)
  doc.font('Helvetica').fontSize(12).fillColor('#666').text(titulo, leftMargin, 52)
  doc.fontSize(9).fillColor('#999').text(`Generado: ${new Date().toLocaleString('es-AR')}`, leftMargin, 68)

  // Separador
  doc.moveTo(leftMargin, 85).lineTo(leftMargin + pageWidth, 85).strokeColor('#ddd').stroke()

  let y = 100

  // Calcular totales
  let totalEfectivo = 0
  let totalTransferencia = 0
  let totalOtro = 0
  let totalGeneral = 0

  if (ventas.length === 0) {
    doc.fontSize(12).fillColor('#999').text('No hay ventas para el período seleccionado.', leftMargin, y)
    return
  }

  // Tabla
  const colFechaL = 30
  const colHoraL = 120
  const colUsuarioL = 170
  const colPagoL = 240
  const colTotalL = 320
  const colDetalleL = 370

  // Headers de tabla
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#333')
  doc.text('Fecha', colFechaL, y, { width: 80 })
  doc.text('Hora', colHoraL, y, { width: 45 })
  doc.text('Usuario', colUsuarioL, y, { width: 65 })
  doc.text('Pago', colPagoL, y, { width: 70 })
  doc.text('Total', colTotalL, y, { width: 50, align: 'right' })
  doc.text('Detalle', colDetalleL, y, { width: pageWidth - colDetalleL + leftMargin })

  y += 15
  doc.moveTo(leftMargin, y - 3).lineTo(leftMargin + pageWidth, y - 3).strokeColor('#ddd').stroke()

  doc.font('Helvetica').fontSize(7.5).fillColor('#444')

  ventas.forEach((venta) => {
    if (y > doc.page.height - 60) {
      doc.addPage()
      y = 30
    }

    const fecha = new Date(venta.fecha)
    const fechaStr = fecha.toLocaleDateString('es-AR')
    const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    const monto = Number(venta.total)
    const usuarioNombre = venta.usuario?.nombre || venta.usuarioPin
    const tipoPago = venta.tipoPago === 'otro' && venta.otroPagoDescripcion
      ? venta.otroPagoDescripcion
      : venta.tipoPago

    doc.text(fechaStr, colFechaL, y, { width: 80 })
    doc.text(horaStr, colHoraL, y, { width: 45 })
    doc.text(usuarioNombre, colUsuarioL, y, { width: 65 })
    doc.text(tipoPago, colPagoL, y, { width: 70 })
    doc.text(formatearMoneda(monto), colTotalL, y, { width: 50, align: 'right' })

    const detalle = (venta.detalles || [])
      .map((d: any) => `${d.producto?.nombre || '?'} x${d.cantidad}`)
      .join(', ')
    doc.text(detalle, colDetalleL, y, { width: pageWidth - colDetalleL + leftMargin })

    y += 14

    if (venta.tipoPago === 'efectivo') totalEfectivo += monto
    else if (venta.tipoPago === 'transferencia') totalTransferencia += monto
    else if (venta.tipoPago === 'otro') totalOtro += monto
    totalGeneral += monto
  })

  // Resumen
  y += 10
  doc.moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).strokeColor('#333').stroke()
  y += 10

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#333').text('Resumen', leftMargin, y)
  y += 16

  doc.font('Helvetica').fontSize(9).fillColor('#444')
  doc.text(`Cantidad de ventas: ${ventas.length}`, leftMargin, y)
  y += 14
  doc.text(`Total Efectivo: ${formatearMoneda(totalEfectivo)}`, leftMargin, y)
  y += 14
  doc.text(`Total Transferencia: ${formatearMoneda(totalTransferencia)}`, leftMargin, y)
  y += 14
  doc.text(`Total Otro: ${formatearMoneda(totalOtro)}`, leftMargin, y)
  y += 14
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000')
  doc.text(`Total General: ${formatearMoneda(totalGeneral)}`, leftMargin, y)
}
