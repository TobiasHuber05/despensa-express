import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// POST: cargar productos desde CSV
// Espera un FormData con un archivo CSV
// Formato del CSV: codigo,nombre,precio,stock
export async function POST(request) {
  try {
    const formData = await request.formData()
    const archivo = formData.get('archivo')

    if (!archivo) {
      return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 })
    }

    const contenido = await archivo.text()
    const lineas = contenido.split('\n').filter((linea) => linea.trim())

    if (lineas.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })
    }

    const resultados = {
      exitosas: 0,
      errores: [],
    }

    // Procesar cada línea (saltar header si existe)
    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i]

      // Saltar si parece ser header
      if (i === 0 && linea.toLowerCase().includes('codigo')) {
        continue
      }

      try {
        const [codigo, nombre, precioStr, stockStr] = linea.split(',').map((v) => v.trim())

        if (!nombre || !precioStr) {
          resultados.errores.push({
            linea: i + 1,
            error: 'Nombre y precio son obligatorios',
          })
          continue
        }

        const precio = parseFloat(precioStr)
        const stock = parseInt(stockStr) || 0

        if (isNaN(precio) || precio < 0) {
          resultados.errores.push({
            linea: i + 1,
            error: 'Precio inválido',
          })
          continue
        }

        // Verificar si ya existe producto con ese código
        if (codigo) {
          const existe = await prisma.producto.findFirst({
            where: { codigoBarra: codigo },
          })

          if (existe) {
            // Actualizar producto existente
            await prisma.producto.update({
              where: { id: existe.id },
              data: { nombre, precio, stockActual: stock },
            })
            resultados.exitosas++
            continue
          }
        }

        // Crear nuevo producto
        await prisma.producto.create({
          data: {
            codigoBarra: codigo || null,
            nombre,
            precio,
            stockActual: stock,
          },
        })

        resultados.exitosas++
      } catch (error) {
        resultados.errores.push({
          linea: i + 1,
          error: error.message,
        })
      }
    }

    return NextResponse.json(resultados)
  } catch (error) {
    console.error('Error al cargar productos:', error)
    return NextResponse.json({ error: 'Error al procesar archivo' }, { status: 500 })
  }
}

// GET: descargar plantilla CSV
export async function GET() {
  const plantilla = `codigo,nombre,precio,stock
123456,Pan integral,2.50,50
234567,Leche descremada,3.00,30
345678,Queso provoleta,15.50,10
456789,Aceite de oliva,8.99,20
567890,Café premium,12.00,15
`

  return new NextResponse(plantilla, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla_productos.csv"',
    },
  })
}
