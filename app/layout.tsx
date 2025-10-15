// app/layout.tsx
import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Deply",
  description: "Monitor the health, risk, and activity of open-source repositories",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/Deply_Logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/Deply_Logo.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/project"
      signInForceRedirectUrl="/project"
      signUpFallbackRedirectUrl="/project"
      signUpForceRedirectUrl="/project"
      appearance={{
        // Use design tokens instead of hard-coded light colors
        variables: {
          colorPrimary: "hsl(var(--primary))",
          borderRadius: "12px",
          colorBackground: "hsl(var(--background))",
          colorText: "hsl(var(--foreground))",
        },
        elements: {
          card: "bg-card text-card-foreground border border-border shadow-none",
          headerTitle: "text-foreground",
          formFieldInput: "bg-background text-foreground border-border",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        {/* no bg-white here; let tokens handle background */}
        <body className={inter.className}>
          {/* follow system; don't force light; prevent transition flash */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
