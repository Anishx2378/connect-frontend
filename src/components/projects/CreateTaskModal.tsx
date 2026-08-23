"use client"

import React, { useState } from 'react'
import { X, CheckSquare, Bug, BookOpen, Crown, AlertTriangle, Calendar, Tag, Paperclip, Link as LinkIcon, UserPlus, Info } from 'lucide-react'
import { useProjectStore, Task, ProjectMember } from '@/store/useProjectStore'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface CreateTaskModalProps {
  onClose: () => void
  projectId: string
  projectKey: string
}

const TASK_TYPES = [
  { id: 'Task', icon: CheckSquare, color: 'text-blue-500' },
  { id: 'Bug', icon: Bug, color: 'text-red-500' },
  { id: 'Story', icon: BookOpen, color: 'text-emerald-500' },
  { id: 'Epic', icon: Crown, color: 'text-purple-500' },
  { id: 'Incident', icon: AlertTriangle, color: 'text-orange-500' },
]

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export function CreateTaskModal({ onClose, projectId, projectKey }: CreateTaskModalProps) {
  const { createTaskAPI, projects } = useProjectStore()
  const project = projects.find(p => p.id === projectId)
  const projectMembers = project?.members || []

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState('Task')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [assignees, setAssignees] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [labelInput, setLabelInput] = useState('')

  const handleAddLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && labelInput.trim()) {
      e.preventDefault()
      if (!labels.includes(labelInput.trim())) {
        setLabels([...labels, labelInput.trim()])
      }
      setLabelInput('')
    }
  }

  const removeLabel = (labelToRemove: string) => {
    setLabels(labels.filter(l => l !== labelToRemove))
  }

  const toggleAssignee = (memberId: string) => {
    if (assignees.includes(memberId)) {
      setAssignees(assignees.filter(id => id !== memberId))
    } else {
      setAssignees([...assignees, memberId])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      const newTask = await createTaskAPI({
        title,
        description,
        type,
        priority: priority as any,
        projectId,
        assignees: assignees as any, // backend expects array of IDs
        labels,
        dueDate: dueDate || null
      })

      if (newTask) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground">Task created successfully</span>
              <Link 
                href={`/${projectKey}/${newTask.issueKey}`}
                onClick={() => toast.dismiss(t.id)}
                className="text-primary hover:underline text-sm font-medium flex items-center gap-1"
              >
                View {newTask.issueKey}
              </Link>
            </div>
          ),
          { duration: 5000 }
        )
      } else {
        toast.success('Task created successfully')
      }
      
      onClose()
    } catch (err) {
      console.error("Failed to create task", err)
      toast.error('Failed to create task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const TypeIcon = TASK_TYPES.find(t => t.id === type)?.icon || CheckSquare
  const typeColor = TASK_TYPES.find(t => t.id === type)?.color || 'text-blue-500'

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-muted/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Create Task</h2>
            <span className="text-sm font-medium text-muted-foreground bg-border/50 px-2.5 py-0.5 rounded-full">
              {project?.name}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-secondary-foreground hover:bg-border/50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Form Body */}
        <form id="create-task-form" onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100">
            <div className="space-y-6">
              
              {/* Title */}
              <div>
                <input 
                  required
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task summary..." 
                  className="w-full text-xl font-medium text-foreground placeholder:text-muted-foreground outline-none border-b border-transparent focus:border-primary transition-colors pb-2 bg-transparent"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <RichTextEditor 
                  content={description}
                  onChange={setDescription}
                />
              </div>

              {/* Attachments & Links placeholders */}
              <div className="pt-4 border-t border-slate-100 flex gap-4">
                <button type="button" className="flex items-center gap-2 text-sm font-medium text-secondary-foreground hover:text-foreground bg-muted hover:bg-secondary px-3 py-2 rounded-lg transition-colors">
                  <Paperclip size={16} /> Attach Files
                </button>
                <button type="button" className="flex items-center gap-2 text-sm font-medium text-secondary-foreground hover:text-foreground bg-muted hover:bg-secondary px-3 py-2 rounded-lg transition-colors">
                  <LinkIcon size={16} /> Link Issue
                </button>
              </div>

            </div>
          </div>

          {/* Properties Sidebar */}
          <div className="w-full md:w-80 bg-muted overflow-y-auto p-6 shrink-0 flex flex-col gap-6">
            
            {/* Issue Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Issue Type</label>
              <div className="relative">
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full appearance-none bg-white border border-border text-slate-700 text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-brand-500/20 shadow-sm"
                >
                  {TASK_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.id}</option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <TypeIcon size={16} className={typeColor} />
                </div>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-white border border-border text-slate-700 text-sm rounded-lg px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-brand-500/20 shadow-sm"
              >
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center justify-between">
                Assignees
                <span className="text-xs font-normal text-muted-foreground bg-white px-2 py-0.5 rounded border border-border">{assignees.length} selected</span>
              </label>
              <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden max-h-48 overflow-y-auto p-1">
                {projectMembers.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">No project members</div>
                ) : (
                  projectMembers.map(member => {
                    // member might be ProjectMember, we need the user.id
                    // In useProjectStore mock data, member is just an object with id, name, avatar
                    const isSelected = assignees.includes(member.id)
                    return (
                      <div 
                        key={member.id}
                        onClick={() => toggleAssignee(member.id)}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-brand-50' : 'hover:bg-muted'}`}
                      >
                        <img src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`} alt="" className="w-6 h-6 rounded-full" />
                        <span className={`text-sm flex-1 ${isSelected ? 'font-medium text-brand-900' : 'text-slate-700'}`}>{member.name}</span>
                        {isSelected && <CheckSquare size={14} className="text-primary" />}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
              <div className="relative">
                <input 
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white border border-border text-slate-700 text-sm rounded-lg pl-10 pr-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-brand-500/20 shadow-sm"
                />
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Labels</label>
              <div className="bg-white border border-border rounded-lg p-2 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                <div className="flex flex-wrap gap-2 mb-2">
                  {labels.map(label => (
                    <span key={label} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-secondary text-slate-700 text-xs font-medium">
                      {label}
                      <button type="button" onClick={() => removeLabel(label)} className="text-muted-foreground hover:text-secondary-foreground">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-muted-foreground" />
                  <input 
                    type="text" 
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={handleAddLabel}
                    placeholder="Type and press Enter..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-muted-foreground min-w-[120px]"
                  />
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-muted/50 rounded-b-xl shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-border bg-secondary rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            form="create-task-form"
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>

      </div>
    </div>
  )
}
