import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { items, tipoPago = 'efectivo', otroPagoDescripcion, usuarioPin } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'La venta no tiene productos' }, { status: 400 })
    }

    if (!['efectivo', 'transferencia', 'otro'].includes(tipoPago)) {
      return NextResponse.json({ error: 'Tipo de pago inválido' }, { status: 400 })
    }

    if (tipoPago === 'otro' && !otroPagoDescripcion?.trim()) {
      return NextResponse.json({ error: 'Debe escribir una descripción para el método de pago' }, { status: 400 })
    }

    if (!usuarioPin) {
      const cookiePin = request.cookies.get('auth')?.value
      if (!cookiePin) {
        return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      }
    }

    const pin = usuarioPin || request.cookies.get('auth')?.value

    const resultado = await prisma.$transaction(async (tx) => {
      let total = 0
      const detallesData: { productoId: number; cantidad: number; precioUnitario: any }[] = []

      for (const item of items) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
        })

        if (!producto) {
          throw new Error(`Producto con id ${item.productoId} no existe`)
        }

        if (producto.stockActual < item.cantidad) {
          throw new Error(`Stock insuficiente de "${producto.nombre}"`)
        }

        const subtotal = Number(producto.precio) * item.cantidad
        total += subtotal

        detallesData.push({
          productoId: producto.id,
          cantidad: item.cantidad,
          precioUnitario: producto.precio,
        })

        await tx.producto.update({
          where: { id: producto.id },
          data: { stockActual: { decrement: item.cantidad } },
        })
      }

      const venta = await tx.venta.create({
        data: {
          total,
          tipoPago,
          otroPagoDescripcion: tipoPago === 'otro' ? otroPagoDescripcion : null,
          usuarioPin: pin!,
          detalles: {
            create: detallesData,
          },
        },
        include: { detalles: true },
      })

      return venta
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al registrar venta' }, { status: 400 })
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioPin = searchParams.get('usuarioPin')
    const fechaDesde = searchParams.get('fechaDesde')
    const fechaHasta = searchParams.get('fechaHasta')

    const where: any = {}

    if (usuarioPin) {
      where.usuarioPin = usuarioPin
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        const d = new Date(fechaDesde)
        d.setUTCHours(0, 0, 0, 0)
        where.fecha.gte = d
      }
      if (fechaHasta) {
        const d = new Date(fechaHasta)
        d.setUTCHours(23, 59, 59, 999)
        where.fecha.lte = d
      }
    }

    const ventas = await prisma.venta.findMany({
      where,
      orderBy: { fecha: 'desc' },
      include: {
        detalles: { include: { producto: true } },
        usuario: { select: { pin: true, nombre: true, rol: true } },
      },
    })
    return NextResponse.json(ventas)
  } catch {
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 })
  }
}
