import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen pb-20 bg-transparent">
        <div className="relative z-0 min-h-screen">
          {children}
        </div>
        <BottomNav />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
