import React from 'react'
import { Task } from '@/store/useProjectStore'
import { MessageSquare, Paperclip, CheckSquare } from 'lucide-react'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50 ring-1 ring-red-200'
      case 'High': return 'text-orange-600 bg-orange-50 ring-1 ring-orange-200'
      case 'Medium': return 'text-blue-600 bg-blue-50 ring-1 ring-blue-200'
      case 'Low': return 'text-secondary-foreground bg-muted ring-1 ring-slate-200'
      default: return 'text-secondary-foreground bg-muted ring-1 ring-slate-200'
    }
  }

  const completedChecklist = task.checklist.filter(c => c.completed).length
  const totalChecklist = task.checklist.length

  return (
    <div className="bg-white p-3.5 rounded-xl shadow-sm border border-border/60 hover:shadow-md hover:border-brand-300 transition-all group">
      
      <div className="flex gap-2 mb-3 flex-wrap">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-secondary text-muted-foreground">
          {task.issueKey}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.labels.map(label => (
          <span key={label} className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-secondary text-secondary-foreground">
            {label}
          </span>
        ))}
      </div>

      <h4 className="font-semibold text-foreground text-[14px] leading-snug mb-4 group-hover:text-primary transition-colors">
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3 text-muted-foreground">
          {totalChecklist > 0 && (
            <div className="flex items-center gap-1 text-[12px] font-medium" title="Checklist">
              <CheckSquare size={14} className={completedChecklist === totalChecklist ? 'text-emerald-500' : ''} />
              <span>{completedChecklist}/{totalChecklist}</span>
            </div>
          )}
          {task.comments > 0 && (
            <div className="flex items-center gap-1 text-[12px] font-medium" title="Comments">
              <MessageSquare size={14} />
              <span>{task.comments}</span>
            </div>
          )}
          {task.attachments > 0 && (
            <div className="flex items-center gap-1 text-[12px] font-medium" title="Attachments">
              <Paperclip size={14} />
              <span>{task.attachments}</span>
            </div>
          )}
        </div>

        <div className="flex -space-x-1.5">
          {task.assignees.map(a => (
            a.avatar ? (
              <img key={a.id} src={a.avatar} alt={a.name} className="w-6 h-6 rounded-full border-2 border-white shadow-sm object-cover" title={a.name} />
            ) : (
              <div key={a.id} className="w-6 h-6 rounded-full border-2 border-white shadow-sm bg-brand-100 text-primary flex items-center justify-center text-[10px] font-bold" title={a.name}>
                {a.name ? a.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
