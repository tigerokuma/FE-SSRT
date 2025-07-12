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
  className?: string
}

export function WatchlistEmptyState({ 
  title, 
  description, 
  icon, 
  action,
  className 
}: WatchlistEmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon || <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          <Plus className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  )
}

interface ProductionEmptyStateProps {
  onAddDependency: () => void
  className?: string
}

export function ProductionEmptyState({ onAddDependency, className }: ProductionEmptyStateProps) {
  return (
    <WatchlistEmptyState
      title="No production dependencies"
      description="Add production dependencies to your watchlist."
      action={{
        label: "Add Dependency",
        onClick: onAddDependency
      }}
      className={className}
    />
  )
}

interface DevelopmentEmptyStateProps {
  onAddDependency: () => void
  className?: string
}

export function DevelopmentEmptyState({ onAddDependency, className }: DevelopmentEmptyStateProps) {
  return (
    <WatchlistEmptyState
      title="No development dependencies"
      description="Add development dependencies to your watchlist."
      action={{
        label: "Add Dependency",
        onClick: onAddDependency
      }}
      className={className}
    />
  )
}

interface AllDependenciesEmptyStateProps {
  onAddDependency: () => void
  className?: string
}

export function AllDependenciesEmptyState({ onAddDependency, className }: AllDependenciesEmptyStateProps) {
  return (
    <WatchlistEmptyState
      title="No dependencies in watchlist"
      description="Start monitoring your project dependencies by adding them to your watchlist."
      action={{
        label: "Add First Dependency",
        onClick: onAddDependency
      }}
      className={className}
    />
  )
} 