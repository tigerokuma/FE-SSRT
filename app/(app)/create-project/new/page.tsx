"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Github, GitBranch, Package, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { colors } from "@/lib/design-system"
import {useEnsureBackendUser} from "@/lib/useEnsureBackendUser";

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

interface GitHubBranch {
  name: string
  protected: boolean
}

interface GitHubLicense {
  name: string
  key: string
  spdx_id: string | null
  url: string | null
  detected: boolean
  file_name?: string
}

export default function NewProjectPage() {
  const apiBase = "/api/backend";
  const {backendUserId, isEnsured} = useEnsureBackendUser(apiBase);

  const router = useRouter()
  const searchParams = useSearchParams()
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [projectName, setProjectName] = useState<string>('')
  const [selectedLicense, setSelectedLicense] = useState<string>('MIT')
  const [collaborationEnabled, setCollaborationEnabled] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [repository, setRepository] = useState<GitHubRepository | null>(null)
  const [showLicense, setShowLicense] = useState<boolean>(false)
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(false)
  const [detectedLicense, setDetectedLicense] = useState<GitHubLicense | null>(null)
  const [isLoadingLicense, setIsLoadingLicense] = useState<boolean>(false)
  const [hasPackageJson, setHasPackageJson] = useState<boolean | null>(null)
  const [isCheckingPackageJson, setIsCheckingPackageJson] = useState<boolean>(false)
  const [packageCount, setPackageCount] = useState<number | null>(null)
  const [isLoadingPackages, setIsLoadingPackages] = useState<boolean>(false)
  const { toast } = useToast()

  useEffect(() => {
    const repoParam = searchParams.get('repo')
    if (repoParam) {
      try {
        const repoData = JSON.parse(decodeURIComponent(repoParam))
        setRepository(repoData)
        setProjectName(repoData.name)
        // Don't fetch data yet - wait for backend user to be ready
      } catch (error) {
        console.error('Error parsing repository data:', error)
        router.push('/create-project')
      }
    } else {
      router.push('/create-project')
    }
  }, [searchParams, router])

  // Fetch branches and license once backend user is ready
  useEffect(() => {
    if (repository && isEnsured && backendUserId) {
      fetchBranches(repository.full_name)
      fetchLicense(repository.full_name)
    }
  }, [repository, isEnsured, backendUserId])


  // Trigger package.json detection when branch is selected and backend user is ready
  useEffect(() => {
    if (repository && selectedBranch && selectedBranch !== '' && isEnsured && backendUserId) {
      console.log('Branch selected, checking package.json for:', repository.full_name, 'on branch:', selectedBranch)
      checkPackageJson(repository.full_name)
      fetchPackageCount(repository.full_name)
    }
  }, [repository, selectedBranch, isEnsured, backendUserId])

  const fetchBranches = async (repoFullName: string) => {
    if (!backendUserId) {
      console.warn('Cannot fetch branches: backendUserId not available')
      // Set default branches
      setBranches([
        { name: 'main', protected: false },
        { name: 'master', protected: false },
        { name: 'develop', protected: false }
      ])
      return
    }

    setIsLoadingBranches(true)
    try {
      console.log('Fetching branches for:', repoFullName)
      const repositoryUrl = `https://github.com/${repoFullName}`
      const response = await fetch(
  `${apiBase}/github/branches?repositoryUrl=${encodeURIComponent(repositoryUrl)}&userId=${backendUserId}`
      );
      console.log('Branches API response status:', response.status)

      if (response.ok) {
        const branchesData = await response.json()
        console.log('Branches data received:', branchesData)
        setBranches(branchesData)
        // Set the first branch as default if available
        if (branchesData.length > 0 && !selectedBranch) {
          setSelectedBranch(branchesData[0].name)
        }
      } else {
        console.error('Failed to fetch branches:', response.status, response.statusText)
        // Fallback to default branches if API fails
        setBranches([
          { name: 'main', protected: false },
          { name: 'master', protected: false },
          { name: 'develop', protected: false }
        ])
        if (!selectedBranch) {
          setSelectedBranch('main')
        }
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      // Fallback to default branches if API fails
      setBranches([
        { name: 'main', protected: false },
        { name: 'master', protected: false },
        { name: 'develop', protected: false }
      ])
      if (!selectedBranch) {
        setSelectedBranch('main')
      }
    } finally {
      setIsLoadingBranches(false)
    }
  }

  const fetchLicense = async (repoFullName: string) => {
    if (!backendUserId) {
      console.warn('Cannot fetch license: backendUserId not available')
      return
    }

    setIsLoadingLicense(true)
    try {
      console.log('Fetching license for:', repoFullName)
      const repositoryUrl = `https://github.com/${repoFullName}`
      const response = await fetch(
  `${apiBase}/github/license?repositoryUrl=${encodeURIComponent(repositoryUrl)}&userId=${backendUserId}`
      );
      console.log('License API response status:', response.status)

      if (response.ok) {
        const licenseData = await response.json()
        console.log('License data received:', licenseData)
        setDetectedLicense(licenseData)

        // Auto-select the detected license if it's a standard one
        if (licenseData.detected && licenseData.key !== 'custom' && licenseData.key !== 'none') {
          setSelectedLicense(licenseData.key)
          // Don't force showLicense to true - let user decide
        } else if (!licenseData.detected || licenseData.key === 'none') {
          // If no license detected, set to MIT as default
          setSelectedLicense('MIT')
        }
      } else {
        console.error('Failed to fetch license:', response.status, response.statusText)
        // Silently fail - license is optional
      }
    } catch (error) {
      console.error('Error fetching license:', error)
      // Silently fail - license is optional
    } finally {
      setIsLoadingLicense(false)
    }
  }

  const checkPackageJson = async (repoFullName: string) => {
    if (!backendUserId || !selectedBranch) {
      console.warn('Cannot check package.json: backendUserId or selectedBranch not available')
      return
    }

    setIsCheckingPackageJson(true)
    try {
      console.log('Checking for package.json in:', repoFullName, 'on branch:', selectedBranch)
      const repositoryUrl = `https://github.com/${repoFullName}`
      const response = await fetch(
  `${apiBase}/github/package-json?repositoryUrl=${encodeURIComponent(repositoryUrl)}&branch=${encodeURIComponent(selectedBranch)}&userId=${backendUserId}`
      );
      console.log('Package.json API response status:', response.status)

      if (response.ok) {
        const packageJsonData = await response.json()
        console.log('Package.json data received:', packageJsonData)
        setHasPackageJson(packageJsonData.exists)
      } else {
        console.error('Failed to check package.json:', response.status, response.statusText)
        setHasPackageJson(false)
      }
    } catch (error) {
      console.error('Error checking package.json:', error)
      setHasPackageJson(false)
    } finally {
      setIsCheckingPackageJson(false)
    }
  }

  const fetchPackageCount = async (repoFullName: string) => {
    if (!backendUserId || !selectedBranch) {
      console.warn('Cannot fetch package count: backendUserId or selectedBranch not available')
      setPackageCount(null)
      return
    }

    setIsLoadingPackages(true)
    try {
      console.log('Fetching package count for:', repoFullName, 'on branch:', selectedBranch)
      const repositoryUrl = `https://github.com/${repoFullName}`
      const response = await fetch(
  `${apiBase}/github/package-count?repositoryUrl=${encodeURIComponent(repositoryUrl)}&branch=${encodeURIComponent(selectedBranch)}&userId=${backendUserId}`
      );
      console.log('Package count API response status:', response.status)

      if (response.ok) {
        const packageData = await response.json()
        console.log('Package count data received:', packageData)
        setPackageCount(packageData.count || 0)
      } else {
        console.error('Failed to fetch package count:', response.status, response.statusText)
        setPackageCount(0)
      }
    } catch (error) {
      console.error('Error fetching package count:', error)
      setPackageCount(0)
    } finally {
      setIsLoadingPackages(false)
    }
  }

  const licenses = [
    { value: 'none', label: 'No License' },
    { value: 'MIT', label: 'MIT License' },
    { value: 'Apache-2.0', label: 'Apache 2.0' },
    { value: 'GPL-3.0', label: 'GPL 3.0' },
    { value: 'BSD-3-Clause', label: 'BSD 3-Clause' },
    { value: 'ISC', label: 'ISC License' },
    { value: 'LGPL-3.0', label: 'LGPL 3.0' },
    { value: 'MPL-2.0', label: 'Mozilla Public License 2.0' },
    { value: 'Unlicense', label: 'The Unlicense' },
    { value: 'CC0-1.0', label: 'CC0 1.0 Universal' }
  ]

  const handleCreateProject = async () => {
    if (!repository) return

    setIsCreating(true)
    try {
      const response = await fetch(`${apiBase}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName || repository.name,
          description: repository.description,
          repositoryUrl: repository.html_url,
          branch: selectedBranch,
          type: 'repo', // Repository type
          language: 'nodejs', // Always use nodejs
          license: showLicense ? (selectedLicense === 'none' ? null : selectedLicense) : null, // Pass license if toggle is on, null if off or 'none' selected
          userId: backendUserId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
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

  if (!repository) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.main }}>
        <div className="text-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
      <div className="container mx-auto px-6 py-8">
        {/* Main Configuration Card */}
        <div className="w-full mt-8">
          <Card style={{ backgroundColor: colors.background.card }}>
            <CardContent className="p-8">
              {/* Header inside card */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">New Project</h1>
                <p className="text-gray-400 mt-2">
                  Configure your project settings
                </p>
              </div>

              <div className="space-y-8">
                  {/* Project Name */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Project Name</h3>
                    <Input
                      placeholder={repository.name}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="border-gray-700 text-white placeholder-gray-400"
                      style={{ backgroundColor: 'rgb(26, 26, 26)' }}
                    />
                  </div>

                  {/* Repository Info */}
                  <div>
                    <div className="rounded-lg p-4" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <Github className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-white font-medium">{repository.name}</div>
                          <div className="text-sm text-gray-400">{repository.full_name}</div>
                        </div>
                      </div>
                      {isLoadingBranches ? (
                        <div className="flex items-center gap-2 p-3 rounded-md border border-gray-700" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                          <span className="text-gray-400 text-sm">Loading branches...</span>
                        </div>
                      ) : (
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                          <SelectTrigger className="border-gray-700 text-white" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.length > 0 ? (
                              branches.map((branch) => (
                                <SelectItem key={branch.name} value={branch.name}>
                                  {branch.name}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="main">main</SelectItem>
                                <SelectItem value="develop">develop</SelectItem>
                                <SelectItem value="master">master</SelectItem>
                                <SelectItem value="staging">staging</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>


                  {/* License Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">License</h3>
                        {isLoadingLicense ? (
                          <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-400 border-t-transparent"></div>
                            Detecting license...
                          </div>
                        ) : detectedLicense ? (
                          <div className="text-sm text-gray-400 mt-1">
                            {detectedLicense.detected ? (
                              <span className="text-green-400">
                                ✓ Detected: {detectedLicense.name}
                                {detectedLicense.file_name && ` (${detectedLicense.file_name})`}
                              </span>
                            ) : (
                              <span className="text-yellow-400">
                                ⚠ None detected
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <Switch
                        checked={showLicense}
                        onCheckedChange={setShowLicense}
                        className="data-[state=checked]:bg-[rgb(84,0,250)]"
                      />
                    </div>
                    {showLicense && !detectedLicense?.detected && (
                      <div className="relative">
                        {isLoadingLicense ? (
                          <div className="flex items-center gap-2 p-3 rounded-md border border-gray-700" style={{ backgroundColor: 'rgb(26, 26, 26)' }}>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                            <span className="text-gray-400 text-sm">Loading license...</span>
                          </div>
                        ) : (
                          <Select
                            value={selectedLicense}
                            onValueChange={setSelectedLicense}
                          >
                            <SelectTrigger
                              className="border-gray-700 text-white"
                              style={{ backgroundColor: 'rgb(26, 26, 26)' }}
                            >
                              <SelectValue placeholder="Select license" />
                            </SelectTrigger>
                            <SelectContent>
                              {licenses.map((license) => (
                                <SelectItem key={license.value} value={license.value}>
                                  {license.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Packages Detected */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primaryBubble }}>
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Packages Detected</h3>
                          <p className="text-gray-400 text-sm">Dependencies found in your project</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isLoadingPackages ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent"></div>
                            <span className="text-gray-400 text-sm">Loading...</span>
                          </div>
                        ) : (
                          <div className="text-2xl font-bold text-white">
                            {packageCount !== null ? packageCount : "-"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Create Project Button */}
                  <div className="pt-4">
                    <Button
                      onClick={handleCreateProject}
                      disabled={isCreating}
                      className="w-full text-white text-lg py-6"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {isCreating ? 'Creating Project...' : 'Create Project'}
                    </Button>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
