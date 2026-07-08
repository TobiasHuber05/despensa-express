import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(): Promise<NextResponse> {
  try {
    const cierres = await prisma.cierreCaja.findMany({
      orderBy: { fecha: 'desc' },
    })
    return NextResponse.json(cierres)
  } catch {
    return NextResponse.json({ error: 'Error al obtener cierres' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { montoEfectivo } = body

    const ahora = new Date()
    const hoy = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0))
    const mañana = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 0, 0))

    const cierrExistente = await prisma.cierreCaja.findFirst({
      where: {
        fecha: { gte: hoy, lt: mañana },
      },
    })

    if (cierrExistente) {
      return NextResponse.json({ error: 'Ya existe un cierre de caja para hoy' }, { status: 400 })
    }

    const ventasHoy = await prisma.venta.findMany({
      where: {
        fecha: { gte: hoy, lt: mañana },
      },
    })

    let totalEfectivo = 0
    let totalTransferencia = 0
    let totalOtro = 0

    ventasHoy.forEach((venta) => {
      const monto = Number(venta.total)
      if (venta.tipoPago === 'efectivo') totalEfectivo += monto
      else if (venta.tipoPago === 'transferencia') totalTransferencia += monto
      else if (venta.tipoPago === 'otro') totalOtro += monto
    })

    const totalVentas = totalEfectivo + totalTransferencia + totalOtro

    const cierre = await prisma.cierreCaja.create({
      data: {
        fecha: new Date(),
        totalEfectivo,
        totalTransferencia,
        totalOtro,
        totalVentas,
        cantidad: ventasHoy.length,
      },
    })

    return NextResponse.json({
      ...cierre,
      montoEfectivoEnCaja: montoEfectivo,
      diferencia: Number(montoEfectivo) - Number(totalEfectivo),
    })
  } catch (error) {
    console.error('Error al crear cierre:', error)
    return NextResponse.json({ error: 'Error al crear cierre de caja' }, { status: 500 })
  }
}
