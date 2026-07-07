-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "estado" TEXT NOT NULL DEFAULT 'completada',
ADD COLUMN     "tipoPago" TEXT NOT NULL DEFAULT 'efectivo';

-- CreateTable
CREATE TABLE "CierreCaja" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEfectivo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalTarjeta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalVentas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CierreCaja_pkey" PRIMARY KEY ("id")
);
