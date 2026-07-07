import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// DELETE: anular una venta (deshacer)
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    const venta = await prisma.venta.findUnique({
      where: { id: parseInt(id) },
      include: { detalles: true },
    })

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Usar transacción para revertir stock y eliminar venta
    await prisma.$transaction(async (tx) => {
      // Revertir stock de todos los productos
      for (const detalle of venta.detalles) {
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stockActual: { increment: detalle.cantidad } },
        })
      }

      // Eliminar detalles primero (por foreign key)
      await tx.detalleVenta.deleteMany({
        where: { ventaId: parseInt(id) },
      })

      // Eliminar venta
      await tx.venta.delete({
        where: { id: parseInt(id) },
      })
    })

    return NextResponse.json({ mensaje: 'Venta anulada correctamente' })
  } catch (error) {
    console.error('Error al anular venta:', error)
    return NextResponse.json({ error: 'Error al anular venta' }, { status: 500 })
  }
}
