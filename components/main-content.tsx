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
    <div className="flex flex-col w-full overflow-x-hidden">
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
          "flex-1 min-h-0 transition-all duration-300",
          "flex flex-col",
          "relative w-full",
          className
        )}
      >
        <div className={cn(
          "w-full",
          "transition-all duration-300"
        )}>
          {children}
        </div>
      </main>
    </div>
  )
} 