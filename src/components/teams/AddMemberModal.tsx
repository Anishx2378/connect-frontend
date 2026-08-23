import * as React from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

interface User {
  id: string
  name: string
  email: string
  avatar: string | null
}

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  teamId: string
  existingMemberIds: string[]
}

export function AddMemberModal({ isOpen, onClose, teamId, existingMemberIds }: AddMemberModalProps) {
  const [users, setUsers] = React.useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [fetchingUsers, setFetchingUsers] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        setFetchingUsers(true)
        try {
          const res = await api.get("/users")
          // Filter out users who are already in the team
          const availableUsers = res.data.data.filter((u: User) => !existingMemberIds.includes(u.id))
          setUsers(availableUsers)
        } catch (err) {
          console.error("Failed to fetch users", err)
        } finally {
          setFetchingUsers(false)
        }
      }
      fetchUsers()
    } else {
      setSelectedUserIds([])
      setError("")
    }
  }, [isOpen, existingMemberIds])

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (selectedUserIds.length === 0) {
      setError("Please select at least one user to add.")
      return
    }

    setLoading(true)
    try {
      await api.post(`/teams/${teamId}/members`, {
        memberIds: selectedUserIds
      })
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add members")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Add Team Members</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Available Users</label>
            <div className="border border-slate-200 rounded-lg h-64 overflow-y-auto custom-scrollbar p-1 space-y-1">
              {fetchingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-slate-400" size={20} />
                </div>
              ) : users.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-12">All workspace users are already in this team.</p>
              ) : (
                users.map(user => (
                  <div 
                    key={user.id} 
                    onClick={() => toggleUser(user.id)}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${selectedUserIds.includes(user.id) ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50 border border-transparent'}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-brand-700">
                          {user.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${selectedUserIds.includes(user.id) ? 'text-brand-900' : 'text-slate-900'}`}>{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedUserIds.includes(user.id) ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300'}`}>
                      {selectedUserIds.includes(user.id) && <X size={12} className="rotate-45" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white" disabled={loading || users.length === 0}>
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              Add Selected ({selectedUserIds.length})
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
