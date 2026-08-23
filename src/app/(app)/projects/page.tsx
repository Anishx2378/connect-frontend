"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import { Search, Plus, LayoutGrid, List as ListIcon, Star, Clock, Archive, MoreVertical, Filter } from 'lucide-react'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'
import { EmptyState } from '@/components/ui/empty-state'
import { useStore } from '@/store/useStore'
import api from '@/lib/api'

export default function ProjectsPage() {
  const router = useRouter()
  const { projects, setProjects } = useProjectStore()
  const { activeWorkspaceId } = useStore()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  React.useEffect(() => {
    if (!activeWorkspaceId) return
    const fetchProjects = async () => {
      setIsLoading(true)
      try {
        const res = await api.get(`/projects?workspaceId=${activeWorkspaceId}`)
        setProjects(res.data.data || [])
      } catch (err) {
        console.error("Failed to fetch projects", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProjects()
  }, [activeWorkspaceId, setProjects])
  
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.client.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeProjects = filteredProjects.filter(p => !p.isArchived)
  const favoriteProjects = filteredProjects.filter(p => p.isFavorite)

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-10">
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Projects</h1>
              <p className="text-muted-foreground mt-1">Manage and track all your team's projects</p>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={18} />
              New Project
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8 bg-white p-2 rounded-xl shadow-sm border border-border/60">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text" 
                placeholder="Search projects by name or client..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-transparent outline-none focus:bg-muted transition-colors text-[15px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="h-6 w-[1px] bg-border"></div>
            <button className="flex items-center gap-2 px-3 py-2 text-secondary-foreground hover:bg-muted rounded-lg text-sm font-medium transition-colors">
              <Filter size={16} />
              Filters
            </button>
            <div className="flex items-center p-1 bg-secondary rounded-lg gap-1">
              <button 
                onClick={() => setView('grid')}
                className={`p-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-secondary-foreground'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setView('list')}
                className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-secondary-foreground'}`}
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>

          {/* Favorites Section */}
          {favoriteProjects.length > 0 && (
            <div className="mb-10">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Star size={16} className="text-amber-400" />
                Favorites
              </h2>
              <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {favoriteProjects.map(project => (
                  <ProjectCard key={project.id} project={project} view={view} onClick={() => router.push(`/projects/${project.id}/overview`)} />
                ))}
              </div>
            </div>
          )}

          {/* Active Projects */}
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock size={16} />
              Active Projects
            </h2>
            {isLoading ? (
              <div className="py-12 flex justify-center text-muted-foreground">Loading projects...</div>
            ) : (
              <div className={`grid gap-5 ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {activeProjects.map(project => (
                  <ProjectCard key={project.id} project={project} view={view} onClick={() => router.push(`/projects/${project.id}/overview`)} />
                ))}
              </div>
            )}
            {!isLoading && activeProjects.length === 0 && (
              <EmptyState 
                icon={Archive} 
                title="No active projects" 
                description="Get started by creating a new project for your team." 
                className="mt-12 bg-white rounded-3xl border border-border shadow-sm"
              />
            )}
          </div>

        </div>
      </div>
      
      {isCreateModalOpen && (
        <CreateProjectModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  )
}

function ProjectCard({ project, view, onClick }: { project: any, view: 'grid' | 'list', onClick: () => void }) {
  if (view === 'list') {
    return (
      <div onClick={onClick} className="bg-white border border-border/60 p-4 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-6 group">
        <div className="h-12 w-12 rounded-lg flex items-center justify-center font-bold text-white shrink-0" style={{ backgroundColor: project.color }}>
          {project.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{project.name}</h3>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-secondary-foreground'}`}>
              {project.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{project.client}</p>
        </div>
        
        <div className="w-32 hidden md:block">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-secondary-foreground">Progress</span>
            <span className="font-bold text-foreground">{project.progress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary/100 rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        <div className="flex -space-x-2 shrink-0">
          {project.members.slice(0, 3).map((m: any) => (
            <img key={m.id} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-white" />
          ))}
          {project.members.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground">
              +{project.members.length - 3}
            </div>
          )}
        </div>
        
        <div className="text-right shrink-0 min-w-[100px]">
          <p className="text-xs text-muted-foreground font-medium mb-0.5">Due date</p>
          <p className="text-sm font-semibold text-secondary-foreground">{new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>
    )
  }

  // Grid View
  return (
    <div onClick={onClick} className="bg-white border border-border/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative">
      <div className="absolute top-4 right-4 text-muted-foreground hover:text-muted-foreground">
        <MoreVertical size={18} />
      </div>
      <div className="flex items-start gap-4 mb-4">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: project.color }}>
          {project.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-bold text-[16px] text-foreground group-hover:text-primary transition-colors leading-tight mb-1">{project.name}</h3>
          <p className="text-sm text-muted-foreground font-medium">{project.client}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${project.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-muted text-secondary-foreground ring-1 ring-slate-200'}`}>
          {project.status}
        </span>
        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${project.priority === 'Urgent' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : project.priority === 'High' ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'}`}>
          {project.priority}
        </span>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex justify-between text-xs mb-2">
          <span className="font-medium text-secondary-foreground">Progress</span>
          <span className="font-bold text-foreground">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.members.slice(0, 3).map((m: any) => (
              <img key={m.id} src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full border-2 border-white shadow-sm" />
            ))}
            {project.members.length > 3 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[10px] font-bold text-secondary-foreground shadow-sm">
                +{project.members.length - 3}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground font-medium mb-0.5 uppercase tracking-wider">Due date</p>
            <p className="text-[13px] font-semibold text-secondary-foreground">{new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
