"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import { CheckCircle2, Clock, Users, FileText, Activity } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

export default function ProjectOverviewPage() {
  const params = useParams()
  const projectKey = params.projectKey as string
  const { projects, tasks } = useProjectStore()

  const project = projects.find(p => p.key?.toUpperCase() === projectKey.toUpperCase() || p.id === projectKey)
  const projectTasks = tasks.filter(t => t.projectId === project?.id)
  
  if (!project) return null

  const completedTasks = projectTasks.filter(t => t.status === 'Completed').length
  const totalTasks = projectTasks.length
  
  // Mock chart data
  const activityData = [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 19 },
    { name: 'Wed', value: 15 },
    { name: 'Thu', value: 25 },
    { name: 'Fri', value: 22 },
    { name: 'Sat', value: 8 },
    { name: 'Sun', value: 14 },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Header section with big progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/60 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Project Overview</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="w-64 text-right">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-semibold text-secondary-foreground">Overall Progress</span>
            <span className="text-3xl font-bold text-foreground leading-none">{project.progress}%</span>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary/100 rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Stat Cards */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/60 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-0.5">Tasks Completed</p>
            <p className="text-2xl font-bold text-foreground">{completedTasks} <span className="text-sm font-medium text-muted-foreground">/ {totalTasks}</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/60 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-0.5">Time Logged</p>
            <p className="text-2xl font-bold text-foreground">142h <span className="text-sm font-medium text-muted-foreground">/ 200h</span></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/60 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-0.5">Team Members</p>
            <p className="text-2xl font-bold text-foreground">{project.members.length}</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-border/60">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Activity size={20} className="text-muted-foreground" />
            Activity Trends
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={project.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={project.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke={project.color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/60">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <FileText size={20} className="text-muted-foreground" />
            Recent Updates
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4 relative">
              <div className="absolute left-[15px] top-10 bottom-[-24px] w-[2px] bg-secondary"></div>
              <img src={project.members[0]?.avatar} alt="" className="w-8 h-8 rounded-full ring-4 ring-white relative z-10 shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium">Completed task <span className="font-bold">Design hero section</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-4 relative">
              <div className="absolute left-[15px] top-10 bottom-[-24px] w-[2px] bg-secondary"></div>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-4 ring-white relative z-10 shrink-0">
                <FileText size={14} />
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">Uploaded <span className="font-bold">branding-assets.zip</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">Yesterday</p>
              </div>
            </div>
            <div className="flex gap-4 relative">
              <img src={project.members[1]?.avatar} alt="" className="w-8 h-8 rounded-full ring-4 ring-white relative z-10 shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium">Left a comment on <span className="font-bold">API Integration</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">2 days ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
