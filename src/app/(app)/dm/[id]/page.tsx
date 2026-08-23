"use client"

import * as React from "react"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { ThreadSidebar } from "@/components/chat/ThreadSidebar"
import { PinnedSidebar } from "@/components/chat/PinnedSidebar"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { getSocket } from "@/lib/socket"
import { useStore } from "@/store/useStore"
import { Loader2, Phone, Video, Search, ChevronDown, Pin } from "lucide-react"

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

export default function DMPage() {
  const params = useParams()
  const conversationId = params.id as string
  const { user: currentUser, activeWave, setActiveWave, waveRoomState } = useStore()
  
  const [messages, setMessages] = React.useState<Message[]>([])
  const [otherUser, setOtherUser] = React.useState<{ name: string; avatar: string | null; designation?: string; isOnline?: boolean } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [typingUser, setTypingUser] = React.useState<string | null>(null)
  const [activeThread, setActiveThread] = React.useState<any>(null)
  const [showPinned, setShowPinned] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const isWaveActiveHere = waveRoomState[conversationId] && waveRoomState[conversationId].length > 0
  const isMeInWave = activeWave?.roomId === conversationId

  const handleWaveToggle = () => {
    window.open(`/wave/dm/${conversationId}`, '_blank')
  }

  React.useEffect(() => {
    const fetchDMData = async () => {
      try {
        const dmsRes = await api.get("/dms")
        const currentConv = dmsRes.data.data.find((c: any) => c.id === conversationId)
        
        if (currentConv && currentUser) {
          const friend = currentConv.user1Id === currentUser.id ? currentConv.user2 : currentConv.user1
          setOtherUser(friend)
        }

        const msgRes = await api.get(`/dms/${conversationId}/messages`)
        setMessages(msgRes.data.data.messages?.map((m: any) => ({...m, replyCount: m._count?.replies || 0})) || [])

        api.post(`/dms/${conversationId}/read`).catch(console.error)
      } catch (err) {
        console.error("Failed to load DM:", err)
      } finally {
        setLoading(false)
        setTimeout(scrollToBottom, 100)
      }
    }

    fetchDMData()
  }, [conversationId, currentUser])

  React.useEffect(() => {
    if (!conversationId) return

    const socket = getSocket()
    socket.emit("join_dm", conversationId)
    
    const handleConnect = () => {
      socket.emit("join_dm", conversationId)
    }
    socket.on("connect", handleConnect)
    
    const handleNewDM = (newMsg: any) => {
      if (newMsg.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some(m => m.id === newMsg.id)) return prev;

          // If sender has the optimistic message matching localId, replace it
          if (newMsg.localId && prev.some(m => m.id === newMsg.localId)) {
            return prev.map(m => m.id === newMsg.localId ? { ...newMsg, replyCount: 0 } : m);
          }

          // Otherwise (recipient side or non-optimistic), append the new message
          return [...prev, { ...newMsg, replyCount: 0 }];
        })
        setTimeout(scrollToBottom, 100)
      }
    }

    const handleMessageUpdated = (updatedMsg: any) => {
      if (updatedMsg.conversationId && updatedMsg.conversationId !== conversationId) return
      setMessages((prev) => prev.map(msg => msg.id === updatedMsg.id ? { ...updatedMsg, replyCount: msg.replyCount } : msg))
    }

    const handleMessageDeleted = ({ id, conversationId: msgConvId }: { id: string, conversationId?: string }) => {
      if (msgConvId && msgConvId !== conversationId) return
      setMessages((prev) => prev.filter(msg => msg.id !== id))
    }

    const handleTypingStart = (data: { userId: string, name: string, roomId: string }) => {
      if (data.roomId === conversationId && data.userId !== currentUser?.id) {
        setTypingUser(data.name)
        setTimeout(scrollToBottom, 100)
      }
    }

    const handleTypingStop = (data: { userId: string, name: string, roomId: string }) => {
      if (data.roomId === conversationId && data.userId !== currentUser?.id) {
        setTypingUser(null)
      }
    }

    const handleReactionAdded = (payload: any) => {
      if (payload.conversationId && payload.conversationId !== conversationId) return
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
      if (payload.conversationId && payload.conversationId !== conversationId) return
      setMessages(prev => prev.map(msg => {
        if (msg.id === payload.messageId) {
          const reactions = msg.reactions || []
          return { ...msg, reactions: reactions.filter((r: any) => r.id !== payload.reactionId) }
        }
        return msg
      }))
    }

    const handleReceiveReply = (replyMsg: any) => {
      if (replyMsg.conversationId && replyMsg.conversationId !== conversationId) return
      setMessages(prev => prev.map(msg => {
        if (msg.id === replyMsg.parentId) {
          return { ...msg, replyCount: (msg.replyCount || 0) + 1 }
        }
        return msg
      }))
    }

    socket.on("receive_dm", handleNewDM)
    socket.on("message_updated", handleMessageUpdated)
    socket.on("message_deleted", handleMessageDeleted)
    socket.on("typing_start", handleTypingStart)
    socket.on("typing_stop", handleTypingStop)
    socket.on("reaction_added", handleReactionAdded)
    socket.on("reaction_removed", handleReactionRemoved)
    socket.on("receive_reply", handleReceiveReply)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("receive_dm", handleNewDM)
      socket.off("message_updated", handleMessageUpdated)
      socket.off("message_deleted", handleMessageDeleted)
      socket.off("typing_start", handleTypingStart)
      socket.off("typing_stop", handleTypingStop)
      socket.off("reaction_added", handleReactionAdded)
      socket.off("reaction_removed", handleReactionRemoved)
      socket.off("receive_reply", handleReceiveReply)
      socket.emit("leave_dm", conversationId)
    }
  }, [conversationId, currentUser])

  const handleSendMessage = async (content: string, file?: File) => {
    if (!conversationId || !currentUser) return

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
        socket.emit("send_dm", { 
          conversationId, 
          content,
          localId: tempId,
          file: {
            buffer,
            name: file.name,
            type: file.type
          }
        })
      } else {
        socket.emit("send_dm", { conversationId, content, localId: tempId })
      }
    } catch (err) {
      console.error("Failed to send message", err)
    }
  }

  const handleTyping = (isTyping: boolean) => {
    if (!conversationId) return
    const socket = getSocket()
    socket.emit(isTyping ? "typing_start" : "typing_stop", {
      roomId: conversationId,
      roomType: "dm"
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    )
  }

  const userName = otherUser?.name || "Unknown User"

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="flex shrink-0 h-[60px] items-center justify-between border-b border-border px-5 bg-background/95 backdrop-blur-xl z-10 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            {otherUser?.avatar ? (
              <img src={otherUser.avatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-sm font-semibold text-foreground">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            {otherUser?.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground leading-tight">{userName}</h2>
            {otherUser?.designation && (
              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[200px]">{otherUser.designation}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
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
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-2">
            <div className="space-y-4">
              <div className="flex flex-col items-start gap-4 pb-12 mt-12 mb-4 px-2">
                {otherUser?.avatar ? (
                  <img 
                    src={otherUser.avatar} 
                    alt={userName}
                    className="w-20 h-20 rounded-full object-cover shadow-sm ring-1 ring-border" 
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center text-3xl font-bold text-primary ring-1 ring-primary/20 shadow-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-bold text-foreground leading-tight tracking-tight">{userName}</h1>
                  {otherUser?.designation && (
                    <span className="text-[15px] text-muted-foreground font-medium">{otherUser.designation}</span>
                  )}
                </div>
                <p className="text-[15px] text-muted-foreground mt-1 max-w-2xl font-medium">
                  This conversation is just between <strong className="text-foreground">@{userName}</strong> and you. Check out their profile to learn more about them.
                </p>
                <button className="text-[13px] h-8 mt-2 shadow-sm font-semibold rounded-md border border-border bg-background hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-foreground px-3 transition-colors">
                  View Profile
                </button>
              </div>

              {messages.length === 0 ? null : (
                messages.map((msg, index) => {
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
                })
              )}
              {typingUser && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground italic px-2 py-1">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  {typingUser} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="w-full shrink-0 bg-background px-6 pb-6 pt-2">
            <ChatInput 
              placeholder={`Message ${userName}`} 
              onSendMessage={handleSendMessage} 
              onTyping={handleTyping}
            />
          </div>
        </div>

        {activeThread && (
          <ThreadSidebar 
            thread={activeThread} 
            onClose={() => setActiveThread(null)} 
            conversationId={conversationId} 
          />
        )}

        {showPinned && !activeThread && (
          <PinnedSidebar 
            messages={messages} 
            onClose={() => setShowPinned(false)} 
          />
        )}
      </div>
    </div>
  )
}
