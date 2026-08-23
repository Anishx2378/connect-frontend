import { create } from 'zustand'

export interface TeamMember {
  userId: string
  teamId: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string
    avatar?: string
    designation?: string
    isOnline: boolean
  }
}

export interface Team {
  id: string
  name: string
  handle?: string
  description?: string
  avatar?: string
  coverImage?: string
  colorTheme?: string
  department?: string
  visibility: string
  createdAt: string
  _count: {
    members: number
    projects: number
  }
  lead?: {
    id: string
    name: string
    avatar?: string
  }
  manager?: {
    id: string
    name: string
    avatar?: string
  }
  members?: TeamMember[]
  projects?: any[]
}

interface TeamState {
  teams: Team[]
  activeTeamId: string | null
  setTeams: (teams: Team[]) => void
  addTeam: (team: Team) => void
  updateTeam: (teamId: string, updates: Partial<Team>) => void
  removeTeam: (teamId: string) => void
  setActiveTeam: (teamId: string | null) => void
  getActiveTeam: () => Team | undefined
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  activeTeamId: null,
  setTeams: (teams) => set({ teams }),
  addTeam: (team) => set((state) => {
    const exists = state.teams.some(t => t.id === team.id)
    if (exists) {
      return { teams: state.teams.map(t => t.id === team.id ? { ...t, ...team } : t) }
    }
    return { teams: [...state.teams, team] }
  }),
  updateTeam: (teamId, updates) => set((state) => ({
    teams: state.teams.map(t => (t.id === teamId ? { ...t, ...updates } : t))
  })),
  removeTeam: (teamId) => set((state) => ({
    teams: state.teams.filter(t => t.id !== teamId),
    activeTeamId: state.activeTeamId === teamId ? null : state.activeTeamId
  })),
  setActiveTeam: (activeTeamId) => set({ activeTeamId }),
  getActiveTeam: () => {
    const { teams, activeTeamId } = get()
    return teams.find(t => t.id === activeTeamId)
  }
}))
