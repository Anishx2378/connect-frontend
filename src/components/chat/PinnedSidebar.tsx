"use client"

import * as React from "react"
import { X, Pin } from "lucide-react"
import { MessageBubble } from "./MessageBubble"

interface PinnedSidebarProps {
  messages: any[]
  onClose: () => void
  onMessageClick?: (messageId: string) => void
}

export function PinnedSidebar({ messages, onClose, onMessageClick }: PinnedSidebarProps) {
  const pinnedMessages = messages.filter(m => m.isPinned).sort((a, b) => new Date(b.pinnedAt || b.createdAt).getTime() - new Date(a.pinnedAt || a.createdAt).getTime());

  return (
    <div className="w-[400px] flex flex-col border-l border-slate-200 bg-slate-50 shrink-0">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-2 text-slate-800">
          <Pin size={18} className="fill-slate-800" />
          <h3 className="font-semibold">Pinned Messages</h3>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {pinnedMessages.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-500">
            <Pin size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-slate-700 mb-1">No pinned messages</p>
            <p className="text-xs">Important messages pinned to this conversation will appear here.</p>
          </div>
        ) : (
          pinnedMessages.map((msg) => (
            <div key={msg.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative group">
              <div 
                className="absolute inset-0 bg-brand-50/0 group-hover:bg-brand-50/50 cursor-pointer transition-colors z-10 pointer-events-none"
                onClick={() => onMessageClick && onMessageClick(msg.id)}
              />
              <div className="p-3">
                <MessageBubble 
                  message={{
                    id: msg.id,
                    userId: msg.sender?.id || msg.userId,
                    userName: msg.sender?.name || msg.userName || "Unknown",
                    avatar: msg.sender?.avatar || msg.avatar || `https://ui-avatars.com/api/?name=${msg.sender?.name || 'Unknown'}&background=random`,
                    content: msg.content,
                    timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: msg.createdAt,
                    attachments: msg.attachments,
                    linkPreviews: msg.linkPreviews,
                    reactions: msg.reactions,
                    replyCount: msg.replyCount || msg._count?.replies || 0,
                    isPinned: msg.isPinned,
                    pinnedBy: msg.pinnedBy
                  }} 
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
