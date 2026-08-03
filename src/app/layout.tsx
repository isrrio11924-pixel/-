import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "航路 | メンター・メンティー就活支援",
  description:
    "就活生の航海日誌。メンティーが記録し、メンターが見守る、就活支援アプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
