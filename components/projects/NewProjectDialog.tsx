'use client'

import {useEffect, useMemo, useState} from 'react'
import Image from 'next/image'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import {Github, Package, X} from 'lucide-react'
import {colors} from '@/lib/design-system'
import {useToast} from '@/hooks/use-toast'
import {useEnsureBackendUser} from "@/lib/useEnsureBackendUser";

type GitHubRepository = {
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

type GitHubBranch = { name: string; protected: boolean }
type GitHubLicense = {
    name: string
    key: string
    spdx_id: string | null
    url: string | null
    detected: boolean
    file_name?: string
}

interface Props {
    open: boolean
    onOpenChange: (v: boolean) => void
    repo: GitHubRepository | null
}

export default function NewProjectDialog({open, onOpenChange, repo}: Props) {
    const {toast} = useToast()

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const {backendUserId, isEnsured} = useEnsureBackendUser(apiBase);

    const [projectName, setProjectName] = useState('')
    const [branches, setBranches] = useState<GitHubBranch[]>([])
    const [selectedBranch, setSelectedBranch] = useState('')
    const [detectedLicense, setDetectedLicense] = useState<GitHubLicense | null>(null)
    const [selectedLicense, setSelectedLicense] = useState('MIT')
    const [showLicense, setShowLicense] = useState(false)
    const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
    const [selectedFramework, setSelectedFramework] = useState('other')
    const [hasPackageJson, setHasPackageJson] = useState<boolean | null>(null)
    const [packageCount, setPackageCount] = useState<number | null>(null)

    const [isLoadingBranches, setIsLoadingBranches] = useState(false)
    const [isLoadingLicense, setIsLoadingLicense] = useState(false)
    const [isLoadingLanguage, setIsLoadingLanguage] = useState(false)
    const [isCheckingPackageJson, setIsCheckingPackageJson] = useState(false)
    const [isLoadingPackages, setIsLoadingPackages] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    const frameworks = useMemo(
        () => [
            {value: 'other', label: 'Other', icon: '/Deply_Logo.png'},
            {value: 'nodejs', label: 'Node.js', icon: '/Node_logo.png'},
            {value: 'python', label: 'Python', icon: '/Python_logo.png'},
            {value: 'java', label: 'Java', icon: '/Java_logo.png'},
            {value: 'rust', label: 'Rust', icon: '/Rust_logo.png'},
            {value: 'go', label: 'Go', icon: '/Go_logo.png'},
            {value: 'ruby', label: 'Ruby', icon: '/Ruby_logo.png'},
        ],
        []
    )

    const licenses = useMemo(
        () => [
            {value: 'MIT', label: 'MIT License'},
            {value: 'Apache-2.0', label: 'Apache 2.0'},
            {value: 'GPL-3.0', label: 'GPL 3.0'},
            {value: 'BSD-3-Clause', label: 'BSD 3-Clause'},
            {value: 'ISC', label: 'ISC License'},
        ],
        []
    )

    // Reset state when a repo is provided / dialog opened
    useEffect(() => {
        if (!open || !repo) return
        setProjectName(repo.name)
        setSelectedBranch('')
        setBranches([])
        setDetectedLicense(null)
        setSelectedLicense('MIT')
        setShowLicense(false)
        setDetectedLanguage(null)
        setSelectedFramework('other')
        setHasPackageJson(null)
        setPackageCount(null)
    }, [open, repo])

    // Kick off fetches when repo changes
    useEffect(() => {
        if (!open || !repo || !isEnsured || !backendUserId) return
        const full = repo.full_name
        fetchBranches(full)
        fetchLicense(full)
        fetchLanguage(full)
    }, [open, repo, isEnsured, backendUserId])

    // After language known + we later know package.json, decide framework for JS/TS
    useEffect(() => {
        if (!detectedLanguage || hasPackageJson === null) return
        if (['JavaScript', 'TypeScript'].includes(detectedLanguage)) {
            setSelectedFramework(hasPackageJson ? 'nodejs' : 'other')
        }
    }, [detectedLanguage, hasPackageJson])

    // When a branch is chosen, check package.json & package count
    useEffect(() => {
        if (!repo || !selectedBranch) return
        checkPackageJson(repo.full_name)
        fetchPackageCount(repo.full_name)
    }, [selectedBranch, repo])

    async function fetchBranches(full: string) {
        setIsLoadingBranches(true)
        try {
            const repositoryUrl = `https://github.com/${full}`
            const r = await fetch(`${apiBase}/github/branches?repositoryUrl=${encodeURIComponent(repositoryUrl)}&userId=${backendUserId}`)
            if (!r.ok) throw new Error()
            const data = await r.json()
            setBranches(data)
            setSelectedBranch(data[0]?.name || '')
        } catch {
            setBranches([
                {name: 'main', protected: false},
                {name: 'master', protected: false},
                {name: 'develop', protected: false},
            ])
            setSelectedBranch('main')
        } finally {
            setIsLoadingBranches(false)
        }
    }

    async function fetchLicense(full: string) {
        setIsLoadingLicense(true)
        try {
            const repositoryUrl = `https://github.com/${full}`
            const r = await fetch(`${apiBase}/github/license?repositoryUrl=${encodeURIComponent(repositoryUrl)}&userId=${backendUserId}`)
            if (!r.ok) throw new Error()
            const data = await r.json()
            setDetectedLicense(data)
            if (data.detected && data.key !== 'custom' && data.key !== 'none') {
                setSelectedLicense(data.key)
            }
        } catch {
            /* noop */
        } finally {
            setIsLoadingLicense(false)
        }
    }

    async function fetchLanguage(full: string) {
        setIsLoadingLanguage(true)
        try {
            const repositoryUrl = `https://github.com/${full}`
            const r = await fetch(`${apiBase}/github/language?repositoryUrl=${encodeURIComponent(repositoryUrl)}&userId=${backendUserId}`)
            if (!r.ok) throw new Error()
            const data = await r.json()
            setDetectedLanguage(data.language)
            const map: Record<string, string> = {
                JavaScript: 'nodejs',
                TypeScript: 'nodejs',
                Python: 'python',
                Java: 'java',
                Rust: 'rust',
                Go: 'go',
                Ruby: 'ruby',
            }
            const mapped = map[data.language]
            if (mapped && mapped !== 'nodejs') setSelectedFramework(mapped)
        } catch {
            /* noop */
        } finally {
            setIsLoadingLanguage(false)
        }
    }

    async function checkPackageJson(full: string) {
        setIsCheckingPackageJson(true)
        try {
            const repositoryUrl = `https://github.com/${full}`
            const r = await fetch(
                `${apiBase}/github/package-json?repositoryUrl=${encodeURIComponent(repositoryUrl)}&branch=${encodeURIComponent(selectedBranch)}&userId=${backendUserId}`
            )
            if (!r.ok) throw new Error()
            const data = await r.json()
            setHasPackageJson(!!data.exists)
            if (data.exists && ['JavaScript', 'TypeScript'].includes(detectedLanguage || '')) {
                setSelectedFramework('nodejs')
            }
        } catch {
            setHasPackageJson(false)
        } finally {
            setIsCheckingPackageJson(false)
        }
    }

    async function fetchPackageCount(full: string) {
        setIsLoadingPackages(true)
        try {
            const repositoryUrl = `https://github.com/${full}`
            const r = await fetch(
                `${apiBase}/github/package-count?repositoryUrl=${encodeURIComponent(repositoryUrl)}&branch=${encodeURIComponent(selectedBranch)}&userId=${backendUserId}`
            )
            if (!r.ok) throw new Error()
            const data = await r.json()
            setPackageCount(data.count ?? null)
        } catch {
            setPackageCount(null)
        } finally {
            setIsLoadingPackages(false)
        }
    }

    async function handleCreateProject() {
        if (!repo) return
        setIsCreating(true)
        try {
            const r = await fetch(`${apiBase}/projects`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: projectName || repo.name,
                    description: repo.description,
                    repositoryUrl: repo.html_url,
                    branch: selectedBranch,
                    type: 'repo',
                    language: selectedFramework,
                    license: showLicense ? selectedLicense : null,
                    userId: backendUserId,
                }),
            })
            if (!r.ok) throw new Error(await r.text())
            window.dispatchEvent(new Event("projects:invalidate"))
            toast({title: 'Project Created!', description: 'Your project is now being set up in the background.'})
            onOpenChange(false)
        } catch (e) {
            toast({title: 'Error', description: 'Failed to create project. Please try again.', variant: 'destructive'})
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-[640px] border border-white/10 bg-[#121212]"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {/* Top-right cancel (X) */}
                {/*<button*/}
                {/*  aria-label="Close"*/}
                {/*  onClick={() => onOpenChange(false)}*/}
                {/*  className="absolute right-3 top-3 rounded-md p-2 hover:bg-white/5"*/}
                {/*>*/}
                {/*  <X className="h-4 w-4 text-gray-400" />*/}
                {/*</button>*/}

                <DialogHeader>
                    <DialogTitle className="text-white">New Project</DialogTitle>
                </DialogHeader>

                {/* Content */}
                <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-1">
                    {/* Project name */}
                    <div>
                        <h3 className="text-sm font-medium text-white mb-2">Project Name</h3>
                        <Input
                            placeholder={repo?.name || 'my-project'}
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            className="border-gray-700 text-white placeholder-gray-500"
                            style={{backgroundColor: 'rgb(26, 26, 26)'}}
                        />
                    </div>

                    {/* Repo + branch */}
                    <div className="rounded-lg p-4" style={{backgroundColor: 'rgb(26, 26, 26)'}}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                                <Github className="h-4 w-4 text-gray-300"/>
                            </div>
                            <div>
                                <div className="text-white font-medium">{repo?.name}</div>
                                <div className="text-sm text-gray-400">{repo?.full_name}</div>
                            </div>
                        </div>

                        {isLoadingBranches ? (
                            <div className="flex items-center gap-2 p-3 rounded-md border border-gray-700">
                                <div
                                    className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"/>
                                <span className="text-gray-400 text-sm">Loading branches…</span>
                            </div>
                        ) : (
                            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                <SelectTrigger className="border-gray-700 text-white"
                                               style={{backgroundColor: 'rgb(26, 26, 26)'}}>
                                    <SelectValue placeholder="Select branch"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {(branches.length ? branches : [{name: 'main', protected: false}]).map((b) => (
                                        <SelectItem key={b.name} value={b.name}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* License */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-sm font-medium text-white">License</h3>
                                {isLoadingLicense ? (
                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                        <div
                                            className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent"/>
                                        Detecting license…
                                    </div>
                                ) : detectedLicense ? (
                                    <div className="text-xs text-gray-400 mt-1">
                                        {detectedLicense.detected ? (
                                            <span className="text-green-400">
                        ✓ Detected: {detectedLicense.name}
                                                {detectedLicense.file_name && ` (${detectedLicense.file_name})`}
                      </span>
                                        ) : (
                                            <span className="text-yellow-400">⚠ None detected</span>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                            <Switch checked={showLicense} onCheckedChange={setShowLicense}/>
                        </div>

                        {showLicense && !detectedLicense?.detected && (
                            <Select value={selectedLicense} onValueChange={setSelectedLicense}>
                                <SelectTrigger className="border-gray-700 text-white"
                                               style={{backgroundColor: 'rgb(26, 26, 26)'}}>
                                    <SelectValue placeholder="Select license"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {licenses.map((l) => (
                                        <SelectItem key={l.value} value={l.value}>
                                            {l.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Language */}
                    <div>
                        <h3 className="text-sm font-medium text-white mb-2">Language</h3>
                        <Select
                            value={selectedFramework}
                            onValueChange={setSelectedFramework}
                            disabled={isLoadingLanguage || isCheckingPackageJson}
                        >
                            <SelectTrigger className="border-gray-700 text-white"
                                           style={{backgroundColor: 'rgb(26, 26, 26)'}}>
                                <div className="flex items-center gap-2">
                                    {(isLoadingLanguage || isCheckingPackageJson) && (
                                        <div
                                            className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"/>
                                    )}
                                    <SelectValue placeholder="Select language"/>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {frameworks.map((f) => (
                                    <SelectItem key={f.value} value={f.value}>
                                        <div className="flex items-center gap-2">
                                            <img src={f.icon} alt={f.label} className="w-4 h-4"/>
                                            {f.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Packages detected */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{backgroundColor: colors.primaryBubble}}>
                                <Package className="h-4 w-4 text-white"/>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-white">Packages Detected</h3>
                                <p className="text-gray-400 text-xs">Dependencies found in your project</p>
                            </div>
                        </div>
                        <div className="text-right">
                            {isLoadingPackages ? (
                                <div className="flex items-center gap-2">
                                    <div
                                        className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"/>
                                    <span className="text-gray-400 text-sm">Loading…</span>
                                </div>
                            ) : (
                                <div className="text-xl font-bold text-white">{packageCount ?? '-'}</div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <DialogClose asChild>
                        <Button variant="ghost" className="text-gray-300 hover:text-white">Cancel</Button>
                    </DialogClose>
                    <Button
                        onClick={handleCreateProject}
                        disabled={isCreating || !repo || !projectName.trim() || !selectedBranch || !backendUserId || !isEnsured}
                        className="text-white"
                        style={{backgroundColor: colors.primary}}
                    >
                        {isCreating ? 'Creating Project…' : 'Create Project'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
