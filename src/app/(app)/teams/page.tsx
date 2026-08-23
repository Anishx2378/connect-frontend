"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Folder, Search, Plus, UserCircle, ChevronRight, Loader2, MoreHorizontal, Settings, Trash, Eye, EyeOff } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"

import { CreateTeamModal } from "@/components/modals/CreateTeamModal"

interface Team {
  id: string
  name: string
  handle?: string
  description?: string
  visibility?: string
  colorTheme?: string
  _count: {
    members: number
    projects: number
  }
  lead: {
    id: string
    name: string
    avatar?: string
  }
}

export default function TeamsPage() {
  const router = useRouter()
  const activeWorkspaceId = useStore((state) => state.activeWorkspaceId)
  
  const [teams, setTeams] = React.useState<Team[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  
  const fetchTeams = async () => {
    setLoading(true)
    try {
      const res = await api.get("/teams")
      setTeams(res.data.data)
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (!activeWorkspaceId) return
    fetchTeams()
  }, [activeWorkspaceId])

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shrink-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Teams</h1>
          <p className="text-sm text-slate-500">Groups of people working together.</p>
        </div>
        <Button className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 h-10 shadow-sm transition-all duration-200" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search Teams..." 
              className="pl-10 h-12 bg-white border-slate-200 rounded-xl shadow-sm focus-visible:ring-brand-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="border-t border-slate-200/60 pt-6">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 border-dashed">
                <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-semibold text-slate-900">No teams found</h3>
                <p className="text-slate-500 text-sm mt-1">Create a new team to organize your people and projects.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map((team) => (
                  <Card key={team.id} className="group overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:border-brand-300/50 cursor-pointer flex flex-col h-full" onClick={() => router.push(`/teams/${team.id}`)}>
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="p-6 pb-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-lg ring-1 ring-brand-100">
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 rounded-full">
                                <MoreHorizontal className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push(`/teams/${team.id}`)}>
                                  View Workspace
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/teams/${team.id}/settings`)}>
                                  <Settings className="mr-2 h-4 w-4 text-slate-500" />
                                  Settings
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{team.name}</h3>
                          {team.handle && <p className="text-sm text-slate-500 font-medium">@{team.handle}</p>}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-5">
                          <div className="flex items-center gap-1.5" title="Visibility">
                            {team.visibility === 'Public' ? <Eye className="h-4 w-4 text-slate-400" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
                            <span className="truncate max-w-[60px]">{team.visibility || 'Private'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{team._count.members}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Folder className="h-4 w-4 text-slate-400" />
                            <span>{team._count.projects || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer Section */}
                      <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between group-hover:bg-brand-50/30 transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-xs text-slate-500 shrink-0">Lead:</span>
                          <div className="flex items-center gap-2 min-w-0">
                            {team.lead?.avatar ? (
                              <img src={team.lead.avatar} alt={team.lead.name} className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-200" />
                            ) : (
                              <UserCircle className="h-5 w-5 text-slate-400" />
                            )}
                            <span className="text-sm font-medium text-slate-700 truncate">{team.lead?.name || "Unassigned"}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm font-medium text-brand-600 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                          View Team <ChevronRight className="h-4 w-4 ml-0.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateTeamModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchTeams} 
      />
    </div>
  )
}
