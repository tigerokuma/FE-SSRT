"use client"

import {useState, useEffect} from "react"
import {useRouter} from "next/navigation"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Card, CardContent} from "@/components/ui/card"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Switch} from "@/components/ui/switch"
import {Github, ArrowLeft, Package, Globe, Lock} from "lucide-react"
import {useToast} from "@/hooks/use-toast"
import {colors} from "@/lib/design-system"
import {useEnsureBackendUser} from "@/lib/useEnsureBackendUser";
import NewProjectDialog from "@/components/projects/NewProjectDialog";

interface GitHubRepository {
    id: number
    name: string
    full_name: string
    description: string
    html_url: string
    clone_url: string
    private: boolean
    language: string
    stargazers_count: number
    forks_count: number
    updated_at: string
}

export default function CreateProjectPage() {
    const router = useRouter()
    const [repositories, setRepositories] = useState<GitHubRepository[]>([])
    const [filteredRepos, setFilteredRepos] = useState<GitHubRepository[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [creatingRepoId, setCreatingRepoId] = useState<number | null>(null)
    const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

    // File drop zone state
    const [isFileDropped, setIsFileDropped] = useState(false)
    const [droppedFile, setDroppedFile] = useState<File | null>(null)
    const [projectName, setProjectName] = useState('')
    const [selectedLicense, setSelectedLicense] = useState('MIT')
    const [packageData, setPackageData] = useState<any>(null)
    const [isProcessingFile, setIsProcessingFile] = useState(false)
    const [showLicense, setShowLicense] = useState(false)

    const {toast} = useToast()

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "/api/backend";
    const {backendUserId, isEnsured} = useEnsureBackendUser(apiBase);

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedRepo, setSelectedRepo] = useState<GitHubRepository | null>(null)


    // License options
    const licenses = [
        {value: 'MIT', label: 'MIT License'},
        {value: 'Apache-2.0', label: 'Apache 2.0'},
        {value: 'GPL-3.0', label: 'GPL 3.0'},
        {value: 'BSD-3-Clause', label: 'BSD 3-Clause'},
        {value: 'ISC', label: 'ISC License'}
    ]

    useEffect(() => {
        if (!backendUserId || !isEnsured) return;
        fetchRepositories()
    }, [backendUserId, isEnsured])

    useEffect(() => {
        if (searchQuery) {
            const filtered = repositories.filter(repo =>
                repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            setFilteredRepos(filtered)
        } else {
            setFilteredRepos(repositories)
        }
    }, [searchQuery, repositories])

    const fetchRepositories = async () => {
        if (!backendUserId) return;              // wait for backend user id
        setIsLoading(true);
        try {
            const response = await fetch(
                `${apiBase}/github/repositories/${backendUserId}`,
                {credentials: 'include'}
            );
            if (response.ok) {
                const repos = await response.json();
                setRepositories(repos);
                setFilteredRepos(repos);
            } else {
                console.error('Failed to fetch repositories');
                toast({
                    title: "Error",
                    description: "Failed to load your GitHub repositories. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Error fetching repositories:', error);
            toast({
                title: "Error",
                description: "Failed to load your GitHub repositories. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // const handleCreateProject = async (repo: GitHubRepository) => {
    //     // Navigate to new project configuration page with repository data
    //     router.push(`/create-project/new?repo=${encodeURIComponent(JSON.stringify(repo))}`)
    // }

    const handleCreateProject = (repo: GitHubRepository) => {
        router.push(`/create-project/new?repo=${encodeURIComponent(JSON.stringify(repo))}`)
        // setSelectedRepo(repo)
        // setDialogOpen(true) // open the modal instead of routing
    }

    const handleFileUpload = async (file: File) => {
        if (!file.name.endsWith('.json')) {
            toast({
                title: "Invalid File",
                description: "Please select a valid JSON file.",
                variant: "destructive",
            })
            return
        }

        setIsProcessingFile(true)
        setDroppedFile(file)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`${apiBase}/github/parse-package-json`, {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                setPackageData(data)
                setProjectName(data.name || '')
                setIsFileDropped(true)

                toast({
                    title: "File Processed",
                    description: `Successfully parsed ${file.name}`,
                })
            } else {
                throw new Error('Failed to parse file')
            }
        } catch (error) {
            console.error('Error processing file:', error)
            toast({
                title: "Error",
                description: "Failed to process the file. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsProcessingFile(false)
        }
    }

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            handleFileUpload(file)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const files = e.dataTransfer.files
        if (files.length > 0) {
            handleFileUpload(files[0])
        }
    }

    const handleClearFile = () => {
        setIsFileDropped(false)
        setDroppedFile(null)
        setPackageData(null)
        setProjectName('')
        setSelectedLicense('MIT')
        setShowLicense(false)
    }

    const handleCreateProjectFromFile = async () => {
        if (!packageData || !backendUserId) return

        setIsCreating(true)
        try {
            const response = await fetch(`${apiBase}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: projectName,
                    description: packageData.description || '',
                    // Don't send repositoryUrl or branch for file uploads
                    type: 'file', // File upload type
                    language: 'nodejs', // Always nodejs for package.json
                    license: showLicense ? selectedLicense : null, // Pass license if toggle is on, null if off
                    userId: backendUserId,
                    packageData: packageData
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Project creation failed:', response.status, errorText)
                throw new Error(`Failed to create project: ${response.status} - ${errorText}`)
            }

            const newProject = await response.json()
            console.log("Project created successfully:", newProject)

            // Trigger sidebar update
            window.dispatchEvent(new CustomEvent('projects:invalidate'))

            toast({
                title: "Project Created!",
                description: "Your project is now being set up in the background.",
                duration: 5000,
            })

            // Navigate to dashboard
            router.push('/project')
        } catch (error) {
            console.error("Error creating project:", error)
            toast({
                title: "Error",
                description: "Failed to create project. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsCreating(false)
        }
    }

    const handleCopy = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedStates(prev => ({...prev, [key]: true}))
            setTimeout(() => {
                setCopiedStates(prev => ({...prev, [key]: false}))
            }, 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    return (
        <div className="min-h-screen" style={{backgroundColor: colors.background.main}}>
            <div className="container mx-auto px-6 py-8 max-w-7xl" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Create Project</h1>
                    <p className="text-gray-400 mt-2">
                        Choose how you'd like to create your project
                    </p>
                </div>

                {/* Single Column Layout */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Git Repositories */}
                    <div className="space-y-6" style={{backgroundColor: colors.background.card}}>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                     style={{backgroundColor: colors.primaryBubble}}>
                                    <Github className="h-4 w-4 text-white"/>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Import Git Repository</h2>
                                    <p className="text-gray-400 text-sm">Link to repository for automatic updates</p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative mb-6">
                                <Input
                                    placeholder="Search repositories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-black border-gray-700 text-white placeholder-gray-400"
                                    style={{backgroundColor: 'rgb(26 26 26)'}}
                                />
                            </div>

                            {/* Repository List */}
                            <div className="space-y-3">
                                {isLoading ? (
                                    // Loading skeletons
                                    Array.from({length: 5}).map((_, index) => (
                                        <Card
                                            key={index}
                                            className="bg-black border-gray-700 hover:border-gray-600 transition-all"
                                            style={{backgroundColor: 'rgb(26 26 26)'}}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-8 h-8 bg-gray-600 rounded-lg animate-pulse"/>
                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className="h-4 bg-gray-600 rounded animate-pulse mb-1 w-3/4"/>
                                                            <div
                                                                className="h-3 bg-gray-600 rounded animate-pulse mb-1 w-1/2"/>
                                                            <div
                                                                className="h-3 bg-gray-600 rounded animate-pulse w-2/3"/>
                                                        </div>
                                                    </div>
                                                    <div className="h-8 w-20 bg-gray-600 rounded animate-pulse"/>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : filteredRepos.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400">No repositories found</div>
                                    </div>
                                ) : (
                                    filteredRepos.map((repo) => (
                                        <Card
                                            key={repo.id}
                                            className="bg-black border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
                                            style={{backgroundColor: 'rgb(26 26 26)'}}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    {/* Left side: icon + text */}
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        {/* Use your /public/Github_icon.png */}
                                                        <div
                                                            className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                                                            <img src="/Github_icon.png" alt="GitHub"
                                                                 className="h-4 w-4"/>
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1 min-w-0">
                                                                <h3 className="font-medium text-white truncate">{repo.name}</h3>

                                                                {/* Privacy tag with lucide-react */}
                                                                {repo.private ? (
                                                                    <span
                                                                        className="ml-1 inline-flex items-center gap-1 rounded-full border border-red-900/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
                                                                          <Lock className="h-3 w-3"/>
                                                                          Private
                                                                        </span>
                                                                ) : (
                                                                    <span
                                                                        className="ml-1 inline-flex items-center gap-1 rounded-full border border-emerald-900/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                                                                      <Globe className="h-3 w-3"/>
                                                                      Public
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div
                                                                className="text-sm text-gray-400 truncate">{repo.full_name}</div>
                                                            {repo.description && (
                                                                <div
                                                                    className="text-xs text-gray-500 truncate mt-1">{repo.description}</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Right side: Import button */}
                                                    <Button
                                                        onClick={() => handleCreateProject(repo)}
                                                        disabled={creatingRepoId === repo.id || !backendUserId || !isEnsured}
                                                        className="text-white"
                                                        style={{backgroundColor: colors.primary}}
                                                    >
                                                        {creatingRepoId === repo.id ? 'Creating...' : 'Import'}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <NewProjectDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                repo={selectedRepo}
            />
        </div>

    )
}
