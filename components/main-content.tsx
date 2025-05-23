"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export function MainContent({ children }: { children: React.ReactNode }) {
  const { toggleSidebar, state } = useSidebar()
  
  return (
    <>
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
        className={`
          flex-1 
          overflow-x-hidden 
          transition-all 
          duration-300 
          ${state === "collapsed" ? "md:pl-14" : "md:pl-4"}
          p-6
        `}
      >
        <div className="mx-auto max-w-7xl w-full">
          {children}
        </div>
      </main>
    </>
  )
} 