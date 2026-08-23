"use client"

import * as React from "react"
import { X } from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import { ChatInput } from "./ChatInput"
import { getSocket } from "@/lib/socket"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"

interface ThreadSidebarProps {
  thread: any
  onClose: () => void
  channelId?: string
  conversationId?: string
}

export function ThreadSidebar({ thread, onClose, channelId, conversationId }: ThreadSidebarProps) {
  const [localThread, setLocalThread] = React.useState(thread)
  const [replies, setReplies] = React.useState<any[]>([])
  const { user } = useStore()

  React.useEffect(() => {
    setLocalThread(thread)
  }, [thread])

  React.useEffect(() => {
    // Fetch replies
    api.get(`/messages/${thread.id}/replies`)
      .then(res => setReplies(res.data.data))
      .catch(console.error)
  }, [thread.id])

  React.useEffect(() => {
    const socket = getSocket()
    
    const handleReceiveReply = (msg: any) => {
      if (msg.parentId === thread.id) {
        setReplies(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        })
      }
    }

    const handleReactionAdded = (payload: any) => {
      if (payload.messageId === thread.id) {
        setLocalThread((prev: any) => {
          const reactions = prev.reactions || []
          if (!reactions.some((r: any) => r.id === payload.reaction.id)) {
            return { ...prev, reactions: [...reactions, payload.reaction] }
          }
          return prev
        })
      } else {
        setReplies(prev => prev.map(msg => {
          if (msg.id === payload.messageId) {
            const reactions = msg.reactions || []
            if (!reactions.some((r: any) => r.id === payload.reaction.id)) {
              return { ...msg, reactions: [...reactions, payload.reaction] }
            }
          }
          return msg
        }))
      }
    }

    const handleReactionRemoved = (payload: any) => {
      if (payload.messageId === thread.id) {
        setLocalThread((prev: any) => {
          const reactions = prev.reactions || []
          return { ...prev, reactions: reactions.filter((r: any) => r.id !== payload.reactionId) }
        })
      } else {
        setReplies(prev => prev.map(msg => {
          if (msg.id === payload.messageId) {
            const reactions = msg.reactions || []
            return { ...msg, reactions: reactions.filter((r: any) => r.id !== payload.reactionId) }
          }
          return msg
        }))
      }
    }

    socket.on("receive_reply", handleReceiveReply)
    socket.on("reaction_added", handleReactionAdded)
    socket.on("reaction_removed", handleReactionRemoved)
    
    return () => {
      socket.off("receive_reply", handleReceiveReply)
      socket.off("reaction_added", handleReactionAdded)
      socket.off("reaction_removed", handleReactionRemoved)
    }
  }, [thread.id])

  const handleSendReply = (content: string, file?: File) => {
    const socket = getSocket()
    
    if (channelId) {
      socket.emit("send_channel_message", {
        content,
        channelId,
        parentId: thread.id,
        file: file ? { name: file.name, type: file.type, buffer: file } : null,
      })
    } else if (conversationId) {
      socket.emit("send_dm", {
        content,
        conversationId,
        parentId: thread.id,
        file: file ? { name: file.name, type: file.type, buffer: file } : null,
      })
    }
  }

  return (
    <div className="w-[400px] flex flex-col border-l border-slate-200 bg-slate-50 shrink-0">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white shrink-0">
        <h3 className="font-semibold text-slate-800">Thread</h3>
        <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 bg-white mb-2">
          <MessageBubble message={{
            id: localThread.id,
            userId: localThread.sender?.id || localThread.userId,
            userName: localThread.sender?.name || localThread.userName || "Unknown",
            avatar: localThread.sender?.avatar || localThread.avatar || `https://ui-avatars.com/api/?name=${localThread.sender?.name || 'Unknown'}&background=random`,
            content: localThread.content,
            timestamp: new Date(localThread.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: localThread.createdAt,
            attachments: localThread.attachments,
            linkPreviews: localThread.linkPreviews,
            reactions: localThread.reactions,
            replyCount: 0,
            isPinned: localThread.isPinned,
            pinnedBy: localThread.pinnedBy
          }} />
        </div>
        
        <div className="flex items-center gap-4 px-4 my-4">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        <div className="p-4 flex flex-col gap-1">
          {replies.map((reply, index) => {
            const isGrouped = index > 0 &&
              replies[index - 1].sender?.id === (reply.sender?.id || reply.userId) &&
              new Date(reply.createdAt).getTime() - new Date(replies[index - 1].createdAt).getTime() < 5 * 60 * 1000;

            return (
              <MessageBubble key={reply.id} compact={isGrouped} message={{
                id: reply.id,
                userId: reply.sender?.id || reply.userId,
                userName: reply.sender?.name || reply.userName || "Unknown",
                avatar: reply.sender?.avatar || reply.avatar || `https://ui-avatars.com/api/?name=${reply.sender?.name || 'Unknown'}&background=random`,
                content: reply.content,
                timestamp: new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: reply.createdAt,
                attachments: reply.attachments,
                linkPreviews: reply.linkPreviews,
                reactions: reply.reactions,
                replyCount: 0,
                isPinned: reply.isPinned,
                pinnedBy: reply.pinnedBy
              }} />
            )
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 bg-white border-t border-slate-200">
        <ChatInput placeholder="Reply to thread..." onSendMessage={handleSendReply} />
      </div>
    </div>
  )
}
