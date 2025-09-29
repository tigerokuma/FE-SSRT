import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { MainContent } from "@/components/main-content";
import { BackgroundGradient } from "@/components/background-gradient";
import { ThemeToggle } from "@/components/theme-toggle";
import { PaletteSwitcher } from "@/components/palette-switcher";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenSource Insight Tracker",
  description: "Monitor the health, risk, and activity of open-source repositories",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Light/Dark is managed by next-themes using the "class" attribute */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider defaultOpen={true}>
            <BackgroundGradient />

            {/* Floating theme controls (top-right) */}
            <div className="fixed z-50 right-4 top-4 flex items-center gap-2">
              <PaletteSwitcher />
              <ThemeToggle />
            </div>

            <div className="flex min-h-screen max-w-[2000px] mx-auto">
              <AppSidebar />
              <MainContent>{children}</MainContent>
            </div>

            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
