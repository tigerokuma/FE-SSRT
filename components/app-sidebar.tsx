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
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home,
      description: "Overview and key metrics"
    },
    {
      title: "Repository Activity",
      href: "/repository",
      icon: GitBranch,
      description: "Monitor repository changes and updates"
    },
    {
      title: "Alert Center",
      href: "/alerts",
      icon: AlertTriangle,
      description: "View and manage security alerts"
    },
    {
      title: "Dependency Watchlist",
      href: "/dependencies",
      icon: Package,
      description: "Track project dependencies"
    },
    {
      title: "Semantic Graph Export",
      href: "/graph-export",
      icon: BarChart3,
      description: "Export and analyze dependency graphs"
    },
    {
      title: "Team Alert Routing",
      href: "/team-routing",
      icon: Users,
      description: "Configure team notifications"
    },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="relative border-b">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2",
          isCollapsed && "justify-center px-2"
        )}>
          {!isCollapsed && (
            <>
              <Box className="h-6 w-6" />
              <div className="font-semibold">
                OSS Tracker
              </div>
            </>
          )}
          <SidebarTrigger className={cn(
            isCollapsed ? "w-full flex justify-center" : "ml-auto"
          )}>
            <Box className={cn(
              "h-6 w-6",
              !isCollapsed && "hidden"
            )} />
          </SidebarTrigger>
        </div>
        <div className={cn(
          "px-4 pb-2 transition-all duration-300",
          isCollapsed && "hidden"
        )}>
          <Input 
            placeholder="Search repositories..." 
            className="h-9"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href} className="px-2">
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={isCollapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-md",
                      isCollapsed && "[&>a]:justify-center"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <div className={cn(
                        "flex flex-col gap-1 min-w-0",
                        isCollapsed && "hidden"
                      )}>
                        <span className="font-medium truncate leading-none">{item.title}</span>
                        <span className="text-xs text-muted-foreground truncate leading-none">{item.description}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className={cn(
          "transition-all duration-300",
          isCollapsed && "hidden"
        )}>
          <SidebarSeparator className="my-4" />
          <SidebarGroup>
            <SidebarGroupLabel>Recent Repositories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton 
                    asChild 
                    tooltip={isCollapsed ? "lodash/lodash" : undefined}
                    className="flex items-center px-4 py-2.5 rounded-md"
                  >
                    <Link href="/repository?repo=lodash/lodash" className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4 shrink-0" />
                      <span className="truncate">lodash/lodash</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton 
                    asChild 
                    tooltip={isCollapsed ? "vercel/next.js" : undefined}
                    className="flex items-center px-4 py-2.5 rounded-md"
                  >
                    <Link href="/repository?repo=vercel/next.js" className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4 shrink-0" />
                      <span className="truncate">vercel/next.js</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem className="px-2">
                  <SidebarMenuButton 
                    asChild 
                    tooltip={isCollapsed ? "facebook/react" : undefined}
                    className="flex items-center px-4 py-2.5 rounded-md"
                  >
                    <Link href="/repository?repo=facebook/react" className="flex items-center gap-3">
                      <GitBranch className="h-4 w-4 shrink-0" />
                      <span className="truncate">facebook/react</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className={cn(
          "flex items-center gap-2 p-4",
          isCollapsed && "justify-center p-2"
        )}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className={cn(
            "flex flex-col min-w-0",
            isCollapsed && "hidden"
          )}>
            <span className="text-sm font-medium truncate">Jane Doe</span>
            <span className="text-xs text-muted-foreground truncate">DevSecOps Lead</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-8 w-8 ml-auto",
              isCollapsed && "ml-0"
            )}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
