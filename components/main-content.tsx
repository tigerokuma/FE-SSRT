"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function MainContent({ 
  children,
  className
}: { 
  children: React.ReactNode
  className?: string
}) {
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
          "px-4 py-6 sm:px-6 lg:px-8",
          "relative w-full",
          className
        )}
      >
        <div className={cn(
          "w-full",
          "mx-auto",
          "max-w-[100%]",
          "sm:max-w-[640px]",
          "md:max-w-[768px]",
          "lg:max-w-[960px]",
          "xl:max-w-[1200px]",
          "2xl:max-w-[1400px]",
          "transition-all duration-300"
        )}>
          {children}
        </div>
      </main>
    </div>
  )
} 