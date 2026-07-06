import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// PUT: editar un producto (nombre, precio, stock, código)
export async function PUT(request, { params }) {
  const { id } = await params

  try {
    const body = await request.json()
    const { codigoBarra, nombre, precio, stockActual } = body

    const producto = await prisma.producto.update({
      where: { id: Number(id) },
      data: {
        codigoBarra: codigoBarra || null,
        nombre,
        precio,
        stockActual,
      },
    })

    return NextResponse.json(producto)
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe otro producto con ese código de barras' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Error al editar producto' }, { status: 500 })
  }
}

// DELETE: eliminar un producto
export async function DELETE(request, { params }) {
  const { id } = await params

  try {
    await prisma.producto.delete({ where: { id: Number(id) } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}