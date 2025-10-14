"use client"

import Image from "next/image"
import Link from "next/link"
import useSWR from "swr"
import { useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Bell, ChevronDown, ChevronRight, Folder, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Project = { id: string; name: string }
const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  const { data, isLoading } = useSWR<{ projects: Project[] }>(
    "/api/projects",
    fetcher,
    { revalidateOnFocus: false }
  )
  const projects = useMemo(() => data?.projects ?? [], [data])

  const [openProjects, setOpenProjects] = useState(false)
  if (!isLoading && projects.length > 0 && !openProjects) {
    setTimeout(() => setOpenProjects(true), 0)
  }

  const isInProjects = pathname.startsWith("/project")
  const isInAlerts = pathname.startsWith("/alerts")

  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "User"

  return (
    <Sidebar side="left" collapsible="none" className="w-[240px] bg-white border-r">
      {/* Brand (now clickable to /project) */}
      <SidebarHeader className="p-4">
        <Link
          href="/project"
          className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          aria-label="Go to Projects"
        >
          <Image src="/deply-mark.svg" alt="Deply" width={24} height={24} />
          <span className="text-base leading-6 font-normal text-black">Deply</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu className="px-2">
          {/* PROJECTS ROW */}
          <SidebarMenuItem className="mt-2">
            <div
              className={`group flex h-10 w-full items-center rounded-md px-2 text-[16px] transition-colors
                ${isInProjects ? "bg-gray-200 text-gray-900" : "text-[#111] hover:bg-gray-100"}`}
            >
              <Link href="/project" className="flex min-w-0 flex-1 items-center gap-2">
                <Folder className="h-4 w-4" />
                <span className="truncate">Projects</span>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpenProjects((v) => !v)
                }}
                aria-expanded={openProjects}
                aria-label={openProjects ? "Collapse projects" : "Expand projects"}
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
              >
                {openProjects ? (
                  <ChevronDown className="h-4 w-4 text-black" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-black" />
                )}
              </button>
            </div>
          </SidebarMenuItem>

          {openProjects && (
            <div className="mt-1 max-h-40 overflow-y-auto pl-4 pr-1">
              <SidebarMenu>
                {isLoading && (
                  <SidebarMenuItem>
                    <div className="h-8 w-full animate-pulse rounded-md bg-gray-100" />
                  </SidebarMenuItem>
                )}
                {!isLoading && projects.length === 0 && (
                  <SidebarMenuItem>
                    <div className="px-2 py-2 text-xs text-gray-500">No projects yet</div>
                  </SidebarMenuItem>
                )}
                {projects.map((p) => {
                  const href = `/project/${encodeURIComponent(p.id)}`
                  const active = pathname === href
                  return (
                    <SidebarMenuItem key={p.id}>
                      <Link
                        href={href}
                        className={`flex h-8 w-full items-center rounded-md px-3 text-xs font-medium transition-colors
                          ${active ? "bg-gray-200 text-gray-900" : "text-black hover:bg-gray-100"}`}
                      >
                        <span className="truncate">{p.name}</span>
                      </Link>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </div>
          )}

          {/* ALERT CENTER ROW */}
          <SidebarMenuItem className="mt-3">
            <Link
              href="/alerts"
              className={`flex h-10 w-full items-center gap-2 rounded-md px-2 text-[16px] transition-colors
                ${isInAlerts ? "bg-gray-200 text-gray-900" : "text-[#111] hover:bg-gray-100"}`}
            >
              <Bell className="h-4 w-4" />
              <span>Alert Center</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      {/* User block */}
      <SidebarFooter className="mt-auto border-t px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.imageUrl ?? ""} alt={displayName} />
            <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-black">{displayName}</div>
          </div>
          <Link href="/settings" aria-label="User settings">
            <Settings className="h-5 w-5 text-gray-700 hover:text-black" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
