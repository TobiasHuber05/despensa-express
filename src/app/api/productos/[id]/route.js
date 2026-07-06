import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// PUT: editar un producto
export async function PUT(request, { params }) {
  const { id } = await params

  try {
    const body = await request.json()
    const { codigoBarra, nombre, precio, stockActual } = body

    const producto = await prisma.producto.update({
      where: { id: Number(id) },
      data: { codigoBarra: codigoBarra || null, nombre, precio, stockActual },
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

// DELETE: desactivar un producto (no se borra, para no romper el historial de ventas)
export async function DELETE(request, { params }) {
  const { id } = await params

  try {
    await prisma.producto.update({
      where: { id: Number(id) },
      data: { activo: false },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al desactivar producto' }, { status: 500 })
  }
}