"use client"

import React from 'react'
import { Plus, Search, FileText, MoreVertical } from 'lucide-react'

export default function ProjectNotesPage() {
  const notes = [
    { id: 1, title: 'Client Kickoff Call Summary', excerpt: 'Discussed timeline, primary goals, and target audience. Client expects a bold modern design...', date: 'Oct 20, 2026', author: 'Priya Nair' },
    { id: 2, title: 'Technical Architecture Decisions', excerpt: 'We agreed to stick with Next.js App Router for this project. State management will use Zustand...', date: 'Oct 21, 2026', author: 'Alex Chen' },
    { id: 3, title: 'Weekly Sync - Week 1', excerpt: 'Blockers: Waiting on final API keys from the client. Next steps: Design team to finalize wireframes...', date: 'Oct 25, 2026', author: 'Sarah Jones' },
  ]

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-8 py-6 border-b border-border/60 bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Client Notes</h1>
          <p className="text-sm text-muted-foreground">Document important decisions and meetings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search notes..." 
              className="pl-9 pr-3 py-2 bg-muted border border-border rounded-lg text-sm outline-none focus:bg-white focus:border-primary transition-colors w-64"
            />
          </div>
          <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
            <Plus size={16} />
            New Note
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id} className="bg-white p-6 rounded-xl shadow-sm border border-border/60 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-[16px] font-bold text-foreground group-hover:text-primary transition-colors">{note.title}</h3>
                <button className="text-muted-foreground hover:text-secondary-foreground">
                  <MoreVertical size={16} />
                </button>
              </div>
              <p className="text-[15px] text-secondary-foreground leading-relaxed mb-4">{note.excerpt}</p>
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1"><FileText size={14} /> Note</span>
                <span>{note.date}</span>
                <span>By {note.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
