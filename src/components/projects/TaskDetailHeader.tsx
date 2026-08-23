import React, { useState } from 'react'
import { Task } from '@/store/useProjectStore'
import { MoreHorizontal, Share2, ChevronRight, Eye, ThumbsUp, LayoutPanelLeft, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface TaskDetailHeaderProps {
  task: Task
  onUpdate: (id: string, data: Partial<Task>) => void
}

export function TaskDetailHeader({ task, onUpdate }: TaskDetailHeaderProps) {

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard')
  }

  return (
    <div className="flex items-center justify-between px-8 py-5 bg-white sticky top-0 z-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500">
        <Link href={`/projects`} className="hover:underline">
          Projects
        </Link>
        <span className="text-slate-400 mx-1">/</span>
        <Link href={`/projects/${task.project?.key || task.projectId}`} className="flex items-center gap-1.5 hover:underline text-slate-600">
          <LayoutPanelLeft size={14} className="text-blue-500" />
          {task.project?.name || 'Project'}
        </Link>
        <span className="text-slate-400 mx-1">/</span>
        <span className="flex items-center gap-1.5 text-slate-800">
          <CheckSquare size={14} className="text-brand-500" />
          {task.issueKey}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded transition-colors tooltip-trigger" title="Watch">
          <Eye size={18} />
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded transition-colors tooltip-trigger" title="Vote">
          <ThumbsUp size={18} />
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded transition-colors tooltip-trigger" title="Share">
          <Share2 size={18} />
        </button>
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded transition-colors tooltip-trigger" title="More actions">
          <MoreHorizontal size={18} />
        </button>
      </div>
    </div>
  )
}
