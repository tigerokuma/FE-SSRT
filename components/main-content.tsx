"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function MainContent({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  
  return (
    <div className="flex-1 flex">
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <main 
        className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          "flex flex-col",
          isCollapsed ? "md:pl-14" : "md:pl-4",
          "p-6 lg:px-8 xl:px-12 2xl:px-16",
          "relative"
        )}
      >
        <div className={cn(
          "w-full max-w-[1400px]",
          "mx-auto",
          "lg:mx-8 xl:mx-16 2xl:mx-auto"
        )}>
          {children}
        </div>
      </main>
    </div>
  )
} 