"use client"

import {useState, useEffect, useRef, useMemo} from "react"
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
    ChevronRight,
    GitBranch,
    Terminal
} from "lucide-react"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog"
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@/components/ui/collapsible"
import {toast} from "@/hooks/use-toast"
import {WatchlistSearchDialog} from "@/components/watchlist/WatchlistSearchDialog"
import {WatchlistPackageCard} from "@/components/watchlist/WatchlistPackageCard"
import {DependencyPackageCard} from "@/components/dependencies/DependencyPackageCard"
import {ProjectTopBar} from "@/components/ProjectTopBar"
import {RecommendationItem, type FlatteningSuggestion} from "@/components/recommendations/RecommendationItem"
import {colors} from "@/lib/design-system"
import {checkLicenseCompatibility} from "@/lib/license-utils"
import {
    calculateComplianceData,
    getLicenseDisplayName as getComplianceLicenseDisplayName,
    getLicenseColor
} from "@/lib/compliance-utils"
import {useProjects} from "@/hooks/use-projects"
import {useUser} from "@clerk/nextjs";

// deps (shared pipeline)
import {
    filterAndSortDependencies,
    type DependencyControls,
    type FilterDef as DepFilterDef,
} from "@/lib/deps-utils";
import {useDependencyControls} from "@/lib/useDependencyControls";

// watchlist (new pipeline)
import {
    filterAndSortWatchlist,
    type WatchlistControls,
} from "@/lib/watchlist-utils";
import {useWatchlistControls} from "@/lib/useWatchlistControls";

import {AlertsPanel} from "@/components/alerts/AlertsPanel";


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
    health_score?: number;
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


const DUMMY_DEPENDENCIES: ProjectDependency[] = [
    {
        id: 'dummy-react',
        name: 'react',
        version: '18.2.0',
        risk: 35,
        tags: ['ui', 'framework'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        package_id: 'react',
        package: {
            id: 'react',
            name: 'react',
            status: 'done',
            license: 'MIT',
            stars: 210000,
            contributors: 1600,
            summary: 'The React JavaScript library for building user interfaces.',
            total_score: 85,
            activity_score: 90,
            vulnerability_score: 80,
            bus_factor_score: 75,
            scorecard_score: 88,
        },
    },
    {
        id: 'dummy-lodash',
        name: 'lodash',
        version: '4.17.21',
        risk: 20,
        tags: ['utility'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        package_id: 'lodash',
        package: {
            id: 'lodash',
            name: 'lodash',
            status: 'done',
            license: 'MIT',
            stars: 55000,
            contributors: 650,
            summary: 'A modern JavaScript utility library delivering modularity, performance, and extras.',
            total_score: 78,
            activity_score: 72,
            vulnerability_score: 82,
            bus_factor_score: 68,
            scorecard_score: 80,
        },
    },
];

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
    // always go through our Next.js proxy (adds Clerk JWT)
    const apiBase = "/api/backend";
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
    const [flatteningAnalysisData, setFlatteningAnalysisData] = useState<any>(null)
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
    const [flatteningDialogOpen, setFlatteningDialogOpen] = useState(false)
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
    const [healthScore, setHealthScore] = useState<any>(0)
    const [showWatchFilterPopup, setShowWatchFilterPopup] = useState(false);
    const [showSbomDownloadDialog, setShowSbomDownloadDialog] = useState(false);
    const [sbomFormat, setSbomFormat] = useState<'cyclonedx' | 'spdx'>('cyclonedx');
    const [sbomCompressed, setSbomCompressed] = useState(false);
    const [sbomIncludeWatchlist, setSbomIncludeWatchlist] = useState(true);
    const [isDownloadingSbom, setIsDownloadingSbom] = useState(false);

    // --- Dependency list controls (sort via utils) ---
    // AFTER (rename to avoid collisions)
    const {
        sortKey: depSortKey,
        sortDir: depSortDir,
        setSortKey: setDepSortKey,
        setSortDir: setDepSortDir,
    } = useDependencyControls({sortKey: null, sortDir: null});

    const cycleDepSort = (key: 'name' | 'version' | 'contributors' | 'stars' | 'score') => {
        if (depSortKey !== key) {
            // enter the cycle on this column in DESC first
            setDepSortKey(key);
            setDepSortDir('desc');
            return;
        }
        // same column: desc -> asc -> clear
        if (depSortDir === 'desc') {
            setDepSortDir('asc');
        } else if (depSortDir === 'asc') {
            // clear to default (backend order)
            setDepSortKey(null);
            setDepSortDir(null);
        } else {
            // was cleared but clicked same column: go to desc
            setDepSortDir('desc');
        }
    };

    const depArrow = (key: 'name' | 'version' | 'contributors' | 'stars' | 'score') => {
        if (depSortKey !== key || !depSortDir) return '';      // default state → no arrow
        return depSortDir === 'asc' ? '▲' : '▼';
    };

    // Use the exported FilterDef to keep structural typing aligned with deps-utils
    type FilterId =
        | 'high-risk'
        | 'popular'
        | 'few-contributors'
        | 'stale';

    // 2) Local UI filter def with a strong id (FilterId) but util-compatible predicate
    type LocalFilterDef = {
        id: FilterId;
        label: string;
        description: string;
        // use the predicate type from deps-utils so it matches the pipeline
        predicate: import("@/lib/deps-utils").FilterDef["predicate"];
    };

    const daysBetween = (a: string | Date, b: string | Date) =>
        Math.abs((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24))

    // NOTE: these predicates are placeholders you can evolve later.
    // - "outdated": uses tags or a future boolean (dep.package?.is_outdated).
    // - "risky": uses a score threshold; tweak as you like.
    // - "non-compliant": uses your existing checkLicenseCompatibility(project.license, dep.package?.license)
    // 3) your FILTER_DEFS with strong ids
    const FILTER_DEFS: LocalFilterDef[] = [
        {
            id: 'high-risk',
            label: 'High Risk',
            description: 'Total score ≤ 60',
            predicate: (dep, _project) => (dep.package?.total_score ?? dep.risk ?? 100) <= 60,
        },
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
                const updated = dep.updated_at;
                if (!updated) return false;
                const daysBetween = (a: string | Date, b: string | Date) =>
                    Math.abs((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
                return daysBetween(updated, new Date()) > 180;
            },
        },
    ];

    // handy map (unchanged usage)
    const FILTER_BY_ID: Record<FilterId, LocalFilterDef> =
        FILTER_DEFS.reduce((m, f) => (m[f.id] = f, m), {} as any);

    const FILTER_DEFS_FOR_UTIL: DepFilterDef[] = FILTER_DEFS.map(d => ({
        id: d.id,               // your FilterId (string literal) is fine
        predicate: d.predicate, // exact predicate function
    }));

    // WATCHLIST 3-state sort (default -> desc -> asc -> default)
    type WatchlistSortableKey = "name" | "added_at" | "risk" | "vuln" | "score" | "stars" | "contributors" | "status";

    // bring in the hook
    const {
        state: watchState,
        setSearch: setWatchSearch,
        setStatus: setWatchStatus,
        setLicenseFilter: setWatchLicenseFilter,
        setProcessing: setWatchProcessing,
        setRiskMin: setWatchRiskMin,
        setRiskMax: setWatchRiskMax,
        setSortBy: setWatchSortBy,
        setSortDir: setWatchSortDir,
    } = useWatchlistControls();

    const [tmpWatchStatus, setTmpWatchStatus] = useState<("approved" | "pending" | "rejected")[]>([]);
    const [tmpWatchLicenseFilter, setTmpWatchLicenseFilter] = useState<"all" | "compatible" | "incompatible" | "unknown">("all");
    const [tmpWatchProcessing, setTmpWatchProcessing] = useState<"all" | "queued_or_running" | "done">("all");
    const [tmpWatchRiskMin, setTmpWatchRiskMin] = useState<number>(0);
    const [tmpWatchRiskMax, setTmpWatchRiskMax] = useState<number>(100);

    const watchSortKey = watchState.sortBy;
    const watchSortDir = watchState.sortDir;

    const cycleWatchSort = (key: WatchlistSortableKey) => {
        if (watchSortKey !== key) {
            setWatchSortBy(key);
            setWatchSortDir("desc");
            return;
        }
        if (watchSortDir === "desc") {
            setWatchSortDir("asc");
        } else if (watchSortDir === "asc") {
            setWatchSortBy(null);
            setWatchSortDir(null); // back to backend order
        } else {
            setWatchSortDir("desc");
        }
    };

    const watchArrow = (key: WatchlistSortableKey) => {
        if (watchSortKey !== key || !watchSortDir) return "";
        return watchSortDir === "asc" ? "▲" : "▼";
    };

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
            const healthScoreData = Math.max(0, Math.min(100, Math.round(projectData?.health_score ?? 0)));
            setHealthScore(healthScoreData)
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
            const userResponse = await fetch(`${apiBase}/auth/me`)
            if (userResponse.ok) {
                const userData = await userResponse.json()
                setCurrentUser(userData)
            }

            // Fetch project dependencies
            const dependenciesResponse = await fetch(`${apiBase}/projects/${projectId}/dependencies`)
            if (dependenciesResponse.ok) {
                const dependenciesData = await dependenciesResponse.json()
                setProjectDependencies(
                    Array.isArray(dependenciesData) && dependenciesData.length > 0
                        ? dependenciesData
                        : DUMMY_DEPENDENCIES
                )
            } else {
                setProjectDependencies(DUMMY_DEPENDENCIES)
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

            // Fetch flattening analysis from backend (includes score, recommendations, and low similarity packages)
            try {
                const flatteningResponse = await fetch(`${apiBase}/sbom/flattening-analysis/${projectId}`)
                if (flatteningResponse.ok) {
                    const flatteningData = await flatteningResponse.json()
                    setFlatteningAnalysisData(flatteningData)
                }
            } catch (error) {
                console.error('Failed to fetch flattening analysis:', error)
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
    const triggerFileDownload = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const handleSbomDownload = async () => {
        if (!projectId) {
            toast({
                title: "Project not ready",
                description: "We need a project id to generate an SBOM.",
                variant: "destructive",
            })
            return
        }

        setIsDownloadingSbom(true)

        try {
            const response = await fetch(`${apiBase}/sbom/sbom/create-custom`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    project_id: projectId,
                    format: sbomFormat,
                    compressed: sbomCompressed,
                    include_dependencies: true,
                    include_watchlist_dependencies: sbomIncludeWatchlist,
                }),
            })

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }

            const projectName = project?.name?.trim() || 'project'
            const slugifiedName = projectName.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'project'
            const formatSuffix = sbomFormat === 'spdx' ? 'spdx' : 'cyclonedx'
            const extension = sbomCompressed
                ? '.json.br'
                : sbomFormat === 'spdx'
                    ? '.spdx.json'
                    : '.json'
            const fileName = `${slugifiedName}-sbom-${formatSuffix}${extension}`

            if (sbomCompressed) {
                const base64Payload = (await response.text()).trim()
                if (!base64Payload) {
                    throw new Error('Received empty compressed payload')
                }
                const binaryString = atob(base64Payload)
                const buffer = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                    buffer[i] = binaryString.charCodeAt(i)
                }
                const blob = new Blob([buffer], {type: 'application/octet-stream'})
                triggerFileDownload(blob, fileName)
            } else {
                const sbomJson = await response.json()
                const blob = new Blob([JSON.stringify(sbomJson, null, 2)], {type: 'application/json'})
                triggerFileDownload(blob, fileName)
            }

            toast({
                title: "SBOM ready",
                description: `Downloading ${sbomCompressed ? 'compressed ' : ''}${sbomFormat.toUpperCase()} SBOM.`,
            })
            setShowSbomDownloadDialog(false)
        } catch (error) {
            console.error('Error downloading SBOM:', error)
            toast({
                title: "Download failed",
                description: error instanceof Error ? error.message : 'Unable to download SBOM. Please try again.',
                variant: "destructive",
            })
        } finally {
            setIsDownloadingSbom(false)
        }
    }

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
                setProjectDependencies(
                    Array.isArray(dependenciesData) && dependenciesData.length > 0
                        ? dependenciesData
                        : DUMMY_DEPENDENCIES
                )
            } else {
                setProjectDependencies(DUMMY_DEPENDENCIES)
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

    // --- Build the filter/sort controls object for deps ---
    // Keep this minimal; do NOT set defaults here.
    const depControlsPacked: DependencyControls = {
        search: searchQuery,
        activeFilters,
        sortKey: depSortKey,   // no ?? "score"
        sortDir: depSortDir,   // no ?? "desc"
    };

    // Optional: memoize the derived list
    const dependencyItems = useMemo(
        () => filterAndSortDependencies(
            projectDependencies ?? [],
            depControlsPacked,
            project ?? null,
            FILTER_DEFS_FOR_UTIL
        ),
        [projectDependencies, depControlsPacked, project, FILTER_DEFS_FOR_UTIL]
    );

    // If you want watchlist to use its own search text, use watchState.search instead of searchQuery:
    const watchControlsPacked: WatchlistControls = {
        search: watchState.search,              // or searchQuery if you want shared search box
        status: watchState.status,
        licenseFilter: watchState.licenseFilter,
        processing: watchState.processing,
        riskMin: watchState.riskMin,
        riskMax: watchState.riskMax,
        sortBy: watchState.sortBy,              // nullable
        sortDir: watchState.sortDir,            // nullable
    };

    const watchlistItems = useMemo(
        () => filterAndSortWatchlist(
            projectWatchlist ?? [],
            watchControlsPacked,
            project?.license ?? null
        ),
        [projectWatchlist, watchControlsPacked, project?.license]
    );

    const flatteningAnalysis = useMemo(() => {
        const deps = projectDependencies ?? [];

        // Use backend data if available
        if (flatteningAnalysisData) {
            const suggestions: FlatteningSuggestion[] = [];
            const recommendations = flatteningAnalysisData.recommendations;
            const conflicts = flatteningAnalysisData.duplicateCount || 0;
            
            // Generate suggestions from upgrade recommendations
            if (recommendations && !recommendations.error && recommendations.combo) {
                const upgrades = recommendations.combo;
                
                if (upgrades.length > 0) {
                    // Group upgrades by package name to create recommendations
                    const upgradeGroups = upgrades.reduce((acc: any, item: any) => {
                        if (!acc[item.name]) {
                            acc[item.name] = [];
                        }
                        acc[item.name].push(item.version);
                        return acc;
                    }, {});

                    Object.entries(upgradeGroups).forEach(([pkgName, versions]: [string, any]) => {
                        // Find current version from project dependencies
                        const currentDep = deps.find((d: any) => 
                            (d.package?.name || d.name)?.toLowerCase() === pkgName.toLowerCase()
                        );
                        const currentVer = currentDep?.version || '1.2.3'; // Default to dummy version if not found
                        const recommendedVer = versions[versions.length - 1]; // Latest version
                        
                        if (versions.length > 1) {
                            const versionList = versions.join(", ");
                            suggestions.push({
                                title: `Upgrade ${pkgName} to latest version`,
                                description: `Recommended versions: ${versionList}. This upgrade will help reduce dependency conflicts (${conflicts} conflicts detected).`,
                                impact: conflicts > 5 ? "high" : conflicts > 2 ? "medium" : "low",
                                dependencies: [`${pkgName}@${recommendedVer}`],
                                packageName: pkgName,
                                oldVersion: currentVer,
                                newVersion: recommendedVer,
                            });
                        } else {
                            suggestions.push({
                                title: `Upgrade ${pkgName} to ${versions[0]}`,
                                description: `Upgrading to version ${versions[0]} will help optimize your dependency tree and reduce conflicts.`,
                                impact: conflicts > 5 ? "high" : conflicts > 2 ? "medium" : "low",
                                dependencies: [`${pkgName}@${versions[0]}`],
                                packageName: pkgName,
                                oldVersion: currentVer,
                                newVersion: versions[0],
                            });
                        }
                    });
                }

                // If no specific upgrades but conflicts exist, add a general recommendation
                if (conflicts > 0 && suggestions.length === 0) {
                    suggestions.push({
                        title: "Resolve dependency conflicts",
                        description: `Found ${conflicts} dependency version conflicts. Consider upgrading packages to resolve these conflicts.`,
                        impact: conflicts > 5 ? "high" : "medium",
                        dependencies: [],
                    });
                }
                
                // Add a dummy recommendation for demonstration if no real recommendations exist
                if (suggestions.length === 0) {
                    suggestions.push({
                        title: "Upgrade react to latest version",
                        description: "Upgrading to version 18.2.0 will help optimize your dependency tree and reduce conflicts.",
                        impact: "medium" as const,
                        dependencies: ["react@18.2.0"],
                        packageName: "react",
                        oldVersion: "17.0.2",
                        newVersion: "18.2.0",
                    });
                }
            }

            // Add suggestions for low similarity packages (high-risk anchors)
            if (flatteningAnalysisData.lowSimilarityPackages && flatteningAnalysisData.lowSimilarityPackages.length > 0) {
                // Create individual suggestions for each anchor package
                flatteningAnalysisData.lowSimilarityPackages.slice(0, 5).forEach((pkg: any) => {
                    const anchorName = pkg.packageName || pkg.packageId;
                    const dependents = pkg.dependents || [];
                    
                    if (anchorName) {
                        suggestions.push({
                            title: `High-risk anchor: ${anchorName}`,
                            description: dependents.length > 0
                                ? `Package ${anchorName} is an anchor for ${dependents.length} package${dependents.length > 1 ? 's' : ''}: ${dependents.slice(0, 5).join(', ')}${dependents.length > 5 ? ` and ${dependents.length - 5} more` : ''}. It has low similarity with the rest of your dependency tree (${pkg.sharedDependencyCount || 0} shared dependencies).`
                                : `Package ${anchorName} has low similarity with the rest of your dependency tree (${pkg.sharedDependencyCount || 0} shared dependencies, ${pkg.dependencyCount || 0} total). Consider reviewing or isolating this package.`,
                            impact: "high" as const,
                            dependencies: dependents.length > 0 ? [anchorName, ...dependents] : [anchorName],
                        });
                    }
                });
            }

            // Fallback if no suggestions - add dummy recommendation for demo
            if (suggestions.length === 0) {
                suggestions.push({
                    title: "Upgrade react to latest version",
                    description: "Upgrading to version 18.2.0 will help optimize your dependency tree and reduce conflicts.",
                    impact: "medium" as const,
                    dependencies: ["react@18.2.0"],
                    packageName: "react",
                    oldVersion: "17.0.2",
                    newVersion: "18.2.0",
                });
            }

            return {
                score: flatteningAnalysisData.score || 50,
                duplicateCount: flatteningAnalysisData.duplicateCount || 0,
                highRiskCount: flatteningAnalysisData.highRiskCount || 0,
                transitiveTagCount: 0, // Not provided by backend currently
                total: deps.length,
                suggestions: suggestions.slice(0, 5),
            };
        }

        // Fallback to local analysis if backend data is not available
        if (!deps.length) {
            return {
                score: 50,
                level: "Awaiting data",
                duplicateCount: 0,
                highRiskCount: 0,
                transitiveTagCount: 0,
                total: 0,
                suggestions: [
                    {
                        title: "No dependency data yet",
                        description: "Once dependencies are ingested you'll see flattening guidance here.",
                        impact: "low" as const,
                        dependencies: [],
                    },
                ] satisfies FlatteningSuggestion[],
            };
        }

        const total = deps.length;
        const byName = deps.reduce((map, dep) => {
            const key = (dep.package?.name || dep.name || "").toLowerCase();
            if (!key) return map;
            if (!map.has(key)) {
                map.set(key, [] as ProjectDependency[]);
            }
            map.get(key)!.push(dep);
            return map;
        }, new Map<string, ProjectDependency[]>());

        const duplicateGroups = Array.from(byName.values()).filter((group) => group.length > 1);
        const duplicatePenalty = duplicateGroups.reduce((penalty, group) => penalty + (group.length - 1) * 12, 0);

        const avgRisk = deps.reduce((sum, dep) => sum + (typeof dep.risk === "number" ? dep.risk : 0), 0) / total;
        const riskPenalty = Math.max(0, avgRisk - 40) * 0.4;

        const transitiveDeps = deps.filter((dep) => dep.tags?.includes("transitive"));
        const transitivePenalty = transitiveDeps.length * 5;

        let score = 100 - duplicatePenalty - riskPenalty - transitivePenalty;
        score = Math.round(Math.min(99, Math.max(5, score)));

        const suggestions: FlatteningSuggestion[] = [];

        duplicateGroups.forEach((group) => {
            const name = group[0].package?.name || group[0].name;
            const versions = Array.from(new Set(group.map((dep) => dep.version || "unknown"))).join(", ");
            suggestions.push({
                title: `Merge ${name} versions`,
                description: `Found ${group.length} versions (${versions}). Align on a single version to reduce duplication and simplify updates.`,
                impact: group.length >= 3 ? "high" : "medium",
                dependencies: group.map((dep) => dep.package?.name || dep.name),
            });
        });

        const highRisk = deps
            .filter((dep) => (dep.risk ?? 0) >= 70)
            .sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))
            .slice(0, 3);

        if (highRisk.length) {
            suggestions.push({
                title: "Review high-risk packages",
                description: `High-risk dependencies like ${highRisk
                    .map((dep) => dep.package?.name || dep.name)
                    .join(", ")}. Consider pinning, pruning or replacing them to avoid transitive explosions.`,
                impact: "high",
                dependencies: highRisk.map((dep) => dep.package?.name || dep.name),
            });
        }

        if (transitiveDeps.length) {
            suggestions.push({
                title: "Promote critical transitives",
                description: `${transitiveDeps.length} dependencies are tagged as transitive. Promote critical ones to direct dependencies or remove unused indirect packages to flatten the graph.`,
                impact: "medium",
                dependencies: transitiveDeps.map((dep) => dep.package?.name || dep.name),
            });
        }

        if (!suggestions.length) {
            // Add dummy recommendation for demonstration
            suggestions.push({
                title: "Upgrade react to latest version",
                description: "Upgrading to version 18.2.0 will help optimize your dependency tree and reduce conflicts.",
                impact: "medium" as const,
                dependencies: ["react@18.2.0"],
                packageName: "react",
                oldVersion: "17.0.2",
                newVersion: "18.2.0",
            });
        }

        return {
            score,
            duplicateCount: duplicateGroups.length,
            highRiskCount: highRisk.length,
            transitiveTagCount: transitiveDeps.length,
            total,
            suggestions: suggestions.slice(0, 5),
        };
    }, [projectDependencies, flatteningAnalysisData]);

    const flatteningScoreColor = useMemo(() => {
        const score = flatteningAnalysis.score;
        if (score >= 85) return "text-emerald-300";
        if (score >= 65) return "text-sky-300";
        if (score >= 45) return "text-amber-300";
        return "text-red-400";
    }, [flatteningAnalysis.score]);

    // 1) put this near other helpers in page.tsx
    const gotoDependency = (pkgId: string, version?: string) => {
        let v = version;
        if (!v) {
            const found = projectDependencies.find(
                d => d.package_id === pkgId || d.package?.id === pkgId
            );
            v = found?.version;
        }
        // optional: last chance from branch deps if you keep them in state

        if (v) {
            router.push(`/dependency/${pkgId}/${encodeURIComponent(v)}`);
        } else {
            // fall back to the versionless details page
            router.push(`/dependency/${pkgId}`);
        }
    };


    // 2) replace your handleAlertNavigate in page.tsx
    const handleAlertNavigate = ({
                                     source,
                                     packageId,
                                     packageName,
                                     kind,
                                     version,       // <- allow version to be passed if the alert has it
                                 }: {
        source: "dependency" | "watchlist";
        packageId?: string;
        packageName: string;
        kind: "vulnerability" | "license" | "health";
        version?: string;
    }) => {
        if (!packageId) return;

        // If you still want to switch tabs before navigation, keep these two lines:
        if (source === "dependency") setCurrentTab("dependencies");
        else setCurrentTab("watchlist");

        gotoDependency(packageId, version);
    };


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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"
                                                            fill="none" className="text-gray-700"/>
                                                    <circle
                                                        cx="50"
                                                        cy="50"
                                                        r="40"
                                                        stroke="currentColor"
                                                        strokeWidth="8"
                                                        fill="none"
                                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore / 100)}`}
                                                        style={{stroke: 'rgb(84, 0, 250)'}}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div
                                                            className="text-6xl font-bold text-white">{healthScore}</div>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                            {/* Dependency Flattening */}
                            <Card
                                 style={{backgroundColor: colors.background.card}}
                             >
                                 <CardHeader>
                                     <CardTitle className="text-white">Dependency Flattening</CardTitle>
                                 </CardHeader>
                                 <CardContent>
                                     <div className="space-y-4">
                                         <div className="text-center">
                                             <div className={`text-3xl font-bold ${flatteningScoreColor}`}>{flatteningAnalysis.score}</div>
                                             <div className="text-sm text-gray-400">Flattening score</div>
                                         </div>

                                         <div className="space-y-3 text-sm text-gray-300">
                                             <div className="flex items-center justify-between">
                                                 <div className="flex items-center gap-2">
                                                     <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                                                     <span>Duplicate packages</span>
                                                 </div>
                                                 <span className="text-white font-semibold">{flatteningAnalysis.duplicateCount}</span>
                                             </div>
                                             <div className="flex items-center justify-between">
                                                 <div className="flex items-center gap-2">
                                                     <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                                                     <span>High-risk anchors</span>
                                                 </div>
                                                 <span className="text-white font-semibold">{flatteningAnalysis.highRiskCount}</span>
                                             </div>
                                         </div>

                                         <div className="flex justify-end">
                                             <button
                                                 type="button"
                                                 onClick={() => setFlatteningDialogOpen(true)}
                                                 className="text-xs font-semibold text-indigo-300 underline underline-offset-4 hover:text-indigo-200"
                                             >
                                                 Recommendations
                                             </button>
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
                            <button
                                type="button"
                                className="col-span-5 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => cycleDepSort('name')}
                            >
                                Name {depArrow('name')}
                            </button>

                            <button
                                type="button"
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => cycleDepSort('version')}
                            >
                                Version {depArrow('version')}
                            </button>

                            <button
                                type="button"
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => cycleDepSort('contributors')}
                            >
                                Contributors {depArrow('contributors')}
                            </button>

                            <button
                                type="button"
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => cycleDepSort('stars')}
                            >
                                Stars {depArrow('stars')}
                            </button>

                            <button
                                type="button"
                                className="col-span-1 text-left text-sm text-gray-300 hover:text-white hidden lg:block"
                                onClick={() => cycleDepSort('score')}
                            >
                                Score {depArrow('score')}
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
                                dependencyItems.map((dependency) => (
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
                            )}
                        </div>
                    </div>
                )}

                {currentTab === "watchlist" && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search watchlist dependencies..."
                                        value={watchState.search}
                                        onChange={(e) => setWatchSearch(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        style={{
                                            backgroundColor: colors.background.card,
                                            borderColor: 'hsl(var(--border))',
                                            borderWidth: '1px',
                                        }}
                                    />
                                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400"/>
                                </div>

                                <Button
                                    style={{backgroundColor: colors.primary}}
                                    className="hover:opacity-90 text-white"
                                    onClick={() => {
                                        setShowWatchlistSearchDialog(true);
                                    }}
                                >
                                    <Plus className="h-4 w-4 mr-2"/>
                                    Add Dependency
                                </Button>
                            </div>

                            {/* B) Filters row (button + chips) */}
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                    onClick={() => {
                                        // seed popup with current selections
                                        setTmpWatchStatus(watchState.status);
                                        setTmpWatchLicenseFilter(watchState.licenseFilter);
                                        setTmpWatchProcessing(watchState.processing);
                                        setTmpWatchRiskMin(watchState.riskMin);
                                        setTmpWatchRiskMax(watchState.riskMax);
                                        setShowWatchFilterPopup(true);
                                    }}
                                >
                                    <Search className="h-4 w-4 mr-2"/>
                                    Add Filters
                                </Button>

                                {/* Chips — show what’s active */}
                                <div className="flex flex-wrap gap-2">
                                    {/* Status chips */}
                                    {watchState.status.length > 0 &&
                                        watchState.status.map((s) => (
                                            <div
                                                key={`st-${s}`}
                                                className="flex items-center gap-2 px-3 py-1 text-gray-300 text-sm rounded-full"
                                                style={{
                                                    backgroundColor: colors.background.card,
                                                    borderColor: 'hsl(var(--border))',
                                                    borderWidth: '1px',
                                                }}
                                            >
                                                <span>Status: {s}</span>
                                                <button
                                                    onClick={() =>
                                                        setWatchStatus(watchState.status.filter((x) => x !== s))
                                                    }
                                                    className="text-gray-400 hover:text-gray-300"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}

                                    {/* License chip (hide when 'all') */}
                                    {watchState.licenseFilter !== "all" && (
                                        <div
                                            className="flex items-center gap-2 px-3 py-1 text-gray-300 text-sm rounded-full"
                                            style={{
                                                backgroundColor: colors.background.card,
                                                borderColor: 'hsl(var(--border))',
                                                borderWidth: '1px',
                                            }}
                                        >
                                            <span>License: {watchState.licenseFilter}</span>
                                            <button
                                                onClick={() => setWatchLicenseFilter("all")}
                                                className="text-gray-400 hover:text-gray-300"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}

                                    {/* Processing chip (hide when 'all') */}
                                    {watchState.processing !== "all" && (
                                        <div
                                            className="flex items-center gap-2 px-3 py-1 text-gray-300 text-sm rounded-full"
                                            style={{
                                                backgroundColor: colors.background.card,
                                                borderColor: 'hsl(var(--border))',
                                                borderWidth: '1px',
                                            }}
                                        >
                                            <span>Processing: {watchState.processing}</span>
                                            <button
                                                onClick={() => setWatchProcessing("all")}
                                                className="text-gray-400 hover:text-gray-300"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}

                                    {/* Risk range chip (hide when default 0–100) */}
                                    {(watchState.riskMin !== 0 || watchState.riskMax !== 100) && (
                                        <div
                                            className="flex items-center gap-2 px-3 py-1 text-gray-300 text-sm rounded-full"
                                            style={{
                                                backgroundColor: colors.background.card,
                                                borderColor: 'hsl(var(--border))',
                                                borderWidth: '1px',
                                            }}
                                        >
                                            <span>Risk: {watchState.riskMin}–{watchState.riskMax}</span>
                                            <button
                                                onClick={() => {
                                                    setWatchRiskMin(0);
                                                    setWatchRiskMax(100);
                                                }}
                                                className="text-gray-400 hover:text-gray-300"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* C) Watchlist header with sortable columns */}
                        <div
                            className="hidden md:grid grid-cols-12 items-center px-3 py-2 rounded-lg mb-2"
                            style={{backgroundColor: colors.background.card, border: '1px solid hsl(var(--border))'}}
                        >
                            <button
                                className="col-span-4 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => cycleWatchSort("name")}
                                type="button"
                            >
                                Name {watchArrow("name")}
                            </button>

                            <button
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => cycleWatchSort("added_at")}
                                type="button"
                            >
                                Added {watchArrow("added_at")}
                            </button>

                            <button
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => cycleWatchSort("risk")}
                                type="button"
                            >
                                Risk {watchArrow("risk")}
                            </button>

                            <button
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => cycleWatchSort("stars")}
                                type="button"
                            >
                                Stars {watchArrow("stars")}
                            </button>

                            <button
                                className="col-span-2 text-left text-sm text-gray-300 hover:text-white"
                                onClick={() => cycleWatchSort("status")}
                                type="button"
                            >
                                Status {watchArrow("status")}
                            </button>
                        </div>

                        {/* D) Watchlist list */}
                        <div className="grid gap-4">
                            {watchlistItems && watchlistItems.length > 0 ? (
                                watchlistItems.map((w) => {
                                    const pkgId = w.package?.id;
                                    const statusObj = pkgId ? packageStatuses[pkgId] : undefined;
                                    const isLoading =
                                        statusObj?.status === "queued" || statusObj?.status === "fast";
                                    const packageStatus = statusObj?.status as "queued" | "fast" | "done" | undefined;

                                    return (
                                        <WatchlistPackageCard
                                            key={w.id ?? pkgId ?? `${Math.random()}`}
                                            package={w}
                                            searchQuery={watchState.search}
                                            projectLicense={project?.license}
                                            isLoading={isLoading}
                                            packageStatus={packageStatus}
                                            onPackageClick={(pkg) => {
                                                const packageData = pkg.package || pkg;
                                                const packageName = packageData.name || pkg.name || "Unknown Package";

                                                setSelectedDependency({
                                                    id: pkg.id,
                                                    package_id: pkg.package?.id || (pkg as any).package_id,
                                                    name: packageName,
                                                    version: (pkg as any).version || "Unknown",
                                                    addedBy:
                                                        pkg.addedByUser?.name ||
                                                        pkg.addedByUser?.email ||
                                                        (pkg as any).addedBy ||
                                                        (pkg as any).added_by ||
                                                        "Unknown",
                                                    addedAt:
                                                        (pkg as any).addedAt ||
                                                        (pkg as any).added_at ||
                                                        new Date(),
                                                    comments: (pkg as any).comments || [],
                                                    riskScore: pkg.package?.total_score || (pkg as any).riskScore || 0,
                                                    status: (pkg as any).status || "pending",
                                                    approvedBy:
                                                        (pkg as any).approvedByUser?.name || (pkg as any).approvedBy,
                                                    rejectedBy:
                                                        (pkg as any).rejectedByUser?.name || (pkg as any).rejectedBy,
                                                    approvedAt: (pkg as any).approvedAt,
                                                    rejectedAt: (pkg as any).rejectedAt,
                                                    healthScore:
                                                        (pkg.package as any)?.scorecard_score ||
                                                        (pkg.package as any)?.health_score ||
                                                        (pkg as any).healthScore ||
                                                        0,
                                                    activityScore:
                                                        pkg.package?.activity_score || (pkg as any).activityScore || 0,
                                                    busFactor:
                                                        pkg.package?.bus_factor_score || (pkg as any).busFactor || 0,
                                                    license: pkg.package?.license || (pkg as any).license || "Unknown",
                                                    projectLicense: project?.license || null,
                                                    vulnerabilities:
                                                        pkg.package?.vulnerability_score ||
                                                        (pkg as any).vulnerabilities ||
                                                        0,
                                                    licenseScore: pkg.package?.license_score || 0,
                                                    pastVulnerabilities: (pkg as any).pastVulnerabilities || 0,
                                                });
                                                setShowDependencyReviewDialog(true);
                                            }}
                                        />
                                    );
                                })
                            ) : (
                                <div className="text-center py-12">
                                    <div
                                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                                        style={{backgroundColor: 'rgb(84, 0, 250)'}}
                                    >
                                        <img src="/package_icon.png" alt="Package" className="w-8 h-8"/>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white mb-2">No packages in watchlist</h3>
                                    <p className="text-gray-400 mb-6">
                                        Add packages to your watchlist to monitor their security and health
                                    </p>
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
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Vulnerabilities */}
                            <Card style={{backgroundColor: colors.background.card}}>
                                <CardHeader>
                                    <CardTitle className="text-white">Vulnerabilities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <div className="text-3xl font-bold text-white">{complianceData.vulnerableDependencies}</div>
                                            <div className="text-sm text-gray-400">Total active vulnerabilities</div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                    <span className="text-sm text-gray-300">Critical</span>
                                                </div>
                                                <span className="text-white font-semibold">{complianceData.vulnerabilityBreakdown.critical}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                                    <span className="text-sm text-gray-300">High</span>
                                                </div>
                                                <span className="text-white font-semibold">{complianceData.vulnerabilityBreakdown.high}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                                    <span className="text-sm text-gray-300">Medium</span>
                                                </div>
                                                <span className="text-white font-semibold">{complianceData.vulnerabilityBreakdown.medium}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                    <span className="text-sm text-gray-300">Low</span>
                                                </div>
                                                <span className="text-white font-semibold">{complianceData.vulnerabilityBreakdown.low}</span>
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
                        <AlertsPanel
                            dependencies={projectDependencies}
                            watchlist={projectWatchlist}
                            onOpenSettings={() => {
                                setCurrentTab("settings");
                                setCurrentSettingsTab("alerts");
                            }}
                            onNavigate={handleAlertNavigate}   // NEW
                        />
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

            {/* Dependency Filter Popup Dialog */}
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
            <Dialog open={showWatchFilterPopup} onOpenChange={setShowWatchFilterPopup}>
                <DialogContent className="max-w-md" style={{backgroundColor: colors.background.card}}>
                    <DialogHeader>
                        <DialogTitle className="text-white">Watchlist Filters</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5">
                        {/* Status (multi-select via checkboxes) */}
                        <div>
                            <div className="text-sm text-gray-300 mb-2">Status</div>
                            {(["approved", "pending", "rejected"] as const).map((s) => {
                                const checked = tmpWatchStatus.includes(s);
                                return (
                                    <label key={s} className="flex items-center gap-2 text-gray-300 mb-1">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                                setTmpWatchStatus(prev =>
                                                    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                                                )
                                            }
                                        />
                                        {s}
                                    </label>
                                );
                            })}
                        </div>

                        {/* License filter */}
                        <div>
                            <div className="text-sm text-gray-300 mb-2">License</div>
                            <select
                                value={tmpWatchLicenseFilter}
                                onChange={(e) => setTmpWatchLicenseFilter(e.target.value as any)}
                                className="w-full px-3 py-2 rounded text-white bg-transparent border border-gray-600"
                                style={{
                                    backgroundColor: colors.background.card,
                                    color: colors.text.primary,
                                    borderColor: colors.border.default,
                                }}
                            >
                                <option value="all">All</option>
                                <option value="compatible">Compatible</option>
                                <option value="incompatible">Incompatible</option>
                                <option value="unknown">Unknown</option>
                            </select>
                        </div>

                        {/* Processing filter */}
                        <div>
                            <div className="text-sm text-gray-300 mb-2">Processing</div>
                            <select
                                value={tmpWatchProcessing}
                                onChange={(e) => setTmpWatchProcessing(e.target.value as any)}
                                className="w-full px-3 py-2 rounded text-white bg-transparent border border-gray-600"
                                style={{
                                    backgroundColor: colors.background.card,
                                    color: colors.text.primary,
                                    borderColor: colors.border.default,
                                }}
                            >
                                <option value="all">All</option>
                                <option value="queued_or_running">Queued / Running</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        {/* Risk range */}
                        <div>
                            <div className="text-sm text-gray-300 mb-2">Risk Range</div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={tmpWatchRiskMin}
                                    onChange={(e) => setTmpWatchRiskMin(Math.max(0, Math.min(100, Number(e.target.value))))}
                                    className="w-20 px-2 py-1 rounded text-white bg-transparent border border-gray-600"
                                />
                                <span className="text-gray-400">to</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={tmpWatchRiskMax}
                                    onChange={(e) => setTmpWatchRiskMax(Math.max(0, Math.min(100, Number(e.target.value))))}
                                    className="w-20 px-2 py-1 rounded text-white bg-transparent border border-gray-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pt-2">
                            <Button
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() => {
                                    setTmpWatchStatus([]);
                                    setTmpWatchLicenseFilter("all");
                                    setTmpWatchProcessing("all");
                                    setTmpWatchRiskMin(0);
                                    setTmpWatchRiskMax(100);
                                }}
                            >
                                Reset
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                    onClick={() => setShowWatchFilterPopup(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    style={{backgroundColor: colors.primary}}
                                    className="text-white"
                                    onClick={() => {
                                        setWatchStatus(tmpWatchStatus);
                                        setWatchLicenseFilter(tmpWatchLicenseFilter);
                                        setWatchProcessing(tmpWatchProcessing);
                                        setWatchRiskMin(tmpWatchRiskMin);
                                        setWatchRiskMax(tmpWatchRiskMax);
                                        setShowWatchFilterPopup(false);
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
                            const raw = await projectWatchlistResponse.json();
                            const normalized = raw.map((x: any) => ({
                                ...x,
                                // ensure nested package exists and has a stable id
                                package: {
                                    ...(x.package ?? {}),
                                    id: x.package?.id ?? x.package_id ?? x.packageId, // <- cover all cases
                                    name: x.package?.name ?? x.name,                  // helpful for cards/links
                                },
                            }));
                            setProjectWatchlist(normalized);
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
                                                const pkgId =
                                                    selectedDependency?.package_id ??
                                                    selectedDependency?.package?.id ??
                                                    selectedDependency?.packageId

                                                const ver =
                                                    selectedDependency?.version ??
                                                    projectDependencies.find(d =>
                                                        d.package_id === pkgId || d.package?.id === pkgId
                                                    )?.version

                                                if (pkgId) {
                                                    gotoDependency(pkgId, ver)   // ✅ uses your helper
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

            <Dialog open={showSbomDownloadDialog} onOpenChange={setShowSbomDownloadDialog}>
                <DialogContent className="bg-gray-900 border-gray-800">
                    <DialogHeader>
                        <DialogTitle className="text-white">Download SBOM</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5">
                        <div>
                            <div className="text-sm font-medium text-gray-300 mb-2">SBOM Type</div>
                            <Select
                                value={sbomFormat}
                                onValueChange={(value) => setSbomFormat(value as 'cyclonedx' | 'spdx')}
                            >
                                <SelectTrigger className="text-white" style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-400"/>
                                        <SelectValue placeholder="Select format"/>
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cyclonedx">CycloneDX (JSON)</SelectItem>
                                    <SelectItem value="spdx">SPDX (JSON)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-800 px-4 py-3"
                             style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                            <div>
                                <div className="text-sm font-medium text-white">Include Watchlist Dependencies</div>
                                <p className="text-xs text-gray-400">When off, only direct project dependencies are exported.</p>
                            </div>
                            <Switch
                                checked={sbomIncludeWatchlist}
                                onCheckedChange={setSbomIncludeWatchlist}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-gray-800 px-4 py-3"
                              style={{backgroundColor: 'rgb(18, 18, 18)'}}>
                             <div>
                                 <div className="text-sm font-medium text-white">Brotli Compression</div>
                                 <p className="text-xs text-gray-400">Smaller download, requires decompression to view.</p>
                             </div>
                            <Switch
                                checked={sbomCompressed}
                                onCheckedChange={setSbomCompressed}
                            />
                        </div>

                        <Button
                            className="w-full hover:opacity-90 text-white"
                            style={{backgroundColor: colors.primary}}
                            onClick={handleSbomDownload}
                            disabled={isDownloadingSbom}
                        >
                            {isDownloadingSbom ? 'Preparing...' : 'Download'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={flatteningDialogOpen} onOpenChange={setFlatteningDialogOpen}>
                <DialogContent className="max-w-5xl border border-gray-800 bg-gray-950 text-gray-200 max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">Dependency Flattening Recommendations</DialogTitle>
                        <p className="text-xs text-gray-500">Provides recommendations for resolving dependency version conflicts and consolidating transitive packages.</p>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-3">
                            {flatteningAnalysis.suggestions.map((suggestion, idx) => (
                                <RecommendationItem
                                    key={`${suggestion.title}-${idx}`}
                                    suggestion={suggestion}
                                    projectId={projectId}
                                    apiBase={apiBase}
                                />
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}




