import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// POST: registrar una venta
// Body esperado: { items: [{ productoId: 1, cantidad: 2 }], tipoPago: "efectivo" }
export async function POST(request) {
  try {
    const body = await request.json()
    const { items, tipoPago = 'efectivo' } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'La venta no tiene productos' }, { status: 400 })
    }

    if (!['efectivo', 'tarjeta'].includes(tipoPago)) {
      return NextResponse.json({ error: 'Tipo de pago inválido' }, { status: 400 })
    }

    // Usamos una transacción: o se hace todo (venta + descuento de stock), o no se hace nada
    const resultado = await prisma.$transaction(async (tx) => {
      let total = 0
      const detallesData = []

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

        // Descontar stock
        await tx.producto.update({
          where: { id: producto.id },
          data: { stockActual: { decrement: item.cantidad } },
        })
      }

      // Crear la venta con sus detalles
      const venta = await tx.venta.create({
        data: {
          total,
          tipoPago: tipoPago || 'efectivo',
          detalles: {
            create: detallesData,
          },
        },
        include: { detalles: true },
      })

      return venta
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Error al registrar venta' }, { status: 400 })
  }
}

// GET: listar ventas completadas (para reportes después)
export async function GET() {
  try {
    const ventas = await prisma.venta.findMany({
      orderBy: { fecha: 'desc' },
      include: { detalles: { include: { producto: true } } },
    })
    return NextResponse.json(ventas)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener ventas' }, { status: 500 })
  }
}