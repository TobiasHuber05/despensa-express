import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET: buscar productos por código de barras o por nombre
// Ejemplo: /api/productos?codigo=7790895000012
// Ejemplo: /api/productos?nombre=coca
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const codigo = searchParams.get('codigo')
  const nombre = searchParams.get('nombre')

  try {
    if (codigo) {
      const producto = await prisma.producto.findUnique({
        where: { codigoBarra: codigo },
      })
      if (!producto) {
        return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
      }
      return NextResponse.json(producto)
    }

    if (nombre) {
      const productos = await prisma.producto.findMany({
        where: {
          nombre: {
            contains: nombre,
            mode: 'insensitive',
          },
        },
      })
      return NextResponse.json(productos)
    }

    // Sin filtros: devolver todos los productos
    const productos = await prisma.producto.findMany({
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