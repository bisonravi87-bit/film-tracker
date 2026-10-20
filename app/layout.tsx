import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
export const metadata: Metadata = { title: "Film Tracker", description: "Tacha las películas de tus directores favoritos." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={font.variable}>{children}</body>
    </html>
  );
}
