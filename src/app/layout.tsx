import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business English",
  description: "Тренажёр бизнес-английского: слова с урока — в рабочие фразы",
  robots: { index: false, follow: false },
  applicationName: "Business English",
  // Установка на экран «Домой» в iOS / iPadOS: без адресной строки, со своим названием.
  appleWebApp: { capable: true, title: "Business English", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F2EA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full bg-paper text-ink">{children}</body>
    </html>
  );
}
