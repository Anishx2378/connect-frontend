"use client"

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import { Save, Trash2, AlertCircle } from 'lucide-react'

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const projectKey = params.projectKey as string
  const { projects, updateProject, deleteProject } = useProjectStore()
  
  const project = projects.find(p => p.key?.toUpperCase() === projectKey.toUpperCase() || p.id === projectKey)
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')

  if (!project) return null

  const handleSave = () => {
    updateProject(project.id, { name, description })
    // In a real app we'd show a success toast here
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      deleteProject(project.id)
      router.push('/projects')
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-8 py-6 border-b border-border/60 bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Project Settings</h1>
          <p className="text-sm text-muted-foreground">Manage project configuration and preferences</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full">
        
        <div className="bg-white rounded-xl shadow-sm border border-border/60 p-8 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-6">General Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-secondary-foreground mb-1.5">Project Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg outline-none focus:bg-white focus:border-primary transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-secondary-foreground mb-1.5">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-muted border border-border rounded-lg outline-none focus:bg-white focus:border-primary transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl border border-red-200 p-8">
          <h2 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
            <AlertCircle size={20} /> Danger Zone
          </h2>
          <p className="text-sm text-red-600 mb-6">Once you delete a project, there is no going back. Please be certain.</p>
          
          <button 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Trash2 size={16} />
            Delete Project
          </button>
        </div>

      </div>
    </div>
  )
}
