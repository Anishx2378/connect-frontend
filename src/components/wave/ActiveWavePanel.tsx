"use client"

import React from 'react'
import { useStore } from '@/store/useStore'
import { getSocket } from '@/lib/socket'
import { Mic, MicOff, PhoneOff } from 'lucide-react'

export function ActiveWavePanel() {
  const { activeWave, waveParticipants, isWaveMuted, setIsWaveMuted, setActiveWave, channels, dms } = useStore()

  if (!activeWave) return null

  const handleLeave = () => {
    const socket = getSocket()
    socket.emit('leave_wave', activeWave)
    setActiveWave(null)
  }

  const toggleMute = () => {
    setIsWaveMuted(!isWaveMuted)
  }

  // Get the name of the room we are in
  let roomName = 'Wave'
  if (activeWave.roomType === 'channel') {
    const c = channels.find(c => c.id === activeWave.roomId)
    if (c) roomName = `#${c.name}`
  } else {
    const dm = dms.find(d => d.id === activeWave.roomId)
    if (dm) roomName = dm.name
  }

  return (
    <div className="m-4 p-4 rounded-3xl bg-background/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-3 relative overflow-hidden group">
      
      {/* Subtle animated gradient background for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-50 pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-sm font-semibold text-foreground tracking-tight">
          Wave in {roomName}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-400/10 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 animate-pulse" />
          Active
        </span>
      </div>

      <div className="flex items-center relative z-10">
        <div className="flex -space-x-3 overflow-hidden p-1">
          {waveParticipants.map((p) => (
            <div key={p.id} className="relative inline-block h-10 w-10 rounded-full ring-[3px] ring-white dark:ring-gray-900 overflow-hidden bg-muted shadow-sm transition-transform hover:scale-110 hover:z-10">
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
                  {p.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          ))}
          {waveParticipants.length === 0 && (
            <span className="text-xs font-medium text-muted-foreground ml-2 py-2">Waiting for others...</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 relative z-10">
        <button
          onClick={toggleMute}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
            isWaveMuted 
              ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 shadow-sm' 
              : 'bg-background text-foreground border border-border hover:bg-muted shadow-sm'
          }`}
        >
          {isWaveMuted ? <MicOff size={16} /> : <Mic size={16} />}
          {isWaveMuted ? 'Muted' : 'Mic On'}
        </button>
        <button
          onClick={handleLeave}
          className="p-2.5 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
          title="Leave Wave"
        >
          <PhoneOff size={16} />
        </button>
      </div>
    </div>
  )
}
