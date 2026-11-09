import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { THEME_SCRIPT } from "@/lib/theme";
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
    // suppressHydrationWarning: THEME_SCRIPT may add data-theme before hydration.
    <html lang="mn" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
