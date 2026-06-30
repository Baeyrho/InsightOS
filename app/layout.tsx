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

  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
