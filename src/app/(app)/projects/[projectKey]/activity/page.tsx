"use client"

import React from 'react'
import { Activity as ActivityIcon, CheckCircle2, MessageSquare, FileText, UserPlus, GitCommit } from 'lucide-react'

export default function ProjectActivityPage() {
  const activities = [
    { id: 1, type: 'task', text: 'Sarah Jones completed task', target: 'Design hero section', time: '2 hours ago', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 2, type: 'file', text: 'David Kim uploaded', target: 'branding-assets.zip', time: '5 hours ago', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 3, type: 'comment', text: 'Alex Chen commented on', target: 'API Integration', time: 'Yesterday', icon: MessageSquare, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 4, type: 'member', text: 'Priya Nair added', target: 'David Kim to the project', time: 'Yesterday', icon: UserPlus, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 5, type: 'system', text: 'Project status changed to', target: 'Active', time: 'Oct 20, 2026', icon: GitCommit, color: 'text-muted-foreground', bg: 'bg-secondary' },
  ]

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-8 py-6 border-b border-border/60 bg-white shrink-0">
        <h1 className="text-xl font-bold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground">History of all changes in this project</p>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow-sm border border-border/60 p-8">
          <div className="space-y-8">
            {activities.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex gap-4 relative group">
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-[-32px] w-[2px] bg-secondary group-hover:bg-border transition-colors"></div>
                  )}
                  <div className={`w-10 h-10 rounded-full ${activity.bg} ${activity.color} flex items-center justify-center ring-4 ring-white relative z-10 shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="pt-2">
                    <p className="text-[15px] text-secondary-foreground">
                      {activity.text} <span className="font-semibold text-foreground">{activity.target}</span>
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
