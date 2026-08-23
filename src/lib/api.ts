import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Attach workspace ID if selected
  const workspaceId = Cookies.get('activeWorkspaceId')
  if (workspaceId) {
    config.headers['x-workspace-id'] = workspaceId
  }

  return config
})

export default api
