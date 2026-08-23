"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import { Plus, Search, Mail, MessageSquare } from 'lucide-react'

export default function ProjectTeamPage() {
  const params = useParams()
  const projectKey = params.projectKey as string
  const { projects } = useProjectStore()
  const project = projects.find(p => p.key?.toUpperCase() === projectKey.toUpperCase() || p.id === projectKey)

  if (!project) return null

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-8 py-6 border-b border-border/60 bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">People working on this project</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search members..." 
              className="pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-colors w-64"
            />
          </div>
          <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} />
            Add Member
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.members.map(member => (
            <div key={member.id} className="bg-white p-6 rounded-xl shadow-sm border border-border/60 flex flex-col items-center text-center">
              <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full mb-4 ring-4 ring-slate-50" />
              <h3 className="font-bold text-foreground text-[16px]">{member.name}</h3>
              <p className="text-[13px] text-primary font-medium mb-1">{member.role}</p>
              <p className="text-[13px] text-muted-foreground mb-6">{member.department || 'General'}</p>
              
              <div className="flex items-center gap-2 w-full mt-auto">
                <button className="flex-1 bg-muted hover:bg-secondary text-secondary-foreground font-medium py-2 rounded-lg text-sm transition-colors border border-border flex items-center justify-center gap-2">
                  <MessageSquare size={16} /> Message
                </button>
                <button className="p-2 bg-muted hover:bg-secondary text-secondary-foreground rounded-lg transition-colors border border-border">
                  <Mail size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
