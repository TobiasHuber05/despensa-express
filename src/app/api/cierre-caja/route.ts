import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// GET: obtener cierres de caja
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

// POST: crear cierre de caja del día actual
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { montoEfectivo } = body

    const ahora = new Date()
    const hoy = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0))
    const mañana = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 0, 0))

    // Verificar si ya existe cierre de hoy
    const cierrExistente = await prisma.cierreCaja.findFirst({
      where: {
        fecha: {
          gte: hoy,
          lt: mañana,
        },
      },
    })

    if (cierrExistente) {
      return NextResponse.json(
        { error: 'Ya existe un cierre de caja para hoy' },
        { status: 400 }
      )
    }

    // Obtener ventas de hoy completadas
    const ventasHoy = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: hoy,
          lt: mañana,
        },
      },
    })

    // Calcular totales por tipo de pago
    let totalEfectivo = 0
    let totalTarjeta = 0

    ventasHoy.forEach((venta) => {
      const monto = Number(venta.total)
      if (venta.tipoPago === 'efectivo') {
        totalEfectivo += monto
      } else if (venta.tipoPago === 'tarjeta') {
        totalTarjeta += monto
      }
    })

    const totalVentas = totalEfectivo + totalTarjeta

    // Crear cierre de caja
    const cierre = await prisma.cierreCaja.create({
      data: {
        fecha: new Date(),
        totalEfectivo,
        totalTarjeta,
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
