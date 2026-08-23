"use client"

import * as React from "react"
import { Menu, Bell, HelpCircle, Headphones } from "lucide-react"
import { GlobalSearch } from "./GlobalSearch"
import { useStore } from "@/store/useStore"
import { getSocket } from "@/lib/socket"
import { usePathname } from "next/navigation"

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const { activeWave, setActiveWave, waveRoomState } = useStore()
  
  // Determine current room from URL
  let currentRoomId = null
  let currentRoomType: 'channel' | 'dm' | null = null
  
  if (pathname.startsWith('/channel/')) {
    currentRoomId = pathname.replace('/channel/', '')
    currentRoomType = 'channel'
  } else if (pathname.startsWith('/dm/')) {
    currentRoomId = pathname.replace('/dm/', '')
    currentRoomType = 'dm'
  }
  
  const isWaveActiveHere = currentRoomId && waveRoomState[currentRoomId] && waveRoomState[currentRoomId].length > 0
  const isMeInWave = activeWave?.roomId === currentRoomId

  const handleWaveToggle = () => {
    if (!currentRoomId || !currentRoomType) return
    
    if (isMeInWave) {
      // Leave wave
      const socket = getSocket()
      socket.emit('leave_wave', activeWave)
      setActiveWave(null)
    } else {
      // Join/Start wave
      setActiveWave({ roomId: currentRoomId, roomType: currentRoomType })
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 shrink-0 font-sans antialiased">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="text-muted-foreground hover:text-foreground md:hidden transition-colors"
        >
          <Menu size={20} />
        </button>
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 hidden sm:block">
          <HelpCircle size={18} />
        </button>
        <button className="relative text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background"></span>
        </button>
      </div>
    </header>
  )
}
