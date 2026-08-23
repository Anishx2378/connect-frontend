import React, { useState } from 'react'
import { Task, useProjectStore } from '@/store/useProjectStore'
import { X, AlignLeft, CheckSquare, MessageSquare, Paperclip, Activity, Send } from 'lucide-react'
import { parseIssueKeysHTML } from '@/utils/textParser'

interface TaskDrawerProps {
  taskId: string
  onClose: () => void
}

export function TaskDrawer({ taskId, onClose }: TaskDrawerProps) {
  const { tasks, updateTask } = useProjectStore()
  const task = tasks.find(t => t.id === taskId)

  const [comment, setComment] = useState('')

  if (!task) return null

  const handleChecklistToggle = (itemId: string) => {
    const newChecklist = task.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    updateTask(task.id, { checklist: newChecklist })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50 ring-1 ring-red-200'
      case 'High': return 'text-orange-600 bg-orange-50 ring-1 ring-orange-200'
      case 'Medium': return 'text-blue-600 bg-blue-50 ring-1 ring-blue-200'
      case 'Low': return 'text-slate-600 bg-slate-50 ring-1 ring-slate-200'
      default: return 'text-slate-600 bg-slate-50 ring-1 ring-slate-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm">
      <div 
        className="w-[600px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0"
        style={{ animation: 'slideIn 0.3s ease-out' }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
        
        <div className="px-6 py-4 border-b border-slate-200/60 flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-400">{task.issueKey || `TASK-${task.id.slice(0, 4).toUpperCase()}`}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          
          <h2 className="text-2xl font-bold text-slate-900 mb-6">{task.title}</h2>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Assignees</p>
              <div className="flex -space-x-2">
                {task.assignees.map(a => (
                  a.avatar ? (
                    <img key={a.id} src={a.avatar} alt={a.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" title={a.name} />
                  ) : (
                    <div key={a.id} className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold" title={a.name}>
                      {a.name ? a.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )
                ))}
                <button className="w-8 h-8 rounded-full border-2 border-white border-dashed text-slate-400 flex items-center justify-center hover:text-slate-600 hover:border-slate-300 bg-slate-50 transition-colors">
                  +
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Status</p>
              <select 
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                className="w-full max-w-[200px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-brand-500 transition-colors"
              >
                {['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Completed'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-3">
              <AlignLeft size={18} className="text-slate-400" /> Description
            </h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-[15px] leading-relaxed prose prose-sm prose-slate max-w-none">
              {task.description ? (
                <div dangerouslySetInnerHTML={{ __html: parseIssueKeysHTML(task.description) }} />
              ) : (
                <p>No description provided. Click to add one.</p>
              )}
            </div>
          </div>

          {task.checklist.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900">
                  <CheckSquare size={18} className="text-slate-400" /> Checklist
                </h3>
                <span className="text-sm font-medium text-slate-500">
                  {Math.round((task.checklist.filter(c => c.completed).length / task.checklist.length) * 100)}%
                </span>
              </div>
              
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300" 
                  style={{ width: `${(task.checklist.filter(c => c.completed).length / task.checklist.length) * 100}%` }} 
                />
              </div>

              <div className="space-y-2">
                {task.checklist.map(item => (
                  <label key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={item.completed}
                      onChange={() => handleChecklistToggle(item.id)}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                    />
                    <span className={`text-[15px] ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-slate-900 mb-4">
              <Activity size={18} className="text-slate-400" /> Activity & Comments
            </h3>
            
            <div className="space-y-6 mb-6">
              <div className="flex gap-4">
                <img src="https://i.pravatar.cc/150?u=sarah" alt="User" className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900">Sarah Jones</span>
                    <span className="text-xs text-slate-400">2 hours ago</span>
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg rounded-tl-none border border-slate-100">
                    I've updated the design files in Figma. The new layout should fix the responsive issues we were seeing on mobile.
                  </p>
                </div>
              </div>
            </div>

            {/* Comment Input */}
            <div className="flex gap-4 items-start">
              <img src="https://i.pravatar.cc/150?u=you" alt="You" className="w-8 h-8 rounded-full shrink-0" />
              <div className="flex-1 relative">
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..." 
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none min-h-[100px] text-[15px]"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <Paperclip size={18} />
                  </button>
                  <button className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-sm disabled:opacity-50" disabled={!comment.trim()}>
                    <Send size={14} /> Comment
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
