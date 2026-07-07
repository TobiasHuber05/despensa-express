import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "Despensa Express",
  description: "Sistema de ventas y stock",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Despensa Express",
  },
};

export const viewport = {
  themeColor: "#111827",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen pb-20 bg-transparent">
        <div className="relative z-0 min-h-screen">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}