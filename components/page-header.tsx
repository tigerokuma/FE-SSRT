import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="border-b">
      <div className={cn(
        "mx-auto px-4 sm:px-6 lg:px-8",
        "max-w-[100%]",
        "sm:max-w-[640px]",
        "md:max-w-[768px]",
        "lg:max-w-[960px]",
        "xl:max-w-[1200px]",
        "2xl:max-w-[1400px]",
        "flex flex-col items-start justify-between gap-4 py-4 sm:py-6 md:py-10"
      )}>
        <div className="grid gap-1 w-full">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl truncate">{title}</h1>
          {description && (
            <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-none">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex w-full sm:w-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
