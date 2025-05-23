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
          "flex items-center gap-2 px-4 py-3",
          isCollapsed && "justify-center px-2"
        )}>
          {!isCollapsed && (
            <>
              <Box className="h-5 w-5 shrink-0" />
              <div className="font-semibold truncate">
                OSS Tracker
              </div>
            </>
          )}
          <SidebarTrigger className={cn(
            "ml-auto",
            isCollapsed && "w-full flex justify-center"
          )}>
            <Box className={cn(
              "h-5 w-5",
              !isCollapsed && "hidden"
            )} />
          </SidebarTrigger>
        </div>
        <div className={cn(
          "px-4 pb-3 transition-all duration-300",
          isCollapsed && "hidden"
        )}>
          <Input 
            placeholder="Search repositories..." 
            className="h-9"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2">Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={isCollapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 w-full",
                      isCollapsed && "[&>a]:justify-center"
                    )}
                  >
                    <Link href={item.href} className="flex items-center gap-3 flex-1">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <div className={cn(
                        "flex flex-col gap-0.5 min-w-0",
                        isCollapsed && "hidden"
                      )}>
                        <span className="font-medium truncate">{item.title}</span>
                        <span className="text-xs text-muted-foreground truncate">{item.description}</span>
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
            <SidebarGroupLabel className="px-2">Recent Repositories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={isCollapsed ? "lodash/lodash" : undefined}
                    className="flex items-center px-2 py-2 w-full"
                  >
                    <Link href="/repository?repo=lodash/lodash" className="flex items-center gap-3 w-full">
                      <GitBranch className="h-4 w-4 shrink-0" />
                      <span className="truncate">lodash/lodash</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={isCollapsed ? "vercel/next.js" : undefined}
                    className="flex items-center px-2 py-2 w-full"
                  >
                    <Link href="/repository?repo=vercel/next.js" className="flex items-center gap-3 w-full">
                      <GitBranch className="h-4 w-4 shrink-0" />
                      <span className="truncate">vercel/next.js</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={isCollapsed ? "facebook/react" : undefined}
                    className="flex items-center px-2 py-2 w-full"
                  >
                    <Link href="/repository?repo=facebook/react" className="flex items-center gap-3 w-full">
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
            "flex flex-col min-w-0 transition-all duration-300",
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
