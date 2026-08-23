import React from 'react'
import { Task } from '@/store/useProjectStore'
import { parseIssueKeysHTML } from '@/utils/textParser'
import { AlignLeft, Paperclip, CheckSquare, Layers, Link as LinkIcon, Download, ArrowUp, Activity, Sparkles, Send, Tag } from 'lucide-react'
import { useState } from 'react'

interface TaskWorkPanelProps {
  task: Task
}

export function TaskWorkPanel({ task }: TaskWorkPanelProps) {
  const [comment, setComment] = useState('')

  const getPriorityIcon = (p: string) => {
    switch(p) {
      case 'Critical': return <ArrowUp size={16} className="text-red-500" />
      case 'High': return <ArrowUp size={16} className="text-orange-500" />
      default: return <ArrowUp size={16} className="text-slate-400" />
    }
  }

  return (
    <div className="flex flex-col gap-6 pr-4">
      
      {/* Title */}
      <div>
        <h1 className="text-[28px] font-medium text-slate-900 leading-tight mb-4">
          {task.title}
        </h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold rounded transition-colors">
          <Paperclip size={14} /> Attach
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold rounded transition-colors">
          <CheckSquare size={14} /> Create subtask
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-semibold rounded transition-colors">
          <LinkIcon size={14} /> Link issue
        </button>
      </div>

      {/* Attributes Inline */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-3 text-[13px] font-semibold text-slate-500 flex items-center">Labels</div>
        <div className="col-span-9 flex items-center gap-2">
          {task.labels && task.labels.length > 0 ? task.labels.map((label, idx) => (
            <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[13px] font-medium">
              {label}
            </span>
          )) : (
            <span className="text-[13px] text-slate-400 italic">None</span>
          )}
        </div>
        
        <div className="col-span-3 text-[13px] font-semibold text-slate-500 flex items-center">Priority</div>
        <div className="col-span-9 flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
          {getPriorityIcon(task.priority)} {task.priority}
        </div>
      </div>

      {/* Description */}
      <div className="mt-2">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Description</h3>
        <div className="text-slate-800 text-[15px] leading-relaxed prose prose-slate max-w-none">
          {task.description ? (
            <div dangerouslySetInnerHTML={{ __html: parseIssueKeysHTML(task.description, task.project?.key) }} />
          ) : (
            <p className="text-slate-400 italic">Click to add description</p>
          )}
        </div>
      </div>

      {/* Acceptance Criteria (Mock) */}
      <div className="mt-4">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Acceptance criteria</h3>
        <p className="text-[15px] text-slate-500">None</p>
      </div>

      {/* Attachments Table */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[15px] font-semibold text-slate-900">Attachments</h3>
          <div className="flex gap-2">
            <button className="text-slate-400 hover:text-slate-600">+</button>
            <button className="text-slate-400 hover:text-slate-600">...</button>
          </div>
        </div>
        <table className="w-full text-left border-t border-slate-200">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-200">
              <th className="font-normal py-2 px-2">Name</th>
              <th className="font-normal py-2 px-2 w-24">Size</th>
              <th className="font-normal py-2 px-2 w-48">Date added</th>
              <th className="font-normal py-2 px-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="text-[13px] text-slate-700">
            <tr className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-2 flex items-center gap-2 text-brand-600 font-medium">
                <div className="w-5 h-5 bg-yellow-400 rounded-sm"></div> home-screenshot.jpg
              </td>
              <td className="py-2 px-2 text-slate-500">1.3 MB</td>
              <td className="py-2 px-2 text-slate-500">06 Feb 2026 10:51am</td>
              <td className="py-2 px-2"><Download size={16} className="text-slate-400 hover:text-slate-700 cursor-pointer" /></td>
            </tr>
            <tr className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 px-2 flex items-center gap-2 text-brand-600 font-medium">
                <div className="w-5 h-5 bg-yellow-400 rounded-sm"></div> navigation-screenshot.jpg
              </td>
              <td className="py-2 px-2 text-slate-500">6 KB</td>
              <td className="py-2 px-2 text-slate-500">06 Feb 2026 9:58am</td>
              <td className="py-2 px-2"><Download size={16} className="text-slate-400 hover:text-slate-700 cursor-pointer" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Linked Issues */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[15px] font-semibold text-slate-900">Linked issues</h3>
          <div className="flex gap-2">
            <button className="text-slate-400 hover:text-slate-600">+</button>
            <button className="text-slate-400 hover:text-slate-600">...</button>
          </div>
        </div>
        <p className="text-[13px] text-slate-500 mb-2">is blocked by</p>
        <div className="flex items-center justify-between p-3 border border-slate-200 rounded text-[14px]">
          <div className="flex items-center gap-3">
            <CheckSquare size={16} className="text-brand-500" />
            <span className="text-slate-500 line-through">NEXT-1227</span>
            <span className="text-slate-800 font-medium">Update developer documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <ArrowUp size={16} className="text-orange-500" />
            <img src="https://i.pravatar.cc/150?u=sarah" alt="Assignee" className="w-6 h-6 rounded-full" />
            <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded uppercase">Backlog</span>
          </div>
        </div>
      </div>

      {/* Activity & Comments integrated */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        
        {/* Comment Input */}
        <div className="flex gap-4 mb-8">
          <img src="https://i.pravatar.cc/150?u=current" alt="You" className="w-10 h-10 rounded-full shrink-0 border border-slate-200" />
          <div className="flex-1 relative">
            <textarea
              placeholder="Add a comment... (Type '/' for commands or '@' to mention)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded px-4 py-3 text-[15px] focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none transition-shadow"
              rows={2}
            />
            <div className="mt-2 text-xs text-slate-500 font-semibold">
              Pro tip: press M to comment
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="space-y-6 pl-14">
          <div className="flex gap-4">
            <img src="https://i.pravatar.cc/150?u=sarah" alt="Sarah" className="w-10 h-10 rounded-full shrink-0 absolute left-8" />
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-bold text-[15px] text-slate-900">Sarah Jones</span>
                <span className="text-xs text-slate-400">1 hour ago</span>
              </div>
              <div className="text-[15px] text-slate-700 leading-relaxed">
                I've updated the design files in Figma. The new layout should fix the responsive issues we were seeing on mobile.
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 absolute left-9">
              <span className="text-xs font-bold text-slate-500">S</span>
            </div>
            <div className="flex-1 pt-1.5">
              <p className="text-[15px] text-slate-600">
                <span className="font-semibold text-slate-900">System</span> created this task
              </p>
              <p className="text-xs text-slate-400 mt-1">2 days ago</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
