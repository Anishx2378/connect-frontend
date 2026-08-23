"use client"

import React from 'react'
import Link from 'next/link'
import { LayoutDashboard, CheckSquare, MessageSquare, Folder, Users, Activity, Settings, Video, FileText } from 'lucide-react'
import { Project } from '@/store/useProjectStore'

interface ProjectSidebarProps {
  project: Project
  currentPath: string
}

export function ProjectSidebar({ project, currentPath }: ProjectSidebarProps) {
  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: `/projects/${project.id}/overview` },
    { label: 'Tasks', icon: CheckSquare, href: `/projects/${project.id}/tasks` },
    { label: 'Chat', icon: MessageSquare, href: `/projects/${project.id}/chat` },
    { label: 'Files', icon: Folder, href: `/projects/${project.id}/files` },
    { label: 'Meetings', icon: Video, href: `/projects/${project.id}/meetings` },
    { label: 'Client Notes', icon: FileText, href: `/projects/${project.id}/notes` },
    { label: 'Team', icon: Users, href: `/projects/${project.id}/team` },
    { label: 'Activity', icon: Activity, href: `/projects/${project.id}/activity` },
  ]

  return (
    <div className="w-64 bg-muted border-r border-border/60 flex flex-col h-full shrink-0">
      
      {/* Project Branding */}
      <div className="p-5 flex items-center gap-3 border-b border-border/60 shrink-0">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-sm" style={{ backgroundColor: project.color }}>
          {project.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-[15px] text-foreground truncate leading-tight">{project.name}</h2>
          <p className="text-[12px] font-medium text-muted-foreground truncate">{project.client}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {navItems.map(item => {
          const isActive = currentPath === item.href || currentPath.startsWith(`${item.href}/`)
          const Icon = item.icon
          
          return (
            <Link 
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/50' 
                  : 'text-secondary-foreground hover:bg-border/50 hover:text-foreground'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* Settings at Bottom */}
      <div className="p-3 border-t border-border/60 mt-auto shrink-0">
        <Link
          href={`/projects/${project.id}/settings`}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentPath.endsWith('/settings')
              ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200/50' 
              : 'text-secondary-foreground hover:bg-border/50 hover:text-foreground'
          }`}
        >
          <Settings size={18} className={currentPath.endsWith('/settings') ? 'text-primary' : 'text-muted-foreground'} />
          Settings
        </Link>
      </div>

    </div>
  )
}
