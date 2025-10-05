import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { MainContent } from "@/components/main-content";
import { BackgroundGradient } from "@/components/background-gradient";
import { Toaster } from "@/components/ui/toaster";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <BackgroundGradient />
      <div className="mx-auto flex min-h-screen ">
        <AppSidebar />
        <MainContent>{children}</MainContent>
      </div>
      <Toaster />
    </>
  );
}
