// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Deply",
  description: "Automatically find and fix OSS risks across your current and future codebase",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/project"
      signInForceRedirectUrl="/project"
      signUpFallbackRedirectUrl="/project"
      signUpForceRedirectUrl="/project"
      appearance={{
        variables: { colorPrimary: "#4B0082", borderRadius: "12px" },
        elements: { card: "shadow-none border border-[#E5E7EB]" },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        {/* Force a white background on the whole document */}
        <body className={`${inter.className} bg-white`}>
          {/* Force the app to light theme so no dark styles bleed in */}
          <ThemeProvider attribute="class" forcedTheme="light">
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
