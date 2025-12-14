"use client"

import Link from "next/link"
import Image from "next/image"
import {useEffect, useMemo, useState} from "react"
import {usePathname} from "next/navigation"
import {useUser} from "@clerk/nextjs"
import {Home, Settings} from "lucide-react"

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
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/ui/button"
import {cn} from "@/lib/utils"
import {colors} from "@/lib/design-system"
import {useEnsureBackendUser} from "@/lib/useEnsureBackendUser";
import BrandWord from "@/components/landing/BrandWord";

// ---------- Types ----------
type Project = {
    id: string
    name: string
    language?: string | null
    status?: string
}

// ---------- Helpers ----------
function ProjectIcon({language}: { language?: string | null }) {
    const lang = language?.toLowerCase()
    const cls = "h-4 w-4 bg-transparent"
    if (["javascript", "typescript", "react", "nodejs"].includes(lang ?? "")) {
        return <img src="/Node_logo.png" alt="Node.js" className={cls}/>
    }
    if (lang === "vue") return <img src="/Vue_logo.png" alt="Vue" className={cls}/>
    if (lang === "python") return <img src="/Python_logo.png" alt="Python" className={cls}/>
    if (lang === "go") return <img src="/Go_logo.png" alt="Go" className={cls}/>
    if (lang === "java") return <img src="/Java_logo.png" alt="Java" className={cls}/>
    if (lang === "rust") return <img src="/Rust_logo.png" alt="Rust" className={cls}/>
    if (lang === "ruby") return <img src="/Ruby_logo.png" alt="Ruby" className={cls}/>
    return <img src="/Deply_Logo.png" alt="Deply" className={cls}/>
}

function normalizeProjects(payload: any): Project[] {
    const list =
        (Array.isArray(payload) && payload) ||
        (Array.isArray(payload?.projects) && payload.projects) ||
        (Array.isArray(payload?.data) && payload.data) ||
        (Array.isArray(payload?.items) && payload.items) ||
        (Array.isArray(payload?.result) && payload.result) ||
        (Array.isArray(payload?.data?.projects) && payload.data.projects) ||
        []

    return list
        .map((p: any) => ({
            id: p.id ?? p.project_id ?? p._id ?? p.uuid ?? null,
            name: p.name ?? p.project_name ?? p.repo_name ?? p.slug ?? "Untitled",
            language: p.language ?? p.primary_language ?? p.lang ?? p.stack ?? null,
            status: p.status ?? p.project_status ?? null,
        }))
        .filter((p: Project) => p.id && p.name)
}

// ---------- Component ----------
export default function AppSidebar() {
    // always go through our Next.js proxy (adds Clerk JWT)
    const apiBase = "/api/backend";
    const {backendUserId, isEnsured} = useEnsureBackendUser(apiBase)
    const pathname = usePathname()
    const {user, isLoaded} = useUser()
    const {state, isMobile} = useSidebar()
    const isCollapsed = state === "collapsed"

    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [globalProjectsLoading, setGlobalProjectsLoading] = useState(false)


    useEffect(() => {
        let cancelled = false

        const load = async () => {
            if (!isLoaded || !isEnsured || !backendUserId) return
            try {
                setIsLoading(true)
                const url = `${apiBase}/projects/user/${backendUserId}?t=${Date.now()}` // cache-bust
                console.log("[Sidebar] Fetching:", url)
                const res = await fetch(url, {
                    headers: {"Content-Type": "application/json"},
                    credentials: "include",
                    cache: "no-store",
                })
                if (!res.ok) throw new Error(`Projects fetch failed: ${res.status}`)
                const json = await res.json()
                const normalized = normalizeProjects(json)
                if (!cancelled) setProjects(normalized)
            } catch (e) {
                console.error("Sidebar: failed to load projects", e)
                if (!cancelled) setProjects([])
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        // initial load
        load()

        // refresh when a project is created
        const onInvalidate = () => load()
        window.addEventListener("projects:invalidate", onInvalidate)
        return () => {
            cancelled = true
            window.removeEventListener("projects:invalidate", onInvalidate)
        }
    }, [isLoaded, isEnsured, backendUserId, apiBase])

    useEffect(() => {
        const handleLoading = () => setGlobalProjectsLoading(true)
        const handleLoaded = () => setGlobalProjectsLoading(false)

        window.addEventListener("projects:loading", handleLoading)
        window.addEventListener("projects:loaded", handleLoaded)

        return () => {
            window.removeEventListener("projects:loading", handleLoading)
            window.removeEventListener("projects:loaded", handleLoaded)
        }
    }, [])

    const showLoading = isLoading || globalProjectsLoading


    const mainNavItems = useMemo(
        () => [
            {title: "Dashboard", href: "/project", icon: Home},
        ],
        []
    )

    const displayName =
        user?.fullName ||
        user?.username ||
        user?.primaryEmailAddress?.emailAddress ||
        "User"

    return (
        <Sidebar
            variant="sidebar"
            collapsible="icon"
            side="left"
            style={{backgroundColor: colors.background.card}}
        >
            <SidebarRail/>

            {/* Header: brand + collapse trigger */}
            <SidebarHeader className="relative">
                <div
                    className={cn(
                        "flex items-center gap-2 px-4 py-3",
                        isCollapsed && !isMobile && "justify-center px-2"
                    )}
                >
                    {(!isCollapsed || isMobile) && (
                        <Link
                            href="/project"
                            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-neutral-800"
                            aria-label="Go to Projects"
                        >
                            <Image
                                src="/deply-mark.svg"
                                alt="Deply"
                                width={24}
                                height={24}
                                className="h-6 w-6 object-contain flex-shrink-0"
                            />
                            <BrandWord variant="shield" className="text-base leading-6"/>
                        </Link>
                    )}
                    {!isMobile && (
                        <SidebarTrigger
                            className={cn(isCollapsed ? "w-full flex justify-center" : "ml-auto")}
                            aria-label="Toggle sidebar"
                        >
                            <Image
                                src="/deply-mark.svg"
                                alt="Deply"
                                width={24}
                                height={24}
                                className={cn("h-6 w-6 object-contain flex-shrink-0", !isCollapsed && "hidden")}
                            />
                        </SidebarTrigger>
                    )}
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {mainNavItems.map((item) => {
                                const active = pathname === item.href
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={isCollapsed && !isMobile ? item.title : undefined}
                                            className={cn(
                                                "flex items-center rounded-md transition-colors w-full",
                                                isCollapsed && !isMobile ? "justify-center py-2" : "px-4 py-2",
                                                active
                                                    ? "bg-gray-200 text-gray-900 dark:bg-neutral-800 dark:text-white"
                                                    : "hover:bg-gray-100 dark:hover:bg-neutral-800"
                                            )}
                                        >
                                            <Link href={item.href} className="flex items-center gap-3">
                                                <item.icon
                                                    className={cn(
                                                        "h-5 w-5 shrink-0",
                                                        active ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                                                    )}
                                                />
                                                {(!isCollapsed || isMobile) && (
                                                    <span className="font-medium truncate">{item.title}</span>
                                                )}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Projects */}
                <SidebarGroup>
                    <SidebarGroupLabel>Projects</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {/* Loading row */}
                            {showLoading && (
                                <SidebarMenuItem>
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 rounded-md w-full px-4 py-2",
                                            isCollapsed && !isMobile ? "justify-center" : ""
                                        )}
                                    >
                                        {/* icon skeleton */}
                                        <div className="w-4 h-4 rounded-full bg-gray-600 animate-pulse"/>

                                        {/* text skeleton (only when expanded) */}
                                        {(!isCollapsed || isMobile) && (
                                            <div className="flex flex-col gap-2 flex-1">
                                                <div className="h-3 w-24 rounded bg-gray-600 animate-pulse"/>
                                                <div className="h-3 w-16 rounded bg-gray-600 animate-pulse"/>
                                            </div>
                                        )}
                                    </div>
                                </SidebarMenuItem>
                            )}

                            {/* No data row */}
                            {!showLoading && projects.length === 0 && (
                                <SidebarMenuItem>
                                    <div
                                        className={cn(
                                            "flex items-center rounded-md w-full px-4 py-2 text-muted-foreground",
                                            isCollapsed && !isMobile ? "justify-center" : ""
                                        )}
                                    >
                                        <Image src="/Deply_Logo.png" alt="Deply" width={16} height={16}
                                               className="h-4 w-4"/>
                                        {(!isCollapsed || isMobile) &&
                                            <span className="ml-3 text-sm">No projects</span>}
                                    </div>
                                </SidebarMenuItem>
                            )}

                            {/* Project rows */}
                            {!showLoading &&
                                projects.map((project) => {
                                    const href = `/project/${project.id}`
                                    const isCreating = project.status === "creating"
                                    const active = !isCreating && pathname.startsWith(href)
                                    return (
                                        <SidebarMenuItem key={project.id}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active}
                                                tooltip={isCollapsed && !isMobile ? project.name : undefined}
                                                className={cn(
                                                    "flex items-center rounded-md transition-colors w-full",
                                                    isCollapsed && !isMobile ? "justify-center py-2" : "px-4 py-2",
                                                    active
                                                        ? "bg-gray-200 text-gray-900 dark:bg-neutral-800 dark:text-white"
                                                        : "hover:bg-gray-100 dark:hover:bg-neutral-800",
                                                    isCreating && "opacity-50 cursor-not-allowed pointer-events-none"
                                                )}
                                            >
                                                {isCreating ? (
                                                    <div className="flex items-center gap-3">
                                                        <ProjectIcon language={project.language}/>
                                                        {(!isCollapsed || isMobile) && (
                                                            <span
                                                                className="font-medium truncate text-sm">{project.name}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link href={href} className="flex items-center gap-3">
                                                        <ProjectIcon language={project.language}/>
                                                        {(!isCollapsed || isMobile) && (
                                                            <span
                                                                className="font-medium truncate text-sm">{project.name}</span>
                                                        )}
                                                    </Link>
                                                )}
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer with Clerk user avatar + settings */}
            <SidebarFooter>
                {isCollapsed && !isMobile ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.imageUrl ?? ""} alt={displayName}/>
                            <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Link href="/settings">
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Settings">
                                <Settings className="h-4 w-4"/>
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-4">
                        <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={user?.imageUrl ?? ""} alt={displayName}/>
                            <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{displayName}</div>
                            {user?.primaryEmailAddress?.emailAddress && (
                                <div className="truncate text-xs text-muted-foreground">
                                    {user.primaryEmailAddress.emailAddress}
                                </div>
                            )}
                        </div>
                        <Link href="/settings" aria-label="User settings" className="ml-auto">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings className="h-4 w-4"/>
                            </Button>
                        </Link>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    )
}
