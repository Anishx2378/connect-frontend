"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Bell, Search, Star, MoreHorizontal, UserPlus, X, Check, Loader2 } from 'lucide-react'
import { Project, useProjectStore } from '@/store/useProjectStore'
import api from '@/lib/api'

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const { updateProject } = useProjectStore()
  const [showAddMember, setShowAddMember] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowAddMember(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (showAddMember) {
      fetchUsers()
    }
  }, [showAddMember, searchQuery])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const query = searchQuery ? '?search=' + encodeURIComponent(searchQuery) : ''
      const res = await api.get('/users' + query)
      setUsers(res.data.data)
    } catch (err) {
      console.error("Failed to fetch users", err)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMember = async (user: any) => {
    const isMember = project.members.some(m => m.id === user.id)
    let newMembers;
    if (isMember) {
      newMembers = project.members.filter(m => m.id !== user.id)
    } else {
      const newMember = {
        id: user.id,
        name: user.name,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
        role: user.designation || 'Member',
        department: 'General'
      }
      newMembers = [...project.members, newMember]
    }

    // Optimistic update
    updateProject(project.id, { members: newMembers })

    try {
      await api.put(`/projects/${project.id}`, { members: newMembers })
    } catch (err) {
      console.error("Failed to update project members", err)
      // Revert on error
      updateProject(project.id, { members: project.members })
    }
  }

  return (
    <header className="h-16 bg-white border-b border-border/60 flex items-center justify-between px-6 shrink-0 relative z-10 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Breadcrumb style project name if we wanted, but we'll stick to a clean title here */}
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${project.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          <span className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">{project.status}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex -space-x-2 mr-2 relative">
          {project.members.slice(0, 4).map((m: any) => (
            <img key={m.id} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" title={m.name} />
          ))}
          {project.members.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-[11px] font-bold text-secondary-foreground shadow-sm relative z-0">
              +{project.members.length - 4}
            </div>
          )}
          
          <div className="relative z-10 ml-1 flex items-center">
            <button 
              onClick={() => setShowAddMember(!showAddMember)}
              className="w-8 h-8 rounded-full border-2 border-white bg-primary/10 hover:bg-brand-100 flex items-center justify-center text-primary shadow-sm transition-colors relative z-10 ml-2" 
              title="Add members"
            >
              <UserPlus size={14} />
            </button>

            {showAddMember && (
              <div ref={popoverRef} className="absolute top-10 right-0 w-72 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50">
                <div className="p-3 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-muted border border-border rounded-md text-[13px] outline-none focus:border-primary focus:bg-white transition-colors"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={16} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">No users found</div>
                  ) : (
                    users.map(user => {
                      const isMember = project.members.some(m => m.id === user.id)
                      const avatar = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
                      return (
                        <div 
                          key={user.id} 
                          onClick={() => toggleMember(user)}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <img src={avatar} alt={user.name} className="w-8 h-8 rounded-full" />
                            <div className="flex flex-col">
                              <span className="text-[13px] font-semibold text-foreground">{user.name}</span>
                              <span className="text-[11px] text-muted-foreground">{user.email}</span>
                            </div>
                          </div>
                          {isMember ? (
                            <Check size={16} className="text-primary" />
                          ) : (
                            <PlusIcon size={16} className="text-muted-foreground group-hover:text-muted-foreground" />
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-6 w-[1px] bg-border"></div>

        <button className="text-muted-foreground hover:text-amber-400 transition-colors">
          <Star size={20} className={project.isFavorite ? 'fill-amber-400 text-amber-400' : ''} />
        </button>
        <button className="text-muted-foreground hover:text-secondary-foreground transition-colors">
          <Search size={20} />
        </button>
        <button className="text-muted-foreground hover:text-secondary-foreground transition-colors">
          <Bell size={20} />
        </button>
        <button className="text-muted-foreground hover:text-secondary-foreground transition-colors">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </header>
  )
}

function PlusIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
