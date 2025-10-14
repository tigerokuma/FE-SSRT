/**
 * License compatibility utilities
 */

export interface LicenseCompatibility {
  isCompatible: boolean
  reason: string
  severity: 'low' | 'medium' | 'high'
}

/**
 * Check if a package license is compatible with a project license
 */
export function checkLicenseCompatibility(
  projectLicense: string | null | undefined,
  packageLicense: string | null | undefined
): LicenseCompatibility {
  // Handle undefined/null cases
  if (!projectLicense || projectLicense === 'unlicensed' || projectLicense === 'none') {
    return {
      isCompatible: true,
      reason: 'Project has no license restrictions',
      severity: 'low'
    }
  }

  if (!packageLicense || packageLicense === 'unlicensed' || packageLicense === 'none') {
    return {
      isCompatible: false,
      reason: 'Package has no license - use with caution',
      severity: 'high'
    }
  }

  const projectLower = projectLicense.toLowerCase()
  const packageLower = packageLicense.toLowerCase()

  // Same license - always compatible
  if (projectLower === packageLower) {
    return {
      isCompatible: true,
      reason: 'Same license as project',
      severity: 'low'
    }
  }

  // MIT license - compatible with most licenses
  if (projectLower.includes('mit')) {
    if (packageLower.includes('mit') || packageLower.includes('apache') || 
        packageLower.includes('bsd') || packageLower.includes('isc') ||
        packageLower.includes('unlicense') || packageLower.includes('cc0')) {
      return {
        isCompatible: true,
        reason: 'MIT project can use permissive licenses',
        severity: 'low'
      }
    }
    
    if (packageLower.includes('gpl')) {
      return {
        isCompatible: false,
        reason: 'GPL licenses are incompatible with MIT projects',
        severity: 'high'
      }
    }
  }

  // Apache license - compatible with most permissive licenses
  if (projectLower.includes('apache')) {
    if (packageLower.includes('mit') || packageLower.includes('apache') || 
        packageLower.includes('bsd') || packageLower.includes('isc') ||
        packageLower.includes('unlicense') || packageLower.includes('cc0')) {
      return {
        isCompatible: true,
        reason: 'Apache project can use permissive licenses',
        severity: 'low'
      }
    }
    
    if (packageLower.includes('gpl')) {
      return {
        isCompatible: false,
        reason: 'GPL licenses are incompatible with Apache projects',
        severity: 'high'
      }
    }
  }

  // BSD licenses - compatible with most permissive licenses
  if (projectLower.includes('bsd')) {
    if (packageLower.includes('mit') || packageLower.includes('apache') || 
        packageLower.includes('bsd') || packageLower.includes('isc') ||
        packageLower.includes('unlicense') || packageLower.includes('cc0')) {
      return {
        isCompatible: true,
        reason: 'BSD project can use permissive licenses',
        severity: 'low'
      }
    }
    
    if (packageLower.includes('gpl')) {
      return {
        isCompatible: false,
        reason: 'GPL licenses are incompatible with BSD projects',
        severity: 'high'
      }
    }
  }

  // GPL projects - can use GPL and compatible licenses
  if (projectLower.includes('gpl')) {
    if (packageLower.includes('gpl') || packageLower.includes('mit') || 
        packageLower.includes('apache') || packageLower.includes('bsd') ||
        packageLower.includes('isc') || packageLower.includes('unlicense') ||
        packageLower.includes('cc0')) {
      return {
        isCompatible: true,
        reason: 'GPL project can use GPL and permissive licenses',
        severity: 'low'
      }
    }
    
    if (packageLower.includes('agpl')) {
      return {
        isCompatible: false,
        reason: 'AGPL is more restrictive than GPL',
        severity: 'medium'
      }
    }
  }

  // AGPL projects - most restrictive
  if (projectLower.includes('agpl')) {
    if (packageLower.includes('agpl') || packageLower.includes('gpl') ||
        packageLower.includes('mit') || packageLower.includes('apache') || 
        packageLower.includes('bsd') || packageLower.includes('isc') ||
        packageLower.includes('unlicense') || packageLower.includes('cc0')) {
      return {
        isCompatible: true,
        reason: 'AGPL project can use most licenses',
        severity: 'low'
      }
    }
  }

  // Proprietary/Commercial licenses
  if (projectLower.includes('proprietary') || projectLower.includes('commercial')) {
    return {
      isCompatible: false,
      reason: 'Proprietary projects should avoid open source dependencies',
      severity: 'high'
    }
  }

  // Unknown license combinations
  return {
    isCompatible: false,
    reason: 'Unknown license compatibility - review required',
    severity: 'medium'
  }
}

/**
 * Get a human-readable license name
 */
export function getLicenseDisplayName(license: string | null | undefined): string {
  if (!license || license === 'unlicensed' || license === 'none') {
    return 'No License'
  }

  const licenseLower = license.toLowerCase()
  
  if (licenseLower.includes('mit')) return 'MIT'
  if (licenseLower.includes('apache')) return 'Apache 2.0'
  if (licenseLower.includes('gpl-3')) return 'GPL-3.0'
  if (licenseLower.includes('gpl-2')) return 'GPL-2.0'
  if (licenseLower.includes('agpl')) return 'AGPL-3.0'
  if (licenseLower.includes('bsd-3')) return 'BSD-3-Clause'
  if (licenseLower.includes('bsd-2')) return 'BSD-2-Clause'
  if (licenseLower.includes('bsd')) return 'BSD'
  if (licenseLower.includes('isc')) return 'ISC'
  if (licenseLower.includes('unlicense')) return 'Unlicense'
  if (licenseLower.includes('cc0')) return 'CC0'
  
  return license
}
