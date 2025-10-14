import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { MainContent } from "@/components/main-content"
import { BackgroundGradient } from "@/components/background-gradient"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Deply",
  description: "Monitor the health, risk, and activity of open-source repositories",
  generator: 'v0.dev',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/Deply_Logo.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/Deply_Logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} scrollbar-hide`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-w-[calc(80vw)]" style={{ width: '100%' }}>
              <AppSidebar />
              <MainContent>{children}</MainContent>
            </div>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
