import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Pulsa Platform",
  description: "Base operacional da Pulsa",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
