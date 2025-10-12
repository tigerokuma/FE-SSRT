"use client"

import { Bell, Home, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { colors } from "@/lib/design-system"
import { AuthService } from "@/lib/auth"

interface Project {
  id: string
  name: string
  description?: string
  repository_url?: string
  status: string
  error_message?: string
  created_at: string
  updated_at: string
  type?: 'repo' | 'file' | 'cli'
  language?: string
  license?: string | null
}

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
  const [projects, setProjects] = useState<Project[]>([])

  // Function to get project icon based on language (same as homescreen)
  const getProjectIcon = (project: Project) => {
    const language = project.language?.toLowerCase()
    
    // React/JavaScript projects
    if (language === 'javascript' || language === 'typescript' || language === 'react' || language === 'nodejs') {
      return <img src="/Node_logo.png" alt="Node.js" className="h-4 w-4 bg-transparent" />
    }
    
    // Vue projects
    if (language === 'vue') {
      return <img src="/Vue_logo.png" alt="Vue" className="h-4 w-4 bg-transparent" />
    }
    
    // Python projects
    if (language === 'python') {
      return <img src="/Python_logo.png" alt="Python" className="h-4 w-4 bg-transparent" />
    }
    
    // Go projects
    if (language === 'go') {
      return <img src="/Go_logo.png" alt="Go" className="h-4 w-4 bg-transparent" />
    }
    
    // Java projects
    if (language === 'java') {
      return <img src="/Java_logo.png" alt="Java" className="h-4 w-4 bg-transparent" />
    }
    
    // Rust projects
    if (language === 'rust') {
      return <img src="/Rust_logo.png" alt="Rust" className="h-4 w-4 bg-transparent" />
    }
    
    // Ruby projects
    if (language === 'ruby') {
      return <img src="/Ruby_logo.png" alt="Ruby" className="h-4 w-4 bg-transparent" />
    }
    
    // Default to Deply logo for unknown languages
    return <img src="/Deply_Logo.png" alt="Deply" className="h-4 w-4 bg-transparent" />
  }

  // Fetch projects function (same as homescreen)
  const fetchProjects = async () => {
    try {
      const response = await AuthService.fetchWithAuth('http://localhost:3000/projects/user/user-123')
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      
      const data = await response.json()
      setProjects(data)
      return data
    } catch (err) {
      console.error('Error fetching projects:', err)
      throw err
    }
  }

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: Home
    },
    {
      title: "Alert Center",
      href: "/alerts",
      icon: Bell
    },
    // {
    //   title: "Team Alert Routing",
    //   href: "/team-routing",
    //   icon: Users
    // },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon" style={{ backgroundColor: colors.background.card }}>
      <SidebarRail />
      <SidebarHeader className="relative">
        <div className={cn(
          "flex items-center gap-2 px-4 py-3",
          isCollapsed && !isMobile && "justify-center px-2"
        )}>
          {(!isCollapsed || isMobile) && (
            <>
              <img src="/Deply_Logo.png" alt="Deply" className="h-6 w-6" />
              <div className="font-semibold">
                Deply
              </div>
            </>
          )}
          {!isMobile && (
            <SidebarTrigger className={cn(
              isCollapsed ? "w-full flex justify-center" : "ml-auto"
            )}>
              <img src="/Deply_Logo.png" alt="Deply" className={cn(
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

        {projects.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {projects.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton 
                      asChild 
                      tooltip={isCollapsed && !isMobile ? project.name : undefined}
                      className={cn(
                        "flex items-center rounded-md transition-colors w-full",
                        isCollapsed && !isMobile ? "justify-center py-2" : "px-4 py-2"
                      )}
                    >
                      <Link href={`/project/${project.id}`} className="flex items-center gap-3">
                        {getProjectIcon(project)}
                        {(!isCollapsed || isMobile) && (
                          <span className="font-medium truncate text-sm">{project.name}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
            <Link href="/settings">
              <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 ml-auto"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
