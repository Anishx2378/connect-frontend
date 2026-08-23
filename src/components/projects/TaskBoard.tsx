"use client"

import React, { useState } from 'react'
import { TaskStatus, useProjectStore } from '@/store/useProjectStore'
import { TaskCard } from './TaskCard'
import { useRouter } from 'next/navigation'

interface TaskBoardProps {
  projectId: string
  searchQuery: string
  initialIssueKey?: string | null
}

const COLUMNS: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Completed']

export function TaskBoard({ projectId, searchQuery, initialIssueKey }: TaskBoardProps) {
  const { tasks, moveTask, fetchTasks } = useProjectStore()

  React.useEffect(() => {
    if (projectId) {
      fetchTasks(projectId)
    }
  }, [projectId, fetchTasks])
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const router = useRouter()

  // Redirect to full page if initialIssueKey matches a task
  React.useEffect(() => {
    if (initialIssueKey && tasks.length > 0) {
      const task = tasks.find(t => t.issueKey === initialIssueKey)
      if (task) {
        const projectKey = (task as any).project?.key || task.issueKey.split('-')[0]
        router.push(`/${projectKey}/${task.issueKey}`)
      }
    }
  }, [initialIssueKey, tasks, router])

  const projectTasks = tasks.filter(t => 
    t.projectId === projectId && 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id)
    e.dataTransfer.effectAllowed = 'move'
    // This is required for Firefox
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (draggedTaskId) {
      moveTask(draggedTaskId, status)
      setDraggedTaskId(null)
    }
  }

  return (
    <>
      <div className="flex gap-6 h-full items-start">
        {COLUMNS.map(status => {
          const columnTasks = projectTasks.filter(t => t.status === status)
          
          return (
            <div 
              key={status}
              className="flex flex-col w-[320px] shrink-0 max-h-full bg-secondary/80 rounded-xl border border-border/60"
              onDragOver={(e) => handleDragOver(e, status)}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="p-4 flex items-center justify-between border-b border-border/60 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-[14px]">{status}</h3>
                  <span className="text-[11px] font-bold text-muted-foreground bg-border px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
                <button className="text-muted-foreground hover:text-secondary-foreground font-bold px-2">+</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px]">
                {columnTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="cursor-grab active:cursor-grabbing"
                    onClick={() => {
                      const projectKey = task.project?.key || task.issueKey.split('-')[0]
                      router.push(`/${projectKey}/${task.issueKey}`)
                    }}
                  >
                    <TaskCard task={task} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
