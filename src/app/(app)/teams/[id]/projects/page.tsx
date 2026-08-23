"use client"

import * as React from "react"
import { useTeamStore } from "@/store/useTeamStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FolderPlus, MoreHorizontal } from "lucide-react"

export default function TeamProjectsPage() {
  const { getActiveTeam } = useTeamStore()
  const team = getActiveTeam()

  if (!team) return null

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search team projects..." 
            className="pl-10 h-10 bg-white border-border"
          />
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <FolderPlus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-16 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mb-4">
            <FolderPlus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">This team doesn't have any projects assigned to it yet. Create one to get started.</p>
          <Button className="bg-primary/10 hover:bg-brand-100 text-primary shadow-none border-brand-200 border">
            Create First Project
          </Button>
        </div>
      </div>
    </div>
  )
}
