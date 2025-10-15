// components/app-shell.tsx
"use client"

import type { ReactNode } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { BackgroundGradient } from "@/components/background-gradient"

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      {/* keep sidebar area white; main gets gradient */}
        <BackgroundGradient />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="relative flex-1 min-h-screen overflow-y-auto">
          {/* gradient sits behind, children render above */}
          <BackgroundGradient />
          <div className="relative z-0">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
