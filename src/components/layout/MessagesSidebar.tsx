"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Hash, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStore } from "@/store/useStore"
import { CreateChannelModal } from "@/components/modals/CreateChannelModal"

export function MessagesSidebar() {
  const pathname = usePathname()
  const channels = useStore((state) => state.channels)
  const dms = useStore((state) => state.dms)
  
  const [isCreateChannelOpen, setIsCreateChannelOpen] = React.useState(false)

  const navItemClass = (isActive: boolean) => cn(
    "flex items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 text-[13.5px] transition-all duration-200 mx-3 outline-none group cursor-pointer",
    isActive 
      ? "bg-white dark:bg-white/[0.06] text-foreground font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.04] dark:ring-white/[0.05]" 
      : "text-muted-foreground font-medium hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-foreground"
  )

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar flex flex-col h-full overflow-y-auto">
      <div className="p-4 pt-5">
        <h2 className="font-semibold text-[17px] tracking-tight px-1">Messages</h2>
      </div>
      
      <div className="py-2 flex-1">
        <div className="px-5 mb-2 flex items-center justify-between group/header cursor-default">
          <span className="text-[12px] font-semibold text-muted-foreground tracking-tight uppercase tracking-wider">Channels</span>
          <button 
            onClick={() => setIsCreateChannelOpen(true)}
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover/header:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 p-1 rounded-md transition-all duration-200"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="space-y-[2px]">
          {channels.map((channel: any) => (
            <Link key={channel.id} href={`/channel/${channel.name.replace('#', '')}`} className={navItemClass(pathname === `/channel/${channel.name.replace('#', '')}`)}>
              <Hash size={16} className={cn("shrink-0 transition-opacity", pathname === `/channel/${channel.name.replace('#', '')}` ? "opacity-100 text-primary" : "opacity-60 group-hover:opacity-100")} />
              <span className="truncate flex-1 tracking-tight">{channel.name}</span>
              {channel.unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[20px] text-center shadow-sm">
                  {channel.unreadCount}
                </span>
              )}
            </Link>
          ))}
          {channels.length === 0 && (
            <div className="px-5 text-[13px] text-muted-foreground tracking-tight">No channels</div>
          )}
        </div>

        <div className="px-5 mt-8 mb-2 text-[12px] font-semibold text-muted-foreground tracking-tight uppercase tracking-wider">
          Direct Messages
        </div>
        <div className="space-y-[2px]">
          {dms.map((dm: any) => (
            <Link key={dm.id} href={`/dm/${dm.id}`} className={navItemClass(pathname === `/dm/${dm.id}`)}>
              <div className="relative shrink-0">
                {dm.avatar ? (
                  <img src={dm.avatar} alt={dm.name} className="h-5 w-5 rounded-full object-cover grayscale opacity-90 transition-all duration-200 group-hover:grayscale-0 group-hover:opacity-100" />
                ) : (
                  <div className="h-5 w-5 rounded-full bg-black/10 dark:bg-white/10 text-foreground flex items-center justify-center text-[10px] font-semibold">
                    {dm.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {dm.isOnline && (
                  <div className="absolute -bottom-[2px] -right-[2px] h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-secondary" />
                )}
              </div>
              <span className="truncate flex-1 tracking-tight">{dm.name}</span>
              {dm.unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[20px] text-center shadow-sm">
                  {dm.unreadCount}
                </span>
              )}
            </Link>
          ))}
          {dms.length === 0 && (
            <div className="px-5 text-[13px] text-muted-foreground tracking-tight">No messages</div>
          )}
        </div>
      </div>
      
      <CreateChannelModal 
        isOpen={isCreateChannelOpen} 
        onClose={() => setIsCreateChannelOpen(false)} 
      />

    </aside>
  )
}
