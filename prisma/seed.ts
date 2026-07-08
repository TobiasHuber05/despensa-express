import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const usuarios = [
    { pin: '6035', nombre: 'Admin', rol: 'admin' },
    { pin: '0000', nombre: 'Vendedor 1', rol: 'vendedor' },
    { pin: '1111', nombre: 'Vendedor 2', rol: 'vendedor' },
  ]

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { pin: u.pin },
      update: { nombre: u.nombre, rol: u.rol },
      create: u,
    })
  }

  console.log('Usuarios creados correctamente')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
