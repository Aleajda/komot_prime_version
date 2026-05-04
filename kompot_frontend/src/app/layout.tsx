import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getThemeBootInlineScript } from "@/lib/theme-storage";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kompot - Управление проектами",
  description: "Система управления проектами и командами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeBootInlineScript() }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <ThemeProvider>
            {children}
            <Toaster position="top-right" richColors closeButton duration={4500} />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
