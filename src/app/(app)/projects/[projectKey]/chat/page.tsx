"use client"

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useProjectStore } from '@/store/useProjectStore'
import { Hash, Search, Phone, Video, Info, MoreVertical, Send, Paperclip, Smile } from 'lucide-react'

export default function ProjectChatPage() {
  const params = useParams()
  const projectKey = params.projectKey as string
  const { projects } = useProjectStore()
  const project = projects.find(p => p.key?.toUpperCase() === projectKey.toUpperCase() || p.id === projectKey)
  const [message, setMessage] = useState('')

  if (!project) return null

  return (
    <div className="flex h-full bg-white">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <Hash size={20} />
            </div>
            <div>
              <h2 className="font-bold text-foreground leading-tight">#project-{project.name.toLowerCase().replace(/\s+/g, '-')}</h2>
              <p className="text-xs text-muted-foreground">{project.members.length} members • General project discussion</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-secondary-foreground hover:bg-muted rounded-lg transition-colors">
              <Phone size={18} />
            </button>
            <button className="p-2 text-muted-foreground hover:text-secondary-foreground hover:bg-muted rounded-lg transition-colors">
              <Video size={18} />
            </button>
            <div className="w-px h-6 bg-border mx-2" />
            <button className="p-2 text-muted-foreground hover:text-secondary-foreground hover:bg-muted rounded-lg transition-colors">
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-center my-6">
            <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full uppercase tracking-wider">
              Today
            </span>
          </div>

          <div className="flex gap-4">
            <img src={project.members[0]?.avatar} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-[15px] text-foreground">{project.members[0]?.name}</span>
                <span className="text-xs text-muted-foreground">10:24 AM</span>
              </div>
              <p className="text-[15px] text-secondary-foreground leading-relaxed">
                Hey team, I've just updated the task board. We need to focus on the high priority tickets before the end of the week.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <img src={project.members[1]?.avatar} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-[15px] text-foreground">{project.members[1]?.name}</span>
                <span className="text-xs text-muted-foreground">11:05 AM</span>
              </div>
              <p className="text-[15px] text-secondary-foreground leading-relaxed">
                Got it. I'll take a look at the database migration tasks.
              </p>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 bg-white border-t border-border/60 shrink-0">
          <div className="bg-muted border border-border rounded-xl flex items-end p-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <button className="p-2 text-muted-foreground hover:text-secondary-foreground rounded-lg shrink-0">
              <Paperclip size={20} />
            </button>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Message #project-${project.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none py-2 px-3 text-[15px]"
              rows={1}
            />
            <div className="flex items-center gap-1 shrink-0 px-2">
              <button className="p-2 text-muted-foreground hover:text-secondary-foreground rounded-lg">
                <Smile size={20} />
              </button>
              <button 
                className={`p-2 rounded-lg transition-colors ${message.trim() ? 'bg-primary text-white hover:bg-primary/90' : 'bg-border text-muted-foreground cursor-not-allowed'}`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar Details */}
      <div className="w-80 border-l border-border/60 bg-muted flex flex-col">
        <div className="h-16 px-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-foreground">Details</h3>
          <button className="p-1.5 text-muted-foreground hover:text-secondary-foreground rounded-md">
            <Info size={18} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="mb-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">About</h4>
            <p className="text-[14px] text-secondary-foreground">
              This channel is for everything related to the <strong>{project.name}</strong> project.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Members ({project.members.length})</h4>
            <div className="space-y-3">
              {project.members.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="relative">
                    <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate">{m.name}</p>
                    <p className="text-[12px] text-muted-foreground truncate">{m.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
