// app/(app)/layout.tsx
import AppShell from "@/components/app-shell"
import { auth } from "@clerk/nextjs/server"
// 👇 use YOUR provider
import { SidebarProvider } from "@/components/ui/sidebar"
// (optional) if you have these, keep them; otherwise delete
// import { ThemeProvider } from "@/components/theme-provider"
// import { Toaster } from "@/components/ui/toaster"

export default async function AppSectionLayout({
  children,
}: { children: React.ReactNode }) {
  const { userId, redirectToSignIn } = await auth()
  if (!userId) {
    redirectToSignIn({ returnBackUrl: "/project" })
  }

  // ✅ AppShell AND all children are now inside SidebarProvider
  return (
    // <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider defaultOpen>
        <AppShell>{children}</AppShell>
        {/* <Toaster /> */}
      </SidebarProvider>
    // </ThemeProvider>
  )
}
