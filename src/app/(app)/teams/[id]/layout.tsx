"use client"

import * as React from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, Folder, Calendar, UserCircle, Settings, Hash, FileText, Video, BarChart2, Loader2, Target, Link as LinkIcon, Activity } from "lucide-react"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"
import { useTeamStore } from "@/store/useTeamStore"
import Link from "next/link"

export default function TeamWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const teamId = params.id as string
  const activeWorkspaceId = useStore((state) => state.activeWorkspaceId)
  
  const { getActiveTeam, setActiveTeam, addTeam } = useTeamStore()
  const [loading, setLoading] = React.useState(true)

  const team = getActiveTeam()

  React.useEffect(() => {
    if (!activeWorkspaceId || !teamId) return
    
    setActiveTeam(teamId)
    
    if (!team || team.id !== teamId) {
      setLoading(true)
      api.get(`/teams/${teamId}`)
        .then(res => {
          addTeam(res.data.data)
        })
        .catch(error => {
          console.error("Failed to fetch team details:", error)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [activeWorkspaceId, teamId, setActiveTeam, addTeam, team])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <Users className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Team not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/teams")}>
          Back to Teams
        </Button>
      </div>
    )
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity, path: `/teams/${teamId}/overview` },
    { id: "members", label: "Members", icon: Users, path: `/teams/${teamId}/members` },
    { id: "projects", label: "Projects", icon: Folder, path: `/teams/${teamId}/projects` },
    { id: "channels", label: "Channels", icon: Hash, path: `/teams/${teamId}/channels` },
    { id: "calendar", label: "Calendar", icon: Calendar, path: `/teams/${teamId}/calendar` },
    { id: "meetings", label: "Meetings", icon: Video, path: `/teams/${teamId}/meetings` },
    { id: "files", label: "Files", icon: FileText, path: `/teams/${teamId}/files` },
    { id: "activity", label: "Activity", icon: Activity, path: `/teams/${teamId}/activity` },
    { id: "analytics", label: "Analytics", icon: BarChart2, path: `/teams/${teamId}/analytics` },
    { id: "goals", label: "Goals", icon: Target, path: `/teams/${teamId}/goals` },
    { id: "resources", label: "Resources", icon: LinkIcon, path: `/teams/${teamId}/resources` },
    { id: "settings", label: "Settings", icon: Settings, path: `/teams/${teamId}/settings` },
  ]

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Cover Image Area */}
      {team.coverImage && (
        <div className="h-32 w-full bg-slate-200 shrink-0">
          <img src={team.coverImage} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Header Area */}
      <header className="bg-white border-b border-slate-200 shrink-0 relative">
        <div className="px-6 py-4 flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/teams")} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg mt-1 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 min-w-0 flex items-center gap-4">
            {team.avatar ? (
              <img src={team.avatar} alt={team.name} className="h-16 w-16 rounded-xl object-cover ring-4 ring-white shadow-sm" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-2xl ring-4 ring-white shadow-sm shrink-0">
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 truncate">{team.name}</h1>
                {team.visibility === "Private" && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium border border-slate-200 shrink-0">Private</span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5 truncate max-w-xl">
                {team.handle ? `@${team.handle} • ` : ""}
                {team.description || "No description provided."}
              </p>
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-lg text-slate-500 shrink-0" onClick={() => router.push(`/teams/${teamId}/settings`)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Team Stats Summary */}
        <div className="px-6 pb-6 pt-2 ml-14">
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-400">Manager:</div>
              <div className="flex items-center gap-1.5 font-medium text-slate-900">
                {team.manager?.avatar ? (
                  <img src={team.manager.avatar} alt={team.manager.name} className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-200" />
                ) : (
                  <UserCircle className="h-5 w-5 text-slate-400" />
                )}
                {team.manager?.name || "Unassigned"}
              </div>
            </div>
            
            <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-900">{team._count?.members || 0}</span> Members
            </div>

            <div className="w-px h-4 bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-900">{team._count?.projects || 0}</span> Projects
            </div>

            {team.department && (
              <>
                <div className="w-px h-4 bg-slate-200 hidden md:block"></div>
                <div className="flex items-center gap-2 hidden md:flex">
                  <span className="text-xs text-slate-400">Dept:</span>
                  <span className="font-medium text-slate-700">{team.department}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 flex items-center gap-6 overflow-x-auto no-scrollbar border-t border-slate-100">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.path || pathname.startsWith(`${tab.path}/`)
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap mt-[-1px] ${
                  isActive 
                    ? "border-brand-500 text-brand-600" 
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-brand-500" : "text-slate-400"}`} />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  )
}
