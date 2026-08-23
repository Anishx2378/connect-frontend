"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Plus, X, Loader2, UploadCloud, Save } from "lucide-react"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"
import { toast } from "react-hot-toast"

export default function AdminPage() {
  const [users, setUsers] = React.useState<any[]>([])
  const { workspaces, setWorkspaces, activeWorkspaceId } = useStore()
  const workspace = workspaces.find(w => w.id === activeWorkspaceId)
  const [workspaceName, setWorkspaceName] = React.useState("")
  const [workspaceLogo, setWorkspaceLogo] = React.useState<File | null>(null)
  const [workspaceLogoPreview, setWorkspaceLogoPreview] = React.useState<string | null>(null)
  const [updatingWorkspace, setUpdatingWorkspace] = React.useState(false)

  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [message, setMessage] = React.useState("")

  const [editingUser, setEditingUser] = React.useState<any | null>(null)
  const [editRole, setEditRole] = React.useState("")
  const [updatingRole, setUpdatingRole] = React.useState(false)

  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    fullName: "",
    email: "",
    role: "MEMBER"
  })

  const fetchUsersAndWorkspace = async () => {
    try {
      const [usersRes, wsRes] = await Promise.all([
        api.get("/users"),
        api.get("/workspaces")
      ])
      setUsers(usersRes.data.data)
      // Since /workspaces returns the list, let's just find the active one
      const activeWs = wsRes.data.data.find((w: any) => w.id === activeWorkspaceId) || wsRes.data.data[0]
      setWorkspaces(wsRes.data.data)
      if (activeWs) {
        setWorkspaceName(activeWs.name)
        if (activeWs.logo) {
          setWorkspaceLogoPreview(activeWs.logo)
        }
      }
    } catch (err) {
      console.error("Failed to load admin data", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (activeWorkspaceId) {
      fetchUsersAndWorkspace()
    }
  }, [activeWorkspaceId])

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingWorkspace(true)
    try {
      const formData = new FormData()
      formData.append("name", workspaceName)
      if (workspaceLogo) {
        formData.append("logo", workspaceLogo)
      }
      
      const res = await api.patch("/workspaces/current", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      
      const updatedWorkspace = res.data.data
      setWorkspaces(workspaces.map(w => w.id === updatedWorkspace.id ? updatedWorkspace : w))
      setWorkspaceLogoPreview(updatedWorkspace.logo)
      toast.success("Workspace settings updated!")
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update workspace")
    } finally {
      setUpdatingWorkspace(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage("")
    try {
      await api.post("/users/invite", formData)
      setMessage("Invite sent successfully!")
      setTimeout(() => {
        setShowModal(false)
        setMessage("")
        setFormData({ firstName: "", lastName: "", fullName: "", email: "", role: "MEMBER" })
      }, 2000)
    } catch (err: any) {
      setMessage(err.response?.data?.error || "Failed to send invite")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setUpdatingRole(true)
    try {
      await api.patch(`/users/${editingUser.id}/role`, { role: editRole })
      toast.success("User role updated successfully")
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: editRole } : u))
      setEditingUser(null)
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update role")
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleRemoveUser = async () => {
    if (!editingUser) return
    if (!confirm("Are you sure you want to remove this user from the workspace?")) return
    
    try {
      await api.delete(`/users/${editingUser.id}`)
      toast.success("User removed from workspace")
      setUsers(users.filter(u => u.id !== editingUser.id))
      setEditingUser(null)
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to remove user")
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage team members and roles.</p>
        </div>
        <Button className="gap-2 bg-brand-600 hover:bg-brand-700 text-white" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add User
        </Button>
      </div>

      <Card className="border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-[15px] font-semibold text-slate-900">Workspace Settings</h2>
          <p className="text-[13px] text-slate-500">Configure your workspace name and logo.</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleUpdateWorkspace} className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Workspace Name</label>
                <Input 
                  required 
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  placeholder="Acme Corp" 
                />
              </div>
              <Button type="submit" disabled={updatingWorkspace} className="mt-2 bg-brand-600 hover:bg-brand-700 text-white">
                {updatingWorkspace ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                Save Workspace
              </Button>
            </div>
            
            <div className="flex-shrink-0 flex flex-col items-center gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50 w-full md:w-auto">
              <div className="h-20 w-20 rounded-xl bg-brand-100 flex items-center justify-center shrink-0 text-brand-700 font-bold text-2xl overflow-hidden relative shadow-sm border border-slate-200">
                {workspaceLogoPreview ? (
                  <img src={workspaceLogoPreview} alt="Workspace Logo" className="h-full w-full object-cover" />
                ) : (
                  workspaceName ? workspaceName.substring(0, 1).toUpperCase() : "W"
                )}
              </div>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/gif" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setWorkspaceLogo(file)
                      setWorkspaceLogoPreview(URL.createObjectURL(file))
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <UploadCloud size={16} /> Change Logo
                </Button>
              </div>
              <p className="text-[11px] text-slate-500">JPG, GIF or PNG. 2MB max.</p>
            </div>
          </form>
        </div>
      </Card>

      <Card className="border-slate-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map(user => (
                  <tr key={user.id} className="bg-white hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <Avatar size="sm" fallback={user.name} />
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-brand-500 hover:text-brand-700"
                        onClick={() => {
                          setEditingUser(user)
                          setEditRole(user.role)
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Invite Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <Card className="w-full max-w-md shadow-xl border-brand-100 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Invite New User</h2>
              <p className="text-sm text-slate-500 mb-6">Send an invitation email to a new team member.</p>
              
              <form onSubmit={handleInvite} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">First Name</label>
                    <Input 
                      required 
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      placeholder="John" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                    <Input 
                      required 
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      placeholder="Doe" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <Input 
                    required 
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <Input 
                    required 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                
                {message && (
                  <div className={`p-3 rounded text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message}
                  </div>
                )}

                <div className="pt-2">
                  <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white" disabled={submitting}>
                    {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    Send Invitation
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <Card className="w-full max-w-md shadow-xl border-brand-100 relative">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Edit User</h2>
              <p className="text-sm text-slate-500 mb-6">Modify role for {editingUser.name}</p>
              
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
                
                <div className="pt-4 flex flex-col gap-2">
                  <Button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white" disabled={updatingRole || editingUser.role === editRole}>
                    {updatingRole ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleRemoveUser}>
                    Remove from Workspace
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
