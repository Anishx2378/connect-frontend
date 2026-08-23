"use client"

import React, { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { getSocket } from '@/lib/socket'

export function WaveManager() {
  const { activeWave, user, isWaveMuted, setWaveParticipants, setWaveRoomState } = useStore()
  
  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Record<string, RTCPeerConnection>>({})
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  
  // Container to render audio elements
  const audioContainerRef = useRef<HTMLDivElement>(null)

  const createPeerConnection = (peerId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })
    
    peersRef.current[peerId] = pc
    
    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket()
        socket.emit('wave_signal', { targetUserId: peerId, signal: event.candidate, roomId: activeWave?.roomId, roomType: activeWave?.roomType })
      }
    }
    
    pc.ontrack = (event) => {
      // Create audio element for the remote stream
      if (!audioRefs.current[peerId]) {
        const audio = document.createElement('audio')
        audio.autoplay = true
        audio.srcObject = event.streams[0]
        if (audioContainerRef.current) {
          audioContainerRef.current.appendChild(audio)
        }
        audioRefs.current[peerId] = audio
      }
    }
    
    if (isInitiator) {
      pc.createOffer().then(offer => {
        return pc.setLocalDescription(offer)
      }).then(() => {
        const socket = getSocket()
        socket.emit('wave_signal', { targetUserId: peerId, signal: pc.localDescription, roomId: activeWave?.roomId, roomType: activeWave?.roomType })
      }).catch(err => {
        console.error("Error creating offer", err)
      })
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
  }

  useEffect(() => {
    const socket = getSocket()
    
    const handleWaveUpdated = (data: { roomId: string, roomType: string, participants: any[] }) => {
      setWaveRoomState(data.roomId, data.participants)
      
      // If this update is for our active wave
      if (activeWave && activeWave.roomId === data.roomId) {
        setWaveParticipants(data.participants)
        
        // Handle new peers
        data.participants.forEach(p => {
          if (p.id !== user?.id && !peersRef.current[p.id]) {
            // Polite peer logic to avoid glare: only initiate if our ID is greater
            createPeerConnection(p.id, user!.id > p.id)
          }
        })
        
        // Handle dropped peers
        const participantIds = new Set(data.participants.map(p => p.id))
        Object.keys(peersRef.current).forEach(peerId => {
          if (!participantIds.has(peerId)) {
            removePeerConnection(peerId)
          }
        })
      }
    }
    
    const handleWaveSignal = async ({ senderId, signal }: { senderId: string, signal: any }) => {
      if (!activeWave) return
      
      let pc = peersRef.current[senderId]
      
      try {
        if (signal.type === 'offer') {
          if (!pc) pc = createPeerConnection(senderId, false)
          await pc.setRemoteDescription(new RTCSessionDescription(signal))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.emit('wave_signal', { targetUserId: senderId, signal: pc.localDescription, roomId: activeWave.roomId, roomType: activeWave.roomType })
        } else if (signal.type === 'answer') {
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signal))
        } else if (signal.candidate) {
          if (!pc) pc = createPeerConnection(senderId, false)
          await pc.addIceCandidate(new RTCIceCandidate(signal))
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
  }, [activeWave, user, setWaveParticipants, setWaveRoomState])
  
  // Join / Leave logic
  useEffect(() => {
    const socket = getSocket()
    
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        localStreamRef.current = stream
        
        // Apply initial mute state
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isWaveMuted
        })
        
        socket.emit('join_wave', activeWave)
      } catch (err) {
        console.error("Error accessing microphone", err)
        // If they deny mic, they can still join as a listener
        socket.emit('join_wave', activeWave)
      }
    }

    const cleanupAllPeers = () => {
      Object.keys(peersRef.current).forEach(peerId => {
        removePeerConnection(peerId)
      })
    }

    const stopLocalStream = () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
      }
    }

    if (activeWave) {
      startLocalStream()
    } else {
      stopLocalStream()
      cleanupAllPeers()
    }
    
    return () => {
      // Don't auto-leave here on activeWave change because the else block handles it.
      // But if the component completely unmounts, clean up
      stopLocalStream()
      cleanupAllPeers()
    }
  }, [activeWave])
  
  // Handle mute toggles
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isWaveMuted
      })
    }
  }, [isWaveMuted])

  return (
    <div ref={audioContainerRef} className="hidden" aria-hidden="true" />
  )
}
