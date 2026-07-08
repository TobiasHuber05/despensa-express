-- CreateTable
CREATE TABLE "Usuario" (
    "pin" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("pin")
);

-- Insertar usuario admin por defecto (para ventas existentes)
INSERT INTO "Usuario" ("pin", "nombre", "rol") VALUES ('6035', 'Admin', 'admin');

-- AlterTable: agregar columna con default primero, luego quitar default
ALTER TABLE "Venta" ADD COLUMN "otroPagoDescripcion" TEXT;
ALTER TABLE "Venta" ADD COLUMN "usuarioPin" TEXT NOT NULL DEFAULT '6035';
ALTER TABLE "Venta" ALTER COLUMN "usuarioPin" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CierreCaja" ADD COLUMN "totalOtro" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN "totalTransferencia" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuarioPin_fkey" FOREIGN KEY ("usuarioPin") REFERENCES "Usuario"("pin") ON DELETE RESTRICT ON UPDATE CASCADE;
