"use client"

import React, { useEffect, useState } from 'react'
import { CheckSquare, Bug, BookOpen, Zap, AlertTriangle, ArrowUp, ChevronUp, Equal, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Task, useProjectStore } from '@/store/useProjectStore'
import { format } from 'date-fns'

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'bug': return <Bug size={16} className="text-red-500" />
    case 'story': return <BookOpen size={16} className="text-emerald-500" />
    case 'epic': return <Zap size={16} className="text-purple-500" />
    case 'incident': return <AlertTriangle size={16} className="text-orange-500" />
    case 'task':
    default: return <CheckSquare size={16} className="text-brand-500" />
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'urgent': return <ArrowUp size={16} className="text-red-600" />
    case 'high': return <ChevronUp size={16} className="text-orange-500" />
    case 'medium': return <Equal size={16} className="text-blue-500" />
    case 'low': return <ChevronDown size={16} className="text-slate-400" />
    default: return <Equal size={16} className="text-slate-400" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'done':
      return <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">DONE</span>
    case 'in progress':
      return <span className="bg-blue-50 text-blue-700 ring-1 ring-blue-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">IN PROGRESS</span>
    case 'review':
      return <span className="bg-purple-50 text-purple-700 ring-1 ring-purple-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">REVIEW</span>
    default:
      return <span className="bg-slate-50 text-slate-700 ring-1 ring-slate-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">{status}</span>
  }
}

export default function MyTasksPage() {
  const { tasks, setTasks } = useProjectStore()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchMyTasks = async () => {
      try {
        const res = await api.get('/tasks?assignedToMe=true')
        setTasks(res.data.data)
      } catch (err) {
        console.error("Failed to fetch my tasks", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMyTasks()
  }, [])

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-8 py-6 border-b border-slate-200/60 bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="text-brand-600" /> My Tasks
          </h1>
          <p className="text-sm text-slate-500 mt-1">Tasks assigned to you across all projects</p>
        </div>
        <div className="text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          {tasks.length} {tasks.length === 1 ? 'Issue' : 'Issues'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <CheckSquare size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium text-slate-600">No tasks assigned to you</p>
            <p className="text-sm mt-1">When you are assigned tasks, they will appear here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-3 w-[120px]">Key</th>
                    <th className="px-4 py-3 min-w-[300px]">Summary</th>
                    <th className="px-4 py-3 w-[60px] text-center" title="Type">T</th>
                    <th className="px-4 py-3 w-[160px]">Updated</th>
                    <th className="px-4 py-3 w-[120px]">Assignee</th>
                    <th className="px-4 py-3 w-[120px]">Reporter</th>
                    <th className="px-4 py-3 w-[60px] text-center" title="Priority">P</th>
                    <th className="px-4 py-3 w-[140px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map(task => (
                    <tr 
                      key={task.id} 
                      onClick={() => {
                        const projectKey = (task as any).project?.key || task.issueKey.split('-')[0]
                        router.push(`/${projectKey}/${task.issueKey}`)
                      }}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-brand-600 group-hover:underline">
                          {task.issueKey}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 truncate max-w-[300px]">
                        {task.title}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center" title={task.type}>
                          {getTypeIcon(task.type)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[13px]">
                        {(task as any).updatedAt ? format(new Date((task as any).updatedAt), 'dd/MMM/yy h:mm a') : 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex -space-x-1.5">
                          {task.assignees?.map(a => (
                            a.avatar ? (
                              <img key={a.id} src={a.avatar} alt={a.name} className="w-6 h-6 rounded-full border-2 border-white shadow-sm object-cover" title={a.name} />
                            ) : (
                              <div key={a.id} className="w-6 h-6 rounded-full border-2 border-white shadow-sm bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold" title={a.name}>
                                {a.name ? a.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )
                          ))}
                          {(!task.assignees || task.assignees.length === 0) && (
                            <span className="text-slate-400 italic text-xs">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {task.reporter ? (
                          <div className="flex items-center gap-2">
                            {task.reporter.avatar ? (
                              <img src={task.reporter.avatar} alt={task.reporter.name} className="w-6 h-6 rounded-full border-2 border-white shadow-sm object-cover" title={task.reporter.name} />
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold" title={task.reporter.name}>
                                {task.reporter.name ? task.reporter.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center" title={task.priority}>
                          {getPriorityIcon(task.priority)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(task.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
