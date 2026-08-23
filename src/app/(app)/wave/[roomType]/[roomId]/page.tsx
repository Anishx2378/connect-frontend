"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { getSocket, connectSocket } from '@/lib/socket'
import { Mic, MicOff, PhoneOff, Settings, Users, Video, Monitor, UserPlus, X, Search } from 'lucide-react'
import api from '@/lib/api'

// A small functional component to render the video stream safely
const VideoParticipant = ({ stream, isLocal }: { stream: MediaStream, isLocal?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])
  
  return (
    <video 
      ref={videoRef} 
      autoPlay 
      playsInline 
      muted={isLocal} 
      className="w-full h-full object-cover rounded-3xl"
    />
  )
}

export default function WavePage() {
  const params = useParams()
  const router = useRouter()
  
  const roomType = params.roomType as 'channel' | 'dm'
  const roomId = params.roomId as string
  
  const { user, setUser, isWaveMuted, setIsWaveMuted, waveParticipants, setWaveParticipants, setWaveRoomState } = useStore()
  
  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const makingOfferRefs = useRef<Record<string, boolean>>({})
  const ignoreOfferRefs = useRef<Record<string, boolean>>({})
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const audioContainerRef = useRef<HTMLDivElement>(null)

  const [roomName, setRoomName] = useState<string>('Wave')
  const [loading, setLoading] = useState(true)

  // Screen Sharing State
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null)
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Record<string, MediaStream>>({})

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [allUsers, setAllUsers] = useState<any[]>([])

  // Fetch user if missing (since new tab has fresh state)
  useEffect(() => {
    if (!user) {
      api.get('/auth/me').then(res => {
        setUser(res.data.data)
      }).catch(err => console.error("Failed to fetch user", err))
    }
  }, [user, setUser])

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        if (roomType === 'channel') {
          const res = await api.get(`/channels`)
          const channel = res.data.data.find((c: any) => c.id === roomId)
          if (channel) setRoomName(`#${channel.name}`)
        } else {
          const res = await api.get(`/dms`)
          const dm = res.data.data.find((d: any) => d.id === roomId)
          if (dm) setRoomName(dm.name)
        }
      } catch (err) {
        console.error("Failed to fetch room details", err)
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [roomId, roomType])

  const createPeerConnection = (peerId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    
    peersRef.current[peerId] = pc
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }
    
    // Add screen share track if active
    if (localScreenStream) {
      const videoTrack = localScreenStream.getVideoTracks()[0]
      if (videoTrack) {
        pc.addTrack(videoTrack, localScreenStream)
      }
    }
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket()
        socket.emit('wave_signal', { targetUserId: peerId, signal: event.candidate, roomId, roomType })
      }
    }
    
    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRefs.current[peerId] = true
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        const socket = getSocket()
        socket.emit('wave_signal', { targetUserId: peerId, signal: pc.localDescription, roomId, roomType })
      } catch (err) {
        console.error("Renegotiation error", err)
      } finally {
        makingOfferRefs.current[peerId] = false
      }
    }
    
    pc.ontrack = (event) => {
      const stream = event.streams[0]
      if (event.track.kind === 'audio') {
        if (!audioRefs.current[peerId]) {
          const audio = document.createElement('audio')
          audio.autoplay = true
          audio.srcObject = stream
          if (audioContainerRef.current) {
            audioContainerRef.current.appendChild(audio)
          }
          audioRefs.current[peerId] = audio
        }
      } else if (event.track.kind === 'video') {
        setRemoteVideoStreams(prev => ({ ...prev, [peerId]: stream }))
        
        event.track.onended = () => {
          setRemoteVideoStreams(prev => {
            const copy = { ...prev }
            delete copy[peerId]
            return copy
          })
        }
      }
    }
    
    return pc
  }

  const removePeerConnection = (peerId: string) => {
    if (peersRef.current[peerId]) {
      peersRef.current[peerId].close()
      delete peersRef.current[peerId]
    }
    if (audioRefs.current[peerId]) {
      audioRefs.current[peerId].remove()
      delete audioRefs.current[peerId]
    }
    setRemoteVideoStreams(prev => {
      const copy = { ...prev }
      delete copy[peerId]
      return copy
    })
  }

  // Socket setup
  useEffect(() => {
    if (!user) return
    connectSocket()
    const socket = getSocket()
    
    const handleWaveUpdated = (data: { roomId: string, roomType: string, participants: any[] }) => {
      setWaveRoomState(data.roomId, data.participants)
      
      if (roomId === data.roomId) {
        setWaveParticipants(data.participants)
        
        data.participants.forEach(p => {
          if (p.id !== user.id && !peersRef.current[p.id]) {
            createPeerConnection(p.id, user.id > p.id)
          }
        })
        
        const participantIds = new Set(data.participants.map(p => p.id))
        Object.keys(peersRef.current).forEach(peerId => {
          if (!participantIds.has(peerId)) {
            removePeerConnection(peerId)
          }
        })
      }
    }
    
    const handleWaveSignal = async ({ senderId, signal }: { senderId: string, signal: any }) => {
      let pc = peersRef.current[senderId]
      const polite = user && senderId ? user.id < senderId : true
      
      try {
        if (signal.type === 'offer' || signal.type === 'answer') {
          if (!pc) pc = createPeerConnection(senderId, !polite)
          
          const offerCollision = signal.type === 'offer' && (makingOfferRefs.current[senderId] || pc.signalingState !== 'stable')
          
          ignoreOfferRefs.current[senderId] = !polite && offerCollision
          if (ignoreOfferRefs.current[senderId]) {
            return
          }

          await pc.setRemoteDescription(new RTCSessionDescription(signal))
          if (signal.type === 'offer') {
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket.emit('wave_signal', { targetUserId: senderId, signal: pc.localDescription, roomId, roomType })
          }
        } else if (signal.candidate) {
          if (!pc) pc = createPeerConnection(senderId, !polite)
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal))
          } catch (err) {
            if (!ignoreOfferRefs.current[senderId]) {
              console.error("Ice Candidate Error", err)
            }
          }
        }
      } catch (err) {
        console.error("WebRTC Error", err)
      }
    }
    
    socket.on('wave_updated', handleWaveUpdated)
    socket.on('wave_signal', handleWaveSignal)
    
    return () => {
      socket.off('wave_updated', handleWaveUpdated)
      socket.off('wave_signal', handleWaveSignal)
    }
  }, [roomId, roomType, user, setWaveParticipants, setWaveRoomState])

  // Media setup
  useEffect(() => {
    const socket = getSocket()
    
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        localStreamRef.current = stream
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isWaveMuted
        })
        socket.emit('join_wave', { roomId, roomType })
      } catch (err) {
        console.error("Error accessing microphone", err)
        socket.emit('join_wave', { roomId, roomType })
      }
    }

    startLocalStream()

    return () => {
      socket.emit('leave_wave', { roomId, roomType })
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
      }
      Object.keys(peersRef.current).forEach(peerId => {
        removePeerConnection(peerId)
      })
      setWaveParticipants([])
    }
  }, [roomId, roomType])
  
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isWaveMuted
      })
    }
  }, [isWaveMuted])

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      setLocalScreenStream(stream)
      setIsScreenSharing(true)

      const videoTrack = stream.getVideoTracks()[0]
      Object.values(peersRef.current).forEach(pc => {
        pc.addTrack(videoTrack, stream)
      })

      videoTrack.onended = () => {
        stopScreenShare()
      }
    } catch (err) {
      console.error("Error sharing screen", err)
    }
  }

  const stopScreenShare = () => {
    if (localScreenStream) {
      localScreenStream.getTracks().forEach(track => track.stop())
      setLocalScreenStream(null)
      setIsScreenSharing(false)
      
      Object.values(peersRef.current).forEach(pc => {
        const senders = pc.getSenders()
        const videoSender = senders.find(s => s.track && s.track.kind === 'video')
        if (videoSender) {
          pc.removeTrack(videoSender)
        }
      })
    }
  }

  const handleLeave = () => {
    window.close()
    // If window.close fails (e.g., if not opened by script), navigate back
    router.push(roomType === 'channel' ? `/channel/${roomId}` : `/dm/${roomId}`)
  }

  const handleOpenInviteModal = async () => {
    try {
      const res = await api.get('/users')
      setAllUsers(res.data.data)
      setIsInviteModalOpen(true)
    } catch (err) {
      console.error("Failed to fetch users", err)
    }
  }

  const handleInviteUser = (targetUserId: string) => {
    const socket = getSocket()
    socket.emit("invite_to_wave", { 
      targetUserIds: [targetUserId], 
      roomId, 
      roomType,
      roomName: roomName
    })
    setIsInviteModalOpen(false)
  }

  const activeScreenShareUserId = isScreenSharing ? user?.id : Object.keys(remoteVideoStreams)[0]
  const activeStream = isScreenSharing ? localScreenStream : (activeScreenShareUserId ? remoteVideoStreams[activeScreenShareUserId] : null)

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#0B0B0D] text-white overflow-hidden font-sans antialiased relative">
      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />
      
      {/* Background ambient effect - Extremely subtle */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a1f] via-[#0B0B0D] to-[#0B0B0D] pointer-events-none" />

      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 h-16 z-10 border-b border-white/[0.04] bg-white/[0.01] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[13px] font-medium text-white/80 tracking-wide">Wave active</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="text-[14px] font-semibold tracking-tight text-white/90">
            {loading ? 'Connecting...' : `Coderaxo Connect / ${roomName}`}
          </h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors cursor-pointer">
          <Users size={14} className="text-white/60" />
          <span className="text-[13px] font-medium text-white/80">{waveParticipants.length}</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 w-full p-4 md:p-8 flex items-center justify-center z-10 overflow-hidden">
        {activeStream ? (
          <div className="w-full h-full flex gap-4 max-w-[1600px] mx-auto">
            {/* Screen Share Focus View */}
            <div className="flex-1 rounded-[20px] overflow-hidden bg-[#101012] relative border border-white/[0.06] flex items-center justify-center shadow-2xl">
              <VideoParticipant stream={activeStream} isLocal={isScreenSharing} />
              <div className="absolute bottom-4 left-4 bg-[#1a1a1f]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 shadow-lg flex items-center gap-2">
                <Monitor size={14} className="text-indigo-400" />
                {isScreenSharing ? 'You are sharing your screen' : `${waveParticipants.find(p => p.id === activeScreenShareUserId)?.name || 'Someone'} is sharing`}
              </div>
            </div>
            
            {/* Participant Sidebar */}
            <div className="w-[280px] flex flex-col gap-3 overflow-y-auto pr-1 pb-4 snap-y custom-scrollbar">
              {/* Current User */}
              {user && (
                <div className={`relative rounded-[16px] bg-[#141416] overflow-hidden flex flex-col items-center justify-center shadow-md border ${isWaveMuted ? 'border-white/[0.04]' : 'border-indigo-500/30'} group h-40 shrink-0 snap-start transition-all duration-300`}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="You" className="w-14 h-14 rounded-full object-cover mb-2" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#1e1e24] flex items-center justify-center text-lg font-medium text-white/80 mb-2">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[13px] font-medium text-white/90">You</span>
                  {isWaveMuted && (
                    <div className="absolute top-3 right-3 bg-red-500/10 rounded-full p-1 border border-red-500/20">
                      <MicOff size={12} className="text-red-400" />
                    </div>
                  )}
                </div>
              )}

              {/* Remote Participants */}
              {waveParticipants.filter(p => p.id !== user?.id).map((p) => (
                <div key={p.id} className="relative rounded-[16px] bg-[#141416] overflow-hidden flex flex-col items-center justify-center shadow-md border border-white/[0.04] group h-40 shrink-0 snap-start">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-14 h-14 rounded-full object-cover mb-2" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#1e1e24] flex items-center justify-center text-lg font-medium text-white/80 mb-2">
                      {p.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[13px] font-medium text-white/90">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`w-full max-w-5xl h-full flex items-center justify-center gap-4 flex-wrap content-center`}>
            {/* Current User */}
            {user && (
              <div className={`relative rounded-[20px] bg-[#141416] overflow-hidden flex flex-col items-center justify-center shadow-lg border ${!isWaveMuted ? 'border-indigo-500/30' : 'border-white/[0.06]'} transition-all duration-300 w-full max-w-[320px] aspect-[4/3]`}>
                {user.avatar ? (
                  <img src={user.avatar} alt="You" className="w-20 h-20 rounded-full object-cover shadow-sm mb-3" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#1e1e24] flex items-center justify-center text-2xl font-medium text-white/80 mb-3 shadow-sm border border-white/[0.04]">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[14px] font-medium text-white/90">You</span>
                {isWaveMuted && (
                  <div className="absolute top-4 right-4 bg-red-500/10 rounded-full p-1.5 border border-red-500/20">
                    <MicOff size={14} className="text-red-400" />
                  </div>
                )}
              </div>
            )}

            {/* Remote Participants */}
            {waveParticipants.filter(p => p.id !== user?.id).map((p) => (
              <div key={p.id} className="relative rounded-[20px] bg-[#141416] overflow-hidden flex flex-col items-center justify-center shadow-lg border border-white/[0.06] w-full max-w-[320px] aspect-[4/3]">
                {p.avatar ? (
                  <img src={p.avatar} alt={p.name} className="w-20 h-20 rounded-full object-cover shadow-sm mb-3" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#1e1e24] flex items-center justify-center text-2xl font-medium text-white/80 mb-3 shadow-sm border border-white/[0.04]">
                    {p.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-[14px] font-medium text-white/90">{p.name}</span>
              </div>
            ))}

            {/* Empty State / Waiting */}
            {waveParticipants.length <= 1 && (
              <div className="w-full max-w-[320px] aspect-[4/3] rounded-[20px] border border-dashed border-white/[0.1] flex flex-col items-center justify-center text-white/40 space-y-3 bg-white/[0.01]">
                <Users size={24} className="opacity-50" />
                <p className="text-[14px] font-medium tracking-tight">Waiting for others...</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Control Dock */}
      <footer className="w-full px-6 py-6 flex items-center justify-center z-20 absolute bottom-0 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 bg-[#1a1a1f]/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/[0.08] shadow-2xl">
          <button 
            onClick={() => setIsWaveMuted(!isWaveMuted)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${isWaveMuted ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-transparent text-white/80 hover:bg-white/[0.06] hover:text-white'}`}
            title={isWaveMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isWaveMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          
          <button 
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ${isScreenSharing ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-transparent text-white/80 hover:bg-white/[0.06] hover:text-white'}`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
          >
            <Monitor size={20} />
          </button>
          
          <button 
            onClick={handleOpenInviteModal}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-transparent text-white/80 hover:bg-white/[0.06] hover:text-white transition-all duration-200"
            title="Invite People"
          >
            <UserPlus size={20} />
          </button>

          <button 
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-transparent text-white/80 hover:bg-white/[0.06] hover:text-white transition-all duration-200"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button 
            onClick={handleLeave}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-sm"
            title="Leave Wave"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </footer>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#141416] w-full max-w-md rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
              <h2 className="text-base font-semibold text-white/90">Invite to Wave</h2>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 border-b border-white/[0.04]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {allUsers
                .filter(u => u.id !== user?.id && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(u => {
                  const isInWave = waveParticipants.some(p => p.id === u.id);
                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#1e1e24] flex items-center justify-center text-sm font-medium text-white/80 border border-white/[0.04]">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-white/90">{u.name}</span>
                      </div>
                      <button
                        onClick={() => handleInviteUser(u.id)}
                        disabled={isInWave}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isInWave ? 'bg-white/[0.03] text-white/30 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                      >
                        {isInWave ? 'Joined' : 'Invite'}
                      </button>
                    </div>
                  )
                })}
              
              {allUsers.filter(u => u.id !== user?.id && u.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="p-8 text-center text-sm text-white/40">
                  No users found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
