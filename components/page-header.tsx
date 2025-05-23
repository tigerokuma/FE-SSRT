import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="border-b">
      <div className="container flex flex-col items-start justify-between gap-4 py-4 sm:py-6 md:py-10">
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
