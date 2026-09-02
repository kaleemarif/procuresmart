import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ProcureSmart",
  description: "Sahi Jankari, Sahi Samay",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
