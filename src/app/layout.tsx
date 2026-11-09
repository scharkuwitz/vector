import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// Inter draws the Mongolian letters Ө ө Ү ү in the same proportions as the
// rest of the Cyrillic alphabet (Geist's versions didn't match, see #1).
// Mongolian's extra letters live in the cyrillic-ext subset, so preload it too.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: { default: "Вектор", template: "%s · Вектор" },
  description: "Урт хугацааны төлөвлөгөө, түүний ажлууд болон Gantt диаграм.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="mn" className={`${inter.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
