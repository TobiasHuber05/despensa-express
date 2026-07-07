import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { parse } from 'csv-parse/sync'

function procesarValor(valor: any) {
  if (typeof valor !== 'string') return valor
  return valor.trim()
}

// POST: cargar productos desde CSV
// Espera un FormData con un archivo CSV
// Formato del CSV: codigo,nombre,precio,stock
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const archivo = formData.get('archivo')

    if (!archivo) {
      return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 })
    }

    const contenido = await (archivo as Blob).text()

    let registros: any[]
    try {
      registros = parse(contenido, {
        columns: ['codigo', 'nombre', 'precio', 'stock'],
        skip_empty_lines: true,
        from_line: 2,
        bom: true,
        relaxColumnCount: true,
      })
    } catch (parseError: any) {
      return NextResponse.json({ error: `Error al parsear CSV: ${parseError.message}` }, { status: 400 })
    }

    if (registros.length === 0) {
      return NextResponse.json({ error: 'El archivo está vacío o no tiene datos después del encabezado' }, { status: 400 })
    }

    const resultados = {
      exitosas: 0,
      errores: [] as { linea: number; error: string }[],
    }

    for (let i = 0; i < registros.length; i++) {
      const row = registros[i]
      const lineaNum = i + 2

      try {
        const codigo = procesarValor(row.codigo)
        const nombre = procesarValor(row.nombre)
        const precioStr = procesarValor(row.precio)
        const stockStr = procesarValor(row.stock)

        if (!nombre || !precioStr) {
          resultados.errores.push({
            linea: lineaNum,
            error: 'Nombre y precio son obligatorios',
          })
          continue
        }

        const precio = parseFloat(precioStr)
        const stock = parseInt(stockStr) || 0

        if (isNaN(precio) || precio < 0) {
          resultados.errores.push({
            linea: lineaNum,
            error: 'Precio inválido',
          })
          continue
        }

        if (codigo) {
          const existe = await prisma.producto.findFirst({
            where: { codigoBarra: codigo },
          })

          if (existe) {
            await prisma.producto.update({
              where: { id: existe.id },
              data: { nombre, precio, stockActual: stock },
            })
            resultados.exitosas++
            continue
          }
        }

        await prisma.producto.create({
          data: {
            codigoBarra: codigo || null,
            nombre,
            precio,
            stockActual: stock,
          },
        })

        resultados.exitosas++
      } catch {
        resultados.errores.push({
          linea: lineaNum,
          error: 'Error al procesar línea',
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
export async function GET(): Promise<NextResponse> {
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
