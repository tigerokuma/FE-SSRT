"use client"

import {useState, useEffect, useRef} from "react"
import {useParams, useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Badge} from "@/components/ui/badge"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Switch} from "@/components/ui/switch"
import {
    Calendar,
    ExternalLink,
    Github,
    Search,
    Plus,
    MoreHorizontal,
    User,
    RefreshCw,
    Copy,
    Check,
    Trash2,
    Download,
    ArrowLeft,
    Shield,
    ShieldCheck,
    MessageSquare,
    X,
    AlertTriangle,
    Clock,
    Users,
    FileText,
    ExternalLink as ExternalLinkIcon,
    Bell,
    MessageCircle,
    Activity,
    ChevronDown,
    GitBranch,
    Terminal
} from "lucide-react"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import {toast} from "@/hooks/use-toast"
import {WatchlistSearchDialog} from "@/components/watchlist/WatchlistSearchDialog"
import {WatchlistPackageCard} from "@/components/watchlist/WatchlistPackageCard"
import {DependencyPackageCard} from "@/components/dependencies/DependencyPackageCard"
import {ProjectTopBar} from "@/components/ProjectTopBar"
import {colors} from "@/lib/design-system"
import {checkLicenseCompatibility} from "@/lib/license-utils"
import {
    calculateComplianceData,
    getLicenseDisplayName as getComplianceLicenseDisplayName,
    getLicenseColor
} from "@/lib/compliance-utils"
import {useProjects} from "@/hooks/use-projects"
import {useUser} from "@clerk/nextjs";

// Function to get project language icon based on language
const getProjectLanguageIcon = (language?: string) => {
    const lang = language?.toLowerCase()

    // React/JavaScript projects
    if (lang === 'javascript' || lang === 'typescript' || lang === 'react' || lang === 'nodejs') {
        return <img src="/Node_logo.png" alt="Node.js" className="h-6 w-6 bg-transparent"/>
    }

    // Vue projects
    if (lang === 'vue') {
        return <img src="/Vue_logo.png" alt="Vue" className="h-6 w-6 bg-transparent"/>
    }

    // Python projects
    if (lang === 'python') {
        return <img src="/Python_logo.png" alt="Python" className="h-6 w-6 bg-transparent"/>
    }

    // Go projects
    if (lang === 'go') {
        return <img src="/Go_logo.png" alt="Go" className="h-6 w-6 bg-transparent"/>
    }

    // Java projects
    if (lang === 'java') {
        return <img src="/Java_logo.png" alt="Java" className="h-6 w-6 bg-transparent"/>
    }

    // Rust projects
    if (lang === 'rust') {
        return <img src="/Rust_logo.png" alt="Rust" className="h-6 w-6 bg-transparent"/>
    }

    // Ruby projects
    if (lang === 'ruby') {
        return <img src="/Ruby_logo.png" alt="Ruby" className="h-6 w-6 bg-transparent"/>
    }

    // Default to Deply logo for unknown languages
    return <img src="/Deply_Logo.png" alt="Deply" className="h-6 w-6 bg-transparent"/>
}

// Function to get display name for language
const getLanguageDisplayName = (language: string) => {
    const lang = language.toLowerCase()

    if (lang === 'nodejs') return 'Node.js'
    if (lang === 'javascript') return 'JavaScript'
    if (lang === 'typescript') return 'TypeScript'
    if (lang === 'react') return 'React'
    if (lang === 'vue') return 'Vue.js'
    if (lang === 'python') return 'Python'
    if (lang === 'go') return 'Go'
    if (lang === 'java') return 'Java'
    if (lang === 'rust') return 'Rust'
    if (lang === 'ruby') return 'Ruby'

    // Capitalize first letter for unknown languages
    return language.charAt(0).toUpperCase() + language.slice(1)
}

// Function to get display name for license
const getLicenseDisplayName = (license: string) => {
    const lic = license.toLowerCase()

    if (lic === 'mit') return 'MIT License'
    if (lic === 'apache-2.0') return 'Apache 2.0'
    if (lic === 'gpl-3.0') return 'GPL 3.0'
    if (lic === 'bsd-3-clause') return 'BSD 3-Clause'
    if (lic === 'isc') return 'ISC License'
    if (lic === 'lgpl-3.0') return 'LGPL 3.0'
    if (lic === 'mpl-2.0') return 'Mozilla Public License 2.0'
    if (lic === 'unlicense') return 'The Unlicense'
    if (lic === 'cc0-1.0') return 'CC0 1.0 Universal'

    // Return as-is for unknown licenses
    return license
}

interface Project {
    id: string
    name: string
    description?: string
    repository_url?: string
    language?: string
    license?: string | null
    type?: 'repo' | 'file' | 'cli'
    status?: string
    created_at: string
    updated_at: string
    vulnerability_notifications?: { alerts: boolean; slack: boolean; discord: boolean }
    license_notifications?: { alerts: boolean; slack: boolean; discord: boolean }
    health_notifications?: { alerts: boolean; slack: boolean; discord: boolean }
    monitoredBranch?: {
        id: string
        repository_url: string
        branch_name: string
        is_active: boolean
    }
}

interface ProjectDependency {
    id: string
    name: string
    version: string
    risk: number
    tags: string[]
    updated_at: string
    created_at: string
    package_id?: string
    package?: {
        id: string
        name: string
        license?: string  // Actual license from Packages table
        status: string
        bus_factor_score?: number
        scorecard_score?: number
        total_score?: number
        activity_score?: number
        vulnerability_score?: number
        license_score?: number
        stars?: number
        contributors?: number
        summary?: string
    }
}

interface WatchlistDependency {
    id: string
    name: string
    version: string
    date_added: string
    reason: string
    added_by: string
}

interface ProjectUser {
    id: string
    project_id: string
    user_id: string
    role: string
    joined_at: string
    user: {
        user_id: string
        name: string
        email: string
    }
}

export default function ProjectDetailPage() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    const {user, isLoaded} = useUser()
    const backendUserId = (user?.publicMetadata as any)?.backendUserId ?? user?.id ?? null
    const [isUserReady, setIsUserReady] = useState(false)


    const params = useParams()
    const router = useRouter()
    const {getProjectById} = useProjects()
    const [project, setProject] = useState<Project | null>(null)
    const [projectDependencies, setProjectDependencies] = useState<ProjectDependency[]>([])
    const [watchlistDependencies, setWatchlistDependencies] = useState<WatchlistDependency[]>([])
    const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([])
    const [projectWatchlist, setProjectWatchlist] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
    const [inviteLink, setInviteLink] = useState<string>('')
    const [showInviteDialog, setShowInviteDialog] = useState(false)
    const [showWatchlistSearchDialog, setShowWatchlistSearchDialog] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [currentTab, setCurrentTab] = useState("overview")
    const [currentSettingsTab, setCurrentSettingsTab] = useState("general")
    const [searchQuery, setSearchQuery] = useState("")
    const [activeFilters, setActiveFilters] = useState<FilterId[]>([])
    const [showFilterPopup, setShowFilterPopup] = useState(false)
    const [tempSelectedFilters, setTempSelectedFilters] = useState<FilterId[]>([])
    const [showDependencyReviewDialog, setShowDependencyReviewDialog] = useState(false)
    const [selectedDependency, setSelectedDependency] = useState<any>(null)
    const [alertFilter, setAlertFilter] = useState("all")
    const [selectedLicense, setSelectedLicense] = useState<string>("")
    const [isSavingLicense, setIsSavingLicense] = useState(false)
    const [projectName, setProjectName] = useState<string>("")
    const [isSavingName, setIsSavingName] = useState(false)
    const [vulnerabilityNotifications, setVulnerabilityNotifications] = useState<{
        alerts: boolean;
        slack: boolean;
        discord: boolean
    }>({alerts: true, slack: false, discord: false})
    const [licenseNotifications, setLicenseNotifications] = useState<{
        alerts: boolean;
        slack: boolean;
        discord: boolean
    }>({alerts: true, slack: false, discord: false})
    const [healthNotifications, setHealthNotifications] = useState<{
        alerts: boolean;
        slack: boolean;
        discord: boolean
    }>({alerts: true, slack: false, discord: false})
    const [isSavingNotifications, setIsSavingNotifications] = useState(false)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [packageStatuses, setPackageStatuses] = useState<{
        [key: string]: { status: string, hasScores: boolean }
    }>({})

    type SortKey = 'name' | 'version' | 'contributors' | 'stars' | 'score'
    type SortDir = 'asc' | 'desc'
    type SortState = { key: SortKey | null; dir: SortDir | null }

    const [sort, setSort] = useState<SortState>({key: null, dir: null})

    const toggleSort = (key: SortKey) => {
        setSort(prev => {
            if (prev.key !== key) return {key, dir: 'desc'}   // first click: DESC
            if (prev.dir === 'desc') return {key, dir: 'asc'} // second click: ASC
            return {key: null, dir: null}                     // third click: off
        })
    }

// small helpers
    const isActive = (key: SortKey) => sort.key === key
    const arrow = (key: SortKey) => isActive(key) ? (sort.dir === 'asc' ? '▲' : '▼') : ''

    const cmp = (a: any, b: any) => (a < b ? -1 : a > b ? 1 : 0)

    const getSortValue = (dep: ProjectDependency, key: SortKey) => {
        switch (key) {
            case 'name':
                return dep.name?.toLowerCase() ?? ''
            case 'version':
                return dep.version ?? ''
            case 'contributors':
                return dep.package?.contributors ?? 0
            case 'stars':
                return dep.package?.stars ?? 0
            case 'score':
                // choose your preferred score; total_score reads like the overall
                return dep.package?.total_score ?? dep.risk ?? 0
        }
    }

    // ---- Filtering types & helpers (extensible) ----
    type FilterId =
        | 'high-risk'
        // | 'low-activity'
        // | 'single-maintainer'
        // | 'vulnerable'
        // | 'weak-license'
        // | 'missing-security-metadata'
        | 'popular'
        | 'few-contributors'
        | 'stale'
    // TODO (keep for later):
    // | 'outdated'
    // | 'non-compliant'
        ;

    type FilterDef = {
        id: FilterId
        label: string
        description: string
        // A predicate that decides if a dependency passes this filter
        // Return `true` if dep should be INCLUDED when this filter is active.
        // (We AND all active filters.)
        predicate: (dep: ProjectDependency, project: Project | null) => boolean
    }
    const daysBetween = (a: string | Date, b: string | Date) =>
        Math.abs((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24))

    // NOTE: these predicates are placeholders you can evolve later.
    // - "outdated": uses tags or a future boolean (dep.package?.is_outdated).
    // - "risky": uses a score threshold; tweak as you like.
    // - "non-compliant": uses your existing checkLicenseCompatibility(project.license, dep.package?.license)
    const FILTER_DEFS: FilterDef[] = [
        {
            id: 'high-risk',
            label: 'High Risk',
            description: 'Total score ≤ 60',
            predicate: (dep) => (dep.package?.total_score ?? dep.risk ?? 100) <= 60,
        },
        // {
        //     id: 'low-activity',
        //     label: 'Low Activity',
        //     description: 'Activity score < 40',
        //     predicate: (dep) => (dep.package?.activity_score ?? 100) < 40,
        // },
        // {
        //     id: 'single-maintainer',
        //     label: 'Single-Maintainer Risk',
        //     description: 'Bus factor < 40',
        //     predicate: (dep) => (dep.package?.bus_factor_score ?? 100) < 40,
        // },
        // {
        //     id: 'vulnerable',
        //     label: 'Vulnerable',
        //     description: 'Vulnerability score < 70',
        //     predicate: (dep) => (dep.package?.vulnerability_score ?? 100) < 70,
        // },
        // {
        //     id: 'weak-license',
        //     label: 'Weak License Score',
        //     description: 'License score < 80',
        //     predicate: (dep) => (dep.package?.license_score ?? 100) < 80,
        // },
        // {
        //     id: 'missing-security-metadata',
        //     label: 'Missing Security Metadata',
        //     description: 'No OpenSSF/scorecard score',
        //     predicate: (dep) => dep.package?.scorecard_score == null,
        // },
        {
            id: 'popular',
            label: 'Popular',
            description: 'Stars ≥ 1000',
            predicate: (dep) => (dep.package?.stars ?? 0) >= 1000,
        },
        {
            id: 'few-contributors',
            label: 'Few Contributors',
            description: 'Contributors < 5',
            predicate: (dep) => (dep.package?.contributors ?? 0) < 5,
        },
        {
            id: 'stale',
            label: 'Stale',
            description: 'Updated > 180 days ago',
            predicate: (dep) => {
                const updated = dep.updated_at
                if (!updated) return false
                return daysBetween(updated, new Date()) > 180
            },
        },

        // ---------- TODO (hide for now) ----------
        // {
        //   id: 'outdated',
        //   label: 'Outdated',
        //   description: 'Newer version available',
        //   predicate: (dep) => dep.tags?.includes('outdated') || (dep as any).is_outdated === true,
        // },
        // {
        //   id: 'non-compliant',
        //   label: 'Non-Compliant',
        //   description: 'License incompatible with project',
        //   predicate: (dep, project) => {
        //     const p = project?.license
        //     const d = dep.package?.license
        //     if (!p || !d) return false
        //     return !checkLicenseCompatibility(p, d).isCompatible
        //   },
        // },
    ]

// handy maps
    const FILTER_BY_ID: Record<FilterId, FilterDef> =
        FILTER_DEFS.reduce((m, f) => (m[f.id] = f, m), {} as any)

    // Calculate compliance data
    const complianceData = project && projectDependencies.length > 0
        ? calculateComplianceData(project, projectDependencies)
        : {
            overallCompliance: 100,
            licenseConflicts: 0,
            vulnerableDependencies: 0,
            totalDependencies: 0,
            nonCompliantDependencies: [],
            vulnerabilityBreakdown: {critical: 0, high: 0, medium: 0, low: 0}
        }

    // Utility function to format dates as relative time
    const formatRelativeDate = (date: Date | string) => {
        const now = new Date()
        const targetDate = new Date(date)
        const diffInMs = now.getTime() - targetDate.getTime()
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

        if (diffInDays === 0) {
            return 'today'
        } else if (diffInDays === 1) {
            return 'yesterday'
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`
        } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7)
            return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
        } else if (diffInDays < 365) {
            const months = Math.floor(diffInDays / 30)
            return months === 1 ? '1 month ago' : `${months} months ago`
        } else {
            const years = Math.floor(diffInDays / 365)
            return years === 1 ? '1 year ago' : `${years} years ago`
        }
    }

    const projectId = params.id as string

    // Debug logging
    console.log('🔍 Project page - params:', params, 'projectId:', projectId)

    // Function to fetch project data
    const fetchProjectData = async () => {
        if (!backendUserId) return;
        try {
            setLoading(true)

            // Fetch project details
            const projectResponse = await fetch(`${apiBase}/projects/${projectId}`)
            if (!projectResponse.ok) {
                throw new Error('Failed to fetch project')
            }
            const projectData = await projectResponse.json()
            console.log('Project data received:', JSON.stringify(projectData, null, 2))
            setProject(projectData)
            setSelectedLicense(projectData.license || 'none')
            setProjectName(projectData.name || '')
            setVulnerabilityNotifications(projectData.vulnerability_notifications ?? {
                alerts: true,
                slack: false,
                discord: false
            })
            setLicenseNotifications(projectData.license_notifications ?? {alerts: true, slack: false, discord: false})
            setHealthNotifications(projectData.health_notifications ?? {alerts: true, slack: false, discord: false})

            // Fetch team members for this project
            const teamResponse = await fetch(`${apiBase}/projects/${projectId}/users`)
            if (teamResponse.ok) {
                const teamData = await teamResponse.json()
                setProjectUsers(teamData)
            }

            // Fetch current user
            const userResponse = await fetch('${apiBase}/auth/me')
            if (userResponse.ok) {
                const userData = await userResponse.json()
                setCurrentUser(userData)
            }

            // Fetch project dependencies
            const dependenciesResponse = await fetch(`${apiBase}/projects/${projectId}/dependencies`)
            if (dependenciesResponse.ok) {
                const dependenciesData = await dependenciesResponse.json()
                setProjectDependencies(dependenciesData)
            }

            // Fetch watchlist dependencies
            const watchlistResponse = await fetch(`${apiBase}/projects/${projectId}/watchlist`)
            if (watchlistResponse.ok) {
                const watchlistData = await watchlistResponse.json()
                setWatchlistDependencies(watchlistData)
            }

            // Check current user's role in the project
            const roleResponse = await fetch(`${apiBase}/projects/${projectId}/user/${backendUserId}/role`)
            if (roleResponse.ok) {
                const roleData = await roleResponse.json()
                setCurrentUserRole(roleData.role)
            }

            // Fetch project watchlist and package statuses
            const [projectWatchlistResponse, packageStatusResponse] = await Promise.all([
                fetch(`${apiBase}/projects/${projectId}/project-watchlist`),
                fetch(`${apiBase}/projects/${projectId}/watchlist/status`)
            ])

            if (projectWatchlistResponse.ok) {
                const projectWatchlistData = await projectWatchlistResponse.json()
                setProjectWatchlist(projectWatchlistData)
            }

            if (packageStatusResponse.ok) {
                const statusData = await packageStatusResponse.json()
                const statusMap: { [key: string]: { status: string, hasScores: boolean } } = {}
                statusData.forEach((pkg: any) => {
                    statusMap[pkg.packageId] = {
                        status: pkg.status,
                        hasScores: pkg.hasScores
                    }
                })
                setPackageStatuses(statusMap)
            }

        } catch (err) {
            console.error('Error fetching project data:', err)
            setError('Failed to load project')
        } finally {
            setLoading(false)
        }
    }


    // Function to save project name change
    const handleProjectNameChange = async (newName: string) => {
        setIsSavingName(true)
        try {
            const response = await fetch(`${apiBase}/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newName
                })
            })

            if (response.ok) {
                setProjectName(newName)
                // Update the project state
                setProject(prev => prev ? {...prev, name: newName} : null)
                toast({
                    title: "Project Name Updated",
                    description: "Project name has been updated successfully.",
                })
            } else {
                throw new Error('Failed to update project name')
            }
        } catch (error) {
            console.error('Error updating project name:', error)
            toast({
                title: "Error",
                description: "Failed to update project name. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSavingName(false)
        }
    }

    // Function to get display text for dropdown button
    const getNotificationDisplayText = (notificationType: 'vulnerability' | 'license' | 'health') => {
        let notifications: { alerts: boolean; slack: boolean; discord: boolean }

        if (notificationType === 'vulnerability') {
            notifications = vulnerabilityNotifications
        } else if (notificationType === 'license') {
            notifications = licenseNotifications
        } else {
            notifications = healthNotifications
        }

        const channels = []
        if (notifications.alerts) channels.push('Alerts Tab')
        if (notifications.slack) channels.push('Slack')
        if (notifications.discord) channels.push('Discord')

        return channels.length > 0 ? channels.join(', ') : 'None'
    }

    // Function to handle add member button
    const handleAddMember = async () => {
        try {
            const joinLink = `${window.location.origin}/join/${projectId}`
            await navigator.clipboard.writeText(joinLink)

            toast({
                title: "Join Link Copied",
                description: "Project join link has been copied to your clipboard. Share this link with team members to invite them to the project.",
            })
        } catch (error) {
            console.error('Error copying to clipboard:', error)
            toast({
                title: "Error",
                description: "Failed to copy join link. Please try again.",
                variant: "destructive",
            })
        }
    }

    // Function to save notification settings
    const handleNotificationChange = async (notificationType: 'vulnerability' | 'license' | 'health', channel: 'alerts' | 'slack' | 'discord', value: boolean) => {
        setIsSavingNotifications(true)
        try {
            const updateData: any = {}
            let newNotifications: { alerts: boolean; slack: boolean; discord: boolean }

            if (notificationType === 'vulnerability') {
                newNotifications = {...vulnerabilityNotifications, [channel]: value}
                updateData.vulnerability_notifications = newNotifications
                setVulnerabilityNotifications(newNotifications)
            } else if (notificationType === 'license') {
                newNotifications = {...licenseNotifications, [channel]: value}
                updateData.license_notifications = newNotifications
                setLicenseNotifications(newNotifications)
            } else if (notificationType === 'health') {
                newNotifications = {...healthNotifications, [channel]: value}
                updateData.health_notifications = newNotifications
                setHealthNotifications(newNotifications)
            }

            const response = await fetch(`${apiBase}/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            })

            if (response.ok) {
                // Update the project state
                setProject(prev => prev ? {
                    ...prev,
                    vulnerability_notifications: notificationType === 'vulnerability' ? newNotifications : prev.vulnerability_notifications,
                    license_notifications: notificationType === 'license' ? newNotifications : prev.license_notifications,
                    health_notifications: notificationType === 'health' ? newNotifications : prev.health_notifications
                } : null)

                toast({
                    title: "Notification Settings Updated",
                    description: `${notificationType.charAt(0).toUpperCase() + notificationType.slice(1)} ${channel} notifications ${value ? 'enabled' : 'disabled'}.`,
                })
            } else {
                throw new Error('Failed to update notification settings')
            }
        } catch (error) {
            console.error('Error updating notification settings:', error)
            toast({
                title: "Error",
                description: "Failed to update notification settings. Please try again.",
                variant: "destructive",
            })
            // Revert the state on error
            if (notificationType === 'vulnerability') {
                setVulnerabilityNotifications(prev => ({...prev, [channel]: !value}))
            } else if (notificationType === 'license') {
                setLicenseNotifications(prev => ({...prev, [channel]: !value}))
            } else if (notificationType === 'health') {
                setHealthNotifications(prev => ({...prev, [channel]: !value}))
            }
        } finally {
            setIsSavingNotifications(false)
        }
    }

    // Function to save license change
    const handleLicenseChange = async (newLicense: string) => {
        setIsSavingLicense(true)
        try {
            const response = await fetch(`${apiBase}/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    license: newLicense === 'none' ? null : newLicense
                })
            })

            if (response.ok) {
                setSelectedLicense(newLicense)
                // Update the project state
                setProject(prev => prev ? {...prev, license: newLicense === 'none' ? null : newLicense} : null)
                toast({
                    title: "License Updated",
                    description: newLicense === 'none' ? "License removed successfully." : "Project license has been updated successfully.",
                })
            } else {
                throw new Error('Failed to update license')
            }
        } catch (error) {
            console.error('Error updating license:', error)
            toast({
                title: "Error",
                description: "Failed to update license. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSavingLicense(false)
        }
    }

    // License options
    const licenses = [
        {value: 'none', label: 'No License'},
        {value: 'MIT', label: 'MIT License'},
        {value: 'Apache-2.0', label: 'Apache 2.0'},
        {value: 'GPL-3.0', label: 'GPL 3.0'},
        {value: 'BSD-3-Clause', label: 'BSD 3-Clause'},
        {value: 'ISC', label: 'ISC License'},
        {value: 'LGPL-3.0', label: 'LGPL 3.0'},
        {value: 'MPL-2.0', label: 'Mozilla Public License 2.0'},
        {value: 'Unlicense', label: 'The Unlicense'},
        {value: 'CC0-1.0', label: 'CC0 1.0 Universal'}
    ]
    useEffect(() => {
        setIsUserReady(isLoaded && !!backendUserId)
    }, [isLoaded, backendUserId])

    useEffect(() => {
        if (projectId && isUserReady) {
            fetchProjectData()
        }
    }, [projectId, isUserReady])

    // Clean package status checking - check individual packages and get data when ready
    useEffect(() => {
        const checkPackageStatuses = async () => {
            const processingPackages = Object.entries(packageStatuses).filter(
                ([_, status]) => status.status === 'queued' || status.status === 'fast'
            )

            if (processingPackages.length === 0) return

            try {
                const response = await fetch(`${apiBase}/projects/${projectId}/watchlist/status`)
                if (!response.ok) return

                const statusData = await response.json()
                const updatedStatuses = {...packageStatuses}
                let hasUpdates = false

                // Check each processing package individually
                for (const [packageId, currentStatus] of processingPackages) {
                    const packageStatus = statusData.find((pkg: any) => pkg.packageId === packageId)
                    if (!packageStatus) continue

                    // If package is done, get the data and stop checking
                    if (packageStatus.status === 'done') {
                        updatedStatuses[packageId] = {
                            status: 'done',
                            hasScores: true
                        }
                        hasUpdates = true

                        // Get the updated package data
                        try {
                            const dataResponse = await fetch(`${apiBase}/projects/${projectId}/project-watchlist`)
                            if (dataResponse.ok) {
                                const watchlistData = await dataResponse.json()
                                setProjectWatchlist(watchlistData)
                            }
                        } catch (error) {
                            console.error('Error fetching updated package data:', error)
                        }
                    }
                }

                if (hasUpdates) {
                    setPackageStatuses(updatedStatuses)
                }
            } catch (error) {
                console.error('Error checking package statuses:', error)
            }
        }

        // Check every 2 seconds for processing packages
        const interval = setInterval(checkPackageStatuses, 2000)

        return () => clearInterval(interval)
    }, [packageStatuses, projectId])

    const handleRefreshDependencies = async () => {
        if (!projectId) return

        try {
            setRefreshing(true)
            const response = await fetch(`${apiBase}/projects/${projectId}/refresh-dependencies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to refresh dependencies')
            }

            // Refresh the dependencies list
            const dependenciesResponse = await fetch(`${apiBase}/projects/${projectId}/dependencies`)
            if (dependenciesResponse.ok) {
                const dependenciesData = await dependenciesResponse.json()
                setProjectDependencies(dependenciesData)
            }

        } catch (err) {
            console.error('Error refreshing dependencies:', err)
            alert('Failed to refresh dependencies. Please try again.')
        } finally {
            setRefreshing(false)
        }
    }

    const handleInviteMember = () => {
        const baseUrl = window.location.origin
        const inviteUrl = `${baseUrl}/join/${projectId}`
        setInviteLink(inviteUrl)
        setShowInviteDialog(true)
    }

    const handleCopyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink)
            toast({
                title: "Invite link copied!",
                description: "Share this link with team members to invite them to the project.",
            })
        } catch (err) {
            console.error('Failed to copy invite link:', err)
            toast({
                title: "Failed to copy link",
                description: "Please try copying the link manually.",
                variant: "destructive",
            })
        }
    }

    const handleWatchlistDependencyAdded = async () => {
        // Refresh project watchlist
        try {
            const projectWatchlistResponse = await fetch(`${apiBase}/projects/${projectId}/project-watchlist`)
            if (projectWatchlistResponse.ok) {
                const projectWatchlistData = await projectWatchlistResponse.json()
                setProjectWatchlist(projectWatchlistData)
            }
        } catch (err) {
            console.error('Error refreshing project watchlist:', err)
        }
    }

    const handleSaveProject = async () => {
        if (!project) return

        try {
            setSaving(true)
            const response = await fetch(`${apiBase}/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: project.name,
                    description: project.description,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to update project')
            }

            toast({
                title: "Project updated!",
                description: "Your project settings have been saved successfully.",
            })

        } catch (err) {
            console.error('Error updating project:', err)
            toast({
                title: "Failed to save",
                description: "Please try again later.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteProject = async () => {
        if (!projectId) return

        try {
            setDeleting(true)
            const response = await fetch(`${apiBase}/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to delete project')
            }

            toast({
                title: "Project deleted!",
                description: "The project has been permanently deleted.",
            })

            // Redirect to home page
            router.push('/project')

        } catch (err) {
            console.error('Error deleting project:', err)
            toast({
                title: "Failed to delete project",
                description: "Please try again later.",
                variant: "destructive",
            })
        } finally {
            setDeleting(false)
            setShowDeleteDialog(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen">
                {/* Project Top Bar */}
                <ProjectTopBar
                    projectName=""
                    projectLanguage=""
                    currentTab="overview"
                    onTabChange={() => {
                    }}
                />

                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    {/* Tab Content - Overview skeleton */}
                    <div className="space-y-6">
                        {/* Project Health Overview */}
                        <Card style={{backgroundColor: colors.background.card}}>
                            <CardHeader>
                                <CardTitle className="text-white">Project Health</CardTitle>
                                <p className="text-gray-400 text-sm">Average dependency risk</p>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Left: Security Score Skeleton */}
                                    <div className="flex flex-col justify-center items-center lg:col-span-3"
                                         style={{marginLeft: 'auto'}}>
                                        <div className="relative w-48 h-48">
                                            <div className="w-48 h-48 bg-gray-600 rounded-full animate-pulse"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="h-16 bg-gray-600 rounded w-16 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Security Score Graph Skeleton */}
                                    <div className="lg:col-span-9">
                                        <div className="h-64 w-full bg-gray-600 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vulnerabilities and License Compliance Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Vulnerabilities */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <CardTitle className="text-white">Vulnerabilities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Total Vulnerabilities Skeleton */}
                                        <div className="text-center">
                                            <div
                                                className="h-8 bg-gray-600 rounded w-16 mx-auto mb-2 animate-pulse"></div>
                                            <div className="h-4 bg-gray-600 rounded w-40 mx-auto animate-pulse"></div>
                                        </div>

                                        {/* Severity Breakdown Skeleton */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
                                                    <span className="text-sm text-gray-300">Critical</span>
                                                </div>
                                                <div className="h-4 bg-gray-600 rounded w-4 animate-pulse"></div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
                                                    <span className="text-sm text-gray-300">High</span>
                                                </div>
                                                <div className="h-4 bg-gray-600 rounded w-4 animate-pulse"></div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
                                                    <span className="text-sm text-gray-300">Medium</span>
                                                </div>
                                                <div className="h-4 bg-gray-600 rounded w-4 animate-pulse"></div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
                                                    <span className="text-sm text-gray-300">Low</span>
                                                </div>
                                                <div className="h-4 bg-gray-600 rounded w-4 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* License Compliance */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <CardTitle className="text-white">License Compliance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Project License Skeleton */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-600 rounded-lg animate-pulse"></div>
                                            <div className="h-5 bg-gray-600 rounded w-24 animate-pulse"></div>
                                        </div>

                                        {/* Compliance Status Skeleton */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Overall Compliance</span>
                                                <div className="h-4 bg-gray-600 rounded w-12 animate-pulse"></div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">License Conflicts</span>
                                                <div className="h-4 bg-gray-600 rounded w-8 animate-pulse"></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="min-h-screen">
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center py-8">
                        <div className="text-red-400 mb-4">{error || 'Project not found'}</div>
                        <Button
                            onClick={() => router.push('/project')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4"/>
                            Back to Projects
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            {/* Project Top Bar */}
            <ProjectTopBar
                projectName={project?.name || ''}
                projectLanguage={project?.language || ''}
                currentTab={currentTab}
                onTabChange={setCurrentTab}
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Tab Content */}
                {currentTab === "overview" && (
                    <div className="space-y-6">
                        {/* Project Health Overview */}
                        <Card style={{backgroundColor: colors.background.card}}>
                            <CardHeader>
                                <CardTitle className="text-white">Project Health</CardTitle>
                                <p className="text-gray-400 text-sm">Average dependency risk</p>
                            </CardHeader>
                            <CardContent>
                                {/* MODIFIED: Changed to a 12-column grid to allow for a wider graph (3/9 split) */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                                    {/* Left: Security Score (3/12 columns on large screens) */}
                                    <div className="flex flex-col justify-center items-center lg:col-span-3"
                                         style={{marginLeft: 'auto'}}>
                                        {/* Security Score with Progress Circle */}
                                        <div className="relative">
                                            <div className="relative w-48 h-48">
                                                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="none"
                                                        className="text-gray-700"
                                                    />
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="none"
                                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.78)}`}
                                                        style={{stroke: 'rgb(84, 0, 250)'}}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="text-6xl font-bold text-white">78</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Security Score Graph (9/12 columns on large screens) */}
                                    <div className="lg:col-span-9">
                                        <div className="h-64 w-full">
                                            {/* MODIFIED: Increased viewBox width from 400 to 600 and adjusted points/text positions */}
                                            <svg className="w-full h-full" viewBox="0 0 600 200">
                                                {/* Grid lines */}
                                                <defs>
                                                    <pattern id="grid" width="20" height="20"
                                                             patternUnits="userSpaceOnUse">
                                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151"
                                                              strokeWidth="0.5" opacity="0.3"/>
                                                    </pattern>
                                                </defs>
                                                <rect width="100%" height="100%" fill="url(#grid)"/>

                                                {/* Y-axis scale numbers (no change) */}
                                                <text x="15" y="25" fill="#9CA3AF" fontSize="12"
                                                      textAnchor="middle">100
                                                </text>
                                                <text x="15" y="60" fill="#9CA3AF" fontSize="12"
                                                      textAnchor="middle">80
                                                </text>
                                                <text x="15" y="95" fill="#9CA3AF" fontSize="12"
                                                      textAnchor="middle">60
                                                </text>
                                                <text x="15" y="130" fill="#9CA3AF" fontSize="12"
                                                      textAnchor="middle">40
                                                </text>
                                                <text x="15" y="165" fill="#9CA3AF" fontSize="12"
                                                      textAnchor="middle">20
                                                </text>
                                                <text x="15" y="195" fill="#9CA3AF" fontSize="12"
                                                      textAnchor="middle">0
                                                </text>

                                                {/* X-axis dates (Adjusted positions for wider graph: 50, 217, 384, 550) */}
                                                <text x="50" y="195" fill="#9CA3AF" fontSize="10"
                                                      textAnchor="middle">30d ago
                                                </text>
                                                <text x="217" y="195" fill="#9CA3AF" fontSize="10"
                                                      textAnchor="middle">20d ago
                                                </text>
                                                <text x="384" y="195" fill="#9CA3AF" fontSize="10"
                                                      textAnchor="middle">10d ago
                                                </text>
                                                <text x="550" y="195" fill="#9CA3AF" fontSize="10"
                                                      textAnchor="middle">Today
                                                </text>

                                                {/* Line chart (Adjusted points for wider graph: 50, 150, 250, 350, 450, 550) */}
                                                <polyline
                                                    fill="none"
                                                    stroke="rgb(84, 0, 250)"
                                                    strokeWidth="3"
                                                    points="50,180 150,160 250,140 350,120 450,100 550,60"
                                                />

                                                {/* Area fill (Adjusted points for wider graph) */}
                                                <polygon
                                                    fill="url(#securityGradient)"
                                                    points="50,180 150,160 250,140 350,120 450,100 550,60 550,180 50,180"
                                                />

                                                {/* Gradient definition (no change) */}
                                                <defs>
                                                    <linearGradient id="securityGradient" x1="0%" y1="0%" x2="0%"
                                                                    y2="100%">
                                                        <stop offset="0%" stopColor="rgb(84, 0, 250)"
                                                              stopOpacity="0.3"/>
                                                        <stop offset="100%" stopColor="rgb(84, 0, 250)"
                                                              stopOpacity="0.05"/>
                                                    </linearGradient>
                                                </defs>

                                                {/* Data points (Adjusted positions for wider graph) */}
                                                <circle cx="50" cy="180" r="3" fill="rgb(84, 0, 250)"/>
                                                <circle cx="250" cy="140" r="3" fill="rgb(84, 0, 250)"/>
                                                <circle cx="450" cy="100" r="3" fill="rgb(84, 0, 250)"/>
                                                <circle cx="550" cy="60" r="3" fill="rgb(84, 0, 250)"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Vulnerabilities and License Compliance Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Vulnerabilities */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <CardTitle className="text-white">Vulnerabilities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Total Vulnerabilities */}
                                        <div className="text-center">
                                            <div
                                                className="text-3xl font-bold text-white">{complianceData.vulnerableDependencies}</div>
                                            <div className="text-sm text-gray-400">Total active vulnerabilities</div>
                                        </div>

                                        {/* Severity Breakdown */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                    <span className="text-sm text-gray-300">Critical</span>
                                                </div>
                                                <span
                                                    className="text-white font-semibold">{complianceData.vulnerabilityBreakdown.critical}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                                    <span className="text-sm text-gray-300">High</span>
                                                </div>
                                                <span
                                                    className="text-white font-semibold">{complianceData.vulnerabilityBreakdown.high}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                    <span className="text-sm text-gray-300">Medium</span>
                                                </div>
                                                <span
                                                    className="text-white font-semibold">{complianceData.vulnerabilityBreakdown.medium}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                    <span className="text-sm text-gray-300">Low</span>
                                                </div>
                                                <span
                                                    className="text-white font-semibold">{complianceData.vulnerabilityBreakdown.low}</span>
                                            </div>
                                        </div>

                                    </div>
                                </CardContent>
                            </Card>

                            {/* License Compliance */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <CardTitle className="text-white">License Compliance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Project License */}
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                project?.license === 'MIT' ? 'bg-green-500/20' :
                                                    project?.license === 'Apache-2.0' ? 'bg-blue-500/20' :
                                                        project?.license === 'GPL-2.0' || project?.license === 'GPL-3.0' ? 'bg-red-500/20' :
                                                            'bg-gray-500/20'
                                            }`}>
                        <span className={`font-bold text-sm ${
                            project?.license === 'MIT' ? 'text-green-400' :
                                project?.license === 'Apache-2.0' ? 'text-blue-400' :
                                    project?.license === 'GPL-2.0' || project?.license === 'GPL-3.0' ? 'text-red-400' :
                                        'text-gray-400'
                        }`}>
                          {project?.license ? project.license.substring(0, 3).toUpperCase() : 'N/A'}
                        </span>
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">
                                                    {project?.license ? getComplianceLicenseDisplayName(project.license) : 'No License Detected'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Compliance Status */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">Overall Compliance</span>
                                                <span className={`font-semibold ${
                                                    complianceData.overallCompliance >= 90 ? 'text-green-400' :
                                                        complianceData.overallCompliance >= 70 ? 'text-yellow-400' :
                                                            'text-red-400'
                                                }`}>
                          {complianceData.overallCompliance}%
                        </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400">License Conflicts</span>
                                                <span className={`font-semibold ${
                                                    complianceData.licenseConflicts === 0 ? 'text-green-400' : 'text-yellow-400'
                                                }`}>
                          {complianceData.licenseConflicts}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {currentTab === "dependencies" && (
                    <div className="space-y-6">
                        {/* Dependencies Header */}
                        <div className="space-y-4">

                            {/* Search and Filters */}
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search dependencies..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        style={{
                                            backgroundColor: colors.background.card,
                                            borderColor: 'hsl(var(--border))',
                                            borderWidth: '1px'
                                        }}
                                    />
                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400"/>
                                </div>

                                {/* Filter Options */}
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                        onClick={() => {
                                            setShowFilterPopup(true)
                                            setTempSelectedFilters(activeFilters)
                                            setShowFilterPopup(true)
                                        }}
                                    >
                                        <Search className="h-4 w-4 mr-2"/>
                                        Add Filters
                                    </Button>

                                    {/* Show filter chips or status text */}
                                    {activeFilters.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {activeFilters.map((fid) => (
                                                <div
                                                    key={fid}
                                                    className="flex items-center gap-2 px-3 py-1 text-gray-300 text-sm rounded-full"
                                                    style={{
                                                        backgroundColor: colors.background.card,
                                                        borderColor: 'hsl(var(--border))',
                                                        borderWidth: '1px'
                                                    }}
                                                >
                                                    <span>{FILTER_BY_ID[fid].label}</span>
                                                    <button
                                                        onClick={() => setActiveFilters(activeFilters.filter((f) => f !== fid))}
                                                        className="text-gray-400 hover:text-gray-300"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-400">
                                            Showing {searchQuery ? 'filtered' : 'all'} dependencies
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            className="hidden md:grid grid-cols-12 items-center px-3 py-2 rounded-lg mb-2"
                            style={{backgroundColor: colors.background.card, border: '1px solid hsl(var(--border))'}}
                        >
                            {/* Name (col-span-5) */}
                            <button
                                type="button"
                                className="col-span-5 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => toggleSort('name')}
                            >
                                Name {arrow('name')}
                            </button>

                            <button
                                type="button"
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => toggleSort('version')}
                            >
                                Version {arrow('version')}
                            </button>

                            <button
                                type="button"
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => toggleSort('contributors')}
                            >
                                Contributors {arrow('contributors')}
                            </button>

                            <button
                                type="button"
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => toggleSort('stars')}
                            >
                                Stars {arrow('stars')}
                            </button>

                            <button
                                type="button"
                                className="col-span-1 text-left text-sm text-gray-300 hover:text-white hidden lg:block"
                                onClick={() => toggleSort('score')}
                            >
                                Score {arrow('score')}
                            </button>
                        </div>

                        {/* Dependencies List */}
                        <div className="grid gap-4">
                            {projectDependencies.length === 0 ? (
                                <Card style={{backgroundColor: colors.background.card}}>
                                    <CardContent className="p-6 text-center">
                                        <div className="text-gray-400">
                                            {project?.status === 'creating' ? (
                                                <div>
                                                    <div
                                                        className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                                    <p>Analyzing dependencies...</p>
                                                    <p className="text-sm mt-2">This may take a few minutes</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p>No dependencies found</p>
                                                    <p className="text-sm mt-2">Dependencies will appear here once the
                                                        project is set up</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                (() => {
                                    const filtered = projectDependencies.filter((dep) => {
                                        const matchesSearch =
                                            !searchQuery || dep.name.toLowerCase().includes(searchQuery.toLowerCase())
                                        const matchesFilters =
                                            activeFilters.length === 0 ||
                                            activeFilters.every((fid) => FILTER_BY_ID[fid].predicate(dep, project))
                                        return matchesSearch && matchesFilters
                                    })

                                    const sorted = sort.key
                                        ? [...filtered].sort((a, b) => {
                                            const av = getSortValue(a, sort.key as SortKey)
                                            const bv = getSortValue(b, sort.key as SortKey)
                                            const dir = sort.dir === 'asc' ? 1 : -1
                                            return dir * (av < bv ? -1 : av > bv ? 1 : 0)
                                        })
                                        : filtered

                                    return sorted.map((dependency) => (
                                        <DependencyPackageCard
                                            key={dependency.id}
                                            dependency={dependency}
                                            searchQuery={searchQuery}
                                            projectLicense={project?.license}
                                            isLoading={
                                                dependency.package?.status === 'queued' ||
                                                dependency.package?.status === 'fast'
                                            }
                                        />
                                    ))
                                })()
                            )}
                        </div>
                    </div>
                )}

                {currentTab === "watchlist" && (
                    <div className="space-y-6">
                        {/* Search and Add */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search watchlist dependencies..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        style={{
                                            backgroundColor: colors.background.card,
                                            borderColor: 'hsl(var(--border))',
                                            borderWidth: '1px'
                                        }}
                                    />
                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400"/>
                                </div>
                                <Button
                                    style={{backgroundColor: colors.primary}}
                                    className="hover:opacity-90 text-white"
                                    onClick={() => {
                                        console.log('🎯 Opening watchlist search dialog')
                                        setShowWatchlistSearchDialog(true)
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2"/>
                                    Add Dependency
                                </Button>
                            </div>
                        </div>

                        {/* Watchlist Dependencies */}
                        <div className="grid gap-4">
                            {projectWatchlist && projectWatchlist.length > 0 ? (
                                projectWatchlist.map((watchlistItem) => (
                                    <WatchlistPackageCard
                                        key={watchlistItem.id}
                                        package={watchlistItem}
                                        searchQuery={searchQuery}
                                        projectLicense={project?.license}
                                        isLoading={packageStatuses[watchlistItem.package?.id]?.status === 'queued' || packageStatuses[watchlistItem.package?.id]?.status === 'fast'}
                                        packageStatus={packageStatuses[watchlistItem.package?.id]?.status as 'queued' | 'fast' | 'done'}
                                        onPackageClick={(pkg) => {
                                            const packageData = pkg.package || pkg
                                            const packageName = packageData.name || pkg.name || 'Unknown Package'

                                            setSelectedDependency({
                                                id: pkg.id,
                                                // package_id: pkg.package_id, // Add the actual package ID
                                                name: packageName,
                                                version: pkg.version || 'Unknown',
                                                addedBy: pkg.addedByUser?.name || pkg.addedByUser?.email || pkg.addedBy || pkg.added_by || 'Unknown',
                                                addedAt: pkg.addedAt || pkg.added_at || new Date(),
                                                comments: pkg.comments || [],
                                                riskScore: pkg.package?.total_score || pkg.riskScore || 0,
                                                status: pkg.status || 'pending',
                                                approvedBy: pkg.approvedByUser?.name || pkg.approvedBy,
                                                rejectedBy: pkg.rejectedByUser?.name || pkg.rejectedBy,
                                                approvedAt: pkg.approvedAt,
                                                rejectedAt: pkg.rejectedAt,
                                                healthScore: (pkg.package as any)?.scorecard_score || (pkg.package as any)?.health_score || pkg.healthScore || 0,
                                                activityScore: pkg.package?.activity_score || pkg.activityScore || 0,
                                                busFactor: pkg.package?.bus_factor_score || pkg.busFactor || 0,
                                                license: pkg.package?.license || pkg.license || 'Unknown',
                                                projectLicense: project?.license || null,
                                                vulnerabilities: pkg.package?.vulnerability_score || pkg.vulnerabilities || 0,
                                                licenseScore: pkg.package?.license_score || 0,
                                                pastVulnerabilities: pkg.pastVulnerabilities || 0
                                            })
                                            setShowDependencyReviewDialog(true)
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-12">
                                    <div
                                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                        style={{backgroundColor: 'rgb(84, 0, 250)'}}>
                                        <img src="/package_icon.png" alt="Package" className="w-8 h-8"/>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">No packages in watchlist</h3>
                                    <p className="text-gray-400 mb-6">Add packages to your watchlist to monitor their
                                        security and health</p>
                                    <Button
                                        style={{backgroundColor: colors.primary}}
                                        className="hover:opacity-90 text-white"
                                        onClick={() => setShowWatchlistSearchDialog(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2"/>
                                        Add First Package
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentTab === "compliance" && (
                    <div className="space-y-6">

                        {/* License Compliance Overview */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Project License */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <CardTitle className="text-white">Project License</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                project?.license === 'MIT' ? 'bg-green-500/20' :
                                                    project?.license === 'Apache-2.0' ? 'bg-blue-500/20' :
                                                        project?.license === 'GPL-2.0' || project?.license === 'GPL-3.0' ? 'bg-red-500/20' :
                                                            'bg-gray-500/20'
                                            }`}>
                        <span className={`font-bold text-sm ${
                            project?.license === 'MIT' ? 'text-green-400' :
                                project?.license === 'Apache-2.0' ? 'text-blue-400' :
                                    project?.license === 'GPL-2.0' || project?.license === 'GPL-3.0' ? 'text-red-400' :
                                        'text-gray-400'
                        }`}>
                          {project?.license ? project.license.substring(0, 3).toUpperCase() : 'N/A'}
                        </span>
                                            </div>
                                            <div>
                                                <div className="text-white font-medium">
                                                    {project?.license ? getComplianceLicenseDisplayName(project.license) : 'No License Detected'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Compliance Status */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <CardTitle className="text-white">Compliance Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">Overall Compliance</span>
                                            <span className={`font-semibold ${
                                                complianceData.overallCompliance >= 90 ? 'text-green-400' :
                                                    complianceData.overallCompliance >= 70 ? 'text-yellow-400' :
                                                        'text-red-400'
                                            }`}>
                        {complianceData.overallCompliance}%
                      </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400">License Conflicts</span>
                                            <span className={`font-semibold ${
                                                complianceData.licenseConflicts === 0 ? 'text-green-400' : 'text-yellow-400'
                                            }`}>
                        {complianceData.licenseConflicts}
                      </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SBOM Download */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <CardTitle className="text-white">Software Bill of Materials</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Button
                                            className="w-full hover:opacity-90 text-white"
                                            style={{backgroundColor: colors.primary}}
                                            onClick={() => {
                                                // Generate SBOM data
                                                const sbomData = {
                                                    project: {
                                                        name: project?.name || 'Unknown Project',
                                                        license: project?.license || 'unlicensed',
                                                        totalDependencies: complianceData.totalDependencies
                                                    },
                                                    dependencies: projectDependencies.map(dep => ({
                                                        name: dep.name,
                                                        version: dep.version,
                                                        licenseScore: dep.package?.license_score || 0,
                                                        vulnerabilityScore: dep.package?.vulnerability_score || 0,
                                                        totalScore: dep.package?.total_score || 0
                                                    })),
                                                    compliance: {
                                                        overallCompliance: complianceData.overallCompliance,
                                                        licenseConflicts: complianceData.licenseConflicts,
                                                        vulnerableDependencies: complianceData.vulnerableDependencies
                                                    },
                                                    generatedAt: new Date().toISOString()
                                                }

                                                // Download as JSON
                                                const blob = new Blob([JSON.stringify(sbomData, null, 2)], {type: 'application/json'})
                                                const url = URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url
                                                a.download = `${project?.name || 'project'}-sbom.json`
                                                document.body.appendChild(a)
                                                a.click()
                                                document.body.removeChild(a)
                                                URL.revokeObjectURL(url)
                                            }}
                                        >
                                            <Download className="h-4 w-4 mr-2"/>
                                            Download SBOM
                                        </Button>
                                        <div className="text-xs text-gray-500">
                                            Last
                                            updated: {project?.updated_at ? formatRelativeDate(project.updated_at) : 'Unknown'}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Non-Compliant Dependencies */}
                        <Card style={{backgroundColor: colors.background.card}}>
                            <CardHeader>
                                <CardTitle className="text-white">Non-Compliant Dependencies</CardTitle>
                                <p className="text-gray-400 text-sm">Dependencies that don't comply with your project's
                                    license</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {complianceData.nonCompliantDependencies.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-green-400 text-4xl mb-2">✓</div>
                                            <p className="text-gray-400">All dependencies are compliant with your
                                                project license</p>
                                        </div>
                                    ) : (
                                        complianceData.nonCompliantDependencies.map((dep, index) => (
                                            <div key={index}
                                                 className="flex items-center justify-between p-4 rounded-lg"
                                                 style={{backgroundColor: 'rgb(26, 26, 26)'}}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                         style={{backgroundColor: 'rgb(84, 0, 250)'}}>
                                                        <img src="/package_icon.png" alt="Package" className="w-4 h-4"/>
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">{dep.name}</div>
                                                        <div
                                                            className="text-sm text-gray-400">v{dep.version} • {dep.license} License
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Incompatible
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>


                    </div>
                )}

                {currentTab === "alerts" && (
                    <div className="space-y-6">
                        {/* No Alerts Message */}
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                 style={{backgroundColor: 'rgb(84, 0, 250)'}}>
                                <Bell className="w-8 h-8 text-white"/>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No Alerts Found</h3>
                            <p className="text-gray-400 mb-6">No alerts have been triggered for this repository yet.
                                Click here to configure alert settings.</p>
                            <Button
                                style={{backgroundColor: colors.primary}}
                                className="hover:opacity-90 text-white"
                                onClick={() => {
                                    // Navigate to settings or open alert configuration
                                    console.log('Configure alert settings clicked')
                                }}
                            >
                                <Bell className="h-4 w-4 mr-2"/>
                                Configure Alert Settings
                            </Button>
                        </div>
                    </div>
                )}

                {currentTab === "settings" && (
                    <div className="flex h-full overflow-hidden scrollbar-hide">
                        {/* Settings Sidebar */}
                        <div className="w-64 border-r border-gray-800 p-6 overflow-y-auto scrollbar-hide">
                            <div className="space-y-1">
                                {/* Settings Navigation Items */}
                                {[
                                    {id: 'general', label: 'General'},
                                    {id: 'integrations', label: 'Integrations'},
                                    {id: 'alerts', label: 'Alert Settings'},
                                    {id: 'team', label: 'Team Members'}
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentSettingsTab(item.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                            currentSettingsTab === item.id
                                                ? 'text-white'
                                                : 'text-gray-300 hover:text-white'
                                        }`}
                                        style={currentSettingsTab === item.id ? {backgroundColor: 'rgb(18, 18, 18)'} : {}}
                                        onMouseEnter={(e) => {
                                            if (currentSettingsTab !== item.id) {
                                                e.currentTarget.style.backgroundColor = 'rgb(18, 18, 18)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (currentSettingsTab !== item.id) {
                                                e.currentTarget.style.backgroundColor = '';
                                            }
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Settings Content */}
                        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
                            {currentSettingsTab === 'general' && (
                                <div className="space-y-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">General Settings</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">Project
                                                Name</label>
                                            <Input
                                                placeholder="Enter project name"
                                                value={projectName}
                                                onChange={(e) => setProjectName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleProjectNameChange(projectName)
                                                    }
                                                }}
                                                disabled={isSavingName}
                                                className="text-white placeholder-gray-400"
                                                style={{backgroundColor: 'rgb(18, 18, 18)'}}
                                            />
                                            {isSavingName && (
                                                <p className="text-xs text-gray-500 mt-1">Saving...</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">Project
                                                Language</label>
                                            <div className="flex items-center gap-3 p-3 border rounded-md" style={{
                                                paddingTop: '0.5rem',
                                                paddingBottom: '0.5rem',
                                                fontSize: '0.875rem',
                                                backgroundColor: 'rgb(18, 18, 18)'
                                            }}>
                                                {getProjectLanguageIcon(project?.language)}
                                                <span className="text-white">
                          {project?.language ? getLanguageDisplayName(project.language) : 'Not specified'}
                        </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Language cannot be changed after
                                                project creation</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-white mb-2">License</label>
                                            <Select
                                                value={selectedLicense}
                                                onValueChange={handleLicenseChange}
                                                disabled={isSavingLicense}
                                            >
                                                <SelectTrigger className="text-white"
                                                               style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                                    <div className="flex items-center gap-3">
                                                        <Shield className="h-6 w-6 text-gray-400"/>
                                                        <SelectValue placeholder="Select license"/>
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {licenses.map((license) => (
                                                        <SelectItem key={license.value} value={license.value}>
                                                            {license.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="pt-4">
                                            <h3 className="text-lg font-semibold text-white mb-4">Project Type</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 p-3 border rounded-md"
                                                     style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                                    {project?.type === 'file' ? (
                                                        <FileText className="h-5 w-5 text-gray-400"/>
                                                    ) : project?.type === 'cli' ? (
                                                        <Terminal className="h-5 w-5 text-gray-400"/>
                                                    ) : (
                                                        <Github className="h-5 w-5 text-gray-400"/>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="text-white text-sm font-medium">
                                                            {project?.type === 'file' ? 'File Upload' : project?.type === 'cli' ? 'CLI Project' : 'Repository Project'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {project?.type === 'file'
                                                        ? 'To update dependencies, upload a new file on the Dependencies page'
                                                        : 'Project type cannot be changed after project creation'
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        {project?.type === 'cli' && (
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">Update
                                                    Dependencies</label>
                                                <div className="flex items-center gap-3 p-3 border rounded-md"
                                                     style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                                    <Terminal className="h-5 w-5 text-gray-400"/>
                                                    <div className="flex-1">
                                                        <div className="text-white text-sm font-mono">
                                                            deply sync
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText('deply sync')
                                                            toast({
                                                                title: "Copied!",
                                                                description: "Command copied to clipboard",
                                                            })
                                                        }}
                                                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                                    >
                                                        <Copy className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Run this command in your
                                                    project directory to update dependencies</p>
                                            </div>
                                        )}

                                        {project?.type === 'repo' && (
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-2">GitHub
                                                    Repository</label>
                                                <div className="flex items-center gap-3 p-3 border rounded-md"
                                                     style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                                    <Github className="h-5 w-5 text-gray-400"/>
                                                    <div className="flex-1">
                                                        <div className="text-white text-sm font-medium">
                                                            {project?.monitoredBranch?.repository_url || 'No repository URL'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Repository cannot be changed
                                                    after project creation</p>
                                            </div>
                                        )}

                                        {project?.type === 'repo' && (
                                            <div>
                                                <label
                                                    className="block text-sm font-medium text-white mb-2">Branch</label>
                                                <div className="flex items-center gap-3 p-3 border rounded-md"
                                                     style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                                    <GitBranch className="h-5 w-5 text-gray-400"/>
                                                    <div className="flex-1">
                                                        <div className="text-white text-sm font-medium">
                                                            {project?.monitoredBranch?.branch_name || 'main'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">Branch cannot be changed after
                                                    project creation</p>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}

                            {currentSettingsTab === 'integrations' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Integrations</h2>
                                        <p className="text-gray-400 mt-1">Connect your favorite tools to streamline your
                                            workflow</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Jira Integration */}
                                        <Card style={{backgroundColor: colors.background.card}}
                                              className="hover:bg-gray-800/50 transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                            <img src="/jira_icon.png" alt="Jira" className="w-6 h-6"/>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">Jira</div>
                                                            <div className="text-xs text-gray-400">Project management
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm"
                                                            className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                                        Connect
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Slack Integration */}
                                        <Card style={{backgroundColor: colors.background.card}}
                                              className="hover:bg-gray-800/50 transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                            <img src="/Slack_icon.png" alt="Slack" className="w-6 h-6"/>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">Slack</div>
                                                            <div className="text-xs text-gray-400">Team communication
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm"
                                                            className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                                        Connect
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Discord Integration */}
                                        <Card style={{backgroundColor: colors.background.card}}
                                              className="hover:bg-gray-800/50 transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                                            <img src="/Discord_icon.png" alt="Discord"
                                                                 className="w-6 h-6"/>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">Discord</div>
                                                            <div className="text-xs text-gray-400">Community chat</div>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm"
                                                            className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                                        Connect
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* GitHub Actions Integration */}
                                        <Card style={{backgroundColor: colors.background.card}}
                                              className="hover:bg-gray-800/50 transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-lg bg-gray-500/20 flex items-center justify-center"
                                                            style={{backgroundColor: 'white'}}>
                                                            <img src="/Github_icon.png" alt="GitHub Actions"
                                                                 className="w-6 h-6"/>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">GitHub Actions</div>
                                                            <div className="text-xs text-gray-400">CI/CD workflows</div>
                                                        </div>
                                                    </div>
                                                    <Button variant="outline" size="sm"
                                                            className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                                        Connect
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {currentSettingsTab === 'alerts' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Notifications</h2>
                                        <p className="text-gray-400 mt-1">Choose how you want to be notified about
                                            project updates</p>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Vulnerability Alerts Row */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border"
                                             style={{
                                                 backgroundColor: colors.background.card,
                                                 borderColor: 'rgb(38, 38, 38)'
                                             }}>
                                            <div>
                                                <div className="text-white font-medium">Vulnerability Alerts</div>
                                                <div className="text-sm text-gray-400">Get notified about security
                                                    vulnerabilities
                                                </div>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="w-56 justify-between text-left"
                                                            style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                                        <span
                                                            className="truncate">{getNotificationDisplayText('vulnerability')}</span>
                                                        <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Select notification channels</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={vulnerabilityNotifications.alerts}
                                                                onChange={(e) => handleNotificationChange('vulnerability', 'alerts', e.target.checked)}
                                                                disabled={isSavingNotifications}
                                                                className="rounded"
                                                            />
                                                            <span>Alerts Tab</span>
                                                        </label>
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={vulnerabilityNotifications.slack}
                                                                onChange={(e) => handleNotificationChange('vulnerability', 'slack', e.target.checked)}
                                                                disabled={isSavingNotifications}
                                                                className="rounded"
                                                            />
                                                            <span>Slack</span>
                                                        </label>
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={vulnerabilityNotifications.discord}
                                                                onChange={(e) => handleNotificationChange('vulnerability', 'discord', e.target.checked)}
                                                                disabled={isSavingNotifications}
                                                                className="rounded"
                                                            />
                                                            <span>Discord</span>
                                                        </label>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        {/* License Alerts Row */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border"
                                             style={{
                                                 backgroundColor: colors.background.card,
                                                 borderColor: 'rgb(38, 38, 38)'
                                             }}>
                                            <div>
                                                <div className="text-white font-medium">License Alerts</div>
                                                <div className="text-sm text-gray-400">Get notified about license
                                                    changes
                                                </div>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="w-56 justify-between text-left"
                                                            style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                                        <span
                                                            className="truncate">{getNotificationDisplayText('license')}</span>
                                                        <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Select notification channels</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={licenseNotifications.alerts}
                                                                onChange={(e) => handleNotificationChange('license', 'alerts', e.target.checked)}
                                                                disabled={isSavingNotifications}
                                                                className="rounded"
                                                            />
                                                            <span>Alerts Tab</span>
                                                        </label>
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={licenseNotifications.slack}
                                                                onChange={(e) => handleNotificationChange('license', 'slack', e.target.checked)}
                                                                disabled={isSavingNotifications}
                                                                className="rounded"
                                                            />
                                                            <span>Slack</span>
                                                        </label>
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={licenseNotifications.discord}
                                                                onChange={(e) => handleNotificationChange('license', 'discord', e.target.checked)}
                                                                disabled={isSavingNotifications}
                                                                className="rounded"
                                                            />
                                                            <span>Discord</span>
                                                        </label>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        {/* Health Alerts Row */}
                                        <div className="flex items-center justify-between p-4 rounded-lg border"
                                             style={{
                                                 backgroundColor: colors.background.card,
                                                 borderColor: 'rgb(38, 38, 38)'
                                             }}>
                                            <div>
                                                <div className="text-white font-medium">Project Health Alerts</div>
                                                <div className="text-sm text-gray-400">Get notified about project health
                                                    changes
                                                </div>
                                            </div>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" className="w-56 justify-between text-left"
                                                            style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                                        <span
                                                            className="truncate">{getNotificationDisplayText('health')}</span>
                                                        <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2"/>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-md">
                                                    <DialogHeader>
                                                        <DialogTitle>Select notification channels</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={healthNotifications.alerts}
                                                                onChange={(e) => handleNotificationChange('health', 'alerts', e.target.checked)}
                                                                disabled={isSavingNotifications}
                                                                className="rounded"
                                                            />
                                                            <span>Alerts Tab</span>
                                                        </label>
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={healthNotifications.slack}
                                                                onChange={(e) => handleNotificationChange('health', 'slack', e.target.checked)}
                                                                disabled={isSavingNotifications}
                                                                className="rounded"
                                                            />
                                                            <span>Slack</span>
                                                        </label>
                                                        <label className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={healthNotifications.discord}
                                                                onChange={(e) => handleNotificationChange('health', 'discord', e.target.checked)}
                                                                disabled={isSavingNotifications}
                                                                className="rounded"
                                                            />
                                                            <span>Discord</span>
                                                        </label>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentSettingsTab === 'team' && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-white">Team Members</h2>
                                        <Button
                                            style={{backgroundColor: colors.primary}}
                                            className="hover:opacity-90 text-white"
                                            onClick={handleAddMember}
                                        >
                                            <Plus className="h-4 w-4 mr-2"/>
                                            Add Member
                                        </Button>
                                    </div>

                                    <div className="space-y-0 border border-gray-700 rounded-lg overflow-hidden">
                                        {projectUsers.map((member, index) => (
                                            <div
                                                key={member.id}
                                                className={`flex items-center justify-between p-4 transition-colors ${index < projectUsers.length - 1 ? 'border-b border-gray-700' : ''}`}
                                                style={{backgroundColor: 'transparent'}}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(18, 18, 18)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-full bg-gray-600/20 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-gray-400"/>
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-medium">
                                                            {member.user?.name || member.user?.email || 'Unknown User'}
                                                            {member.user?.user_id === currentUser?.id && (
                                                                <span
                                                                    className="ml-2 text-xs text-gray-400">(You)</span>
                                                            )}
                                                        </div>
                                                        <div
                                                            className="text-sm text-gray-400 capitalize">{member.role}</div>
                                                    </div>
                                                </div>
                                                {member.user?.user_id !== currentUser?.id && (
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm"
                                                                className="border-gray-600 text-gray-300 hover:bg-gray-700">
                                                            Promote
                                                        </Button>
                                                        <Button variant="outline" size="sm"
                                                                className="border-red-600 text-red-400 hover:bg-red-600/20">
                                                            <Trash2 className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* Filter Popup Dialog */}
            <Dialog open={showFilterPopup} onOpenChange={(open) => {
                setShowFilterPopup(open)
                if (open) setTempSelectedFilters(activeFilters) // seed temp selection on open
            }}>
                <DialogContent className="bg-gray-900 border-gray-800">
                    <DialogHeader>
                        <DialogTitle className="text-white">Add Filters</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-sm text-gray-400">
                            Select filters to narrow down your dependencies
                        </div>

                        {/* Multi-select list */}
                        <div className="space-y-3">
                            {FILTER_DEFS.map((def) => {
                                const checked = tempSelectedFilters.includes(def.id)
                                return (
                                    <button
                                        key={def.id}
                                        type="button"
                                        onClick={() => {
                                            setTempSelectedFilters((prev) =>
                                                prev.includes(def.id)
                                                    ? prev.filter((f) => f !== def.id)
                                                    : [...prev, def.id]
                                            )
                                        }}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors w-full text-left ${
                                            checked ? 'border-gray-600' : 'border-gray-700 hover:border-gray-600'
                                        }`}
                                        style={{backgroundColor: colors.background.card}}
                                    >
                                        <div>
                                            <div className="text-white font-medium">{def.label}</div>
                                            <div className="text-sm text-gray-400">{def.description}</div>
                                        </div>
                                        <div
                                            className={`w-4 h-4 rounded border-2 ${
                                                checked ? 'border-gray-400' : 'border-gray-600'
                                            } flex items-center justify-center`}
                                            style={{backgroundColor: checked ? colors.background.card : 'transparent'}}
                                        >
                                            {checked && <span className="text-white text-xs">✓</span>}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Footer actions */}
                        <div className="flex justify-between gap-2 pt-4">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                                    onClick={() => {
                                        setTempSelectedFilters([])
                                    }}
                                >
                                    Clear
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                    onClick={() => {
                                        setShowFilterPopup(false) // Cancel — discard temp changes
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="hover:opacity-90 text-white"
                                    style={{backgroundColor: colors.primary}}
                                    onClick={() => {
                                        setActiveFilters(tempSelectedFilters)  // commit
                                        setShowFilterPopup(false)              // close
                                    }}
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Invite Dialog */}
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogContent className="bg-gray-900 border-gray-800">
                    <DialogHeader>
                        <DialogTitle className="text-white">Invite Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Share this link with team members to invite them to the project. They will be added as
                            members (non-admin).
                        </p>
                        <div className="flex items-center space-x-2">
                            <Input
                                value={inviteLink}
                                readOnly
                                className="bg-gray-800 border-gray-700 text-white"
                            />
                            <Button
                                onClick={handleCopyInviteLink}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                <Copy className="h-4 w-4"/>
                            </Button>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowInviteDialog(false)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Watchlist Search Dialog */}
            <WatchlistSearchDialog
                open={showWatchlistSearchDialog}
                onOpenChange={setShowWatchlistSearchDialog}
                projectId={projectId}
                onRepositoryAdded={async () => {
                    setShowWatchlistSearchDialog(false)

                    // Fetch updated watchlist data and set initial statuses
                    try {
                        const [projectWatchlistResponse, packageStatusResponse] = await Promise.all([
                            fetch(`${apiBase}/projects/${projectId}/project-watchlist`),
                            fetch(`${apiBase}/projects/${projectId}/watchlist/status`)
                        ])

                        if (projectWatchlistResponse.ok) {
                            const projectWatchlistData = await projectWatchlistResponse.json()
                            setProjectWatchlist(projectWatchlistData)
                        }

                        if (packageStatusResponse.ok) {
                            const statusData = await packageStatusResponse.json()
                            const statusMap: { [key: string]: { status: string, hasScores: boolean } } = {}
                            statusData.forEach((pkg: any) => {
                                statusMap[pkg.packageId] = {
                                    status: pkg.status,
                                    hasScores: pkg.hasScores
                                }
                            })
                            setPackageStatuses(statusMap)
                        }
                    } catch (error) {
                        console.error('Error refreshing watchlist data:', error)
                    }
                }}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="bg-gray-900 border-red-800">
                    <DialogHeader>
                        <DialogTitle className="text-red-400">Delete Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Are you sure you want to delete <strong className="text-white">{project?.name}</strong>?
                            This action cannot be undone and will permanently delete:
                        </p>
                        <ul className="text-gray-300 text-sm space-y-1 ml-4">
                            <li>• All project data and settings</li>
                            <li>• All team member associations</li>
                            <li>• All watchlist items</li>
                            <li>• All dependency tracking data</li>
                            {project?.repository_url && (
                                <li>• Monitored branch (if no other projects are tracking it)</li>
                            )}
                        </ul>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteDialog(false)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteProject}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deleting ? 'Deleting...' : 'Delete Project'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dependency Review Dialog */}
            <Dialog open={showDependencyReviewDialog} onOpenChange={setShowDependencyReviewDialog}>
                <DialogContent
                    className="bg-gray-900 border-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                 style={{backgroundColor: 'rgb(84, 0, 250)'}}>
                                <img src="/package_icon.png" alt="Package" className="w-5 h-5"/>
                            </div>
                            {selectedDependency?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedDependency && (
                        <div className="space-y-6">
                            {/* Package Details - Full Width */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-white">Package Details</CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                            onClick={() => {
                                                // Extract the actual package ID from the watchlist package
                                                const packageId = selectedDependency?.package_id || selectedDependency?.package?.id
                                                console.log('Selected dependency:', selectedDependency)
                                                console.log('Package ID:', packageId)
                                                if (packageId) {
                                                    router.push(`/dependency/${packageId}/watchlist`)
                                                } else {
                                                    console.error('No package ID found in selectedDependency')
                                                }
                                            }}
                                        >
                                            <ExternalLinkIcon className="mr-2 h-4 w-4"/>
                                            View Full Details
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-8">
                                        {/* Progress Circle for Score */}
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-32 h-32">
                                                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-gray-800"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <path
                                                        style={{stroke: 'rgb(84, 0, 250)'}}
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        fill="none"
                                                        strokeDasharray={`${selectedDependency.riskScore}, 100`}
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div
                                                            className="text-3xl font-bold text-white">{selectedDependency.riskScore}</div>
                                                        <div className="text-sm text-gray-400">Score</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bars for Score Breakdown */}
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-300">Activity Score</span>
                                                    <span
                                                        className="text-sm text-white font-medium">{selectedDependency.activityScore}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${selectedDependency.activityScore}%`,
                                                            backgroundColor: 'rgb(84, 0, 250)'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-300">Bus Factor</span>
                                                    <span
                                                        className="text-sm text-white font-medium">{selectedDependency.busFactor}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min(selectedDependency.busFactor * 5, 100)}%`,
                                                            backgroundColor: 'rgb(84, 0, 250)'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-300">Vulnerability Score</span>
                                                    <span
                                                        className="text-sm text-white font-medium">{selectedDependency.vulnerabilities}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${selectedDependency.vulnerabilities}%`,
                                                            backgroundColor: 'rgb(84, 0, 250)'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-300">License Score</span>
                                                    <span
                                                        className="text-sm text-white font-medium">{selectedDependency.licenseScore || 'N/A'}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${selectedDependency.licenseScore || 0}%`,
                                                            backgroundColor: 'rgb(84, 0, 250)'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-300">Health Score</span>
                                                    <span
                                                        className="text-sm text-white font-medium">{selectedDependency.healthScore}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${selectedDependency.healthScore}%`,
                                                            backgroundColor: 'rgb(84, 0, 250)'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Second Row - Vulnerabilities and License */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Vulnerabilities Card */}
                                <Card style={{backgroundColor: colors.background.card}}>
                                    <CardHeader>
                                        <CardTitle className="text-white">Vulnerabilities</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <span className="text-sm text-gray-300">No known vulnerabilities in current version</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <img src="/osv_logo.svg" alt="OSV" className="w-4 h-4"/>
                                                <span className="text-xs text-gray-500">Data from OSV</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* License Information Card */}
                                <Card style={{backgroundColor: colors.background.card}}>
                                    <CardHeader>
                                        <CardTitle className="text-white">License Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="px-3 py-2 rounded-lg bg-green-500/20 flex items-center justify-center min-w-fit">
                                                    <span
                                                        className="text-green-400 font-bold text-sm whitespace-nowrap">{selectedDependency.license}</span>
                                                </div>
                                                <div>
                                                    <div
                                                        className="text-white font-medium">{selectedDependency.license} License
                                                    </div>
                                                </div>
                                            </div>
                                            {(() => {
                                                const hasProjectLicense = selectedDependency.projectLicense && selectedDependency.projectLicense !== 'unlicensed' && selectedDependency.projectLicense !== 'none' && selectedDependency.projectLicense !== null && selectedDependency.projectLicense !== undefined

                                                if (!hasProjectLicense) {
                                                    return null // Don't show anything if no project license
                                                }

                                                const licenseCompatibility = checkLicenseCompatibility(selectedDependency.projectLicense, selectedDependency.license)

                                                if (licenseCompatibility.isCompatible) {
                                                    return (
                                                        <Badge variant="outline"
                                                               className="border-green-500 text-green-500">
                                                            <Shield className="mr-1 h-3 w-3"/>
                                                            License OK
                                                        </Badge>
                                                    )
                                                } else {
                                                    const severityColor = licenseCompatibility.severity === 'high' ? 'red' :
                                                        licenseCompatibility.severity === 'medium' ? 'yellow' : 'blue'
                                                    return (
                                                        <Badge variant="outline"
                                                               className={`border-${severityColor}-500 text-${severityColor}-500`}>
                                                            <AlertTriangle className="mr-1 h-3 w-3"/>
                                                            License Issue
                                                        </Badge>
                                                    )
                                                }
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Review and Timeline - Combined */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-white">Review</CardTitle>
                                        <div>
                                            {selectedDependency.status === 'approved' && (
                                                <Badge variant="outline" className="border-green-500 text-green-500">
                                                    <Check className="mr-1 h-3 w-3"/>
                                                    Approved
                                                </Badge>
                                            )}
                                            {selectedDependency.status === 'rejected' && (
                                                <Badge variant="outline" className="border-red-500 text-red-500">
                                                    <Trash2 className="mr-1 h-3 w-3"/>
                                                    Rejected
                                                </Badge>
                                            )}
                                            {selectedDependency.status === 'pending' && (
                                                <Badge variant="outline"
                                                       className="border-gray-500 text-gray-400 bg-gray-800/50">
                                                    <Clock className="mr-1 h-3 w-3"/>
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Timeline */}
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-blue-400"/>
                                                </div>
                                                <div className="flex-1">
                                                    <div
                                                        className="text-white font-medium">{selectedDependency.addedBy} added
                                                        this dependency to watchlist
                                                    </div>
                                                    <div className="text-sm text-gray-400">
                                                        {selectedDependency.addedAt ? formatRelativeDate(selectedDependency.addedAt) : 'Unknown date'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dynamic Comments */}
                                            {selectedDependency.comments && selectedDependency.comments.length > 0 && (
                                                selectedDependency.comments.map((comment: any, index: number) => (
                                                    <div key={index} className="flex items-start gap-3">
                                                        <div
                                                            className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                                                            <MessageSquare className="h-4 w-4 text-gray-400"/>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div
                                                                className="text-white font-medium">{comment.user?.name || comment.user?.email || comment.user_id} commented
                                                            </div>
                                                            <div className="text-gray-300 mt-1">{comment.comment}</div>
                                                            <div className="text-sm text-gray-400">
                                                                {comment.created_at ? formatRelativeDate(comment.created_at) : 'Unknown date'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}

                                            {/* Show approval/rejection events if not pending */}
                                            {selectedDependency.status === 'approved' && (
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                        <Check className="h-4 w-4 text-green-400"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div
                                                            className="text-white font-medium">{selectedDependency.approvedBy || 'Someone'} approved
                                                            this dependency
                                                        </div>
                                                        <div className="text-gray-300 mt-1">This package has been
                                                            approved for use.
                                                        </div>
                                                        <div className="text-sm text-gray-400">
                                                            {selectedDependency.approvedAt ? formatRelativeDate(selectedDependency.approvedAt) : 'Recently'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedDependency.status === 'rejected' && (
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                                        <Trash2 className="h-4 w-4 text-red-400"/>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div
                                                            className="text-white font-medium">{selectedDependency.rejectedBy || 'Someone'} rejected
                                                            this dependency
                                                        </div>
                                                        <div className="text-gray-300 mt-1">This package has been
                                                            rejected and will not be used.
                                                        </div>
                                                        <div className="text-sm text-gray-400">
                                                            {selectedDependency.rejectedAt ? formatRelativeDate(selectedDependency.rejectedAt) : 'Recently'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Add Comment Section - Only show when pending */}
                                        {selectedDependency.status === 'pending' && (
                                            <div className="border-t border-gray-700 pt-4">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                        <User className="h-4 w-4 text-blue-400"/>
                                                    </div>
                                                    <div className="flex-1">
                            <textarea
                                placeholder="Add a comment..."
                                className="w-full px-3 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                style={{
                                    backgroundColor: colors.background.card,
                                    borderColor: 'hsl(var(--border))',
                                    borderWidth: '1px'
                                }}
                                rows={3}
                            />
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    className="text-white"
                                                                    style={{backgroundColor: 'rgb(34, 197, 94)'}}
                                                                    onClick={async () => {
                                                                        try {
                                                                            const response = await fetch(`${apiBase}/projects/watchlist/${selectedDependency.id}/approve`, {
                                                                                method: 'POST',
                                                                                headers: {'Content-Type': 'application/json'},
                                                                                body: JSON.stringify({userId: backendUserId})
                                                                            })

                                                                            if (response.ok) {
                                                                                // Refresh watchlist data to get actual approver info from database
                                                                                try {
                                                                                    const projectWatchlistResponse = await fetch(`${apiBase}/projects/${projectId}/project-watchlist`)
                                                                                    if (projectWatchlistResponse.ok) {
                                                                                        const projectWatchlistData = await projectWatchlistResponse.json()
                                                                                        setProjectWatchlist(projectWatchlistData)

                                                                                        // Find the updated package and update selectedDependency
                                                                                        const updatedPackage = projectWatchlistData.find((pkg: any) => pkg.id === selectedDependency.id)
                                                                                        if (updatedPackage) {
                                                                                            setSelectedDependency((prev: any) => ({
                                                                                                ...prev,
                                                                                                status: updatedPackage.status,
                                                                                                approvedBy: updatedPackage.approvedByUser?.name || updatedPackage.approvedBy,
                                                                                                approvedAt: updatedPackage.approvedAt
                                                                                            }))
                                                                                        }
                                                                                    }
                                                                                } catch (error) {
                                                                                    console.error('Error refreshing watchlist data:', error)
                                                                                }

                                                                                setShowDependencyReviewDialog(false)
                                                                                toast({
                                                                                    title: "Dependency Approved",
                                                                                    description: `${selectedDependency.name} has been approved.`,
                                                                                })
                                                                                // Status updated successfully - UI already updated
                                                                            } else {
                                                                                toast({
                                                                                    title: "Error",
                                                                                    description: "Failed to approve dependency.",
                                                                                    variant: "destructive"
                                                                                })
                                                                            }
                                                                        } catch (error) {
                                                                            toast({
                                                                                title: "Error",
                                                                                description: "Failed to approve dependency.",
                                                                                variant: "destructive"
                                                                            })
                                                                        }
                                                                    }}
                                                                >
                                                                    <Check className="mr-1 h-3 w-3"/>
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="text-white"
                                                                    style={{backgroundColor: 'rgb(239, 68, 68)'}}
                                                                    onClick={async () => {
                                                                        try {
                                                                            const response = await fetch(`${apiBase}/projects/watchlist/${selectedDependency.id}/reject`, {
                                                                                method: 'POST',
                                                                                headers: {'Content-Type': 'application/json'},
                                                                                body: JSON.stringify({userId: backendUserId})
                                                                            })

                                                                            if (response.ok) {
                                                                                // Refresh watchlist data to get actual approver info from database
                                                                                try {
                                                                                    const projectWatchlistResponse = await fetch(`${apiBase}/projects/${projectId}/project-watchlist`)
                                                                                    if (projectWatchlistResponse.ok) {
                                                                                        const projectWatchlistData = await projectWatchlistResponse.json()
                                                                                        setProjectWatchlist(projectWatchlistData)

                                                                                        // Find the updated package and update selectedDependency
                                                                                        const updatedPackage = projectWatchlistData.find((pkg: any) => pkg.id === selectedDependency.id)
                                                                                        if (updatedPackage) {
                                                                                            setSelectedDependency((prev: any) => ({
                                                                                                ...prev,
                                                                                                status: updatedPackage.status,
                                                                                                rejectedBy: updatedPackage.rejectedByUser?.name || updatedPackage.rejectedBy,
                                                                                                rejectedAt: updatedPackage.rejectedAt
                                                                                            }))
                                                                                        }
                                                                                    }
                                                                                } catch (error) {
                                                                                    console.error('Error refreshing watchlist data:', error)
                                                                                }

                                                                                setShowDependencyReviewDialog(false)
                                                                                toast({
                                                                                    title: "Dependency Rejected",
                                                                                    description: `${selectedDependency.name} has been rejected.`,
                                                                                })
                                                                                // Status updated successfully - UI already updated
                                                                            } else {
                                                                                toast({
                                                                                    title: "Error",
                                                                                    description: "Failed to reject dependency.",
                                                                                    variant: "destructive"
                                                                                })
                                                                            }
                                                                        } catch (error) {
                                                                            toast({
                                                                                title: "Error",
                                                                                description: "Failed to reject dependency.",
                                                                                variant: "destructive"
                                                                            })
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="mr-1 h-3 w-3"/>
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                className="text-white"
                                                                style={{backgroundColor: colors.primary}}
                                                                onClick={async () => {
                                                                    const textarea = document.querySelector('textarea[placeholder="Add a comment..."]') as HTMLTextAreaElement
                                                                    const comment = textarea?.value?.trim()

                                                                    if (!comment) {
                                                                        toast({
                                                                            title: "Error",
                                                                            description: "Please enter a comment.",
                                                                            variant: "destructive"
                                                                        })
                                                                        return
                                                                    }

                                                                    try {
                                                                        const response = await fetch(`${apiBase}/projects/watchlist/${selectedDependency.id}/comment`, {
                                                                            method: 'POST',
                                                                            headers: {'Content-Type': 'application/json'},
                                                                            body: JSON.stringify({
                                                                                userId: backendUserId,
                                                                                comment: comment
                                                                            })
                                                                        })

                                                                        console.log('Comment API response:', response.status, response.statusText, 'ok:', response.ok)

                                                                        if (response.status >= 200 && response.status < 300) {
                                                                            console.log('SUCCESS: Comment added successfully')
                                                                            textarea.value = ''
                                                                            toast({
                                                                                title: "Comment Added",
                                                                                description: "Your comment has been added.",
                                                                            })

                                                                            // Add the new comment to the selected dependency immediately
                                                                            console.log('Current user data:', currentUser)
                                                                            const newComment = {
                                                                                user_id: backendUserId,
                                                                                user: {
                                                                                    name: currentUser?.name || currentUser?.email || 'User',
                                                                                    email: currentUser?.email || 'user@example.com'
                                                                                },
                                                                                comment: comment,
                                                                                created_at: new Date().toISOString()
                                                                            }
                                                                            console.log('New comment object:', newComment)

                                                                            setSelectedDependency((prev: any) => ({
                                                                                ...prev,
                                                                                comments: [...(prev.comments || []), newComment]
                                                                            }))

                                                                            // Also update the projectWatchlist to show the comment in the card
                                                                            setProjectWatchlist((prev: any[]) =>
                                                                                prev.map((item: any) =>
                                                                                    item.id === selectedDependency.id
                                                                                        ? {
                                                                                            ...item,
                                                                                            comments: [...(item.comments || []), newComment]
                                                                                        }
                                                                                        : item
                                                                                )
                                                                            )

                                                                            // Comment added successfully - UI already updated
                                                                        } else {
                                                                            console.log('ERROR: Comment failed with status:', response.status)
                                                                            const errorText = await response.text()
                                                                            console.log('Comment API error:', response.status, errorText)
                                                                            toast({
                                                                                title: "Error",
                                                                                description: `Failed to add comment. Status: ${response.status}`,
                                                                                variant: "destructive"
                                                                            })
                                                                        }
                                                                    } catch (error) {
                                                                        console.log('Comment API catch error:', error)
                                                                        toast({
                                                                            title: "Error",
                                                                            description: "Failed to add comment.",
                                                                            variant: "destructive"
                                                                        })
                                                                    }
                                                                }}
                                                            >
                                                                Comment
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}




