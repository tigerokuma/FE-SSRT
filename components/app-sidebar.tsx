"use client"

import { AlertTriangle, BarChart3, Box, GitBranch, Home, Package, Settings, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed"

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home
    },
    {
      title: "Alert Center",
      href: "/alerts",
      icon: AlertTriangle
    },
    {
      title: "Dependency Watchlist",
      href: "/dependencies",
      icon: Package
    },
    {
      title: "Semantic Graph Export",
      href: "/graph-export",
      icon: BarChart3
    },
    {
      title: "Team Alert Routing",
      href: "/team-routing",
      icon: Users
    },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="relative">
        <div className={cn(
          "flex items-center gap-2 px-4 py-3",
          isCollapsed && !isMobile && "justify-center px-2"
        )}>
          {(!isCollapsed || isMobile) && (
            <>
              <Box className="h-6 w-6" />
              <div className="font-semibold">
                OSS Tracker
              </div>
            </>
          )}
          {!isMobile && (
            <SidebarTrigger className={cn(
              isCollapsed ? "w-full flex justify-center" : "ml-auto"
            )}>
              <Box className={cn(
                "h-6 w-6",
                !isCollapsed && "hidden"
              )} />
            </SidebarTrigger>
          )}
        </div>

      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={isCollapsed && !isMobile ? item.title : undefined}
                    className={cn(
                      "flex items-center rounded-md transition-colors w-full",
                      isCollapsed && !isMobile ? "justify-center py-2" : "px-4 py-2",
                      pathname === item.href && "bg-muted"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0",
                        pathname === item.href && "text-foreground",
                        pathname !== item.href && "text-muted-foreground"
                      )} />
                      {(!isCollapsed || isMobile) && (
                        <span className="font-medium truncate">{item.title}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter>
        {isCollapsed && !isMobile ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src="/placeholder-user.jpg" alt="User" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">Jane Doe</span>
              <span className="text-xs text-muted-foreground truncate">DevSecOps Lead</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 ml-auto"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
