// components/app-shell.tsx
"use client"

import type { ReactNode } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      {/* Make the whole app surface white */}
      <div className="flex min-h-screen w-full bg-white">
        <AppSidebar />
        <main className="relative flex-1 min-h-screen overflow-y-auto bg-white">
          {children}
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
