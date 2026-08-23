import React, { useState } from 'react'
import { Task, TaskStatus } from '@/store/useProjectStore'
import { Calendar, User, Tag, LayoutPanelLeft, Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

interface TaskMetadataPanelProps {
  task: Task
  onUpdate: (id: string, data: Partial<Task>) => void
}

const STATUSES: TaskStatus[] = ['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Completed']

const AccordionSection = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border border-slate-200 rounded-md mb-4 bg-white overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <h3 className="text-[14px] font-semibold text-slate-800">{title}</h3>
        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

const FieldRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
  <div className="grid grid-cols-12 gap-2 py-2 items-center">
    <div className="col-span-5 text-[13px] font-semibold text-slate-500">{label}</div>
    <div className="col-span-7 text-[13px] font-medium text-slate-800 flex items-center">{value}</div>
  </div>
)

export function TaskMetadataPanel({ task, onUpdate }: TaskMetadataPanelProps) {
  const [status, setStatus] = useState<TaskStatus>(task.status)

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus
    setStatus(newStatus)
    onUpdate(task.id, { status: newStatus })
  }

  return (
    <div className="flex flex-col gap-4">
      
      {/* Top Actions */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative inline-flex items-center">
          <select 
            value={status}
            onChange={handleStatusChange}
            className="appearance-none pl-3 pr-8 py-1.5 bg-[#0052CC] hover:bg-[#0047B3] text-white border-none rounded text-[14px] font-semibold outline-none cursor-pointer transition-colors"
          >
            {STATUSES.map(s => (
              <option key={s} value={s} className="bg-white text-slate-800">{s}</option>
            ))}
          </select>
          <ChevronDown size={16} className="text-white absolute right-2 pointer-events-none" />
        </div>
        <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[14px] font-semibold transition-colors">
          Send email
        </button>
      </div>

      {/* Your pinned fields */}
      <AccordionSection title="Your pinned fields">
        <FieldRow label="Business value" value={<span className="text-slate-500">None</span>} />
        <FieldRow label="Complexity" value={<span className="text-slate-500">None</span>} />
      </AccordionSection>

      {/* People */}
      <AccordionSection title="People">
        <FieldRow 
          label="Assignee" 
          value={
            <div className="flex items-center gap-2">
              {task.assignees && task.assignees.length > 0 ? (
                task.assignees.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    {a.avatar ? (
                      <img src={a.avatar} alt={a.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">
                        {a.name ? a.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span>{a.name}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold">U</div>
                  <span className="text-slate-500">Unassigned</span>
                </>
              )}
            </div>
          } 
        />
        <FieldRow 
          label="Reporter" 
          value={
            <div className="flex items-center gap-2">
              {task.reporter ? (
                <>
                  {task.reporter.avatar ? (
                    <img src={task.reporter.avatar} alt={task.reporter.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      {task.reporter.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{task.reporter.name}</span>
                </>
              ) : (
                <span className="text-slate-500 italic">Unknown</span>
              )}
            </div>
          } 
        />
      </AccordionSection>

      {/* Details */}
      <AccordionSection title="Details">
        <FieldRow label="Story points" value={<span className="bg-slate-100 text-slate-600 px-2 rounded-full text-xs font-bold">3</span>} />
        <FieldRow label="Sprint" value={<span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-semibold">Renzuru 13.4</span>} />
        <FieldRow label="Epic link" value={<span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">Editor</span>} />
        <FieldRow label="Components" value={<span className="text-slate-500">None</span>} />
        <FieldRow label="Fix versions" value={<span className="text-slate-500">None</span>} />
      </AccordionSection>

      {/* Dates */}
      <AccordionSection title="Dates">
        <FieldRow 
          label="Due date" 
          value={task.dueDate ? format(new Date(task.dueDate), 'd MMMM yyyy') : <span className="text-slate-500">None</span>} 
        />
        <FieldRow 
          label="Updated" 
          value={(task as any).updatedAt ? format(new Date((task as any).updatedAt), 'd MMMM yyyy') : 'Unknown'} 
        />
        <FieldRow 
          label="Created" 
          value={task.createdAt ? format(new Date(task.createdAt), 'd MMMM yyyy') : 'Unknown'} 
        />
      </AccordionSection>

    </div>
  )
}
