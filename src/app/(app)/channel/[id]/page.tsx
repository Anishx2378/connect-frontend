"use client"

import * as React from "react"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { ThreadSidebar } from "@/components/chat/ThreadSidebar"
import { PinnedSidebar } from "@/components/chat/PinnedSidebar"
import { Hash, Users, Loader2, Search, X, UserPlus, Star, Bell, Headphones, ChevronDown, Lock, Globe, Settings, Pin, Phone, Video } from "lucide-react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { getSocket } from "@/lib/socket"
import { useStore } from "@/store/useStore"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string
    avatar: string | null
  }
  attachments?: Array<any>
  linkPreviews?: Array<any>
  reactions?: Array<any>
  replyCount?: number
  isPinned?: boolean
  pinnedBy?: any
}

const formatDateDivider = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const suffix = ['th', 'st', 'nd', 'rd'][(day > 3 && day < 21) || day % 10 > 3 ? 0 : day % 10];

  return `${weekday}, ${month} ${day}${suffix}`;
};

export default function ChannelPage() {
  const params = useParams()
  const channelName = params.id as string
  const { user: currentUser, activeWave, setActiveWave, waveRoomState } = useStore()
  
  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(true)
  const [channelId, setChannelId] = React.useState<string | null>(null)
  const [channelDetails, setChannelDetails] = React.useState<any>(null)
  const [channelMembers, setChannelMembers] = React.useState<any[]>([])
  
  const [activeThread, setActiveThread] = React.useState<any>(null)
  const [showPinned, setShowPinned] = React.useState(false)

  const [showAddUserModal, setShowAddUserModal] = React.useState(false)
  const [showMembersModal, setShowMembersModal] = React.useState(false)
  const [activeModalTab, setActiveModalTab] = React.useState<'members' | 'settings'>('members')
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<any[]>([])
  const [isSearching, setIsSearching] = React.useState(false)

  // Settings tab state
  const [settingsDescription, setSettingsDescription] = React.useState("")
  const [settingsIsPrivate, setSettingsIsPrivate] = React.useState(false)
  const [isSavingSettings, setIsSavingSettings] = React.useState(false)

  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const isWaveActiveHere = channelId && waveRoomState[channelId] && waveRoomState[channelId].length > 0
  const isMeInWave = activeWave?.roomId === channelId

  const handleWaveToggle = () => {
    if (!channelId) return
    window.open(`/wave/channel/${channelId}`, '_blank')
  }

  React.useEffect(() => {
    const fetchChannelAndMessages = async () => {
      try {
        // Find channel ID by name
        const channelsRes = await api.get("/channels")
        const channel = channelsRes.data.data.find((c: any) => c.name === `#${channelName}` || c.name === channelName || c.id === channelName)
        
        if (channel) {
          setChannelId(channel.id)
          
          // Fetch full channel details including members
          const channelDetailsRes = await api.get(`/channels/${channel.id}`)
          const details = channelDetailsRes.data.data
          setChannelDetails(details)
          const members = details.members.map((m: any) => m.user)
          setChannelMembers(members)
          // Sync settings state
          setSettingsDescription(details.description || "")
          setSettingsIsPrivate(details.isPrivate || false)

          // Fetch messages
          const msgRes = await api.get(`/channels/${channel.id}/messages`)
          setMessages(msgRes.data.data.messages?.map((m: any) => ({...m, replyCount: m._count?.replies || 0})) || [])

          // Mark channel as read
          api.post(`/channels/${channel.id}/read`).catch(console.error)
        }
      } catch (err) {
        console.error("Failed to load channel:", err)
      } finally {
        setLoading(false)
        setTimeout(scrollToBottom, 100)
      }
    }

    fetchChannelAndMessages()
  }, [channelName])

  React.useEffect(() => {
    if (!showAddUserModal) {
      setSearchQuery("")
      setSearchResults([])
      return
    }

    const fetchSearch = async () => {
      setIsSearching(true)
      try {
        const res = await api.get(`/users${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`)
        setSearchResults(res.data.data)
      } catch (err) {
        console.error("Search failed", err)
      } finally {
        setIsSearching(false)
      }
    }

    const timeoutId = setTimeout(fetchSearch, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, showAddUserModal])

  // Socket listener
  React.useEffect(() => {
    if (!channelId) return

    const socket = getSocket()
    
    // Join channel
    socket.emit("join_channel", channelId)

    const handleConnect = () => {
      socket.emit("join_channel", channelId)
    }
    socket.on("connect", handleConnect)

    const handleNewMessage = (newMsg: Message & { channelId?: string; localId?: string }) => {
      if (newMsg.channelId && newMsg.channelId !== channelId) return
      setMessages((prev) => {
        if (prev.some(m => m.id === newMsg.id)) return prev;

        // If sender has the optimistic message matching localId, replace it
        if (newMsg.localId && prev.some(m => m.id === newMsg.localId)) {
          return prev.map(m => m.id === newMsg.localId ? { ...newMsg, replyCount: 0 } : m);
        }

        // Otherwise (recipient side or non-optimistic), append the new message
        return [...prev, newMsg];
      })
      setTimeout(scrollToBottom, 100)
    }

    const handleMessageUpdated = (updatedMsg: Message & { channelId?: string }) => {
      if (updatedMsg.channelId && updatedMsg.channelId !== channelId) return
      setMessages((prev) => prev.map(msg => msg.id === updatedMsg.id ? updatedMsg : msg))
    }

    const handleMessageDeleted = ({ id, channelId: msgChannelId }: { id: string, channelId?: string }) => {
      if (msgChannelId && msgChannelId !== channelId) return
      setMessages((prev) => prev.filter(msg => msg.id !== id))
    }

    const handleReactionAdded = (payload: any) => {
      if (payload.channelId && payload.channelId !== channelId) return
      setMessages(prev => prev.map(msg => {
        if (msg.id === payload.messageId) {
          const reactions = msg.reactions || []
          if (!reactions.some((r: any) => r.id === payload.reaction.id)) {
            return { ...msg, reactions: [...reactions, payload.reaction] }
          }
        }
        return msg
      }))
    }

    const handleReactionRemoved = (payload: any) => {
      if (payload.channelId && payload.channelId !== channelId) return
      setMessages(prev => prev.map(msg => {
        if (msg.id === payload.messageId) {
          const reactions = msg.reactions || []
          return { ...msg, reactions: reactions.filter((r: any) => r.id !== payload.reactionId) }
        }
        return msg
      }))
    }

    const handleReceiveReply = (replyMsg: any) => {
      if (replyMsg.channelId && replyMsg.channelId !== channelId) return
      setMessages(prev => prev.map(msg => {
        if (msg.id === replyMsg.parentId) {
          return { ...msg, replyCount: (msg.replyCount || 0) + 1 }
        }
        return msg
      }))
    }

    socket.on("receive_channel_message", handleNewMessage)
    socket.on("message_updated", handleMessageUpdated)
    socket.on("message_deleted", handleMessageDeleted)
    socket.on("reaction_added", handleReactionAdded)
    socket.on("reaction_removed", handleReactionRemoved)
    socket.on("receive_reply", handleReceiveReply)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("receive_channel_message", handleNewMessage)
      socket.off("message_updated", handleMessageUpdated)
      socket.off("message_deleted", handleMessageDeleted)
      socket.off("reaction_added", handleReactionAdded)
      socket.off("reaction_removed", handleReactionRemoved)
      socket.off("receive_reply", handleReceiveReply)
      socket.emit("leave_channel", channelId)
    }
  }, [channelId])

  const handleSendMessage = async (content: string, file?: File) => {
    if (!channelId || !currentUser) return

    try {
      const socket = getSocket()
      
      const tempId = `temp-${Date.now()}`
      const optimisticMsg: Message = {
        id: tempId,
        content,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        replyCount: 0
      }
      setMessages(prev => [...prev, optimisticMsg])
      setTimeout(scrollToBottom, 100)

      if (file) {
        const buffer = await file.arrayBuffer()
        socket.emit("send_channel_message", { 
          channelId, 
          content,
          localId: tempId,
          file: {
            buffer,
            name: file.name,
            type: file.type
          }
        })
      } else {
        socket.emit("send_channel_message", { channelId, content, localId: tempId })
      }
    } catch (err) {
      console.error("Failed to send message", err)
    }
  }

  const handleAddUser = async (userId: string) => {
    if (!channelId) return
    try {
      await api.post(`/channels/${channelId}/members`, { userId })
      toast.success("User added to channel successfully")
      
      // Refresh members list
      const channelDetailsRes = await api.get(`/channels/${channelId}`)
      const members = channelDetailsRes.data.data.members.map((m: any) => m.user)
      setChannelMembers(members)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add user")
    }
  }

  const handleSaveSettings = async () => {
    if (!channelId) return
    setIsSavingSettings(true)
    try {
      const res = await api.patch(`/channels/${channelId}`, {
        description: settingsDescription,
        isPrivate: settingsIsPrivate,
      })
      setChannelDetails((prev: any) => ({ ...prev, ...res.data.data }))
      toast.success("Channel settings saved!")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings")
    } finally {
      setIsSavingSettings(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Channel Header */}
      <div className="flex shrink-0 h-[60px] items-center justify-between border-b border-border bg-background/95 backdrop-blur-xl z-10 px-5 transition-colors">
        <div className="flex items-center gap-2">
          {channelDetails?.isPrivate ? (
            <Lock className="text-muted-foreground" size={18} strokeWidth={2} />
          ) : (
            <Hash className="text-muted-foreground" size={20} strokeWidth={2} />
          )}
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{channelName.replace('%23', '')}</h2>
          {channelDetails?.isPrivate && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-black/[0.03] dark:bg-white/[0.05] px-1.5 py-0.5 rounded-[4px] ml-1.5">Private</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <div 
            className="flex items-center justify-center w-8 h-8 cursor-pointer transition-colors rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground"
            onClick={() => { setActiveModalTab('members'); setShowMembersModal(true) }}
            title="View Channel Members"
          >
            <Users size={18} strokeWidth={2} />
          </div>
          <div 
            className="flex items-center justify-center w-8 h-8 cursor-pointer transition-colors rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground"
            onClick={() => setShowAddUserModal(true)}
            title="Add user to channel"
          >
            <UserPlus size={18} strokeWidth={2} />
          </div>
          <div 
            className={`flex items-center justify-center w-8 h-8 cursor-pointer transition-colors rounded-lg ${showPinned ? 'bg-primary/10 text-primary' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground'}`}
            onClick={() => setShowPinned(!showPinned)}
            title="Pinned Messages"
          >
            <Pin size={18} strokeWidth={showPinned ? 2.5 : 2} />
          </div>
          <button 
            onClick={handleWaveToggle}
            title="Start Audio Call (Wave)"
            className={`flex items-center justify-center w-8 h-8 cursor-pointer transition-colors rounded-lg ${
              isMeInWave
                ? 'bg-green-500 text-white hover:bg-green-600'
                : isWaveActiveHere
                  ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30'
                  : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground'
            }`}
          >
            <Phone size={18} strokeWidth={2} />
          </button>
          <button className="flex items-center justify-center w-8 h-8 cursor-pointer transition-colors rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground">
            <Video size={18} strokeWidth={2} />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <div 
            className="flex items-center justify-center w-8 h-8 cursor-pointer transition-colors rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.05] hover:text-foreground"
            onClick={() => { setActiveModalTab('settings'); setShowMembersModal(true) }}
            title="Channel Settings"
          >
            <Settings size={18} strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
            <div className="space-y-1">
          {channelDetails && (
            <div className="mb-14 mt-12 px-2">
              <div className="h-16 w-16 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-sm">
                {channelDetails?.isPrivate ? <Lock className="text-primary" size={32} strokeWidth={1.5} /> : <Hash className="text-primary" size={32} strokeWidth={1.5} />}
              </div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Welcome to {channelDetails?.isPrivate ? '' : '#'}{channelName.replace('%23', '')}</h1>
              <p className="text-muted-foreground text-[15px] leading-relaxed max-w-2xl font-medium">
                {(() => {
                  const date = new Date(channelDetails.createdAt);
                  const month = date.toLocaleDateString('en-US', { month: 'long' });
                  const day = date.getDate();
                  const suffix = ['th', 'st', 'nd', 'rd'][(day > 3 && day < 21) || day % 10 > 3 ? 0 : day % 10];
                  return `This is the start of the ${channelDetails?.isPrivate ? 'private ' : ''}`;
                })()}
                <strong className="text-foreground font-semibold">#{channelName.replace('%23', '')}</strong> channel. 
                Created on {new Date(channelDetails.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.
              </p>
            </div>
          )}

          {messages.map((msg, index) => {
            const currentMsgDate = new Date(msg.createdAt).toDateString()
            const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null
            const showDivider = currentMsgDate !== prevMsgDate

            const isGrouped = index > 0 &&
              messages[index - 1].sender.id === msg.sender.id &&
              !showDivider &&
              new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() < 5 * 60 * 1000;

            return (
              <React.Fragment key={msg.id}>
                {showDivider && (
                  <div className="relative flex items-center justify-center my-8">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-3 py-1 text-[12px] font-semibold text-muted-foreground rounded-full flex items-center gap-1.5 ring-1 ring-border">
                        {formatDateDivider(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
                <MessageBubble 
                  compact={isGrouped}
                  onReplyClick={() => setActiveThread(msg)}
                  message={{
                    id: msg.id,
                    userId: msg.sender.id,
                    userName: msg.sender.name,
                    avatar: msg.sender.avatar || `https://ui-avatars.com/api/?name=${msg.sender.name}&background=random`,
                    content: msg.content,
                    timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: msg.createdAt,
                    attachments: msg.attachments,
                    linkPreviews: msg.linkPreviews,
                    reactions: msg.reactions,
                    replyCount: msg.replyCount,
                    isPinned: msg.isPinned,
                    pinnedBy: msg.pinnedBy
                  }} 
                />
              </React.Fragment>
            )
          })}
            <div ref={messagesEndRef} />
          </div>
        </div>

      {/* Input Area */}
      <div className="w-full shrink-0 bg-white px-6 pb-6 pt-2">
        <ChatInput 
          placeholder={`Message #${channelName.replace('%23', '')}`} 
          onSendMessage={handleSendMessage} 
        />
      </div>
    </div>

    {/* Thread Sidebar */}
    {activeThread && (
      <ThreadSidebar 
        thread={activeThread} 
        onClose={() => setActiveThread(null)} 
        channelId={channelId!} 
      />
    )}

    {/* Pinned Messages Sidebar */}
    {showPinned && !activeThread && (
      <PinnedSidebar 
        messages={messages} 
        onClose={() => setShowPinned(false)} 
      />
    )}
  </div>

    {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/50 pt-[10vh] px-4" onClick={() => setShowAddUserModal(false)}>
          <div 
            className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted">
              <Search className="text-muted-foreground" size={20} />
              <input 
                autoFocus
                type="text"
                placeholder="Search to add team members to channel..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button className="text-muted-foreground hover:text-secondary-foreground" onClick={() => setShowAddUserModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-2 flex-1 min-h-[100px]">
              {isSearching ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No users found.
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map(u => (
                    <div
                      key={u.id}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[#0071e3] font-medium overflow-hidden relative">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                          ) : (
                            u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                          )}
                          <div className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white", u.isOnline ? "bg-green-500" : "bg-slate-300")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{u.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.designation || u.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddUser(u.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#f5f5f7] text-[#0071e3] hover:bg-primary/10 transition-colors whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* View Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowMembersModal(false)}>
          <div 
            className="w-full max-w-[600px] rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="pt-6 px-6 pb-0 relative">
              <button 
                className="absolute top-6 right-6 text-muted-foreground hover:text-secondary-foreground p-1 rounded-lg hover:bg-secondary transition-colors" 
                onClick={() => setShowMembersModal(false)}
              >
                <X size={20} />
              </button>
              
              <h2 className="text-[22px] font-semibold tracking-tight text-foreground mb-4 flex items-center gap-1">
                # {channelName.replace('%23', '')}
              </h2>
              
              <div className="flex items-center gap-2 mb-6">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-white border border-border/50 rounded-lg hover:bg-muted transition-colors">
                  <Star size={14} className="text-muted-foreground" />
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-white border border-border/50 rounded-lg hover:bg-muted transition-colors">
                  <Bell size={14} className="text-muted-foreground" />
                  All new posts
                  <ChevronDown size={14} className="text-muted-foreground ml-1" />
                </button>
                <button 
                  onClick={handleWaveToggle}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-white border border-border/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <Headphones size={14} className={isMeInWave || isWaveActiveHere ? 'animate-pulse text-green-500' : 'text-muted-foreground'} />
                  {isMeInWave ? 'Connected' : isWaveActiveHere ? 'Join Huddle' : 'Huddle'}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-6 border-b border-border/50">
                <button 
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeModalTab === 'members'
                      ? 'text-foreground border-b-2 border-brand-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveModalTab('members')}
                >
                  Members <span className="text-muted-foreground font-normal ml-1">{channelMembers.length}</span>
                </button>
                <button 
                  className={`pb-3 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    activeModalTab === 'settings'
                      ? 'text-foreground border-b-2 border-brand-600'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveModalTab('settings')}
                >
                  <Settings size={14} /> Settings
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {activeModalTab === 'members' && (
                <>
                  {/* Search Bar Row */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 relative flex items-center">
                      <Search size={16} className="absolute left-3 text-muted-foreground" />
                      <input 
                        type="text"
                        placeholder="Find members"
                        className="w-full pl-9 pr-3 py-2 text-sm text-foreground bg-white border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-primary placeholder:text-muted-foreground"
                      />
                    </div>
                    <button className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-foreground bg-white border border-border/50 rounded-lg hover:bg-muted transition-colors min-w-[120px]">
                      Everyone
                      <ChevronDown size={14} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {/* Add People Button */}
                    <button 
                      onClick={() => {
                        setShowMembersModal(false)
                        setShowAddUserModal(true)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center shrink-0 text-sky-600">
                        <UserPlus size={18} />
                      </div>
                      <div className="font-semibold text-sm text-foreground">
                        Add people
                      </div>
                    </button>

                    {/* Members List */}
                    {channelMembers.map(u => {
                      const isMe = currentUser?.id === u.id;
                      const isManager = u.role === "ADMIN";
                      return (
                        <div
                          key={u.id}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-[#0071e3] font-medium overflow-hidden relative">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                              ) : (
                                u.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                              )}
                              <div className={cn(
                                "absolute bottom-[-2px] right-[-2px] h-3.5 w-3.5 rounded-full border-[2.5px] border-white", 
                                u.isOnline ? "bg-green-500" : "bg-transparent border-border/50 border-[2px]"
                              )}>
                                {!u.isOnline && <div className="h-full w-full rounded-full bg-white border border-border/50" />}
                              </div>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm text-foreground truncate">{u.name}</span>
                                {isMe && <span className="text-sm text-muted-foreground shrink-0">(you)</span>}
                              </div>
                              {(u.designation || u.email) && (
                                <div className="text-[13px] text-muted-foreground truncate">{u.designation || u.email}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isManager && (
                              <span className="px-2 py-1 text-xs text-secondary-foreground bg-secondary rounded-lg whitespace-nowrap">
                                Channel Manager
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {activeModalTab === 'settings' && (
                <div className="space-y-8">
                  {/* Visibility Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Channel Visibility</h3>
                    <p className="text-xs text-muted-foreground mb-4">Control who can see and join this channel.</p>

                    <div className="space-y-3">
                      {/* Public option */}
                      <label
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          !settingsIsPrivate
                            ? "border-primary bg-[#f5f5f7]"
                            : "border-border/50 bg-white hover:border-border/50"
                        )}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          className="mt-0.5 accent-brand-600"
                          checked={!settingsIsPrivate}
                          onChange={() => setSettingsIsPrivate(false)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe size={16} className={!settingsIsPrivate ? "text-[#0071e3]" : "text-muted-foreground"} />
                            <span className="font-semibold text-sm text-foreground">Public</span>
                            {!settingsIsPrivate && (
                              <span className="text-[10px] font-semibold tracking-tight uppercase tracking-wide text-[#0071e3] bg-primary/10 px-2 py-0.5 rounded-full">Current</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Anyone in the workspace can see and join this channel. Messages are visible to all members.
                          </p>
                        </div>
                      </label>

                      {/* Private option */}
                      <label
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          settingsIsPrivate
                            ? "border-primary bg-[#f5f5f7]"
                            : "border-border/50 bg-white hover:border-border/50"
                        )}
                      >
                        <input
                          type="radio"
                          name="visibility"
                          className="mt-0.5 accent-brand-600"
                          checked={settingsIsPrivate}
                          onChange={() => setSettingsIsPrivate(true)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Lock size={16} className={settingsIsPrivate ? "text-[#0071e3]" : "text-muted-foreground"} />
                            <span className="font-semibold text-sm text-foreground">Private</span>
                            {settingsIsPrivate && (
                              <span className="text-[10px] font-semibold tracking-tight uppercase tracking-wide text-[#0071e3] bg-primary/10 px-2 py-0.5 rounded-full">Current</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Only members who are explicitly added can see this channel. Hidden from workspace search.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">Description</h3>
                    <p className="text-xs text-muted-foreground mb-3">Let people know what this channel is about.</p>
                    <textarea
                      value={settingsDescription}
                      onChange={e => setSettingsDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={3}
                      className="w-full px-3 py-2.5 text-sm text-foreground bg-white border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-primary placeholder:text-muted-foreground resize-none"
                    />
                  </div>

                  {/* Warning for switching to private */}
                  {settingsIsPrivate !== channelDetails?.isPrivate && (
                    <div className={cn(
                      "flex items-start gap-3 p-3.5 rounded-lg text-xs",
                      settingsIsPrivate
                        ? "bg-amber-50 border border-amber-200 text-amber-800"
                        : "bg-sky-50 border border-sky-200 text-sky-800"
                    )}>
                      <div className="shrink-0 mt-0.5">
                        {settingsIsPrivate ? <Lock size={14} /> : <Globe size={14} />}
                      </div>
                      <div>
                        {settingsIsPrivate
                          ? "Making this channel private will hide it from people who are not members. Existing members will keep access."
                          : "Making this channel public will make it visible to everyone in the workspace."}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {isSavingSettings ? (
                        <><Loader2 size={14} className="animate-spin" /> Saving...</>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
