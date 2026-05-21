import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM DTAR",
  description: "Dashboard CRM DTAR — Agente WhatsApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
