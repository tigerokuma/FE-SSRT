// app/layout.tsx
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import "./globals.css";

// client wrapper you showed
import { ThemeProvider } from "@/components/theme-provider"; // the file you pasted

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Deply",
  description:
    "Automatically find and fix OSS risks across your current and future codebase",
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
        <body className={inter.className}>
          {/* ✅ Theme at the root so it affects both marketing and app */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
