import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus AI - Enterprise AI Assistant",
  description:
    "A modern, intelligent AI chat assistant with multi-tone reasoning and real-time streaming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0D12] text-gray-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
