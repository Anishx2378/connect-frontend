"use client"

import React, { useState } from 'react'
import { X, Plus, Calendar } from 'lucide-react'
import { useProjectStore, ProjectPriority, ProjectStatus, ProjectMember } from '@/store/useProjectStore'
import { useStore } from '@/store/useStore'
import api from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface CreateProjectModalProps {
  onClose: () => void
}

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const { addProject } = useProjectStore()
  const { activeWorkspaceId } = useStore()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [description, setDescription] = useState('')
  const [client, setClient] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<ProjectPriority>('Medium')
  const [status, setStatus] = useState<ProjectStatus>('Active')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState('#8b5cf6')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkspaceId) return

    setIsSubmitting(true)
    try {
      const res = await api.post('/projects', {
        name,
        key: projectKey || undefined,
        description,
        client,
        category,
        priority,
        status,
        startDate,
        deadline,
        color,
        workspaceId: activeWorkspaceId
      })
      addProject(res.data.data)
      onClose()
    } catch (err) {
      console.error("Failed to create project", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Create New Project</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Name <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project Key (Optional)</label>
                <input 
                  type="text" 
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase().slice(0, 5))}
                  placeholder="e.g. RV (Auto-generated if left blank)" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all uppercase"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project about?" 
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client</label>
                <input 
                  type="text" 
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="e.g. Acme Corp" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                <input 
                  type="text" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Marketing, Engineering" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Meta */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Planning">Planning</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deadline</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all text-slate-700"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Visuals */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Project Color</label>
              <div className="flex gap-3">
                {['#ef4444', '#f97316', '#f59e0b', '#10b981', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

          </div>
          
          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!name || isSubmitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
