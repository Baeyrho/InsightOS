import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "@/styles/tokens.css";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: "InsightOS | UX Research Intelligence",
  description: "Transform raw research artifacts into structured, decision-ready insights.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("insightos-theme");
  const theme = (themeCookie?.value as "light" | "dark") || "dark";

  const themeScript = `
    (function() {
      var c = document.cookie.match(/(?:^|;\\s*)insightos-theme=([^;]*)/);
      var theme = c ? c[1] : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
      document.documentElement.setAttribute('data-theme', theme);
    })()
  `

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
