import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "智慧父母养育能力评估",
  description: "围绕测评、解读、直播和转化打造的销售型 CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
