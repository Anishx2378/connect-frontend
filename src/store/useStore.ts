import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  designation?: string
  avatar: string | null
  // The global app no longer tracks a single role per user.
  // Instead, the user has a role within a specific workspace.
  // We keep 'role' optional here if needed for legacy components temporarily,
  // but it should ideally be read from the workspace membership.
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST'
}

interface Workspace {
  id: string
  name: string
  logo: string | null
  role?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST'
}

interface Channel {
  id: string
  name: string
  isPrivate?: boolean
  unreadCount?: number
}

interface DM {
  id: string
  name: string
  avatar?: string | null
  isOnline?: boolean
  unreadCount?: number
}

export interface WaveParticipant {
  id: string
  name: string
  avatar: string | null
}

export interface WaveState {
  roomId: string
  roomType: 'channel' | 'dm'
}

interface AppState {
  user: User | null
  setUser: (user: User | null) => void
  workspaces: Workspace[]
  setWorkspaces: (workspaces: Workspace[]) => void
  activeWorkspaceId: string | null
  setActiveWorkspaceId: (id: string | null) => void
  activeChannelId: string | null
  setActiveChannelId: (id: string | null) => void
  channels: Channel[]
  setChannels: (channels: Channel[] | ((prev: Channel[]) => Channel[])) => void
  dms: DM[]
  setDms: (dms: DM[] | ((prev: DM[]) => DM[])) => void
  
  // Wave (Audio Huddle) State
  activeWave: WaveState | null
  setActiveWave: (wave: WaveState | null) => void
  waveParticipants: WaveParticipant[]
  setWaveParticipants: (participants: WaveParticipant[]) => void
  isWaveMuted: boolean
  setIsWaveMuted: (muted: boolean) => void
  waveRoomState: Record<string, WaveParticipant[]>
  setWaveRoomState: (roomId: string, participants: WaveParticipant[]) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  workspaces: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  activeWorkspaceId: null,
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  activeChannelId: null,
  setActiveChannelId: (id) => set({ activeChannelId: id }),
  channels: [],
  setChannels: (channels) => set((state) => ({ channels: typeof channels === 'function' ? channels(state.channels) : channels })),
  dms: [],
  setDms: (dms) => set((state) => ({ dms: typeof dms === 'function' ? dms(state.dms) : dms })),
  
  activeWave: null,
  setActiveWave: (wave) => set({ activeWave: wave }),
  waveParticipants: [],
  setWaveParticipants: (participants) => set({ waveParticipants: participants }),
  isWaveMuted: false,
  setIsWaveMuted: (muted) => set({ isWaveMuted: muted }),
  waveRoomState: {},
  setWaveRoomState: (roomId, participants) => set((state) => ({ 
    waveRoomState: { ...state.waveRoomState, [roomId]: participants } 
  })),
}))
