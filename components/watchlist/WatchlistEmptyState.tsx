import { Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WatchlistEmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  customButton?: React.ReactNode
  className?: string
}

export function WatchlistEmptyState({ 
  title, 
  description, 
  icon, 
  action,
  customButton,
  className 
}: WatchlistEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border bg-card p-8 ${className}`}>
      {icon || <Package className="h-12 w-12 text-muted-foreground" />}
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center">{description}</p>
      {customButton || (action && (
        <div className="mt-4">
          <Button onClick={action.onClick}>
            <Plus className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        </div>
      ))}
    </div>
  )
}

interface ProductionEmptyStateProps {
  onAddDependency?: () => void
  addDependencyButton?: React.ReactNode
  className?: string
}

export function ProductionEmptyState({ onAddDependency, addDependencyButton, className }: ProductionEmptyStateProps) {
  return (
    <WatchlistEmptyState
      title="No production dependencies"
      description="Add production dependencies to your watchlist."
      action={onAddDependency ? {
        label: "Add Dependency",
        onClick: onAddDependency
      } : undefined}
      customButton={addDependencyButton}
      className={className}
    />
  )
}

interface DevelopmentEmptyStateProps {
  onAddDependency?: () => void
  addDependencyButton?: React.ReactNode
  className?: string
}

export function DevelopmentEmptyState({ onAddDependency, addDependencyButton, className }: DevelopmentEmptyStateProps) {
  return (
    <WatchlistEmptyState
      title="No development dependencies"
      description="Add development dependencies to your watchlist."
      action={onAddDependency ? {
        label: "Add Dependency",
        onClick: onAddDependency
      } : undefined}
      customButton={addDependencyButton}
      className={className}
    />
  )
}

interface AllDependenciesEmptyStateProps {
  onAddDependency?: () => void
  addDependencyButton?: React.ReactNode
  className?: string
}

export function AllDependenciesEmptyState({ onAddDependency, addDependencyButton, className }: AllDependenciesEmptyStateProps) {
  return (
    <WatchlistEmptyState
      title="No dependencies in watchlist"
      description="Start monitoring your project dependencies by adding them to your watchlist."
      action={onAddDependency ? {
        label: "Add First Dependency",
        onClick: onAddDependency
      } : undefined}
      customButton={addDependencyButton}
      className={className}
    />
  )
} 