"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { BackgroundGradient } from "@/components/background-gradient";
import { Toaster } from "@/components/ui/toaster";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen">
        <AppSidebar />                       {/* ✅ Sidebar only here */}
        <main className="relative flex-1 overflow-y-auto">
          <BackgroundGradient />
          {children}
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
