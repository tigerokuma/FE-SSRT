export interface CommitData {
  id: string
  sha?: string | undefined
  contributor: { name: string, avatar?: string }
  message: string
  linesAdded: number
  linesDeleted: number
  filesChanged: number
  timestamp: string
  anomalyScore: number // 0-30
  scoreBreakdown?: Array<{
    factor: string
    points: number
    reason: string
  }>
  contributorProfile: {
    avgLinesChanged: { added: number, deleted: number }
    stddevLinesChanged?: { added: number, deleted: number }
    avgFilesChanged: number
    stddevFilesChanged?: number
    totalCommits?: number
    typicalTimes: string // e.g., "Weekdays, 9 AM - 5 PM PST"
    heatmapData: number[][] // 7x24 grid
    thisCommitTime: string
  }
}

export const dummyCommits: CommitData[] = [
  {
    id: 'commit-1',
    contributor: { name: 'Sophie Bell', avatar: 'https://avatars.githubusercontent.com/u/169111517?s=400&v=4' },
    message: 'feat: Implement new caching mechanism for faster data retrieval',
    linesAdded: 1283,
    linesDeleted: 45,
    filesChanged: 8,
    timestamp: '2 days ago',
    anomalyScore: 8,
    contributorProfile: {
      avgLinesChanged: { added: 250, deleted: 80 },
      avgFilesChanged: 4,
      typicalTimes: 'Weekdays, 9 AM - 5 PM PST',
      heatmapData: generateHeatmapData([1, 1, 1, 1, 1, 0, 0]), // Weekdays active
      thisCommitTime: 'Tuesday, 2:30 PM PST'
    }
  },
  {
    id: 'commit-2',
    contributor: { name: 'Dan Star', avatar: 'https://avatars.githubusercontent.com/u/169111517?s=400&v=4' },
    message: 'fix security: Address critical vulnerability in string parsing logic (CVE-2024-12345)',
    linesAdded: 588,
    linesDeleted: 2100,
    filesChanged: 2,
    timestamp: '3 days ago',
    anomalyScore: 25,
    contributorProfile: {
      avgLinesChanged: { added: 120, deleted: 50 },
      avgFilesChanged: 2,
      typicalTimes: 'Weekdays, 9 AM - 5 PM PST',
      heatmapData: generateHeatmapData([1, 1, 1, 1, 1, 0, 0]), // Weekdays active
      thisCommitTime: 'Monday, 11:45 PM PST'
    }
  },
  {
    id: 'commit-3',
    contributor: { name: 'Alex Chen', avatar: 'https://avatars.githubusercontent.com/u/169111517?s=400&v=4' },
    message: 'refactor: Optimize database queries and improve performance',
    linesAdded: 320,
    linesDeleted: 180,
    filesChanged: 5,
    timestamp: '5 days ago',
    anomalyScore: 12,
    contributorProfile: {
      avgLinesChanged: { added: 200, deleted: 100 },
      avgFilesChanged: 3,
      typicalTimes: 'Weekdays, 9 AM - 5 PM PST',
      heatmapData: generateHeatmapData([1, 1, 1, 1, 1, 0, 0]), // Weekdays active
      thisCommitTime: 'Thursday, 10:15 AM PST'
    }
  },
  {
    id: 'commit-4',
    contributor: { name: 'Maria Rodriguez', avatar: 'https://avatars.githubusercontent.com/u/169111517?s=400&v=4' },
    message: 'feat: Add new authentication middleware with enhanced security',
    linesAdded: 450,
    linesDeleted: 25,
    filesChanged: 3,
    timestamp: '1 week ago',
    anomalyScore: 6,
    contributorProfile: {
      avgLinesChanged: { added: 300, deleted: 60 },
      avgFilesChanged: 4,
      typicalTimes: 'Weekdays, 9 AM - 5 PM PST',
      heatmapData: generateHeatmapData([1, 1, 1, 1, 1, 0, 0]), // Weekdays active
      thisCommitTime: 'Wednesday, 3:20 PM PST'
    }
  },
  {
    id: 'commit-5',
    contributor: { name: 'James Wilson', avatar: 'https://avatars.githubusercontent.com/u/169111517?s=400&v=4' },
    message: 'fix: Resolve memory leak in background processing service',
    linesAdded: 95,
    linesDeleted: 340,
    filesChanged: 1,
    timestamp: '1 week ago',
    anomalyScore: 18,
    contributorProfile: {
      avgLinesChanged: { added: 150, deleted: 80 },
      avgFilesChanged: 2,
      typicalTimes: 'Weekdays, 9 AM - 5 PM PST',
      heatmapData: generateHeatmapData([1, 1, 1, 1, 1, 0, 0]), // Weekdays active
      thisCommitTime: 'Friday, 6:30 PM PST'
    }
  },
  {
    id: 'commit-6',
    contributor: { name: 'Sarah Kim', avatar: 'https://avatars.githubusercontent.com/u/169111517?s=400&v=4' },
    message: 'docs: Update API documentation and add usage examples',
    linesAdded: 220,
    linesDeleted: 15,
    filesChanged: 6,
    timestamp: '2 weeks ago',
    anomalyScore: 4,
    contributorProfile: {
      avgLinesChanged: { added: 180, deleted: 40 },
      avgFilesChanged: 5,
      typicalTimes: 'Weekdays, 9 AM - 5 PM PST',
      heatmapData: generateHeatmapData([1, 1, 1, 1, 1, 0, 0]), // Weekdays active
      thisCommitTime: 'Tuesday, 11:00 AM PST'
    }
  },
  {
    id: 'commit-7',
    contributor: { name: 'Mike Johnson', avatar: 'https://avatars.githubusercontent.com/u/169111517?s=400&v=4' },
    message: 'feat: Implement advanced analytics dashboard with real-time updates',
    linesAdded: 1850,
    linesDeleted: 120,
    filesChanged: 12,
    timestamp: '2 weeks ago',
    anomalyScore: 28,
    contributorProfile: {
      avgLinesChanged: { added: 400, deleted: 150 },
      avgFilesChanged: 8,
      typicalTimes: 'Weekdays, 9 AM - 5 PM PST',
      heatmapData: generateHeatmapData([1, 1, 1, 1, 1, 0, 0]), // Weekdays active
      thisCommitTime: 'Saturday, 8:45 PM PST'
    }
  }
]

// Helper function to generate heatmap data
function generateHeatmapData(activeDays: number[]): number[][] {
  const heatmap: number[][] = []
  
  for (let day = 0; day < 7; day++) {
    const dayRow: number[] = []
    for (let hour = 0; hour < 24; hour++) {
      if (activeDays[day] === 1) {
        // Weekdays: higher activity during 9 AM - 5 PM
        if (hour >= 9 && hour <= 17) {
          dayRow.push(Math.floor(Math.random() * 8) + 2) // 2 to 10 commits
        } else {
          dayRow.push(Math.floor(Math.random() * 3)) // 0 to 3 commits
        }
      } else {
        // Weekends: lower activity
        dayRow.push(Math.floor(Math.random() * 2)) // 0 to 2 commits
      }
    }
    heatmap.push(dayRow)
  }
  
  return heatmap
}
