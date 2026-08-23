"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { Task } from '@/store/useProjectStore'
import { TaskDetailHeader } from '@/components/projects/TaskDetailHeader'
import { TaskWorkPanel } from '@/components/projects/TaskWorkPanel'
import { TaskMetadataPanel } from '@/components/projects/TaskMetadataPanel'
import toast from 'react-hot-toast'

export default function TaskDetailPage() {
  const params = useParams()
  const issueKey = params.issueKey as string
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await api.get(`/tasks/${issueKey}`)
        setTask(res.data.data)
      } catch (err) {
        console.error("Failed to load task", err)
        toast.error("Failed to load task")
      } finally {
        setLoading(false)
      }
    }
    if (issueKey) {
      fetchTask()
    }
  }, [issueKey])

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    try {
      // Optimistic update
      if (task) {
        setTask({ ...task, ...data } as Task)
      }
      await api.put(`/tasks/${taskId}`, data)
    } catch (err) {
      console.error("Failed to update task", err)
      toast.error("Failed to update task")
      // We should ideally revert the optimistic update here if it fails
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#FAFAFA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#FAFAFA] text-slate-500">
        <p className="text-xl font-bold">Task not found</p>
        <p className="text-sm mt-2">The issue key {issueKey} does not exist or you don't have access.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] overflow-hidden">
      <TaskDetailHeader task={task} onUpdate={handleUpdateTask} />
      
      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-[1400px] mx-auto h-full bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col xl:flex-row">
          
          {/* Main Column: Work Panel & Activity */}
          <div className="flex-1 overflow-y-auto p-8 xl:border-r border-slate-200/60">
            <TaskWorkPanel task={task} />
          </div>

          {/* Sidebar: Metadata Panel */}
          <div className="w-full xl:w-[400px] shrink-0 overflow-y-auto p-8 bg-slate-50/30">
            <TaskMetadataPanel task={task} onUpdate={handleUpdateTask} />
          </div>
        </div>
      </div>
    </div>
  )
}
