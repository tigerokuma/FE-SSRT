"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GitCommit, FileText, AlertTriangle, Clock } from "lucide-react"
import { colors } from "@/lib/design-system"
import { dummyCommits } from "@/lib/dummyCommitData"
import CommitCard from "./CommitCard"

export default function CommitTimeline() {
  const summaryText = "Recent updates include adding project dependency tracking to the dashboard and improving how alerts are displayed with color-coded severity levels. The API endpoints were also refactored to improve overall loading speed across projects."

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
          Recent Commits
        </h2>
        <Button 
          variant="outline"
          className="flex items-center gap-2"
          style={{ borderColor: colors.border.default, color: colors.text.secondary }}
        >
          <GitCommit className="h-4 w-4" />
          Summarize Commits
        </Button>
      </div>

      {/* Summary Card */}
      <Card style={{ backgroundColor: colors.background.card, borderColor: colors.border.default }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: colors.text.primary }}>
            <FileText className="h-5 w-5" style={{ color: colors.primary }} />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed" style={{ color: colors.text.secondary }}>
            {summaryText}
          </p>
        </CardContent>
      </Card>

      {/* Commit Timeline */}
      <div className="space-y-0">
        {dummyCommits.map((commit, index) => (
          <CommitCard 
            key={commit.id} 
            commit={commit} 
            isLast={index === dummyCommits.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
