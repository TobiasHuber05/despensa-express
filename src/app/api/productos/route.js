import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: buscar productos activos por código de barras o por nombre
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const codigo = searchParams.get('codigo')
  const nombre = searchParams.get('nombre')

  try {
    if (codigo) {
      const producto = await prisma.producto.findFirst({
        where: { codigoBarra: codigo, activo: true },
      })
      if (!producto) {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
      }
      return NextResponse.json(producto)
    }

    if (nombre) {
      const productos = await prisma.producto.findMany({
        where: {
          nombre: { contains: nombre, mode: 'insensitive' },
          activo: true,
        },
      })
      return NextResponse.json(productos)
    }

    const productos = await prisma.producto.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json(productos)
  } catch (error) {
    return NextResponse.json({ error: 'Error al buscar productos' }, { status: 500 })
  }
}

// POST: crear un producto nuevo
export async function POST(request) {
  try {
    const body = await request.json()
    const { codigoBarra, nombre, precio, stockActual } = body

    if (!nombre || precio === undefined) {
      return NextResponse.json(
        { error: 'Nombre y precio son obligatorios' },
        { status: 400 }
      )
    }

    const producto = await prisma.producto.create({
      data: {
        codigoBarra: codigoBarra || null,
        nombre,
        precio,
        stockActual: stockActual || 0,
      },
    })

    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese código de barras' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}