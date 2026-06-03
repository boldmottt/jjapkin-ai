import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { publicEnv } from "@/lib/env";
import { Toaster } from "@/components/Toaster";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: publicEnv.APP_NAME, template: `%s | ${publicEnv.APP_NAME}` },
  description: "텍스트를 붙여넣으면 AI가 자동으로 다이어그램, 플로우차트, 인포그래픽으로 변환",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
