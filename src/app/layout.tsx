import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Analitikai Dashboard",
  description: "Események nyomon követése és vizualizációja",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}