import { GitBranch, GitCommit, GitMerge, GitPullRequest, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const activityData = [
  {
    id: 1,
    type: "commit",
    repo: "lodash/lodash",
    user: {
      name: "John Smith",
      avatar: "/placeholder-user.jpg",
      initials: "JS",
    },
    message: "Fix: Resolve issue with _.debounce when used with React hooks",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "pull_request",
    repo: "vercel/next.js",
    user: {
      name: "Sarah Johnson",
      avatar: "/placeholder-user.jpg",
      initials: "SJ",
    },
    message: "Feature: Add new API for server components",
    time: "4 hours ago",
  },
  {
    id: 3,
    type: "merge",
    repo: "facebook/react",
    user: {
      name: "Mike Chen",
      avatar: "/placeholder-user.jpg",
      initials: "MC",
    },
    message: "Merge: Concurrent mode improvements",
    time: "Yesterday",
  },
  {
    id: 4,
    type: "branch",
    repo: "tailwindlabs/tailwindcss",
    user: {
      name: "Emma Wilson",
      avatar: "/placeholder-user.jpg",
      initials: "EW",
    },
    message: "Created branch: feature/jit-improvements",
    time: "Yesterday",
  },
  {
    id: 5,
    type: "commit",
    repo: "lodash/lodash",
    user: {
      name: "Alex Turner",
      avatar: "/placeholder-user.jpg",
      initials: "AT",
    },
    message: "Refactor: Improve performance of _.map for large arrays",
    time: "2 days ago",
  },
]

const getActivityIcon = (type: string) => {
  switch (type) {
    case "commit":
      return <GitCommit className="h-4 w-4" />
    case "pull_request":
      return <GitPullRequest className="h-4 w-4" />
    case "merge":
      return <GitMerge className="h-4 w-4" />
    case "branch":
      return <GitBranch className="h-4 w-4" />
    default:
      return <User className="h-4 w-4" />
  }
}

export function ActivityFeed() {
  return (
    <div className="space-y-4">
      {activityData.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4 rounded-lg border p-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
            <AvatarFallback>{activity.user.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{activity.user.name}</span>
              <Badge variant="outline" className="flex items-center gap-1">
                {getActivityIcon(activity.type)}
                <span className="text-xs">{activity.repo}</span>
              </Badge>
            </div>
            <p className="text-sm">{activity.message}</p>
            <p className="text-xs text-muted-foreground">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
