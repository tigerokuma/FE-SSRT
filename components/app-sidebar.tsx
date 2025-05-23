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
    },
    {
      title: "Repository Activity",
      href: "/repository",
      icon: GitBranch,
    },
    {
      title: "Alert Center",
      href: "/alerts",
      icon: AlertTriangle,
    },
    {
      title: "Dependency Watchlist",
      href: "/dependencies",
      icon: Package,
    },
    {
      title: "Semantic Graph Export",
      href: "/graph-export",
      icon: BarChart3,
    },
    {
      title: "Team Alert Routing",
      href: "/team-routing",
      icon: Users,
    },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="relative">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2",
          isCollapsed && "justify-center px-2"
        )}>
          {!isCollapsed && (
            <>
              <Box className="h-6 w-6" />
              <div className="font-semibold">
                OpenSource Insight
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
          "px-2 pb-2 transition-all duration-300",
          isCollapsed && "hidden"
        )}>
          <Input placeholder="Search repositories..." />
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href} 
                    tooltip={item.title}
                    className={cn(
                      "flex items-center",
                      isCollapsed && "[&>a]:justify-center"
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className={cn(
                        "transition-all duration-300",
                        isCollapsed && "hidden"
                      )}>{item.title}</span>
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
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Recent Repositories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="lodash/lodash"
                    className="flex items-center"
                  >
                    <Link href="/repository?repo=lodash/lodash">
                      <GitBranch className="h-4 w-4" />
                      <span>lodash/lodash</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="vercel/next.js"
                    className="flex items-center"
                  >
                    <Link href="/repository?repo=vercel/next.js">
                      <GitBranch className="h-4 w-4" />
                      <span>vercel/next.js</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    tooltip="facebook/react"
                    className="flex items-center"
                  >
                    <Link href="/repository?repo=facebook/react">
                      <GitBranch className="h-4 w-4" />
                      <span>facebook/react</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className={cn(
          "flex items-center gap-2 p-4",
          isCollapsed && "justify-center p-2"
        )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className={cn(
            "flex flex-col transition-all duration-300",
            isCollapsed && "hidden"
          )}>
            <span className="text-sm font-medium">Jane Doe</span>
            <span className="text-xs text-muted-foreground">DevSecOps Lead</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "ml-auto",
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
