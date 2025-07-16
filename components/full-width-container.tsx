"use client"

import { cn } from "@/lib/utils"

interface FullWidthContainerProps {
  children: React.ReactNode
  className?: string
  innerClassName?: string
}

export function FullWidthContainer({ 
  children, 
  className, 
  innerClassName 
}: FullWidthContainerProps) {
  return (
    <div className={cn("py-4 sm:py-6 w-full max-w-full overflow-x-hidden", className)}>
      <div className={cn("w-full px-4 sm:px-6 lg:px-8", innerClassName)}>
        {children}
      </div>
    </div>
  )
}

interface FullWidthPageProps {
  children: React.ReactNode
  className?: string
}

export function FullWidthPage({ children, className }: FullWidthPageProps) {
  return (
    <div className={cn("flex flex-col w-full overflow-x-hidden", className)}>
      {children}
    </div>
  )
}

interface FullWidthGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    sm?: number
    md?: number  
    lg?: number
    xl?: number
    "2xl"?: number
  }
}

export function FullWidthGrid({ 
  children, 
  className,
  cols = {
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    "2xl": 6
  }
}: FullWidthGridProps) {
  const gridClasses = cn(
    "w-full grid gap-4",
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols["2xl"] && `2xl:grid-cols-${cols["2xl"]}`,
    className
  )

  return (
    <div className="w-full">
      <div className={gridClasses}>
        {children}
      </div>
    </div>
  )
} 