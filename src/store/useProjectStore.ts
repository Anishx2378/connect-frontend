import { create } from 'zustand'
import api from '@/lib/api'

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Planning'
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type TaskStatus = 'Backlog' | 'To Do' | 'In Progress' | 'Review' | 'Testing' | 'Completed'

export interface ProjectMember {
  id: string
  name: string
  avatar: string
  role: string
  department?: string
  isOnline?: boolean
}

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  type: string
  issueNumber: number
  issueKey: string
  status: TaskStatus
  priority: ProjectPriority
  assignees: ProjectMember[]
  reporterId?: string | null
  reporter?: ProjectMember | null
  dueDate?: string | null
  labels: string[]
  checklist: { id: string; text: string; completed: boolean }[]
  attachments: number
  comments: number
  project?: any
  createdAt?: string
  updatedAt?: string
}

export interface Project {
  id: string
  name: string
  key: string
  description: string
  client: string
  category: string
  priority: ProjectPriority
  status: ProjectStatus
  startDate: string
  deadline: string
  manager: ProjectMember
  members: ProjectMember[]
  tags: string[]
  color: string
  logo?: string
  progress: number
  createdAt: string
  updatedAt: string
  isFavorite?: boolean
  isArchived?: boolean
}

interface ProjectStore {
  projects: Project[]
  tasks: Task[]
  selectedProjectId: string | null
  
  // Actions
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, newStatus: TaskStatus) => void
  
  selectProject: (id: string) => void
  
  fetchTasks: (projectId: string) => Promise<void>
  createTaskAPI: (data: Partial<Task>) => Promise<Task | undefined>
  updateTaskAPI: (taskId: string, data: Partial<Task>) => Promise<void>
}

// Mock Data
const mockMembers: ProjectMember[] = [
  { id: 'm1', name: 'Priya Nair', avatar: 'https://i.pravatar.cc/150?u=priya', role: 'Product Lead', department: 'Product' },
  { id: 'm2', name: 'Alex Chen', avatar: 'https://i.pravatar.cc/150?u=alex', role: 'Frontend Engineer', department: 'Engineering' },
  { id: 'm3', name: 'Sarah Jones', avatar: 'https://i.pravatar.cc/150?u=sarah', role: 'Backend Engineer', department: 'Engineering' },
  { id: 'm4', name: 'David Kim', avatar: 'https://i.pravatar.cc/150?u=david', role: 'UX Designer', department: 'Design' },
]

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Atlas Mobile Redesign',
    key: 'ATLAS',
    description: 'Complete overhaul of the Atlas mobile application for better user engagement.',
    client: 'Atlas Corp',
    category: 'Mobile App',
    priority: 'High',
    status: 'Active',
    startDate: '2026-06-01',
    deadline: '2026-08-15',
    manager: mockMembers[0],
    members: mockMembers,
    tags: ['design', 'mobile', 'react-native'],
    color: '#8b5cf6',
    progress: 72,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-07-04T12:00:00Z',
    isFavorite: true,
  },
  {
    id: 'p2',
    name: 'Billing System Migration',
    key: 'BILL',
    description: 'Migrating legacy invoices and billing schedules to the new schema.',
    client: 'Internal',
    category: 'Backend',
    priority: 'Urgent',
    status: 'Active',
    startDate: '2026-07-01',
    deadline: '2026-07-30',
    manager: mockMembers[2],
    members: [mockMembers[2], mockMembers[1]],
    tags: ['database', 'migration'],
    color: '#ef4444',
    progress: 45,
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-04T15:30:00Z',
  },
]

const mockTasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Audit color contrast across dark mode surfaces',
    type: 'Task',
    issueNumber: 1,
    issueKey: 'ATLAS-1',
    status: 'Backlog',
    priority: 'Low',
    assignees: [mockMembers[3]],
    labels: ['a11y', 'design'],
    checklist: [],
    attachments: 0,
    comments: 2,
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Add testimonial section to landing page',
    type: 'Task',
    issueNumber: 2,
    issueKey: 'ATLAS-2',
    status: 'To Do',
    priority: 'High',
    assignees: [mockMembers[1]],
    labels: ['landing'],
    checklist: [{ id: 'c1', text: 'Design review', completed: true }, { id: 'c2', text: 'Implementation', completed: false }],
    attachments: 1,
    comments: 4,
  },
  {
    id: 't3',
    projectId: 'p1',
    title: 'Design landing page hero + floating cards',
    type: 'Task',
    issueNumber: 3,
    issueKey: 'ATLAS-3',
    status: 'In Progress',
    priority: 'High',
    assignees: [mockMembers[3]],
    labels: ['design'],
    checklist: [{ id: 'c3', text: 'Hero image', completed: true }, { id: 'c4', text: 'Cards layout', completed: true }, { id: 'c5', text: 'Responsive check', completed: false }],
    attachments: 2,
    comments: 3,
  },
  {
    id: 't4',
    projectId: 'p1',
    title: 'Client review for initial mockups',
    type: 'Task',
    issueNumber: 4,
    issueKey: 'ATLAS-4',
    status: 'Review',
    priority: 'Urgent',
    assignees: [mockMembers[2]],
    labels: ['billing'],
    checklist: [],
    attachments: 0,
    comments: 7,
  },
  {
    id: 't5',
    projectId: 'p2',
    title: 'Fix API response timeout on pricing widget',
    type: 'Bug',
    issueNumber: 1,
    issueKey: 'BILL-1',
    status: 'In Progress',
    priority: 'Urgent',
    assignees: [mockMembers[2], mockMembers[1]],
    labels: ['bug'],
    checklist: [],
    attachments: 0,
    comments: 5,
  },
]

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  tasks: [],
  selectedProjectId: null,

  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, data) => set((state) => ({
    projects: state.projects.map((p) => p.id === id ? { ...p, ...data } : p)
  })),
  deleteProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id)
  })),

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, data) => set((state) => ({
    tasks: state.tasks.map((t) => t.id === id ? { ...t, ...data } : t)
  })),
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter((t) => t.id !== id)
  })),
  moveTask: (id, newStatus) => set((state) => ({
    tasks: state.tasks.map((t) => t.id === id ? { ...t, status: newStatus } : t)
  })),

  selectProject: (id: string) => set({ selectedProjectId: id }),

  fetchTasks: async (projectId) => {
    try {
      const res = await api.get(`/tasks?projectId=${projectId}`)
      set({ tasks: res.data.data })
    } catch (err) { console.error(err) }
  },
  createTaskAPI: async (data) => {
    try {
      const res = await api.post(`/tasks`, data)
      set((state) => ({ tasks: [...state.tasks, res.data.data] }))
      return res.data.data
    } catch (err) { console.error(err) }
  },
  updateTaskAPI: async (taskId, data) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, data)
      set((state) => ({
        tasks: state.tasks.map((t) => t.id === taskId ? res.data.data : t)
      }))
    } catch (err) { console.error(err) }
  },
}))
