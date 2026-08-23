"use client"

import React, { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Plus, Filter, Search } from 'lucide-react'
import { TaskBoard } from '@/components/projects/TaskBoard'
import { CreateTaskModal } from '@/components/projects/CreateTaskModal'
import { useProjectStore } from '@/store/useProjectStore'

export default function ProjectTasksPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const issueKeyParam = searchParams.get('issueKey')
  const projectKey = params.projectKey as string
  const { selectedProjectId, createTaskAPI } = useProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddTask = () => {
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-6 border-b border-border/60 bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">Manage your project workflow</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-colors w-64"
            />
          </div>
          <button className="p-2 border border-border text-secondary-foreground rounded-lg hover:bg-muted transition-colors">
            <Filter size={18} />
          </button>
          <button 
            onClick={handleAddTask}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} />
            Add Task
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-background p-8">
        {selectedProjectId && <TaskBoard projectId={selectedProjectId} searchQuery={searchQuery} initialIssueKey={issueKeyParam} />}
      </div>
      
      {isModalOpen && selectedProjectId && (
        <CreateTaskModal 
          onClose={() => setIsModalOpen(false)} 
          projectId={selectedProjectId}
          projectKey={projectKey}
        />
      )}
    </div>
  )
}
