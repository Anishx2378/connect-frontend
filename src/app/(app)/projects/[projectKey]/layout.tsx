"use client"

import React, { useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import { ProjectSidebar } from '@/components/projects/ProjectSidebar'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import api from '@/lib/api'
import { Loader2 } from 'lucide-react'

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const projectKey = params.projectKey as string
  const { projects, selectProject, updateProject, addProject } = useProjectStore()
  const [isLoading, setIsLoading] = React.useState(false)

  const project = projects.find(p => p.key.toUpperCase() === projectKey.toUpperCase() || p.id === projectKey)

  useEffect(() => {
    if (projectKey) {
      selectProject(project?.id || projectKey)
      if (!project) {
        setIsLoading(true)
        api.get(`/projects/${projectKey}`)
          .then(res => {
            addProject(res.data.data)
            selectProject(res.data.data.id)
          })
          .catch(err => {
            console.error("Failed to fetch project", err)
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    }
  }, [projectKey, selectProject, project, addProject])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 mb-2">Project Not Found</h2>
          <button onClick={() => router.push('/projects')} className="text-brand-600 hover:underline">
            Return to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Project Sidebar */}
      <ProjectSidebar project={project} currentPath={pathname} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProjectHeader project={project} />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {children}
        </main>
      </div>
    </div>
  )
}
