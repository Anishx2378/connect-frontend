"use client"

import * as React from "react"
import { Search, Hash, Lock, User as UserIcon, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  
  const [users, setUsers] = React.useState<any[]>([])
  const [channels, setChannels] = React.useState<any[]>([])
  
  const searchRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchResults = async () => {
    if (users.length > 0 && channels.length > 0) return; // already fetched
    
    setLoading(true)
    try {
      const [usersRes, channelsRes] = await Promise.all([
        api.get("/users"),
        api.get("/channels")
      ])
      setUsers(usersRes.data.data || [])
      setChannels(channelsRes.data.data || [])
    } catch (err) {
      console.error("Search fetch failed", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFocus = () => {
    setIsOpen(true)
    fetchResults()
  }

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(query.toLowerCase()))
  )

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(query.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(query.toLowerCase()))
  )

  const handleSelectChannel = (channel: any) => {
    router.push(`/channel/${channel.name.replace('#', '')}`)
    setIsOpen(false)
    setQuery("")
  }

  const handleSelectUser = (user: any) => {
    router.push(`/dm/${user.id}`)
    setIsOpen(false)
    setQuery("")
  }

  return (
    <div className="relative w-full max-w-xl hidden sm:block font-sans antialiased" ref={searchRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" />
      <Input 
        type="search" 
        placeholder="Search workspaces, projects, or people..." 
        className="pl-10 h-9 rounded-full bg-[#e8e8ed]/60 border-transparent hover:bg-[#e8e8ed] focus-visible:bg-white focus-visible:border-[#0071e3] focus-visible:ring-4 focus-visible:ring-[#0071e3]/10 shadow-none transition-all text-[13px] tracking-tight placeholder:text-[#86868b] text-[#1d1d1f]"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (!isOpen) setIsOpen(true)
        }}
        onFocus={handleFocus}
      />

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#d2d2d7]/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden z-50 max-h-[400px] flex flex-col">
          {loading ? (
            <div className="p-4 flex justify-center text-[#86868b]">
              <Loader2 className="animate-spin" size={20} />
            </div>
          ) : (
            <div className="overflow-y-auto p-1.5">
              {filteredChannels.length === 0 && filteredUsers.length === 0 ? (
                <div className="p-4 text-[13px] text-[#86868b] text-center tracking-tight">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="py-1">
                  {/* Channels Section */}
                  {filteredChannels.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-[#86868b] tracking-tight">
                        Channels
                      </div>
                      {filteredChannels.map(channel => (
                        <button
                          key={channel.id}
                          className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#f5f5f7] rounded-lg flex items-center gap-2 text-[#1d1d1f] transition-colors"
                          onClick={() => handleSelectChannel(channel)}
                        >
                          {channel.isPrivate ? <Lock size={14} className="text-[#86868b] shrink-0" /> : <Hash size={14} className="text-[#86868b] shrink-0" />}
                          <span className="font-medium truncate tracking-tight">{channel.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Users Section */}
                  {filteredUsers.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-[#86868b] tracking-tight">
                        People
                      </div>
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#f5f5f7] rounded-lg flex items-center gap-3 text-[#1d1d1f] transition-colors"
                          onClick={() => handleSelectUser(user)}
                        >
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover grayscale opacity-90" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#d2d2d7]/50 text-[#1d1d1f] flex items-center justify-center text-[10px] font-semibold">
                              {user.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium truncate tracking-tight">{user.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
