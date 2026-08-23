"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Loader2, Search, User, Hash, Users2, ExternalLink, Mail, Filter, ChevronDown, Check, Lock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"

export default function DirectoriesPage() {
  const currentUser = useStore((state) => state.user)
  const [users, setUsers] = React.useState<any[]>([])
  const [channels, setChannels] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState('people')
  const [showBanner, setShowBanner] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, channelsRes] = await Promise.all([
          api.get("/users"),
          api.get("/channels")
        ])
        setUsers(usersRes.data.data)
        setChannels(channelsRes.data.data)
      } catch (err) {
        console.error("Failed to load directories data", err)
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchData()
    }
  }, [currentUser])

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    )
  }

  const tabClass = (isActive: boolean) => 
    `flex items-center gap-2 pb-3 border-b-[3px] cursor-pointer ${isActive ? 'border-amber-600 text-slate-900 font-semibold' : 'border-transparent text-slate-600 hover:text-slate-900'}`;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header section */}
      <div className="px-6 pt-6 pb-0 border-b border-slate-200 bg-white shrink-0">
        <h1 className="text-[22px] font-bold text-slate-900 mb-4">Directories</h1>
        
        {/* Tabs */}
        <div className="flex items-center gap-6 text-[15px] font-medium text-slate-600">
          <div className={tabClass(activeTab === 'people')} onClick={() => setActiveTab('people')}>
            <User size={16} />
            <span>People</span>
          </div>
          <div className={tabClass(activeTab === 'channels')} onClick={() => setActiveTab('channels')}>
            <Hash size={16} />
            <span>Channels</span>
          </div>
          <div className={tabClass(activeTab === 'groups')} onClick={() => setActiveTab('groups')}>
            <Users2 size={16} />
            <span>User Groups</span>
          </div>
          <div className={tabClass(activeTab === 'external')} onClick={() => setActiveTab('external')}>
            <ExternalLink size={16} />
            <span>External</span>
          </div>
          <div className={tabClass(activeTab === 'invitations')} onClick={() => setActiveTab('invitations')}>
            <Mail size={16} />
            <span>Invitations</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Optional Banner for Channels */}
        {activeTab === 'channels' && showBanner && (
          <div className="bg-[#e5f5fb] px-6 py-10 relative border-b border-slate-200">
            <button onClick={() => setShowBanner(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
              <X size={18} />
            </button>
            <div className="max-w-3xl">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Organize your team&apos;s conversations</h2>
              <p className="text-sm text-slate-600 mb-4 max-w-xl leading-relaxed">
                Channels are spaces for gathering all the right people, messages, files and tools. Organize them by any project, group, initiative or topic of your choosing.
              </p>
              <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-800 font-semibold text-[13px] h-9 shadow-sm">
                Create a channel
              </Button>
            </div>
          </div>
        )}

        <div className="p-6 max-w-7xl mx-auto w-full space-y-4">
          {/* Search and Action Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder={activeTab === 'channels' ? "Search for channels" : "Search for people"} 
                className="w-full pl-10 py-5 text-[15px] border-slate-300 shadow-sm focus-visible:ring-blue-500 rounded-md"
              />
            </div>
            <Button variant="outline" className="font-semibold text-[15px] py-5 px-6 shadow-sm">
              {activeTab === 'channels' ? "Create Channel" : "Invite People"}
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex items-center justify-between mt-2 mb-6">
            <div className="flex items-center gap-2">
              {activeTab === 'channels' ? (
                <>
                  <Button variant="outline" size="sm" className="h-8 text-[13px] font-medium border-slate-200">
                    All channels <ChevronDown size={14} className="ml-1 text-slate-400" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[13px] font-medium border-slate-200">
                    Any channel type <ChevronDown size={14} className="ml-1 text-slate-400" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[13px] font-medium border-slate-200">
                    Workspaces <ChevronDown size={14} className="ml-1 text-slate-400" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[13px] font-medium border-slate-200">
                    Organizations <ChevronDown size={14} className="ml-1 text-slate-400" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="h-8 text-[13px] font-medium border-slate-200">
                    Title <ChevronDown size={14} className="ml-1 text-slate-400" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[13px] font-medium border-slate-200">
                    Location <ChevronDown size={14} className="ml-1 text-slate-400" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" className="h-8 text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                <Filter size={14} className="mr-1.5" /> Filters
              </Button>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-[13px] font-medium border-slate-200">
              Most recommended <ChevronDown size={14} className="ml-1 text-slate-400" />
            </Button>
          </div>
          
          {/* Content Grid/List based on active tab */}
          {activeTab === 'people' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 pb-10">
              {users.map((u) => {
                const isMe = u.id === currentUser.id;
                const colorIndex = u.name.length % 5;
                const bgColors = ["bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-purple-500", "bg-rose-500"];
                const bgColor = bgColors[colorIndex];

                return (
                  <Card key={u.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group bg-white rounded-xl">
                    <div className={`w-full aspect-square relative ${!u.avatar ? bgColor : "bg-slate-100"}`}>
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-end text-white/90 overflow-hidden pt-8">
                          <div className="w-1/3 aspect-square rounded-full bg-white/20 mb-2"></div>
                          <div className="w-2/3 h-1/2 rounded-t-full bg-white/20 translate-y-2"></div>
                        </div>
                      )}
                      {isMe && (
                        <a 
                          href="/settings"
                          className="absolute top-3 right-3 bg-white text-slate-700 text-[13px] font-semibold px-3 py-1.5 rounded-md shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                        >
                          <User size={14} /> Edit
                        </a>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-bold text-[15px] text-slate-900 truncate" title={u.name}>{u.name}</h3>
                        {u.isOnline ? (
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Online" />
                        ) : (
                          <div className="w-2 h-2 rounded-full border border-slate-400 shrink-0" title="Offline" />
                        )}
                      </div>
                      <p className="text-[13px] text-slate-500 leading-snug line-clamp-2 min-h-[36px]">
                        {isMe ? "That's you!" : (u.designation || "Member")}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden pb-10">
              <div className="divide-y divide-slate-100">
                {channels.map((channel) => {
                  const isJoined = channel.members?.some((m: any) => m.userId === currentUser.id);
                  return (
                    <div key={channel.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {channel.isPrivate ? (
                          <Lock size={15} className="text-slate-800" strokeWidth={2.5} />
                        ) : (
                          <Hash size={15} className="text-slate-800" strokeWidth={2.5} />
                        )}
                        <span className="font-bold text-[15px] text-slate-900">{channel.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
                        {isJoined && (
                          <span className="flex items-center text-green-600 font-medium">
                            <Check size={14} className="mr-1" /> Joined
                          </span>
                        )}
                        {isJoined && <span>·</span>}
                        <span>{channel._count?.members || 0} members</span>
                        {channel.description && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-[500px]" title={channel.description}>
                              {channel.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
