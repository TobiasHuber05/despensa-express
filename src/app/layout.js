import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "Despensa Express",
  description: "Sistema de ventas y stock",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen pb-16">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}