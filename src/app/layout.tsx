import "./globals.css";
import { Outfit } from "next/font/google";
import { Metadata, Viewport } from "next";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "OdontoCross - Palavras Cruzadas Odontológicas",
  description: "Desafie seu conhecimento clínico, anatomia e procedimentos em odontologia em 50 fases de palavras cruzadas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OdontoCross",
  },
};

export const viewport: Viewport = {
  themeColor: "#14a3b5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${outfit.variable}`}>
      <body className="bg-darkbg text-slate-100 min-h-screen overflow-x-hidden selection:bg-dentist-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
