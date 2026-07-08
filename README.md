# Despensa Express

Sistema de ventas y control de stock para despensas/almacenes.

## Funcionalidades

- **Vender**: registro de ventas con búsqueda por código de barras o nombre
- **Stock**: gestión de productos con alerta de stock bajo
- **Reportes**: calendario de ventas, filtros por usuario/fecha, exportación a PDF
- **Cierre de Caja**: cierre diario con totales por método de pago

## Roles

- **Admin** (PIN: `6035`): acceso completo a stock, reportes y cierre de caja
- **Vendedor** (PIN: `0000`, `1111`): solo puede vender

## Tecnologías

- Next.js 16 (App Router + proxy middleware)
- Prisma + Neon PostgreSQL
- Tailwind CSS
- PDFKit (exportación de reportes)
- Docker (deploy en Koyeb)

## Desarrollo

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```
