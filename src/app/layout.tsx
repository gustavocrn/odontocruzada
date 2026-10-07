import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata, Viewport } from "next";
import { AuthProvider } from "../context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

export const metadata: Metadata = {
  title: "GC SDR Imobiliário | Gustavo Carneiro — Corretor de Imóveis",
  description: "Plataforma SDR e CRM de Inteligência Imobiliária para Gestão e Qualificação de Leads de Alto Padrão.",
  authors: [{ name: "Gustavo Carneiro" }],
};

export const viewport: Viewport = {
  themeColor: "#0B192C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-brand-600 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
