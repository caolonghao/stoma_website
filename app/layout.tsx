import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stoma Atlas",
  description: "Clinical follow-up and diagnosis workspace for stoma care."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
