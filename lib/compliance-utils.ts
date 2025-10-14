import { checkLicenseCompatibility } from './license-utils'

export interface ComplianceData {
  overallCompliance: number
  licenseConflicts: number
  vulnerableDependencies: number
  totalDependencies: number
  nonCompliantDependencies: Array<{
    name: string
    version: string
    license: string
    reason: string
  }>
  vulnerabilityBreakdown: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

export interface ProjectDependency {
  id: string
  name: string
  version: string
  package?: {
    id: string
    name: string
    license?: string  // This is the actual license from the Packages table
    status: string
    total_score?: number
    activity_score?: number
    vulnerability_score?: number
    license_score?: number
    stars?: number
    contributors?: number
    summary?: string
  }
}

export interface Project {
  id: string
  name: string
  license?: string | null
}

/**
 * Calculate compliance data for a project based on its dependencies
 */
export function calculateComplianceData(
  project: Project,
  dependencies: ProjectDependency[]
): ComplianceData {
  const projectLicense = project.license || 'unlicensed'
  const hasProjectLicense = projectLicense && projectLicense !== 'unlicensed' && projectLicense !== 'none'
  
  console.log('🔍 Compliance Calculation Debug:', {
    projectLicense,
    hasProjectLicense,
    totalDependencies: dependencies.length,
    dependenciesWithPackages: dependencies.filter(dep => dep.package).length
  })
  
  let licenseConflicts = 0
  let vulnerableDependencies = 0
  const nonCompliantDependencies: Array<{
    name: string
    version: string
    license: string
    reason: string
  }> = []
  
  const vulnerabilityBreakdown = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  }

  // Process each dependency
  dependencies.forEach(dep => {
    const packageData = dep.package
    if (!packageData) return

    // Check license compatibility by comparing actual licenses
    if (hasProjectLicense && packageData.license) {
      const compatibility = checkLicenseCompatibility(projectLicense, packageData.license)
      console.log(`📄 License Check for ${dep.name}:`, {
        projectLicense,
        packageLicense: packageData.license,
        isCompatible: compatibility.isCompatible,
        reason: compatibility.reason
      })
      
      if (!compatibility.isCompatible) {
        licenseConflicts++
        nonCompliantDependencies.push({
          name: dep.name,
          version: dep.version,
          license: packageData.license,
          reason: compatibility.reason
        })
        console.log(`❌ License conflict found: ${dep.name} (${packageData.license})`)
      }
    }

    // Check vulnerability score
    if (packageData.vulnerability_score !== null && packageData.vulnerability_score !== undefined) {
      const vulnScore = packageData.vulnerability_score
      if (vulnScore > 0) {
        vulnerableDependencies++
        
        // Categorize by severity based on vulnerability score
        if (vulnScore >= 80) vulnerabilityBreakdown.critical++
        else if (vulnScore >= 60) vulnerabilityBreakdown.high++
        else if (vulnScore >= 40) vulnerabilityBreakdown.medium++
        else vulnerabilityBreakdown.low++
      }
    }
  })

  // Calculate overall compliance percentage based on license conflicts only
  const totalDependencies = dependencies.length
  const overallCompliance = totalDependencies > 0 
    ? Math.max(0, Math.round(((totalDependencies - licenseConflicts) / totalDependencies) * 100))
    : 100

  return {
    overallCompliance,
    licenseConflicts,
    vulnerableDependencies,
    totalDependencies,
    nonCompliantDependencies,
    vulnerabilityBreakdown
  }
}

/**
 * Get license display name for better UI presentation
 */
export function getLicenseDisplayName(license: string): string {
  const licenseMap: Record<string, string> = {
    'MIT': 'MIT License',
    'Apache-2.0': 'Apache License 2.0',
    'GPL-2.0': 'GNU GPL v2',
    'GPL-3.0': 'GNU GPL v3',
    'BSD-2-Clause': 'BSD 2-Clause License',
    'BSD-3-Clause': 'BSD 3-Clause License',
    'ISC': 'ISC License',
    'LGPL-2.1': 'GNU LGPL v2.1',
    'LGPL-3.0': 'GNU LGPL v3',
    'MPL-2.0': 'Mozilla Public License 2.0',
    'unlicensed': 'Unlicensed',
    'none': 'No License'
  }
  
  return licenseMap[license] || license
}

/**
 * Get license color for UI display
 */
export function getLicenseColor(license: string): string {
  const colorMap: Record<string, string> = {
    'MIT': 'green',
    'Apache-2.0': 'blue',
    'GPL-2.0': 'red',
    'GPL-3.0': 'red',
    'BSD-2-Clause': 'yellow',
    'BSD-3-Clause': 'yellow',
    'ISC': 'green',
    'LGPL-2.1': 'orange',
    'LGPL-3.0': 'orange',
    'MPL-2.0': 'purple',
    'unlicensed': 'gray',
    'none': 'gray'
  }
  
  return colorMap[license] || 'gray'
}
