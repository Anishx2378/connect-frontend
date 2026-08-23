"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Building2, Plus, Loader2, ArrowRight } from "lucide-react"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"
import Cookies from "js-cookie"
import { connectSocket } from "@/lib/socket"

export default function WorkspaceSelectPage() {
  const router = useRouter()
  const user = useStore(state => state.user)
  const workspaces = useStore(state => state.workspaces)
  const setWorkspaces = useStore(state => state.setWorkspaces)
  const setActiveWorkspaceId = useStore(state => state.setActiveWorkspaceId)
  
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  
  const [wsName, setWsName] = React.useState("")
  const [wsSlug, setWsSlug] = React.useState("")

  React.useEffect(() => {
    if (!user) {
      api.get("/auth/me").then(res => {
        const fetchedUser = res.data.data
        useStore.getState().setUser(fetchedUser)
        useStore.getState().setWorkspaces(fetchedUser.workspaces || [])

        // Restore activeWorkspaceId from cookie if it exists
        const savedWorkspaceId = Cookies.get("activeWorkspaceId")
        if (savedWorkspaceId) {
          useStore.getState().setActiveWorkspaceId(savedWorkspaceId)
        }
      }).catch(err => {
        console.error("Not authenticated", err)
        Cookies.remove('token')
        router.push("/login")
      })
      return
    }
    // Auto-select if exactly one workspace
    if (workspaces.length === 1 && !isCreating) {
      handleSelectWorkspace(workspaces[0].id)
    }
  }, [user, workspaces, isCreating, router])

  const handleSelectWorkspace = (workspaceId: string) => {
    Cookies.set("activeWorkspaceId", workspaceId, { expires: 7, path: '/' })
    setActiveWorkspaceId(workspaceId)
    connectSocket()
    router.push("/")
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await api.post("/workspaces", { name: wsName, slug: wsSlug })
      const newWs = res.data.data
      setWorkspaces([...workspaces, newWs])
      handleSelectWorkspace(newWs.id)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create workspace.")
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F7] p-4 sm:p-8 selection:bg-brand-500/30">
      <div className="w-full max-w-[540px]">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 mb-1">
            Welcome to Coderaxo Connect
          </h1>
          <p className="text-[15px] font-medium text-slate-500">
            Choose a workspace to join, or create a new one.
          </p>
        </div>

        {isCreating ? (
          <div className="rounded-[2rem] bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.04]">
            <div className="mb-8 text-center">
              <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">Create a Workspace</h2>
              <p className="text-[15px] font-medium text-slate-500 mt-1">Set up a new space for your team to collaborate.</p>
            </div>
            
            <form onSubmit={handleCreateWorkspace} className="space-y-6">
              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-500/20">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold text-slate-600 px-1" htmlFor="name">
                  Workspace Name
                </label>
                <Input 
                  id="name" 
                  placeholder="e.g. Acme Corp" 
                  required 
                  value={wsName}
                  onChange={(e) => {
                    setWsName(e.target.value)
                    if (!wsSlug || wsSlug === wsName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')) {
                       setWsSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
                    }
                  }}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-[15px] placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setIsCreating(false)} 
                  disabled={loading}
                  className="h-12 flex-1 rounded-xl border-slate-200 text-[15px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="h-12 flex-1 rounded-xl bg-brand-500 text-[15px] font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Create
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.06em] text-slate-400/90 px-2 pb-1">
              Your Workspaces
            </h2>
            
            {workspaces.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.04]">
                <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-[17px] font-semibold tracking-tight text-slate-900 mb-1">No workspaces yet</h3>
                <p className="text-[14px] font-medium text-slate-500">You haven't joined any workspaces.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {workspaces.map((ws, i) => (
                  <button 
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws.id)}
                    className="flex w-full items-center p-4 bg-white rounded-[1.25rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] ring-1 ring-black/[0.04] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:ring-black/[0.08] transition-all text-left group"
                  >
                    <div className={`h-[52px] w-[52px] shrink-0 rounded-[1.1rem] flex items-center justify-center font-bold text-[18px] mr-5 overflow-hidden ${i % 2 === 0 ? 'bg-[#E5E5FA] text-[#5C5CE6]' : 'bg-slate-900 text-white'}`}>
                      {ws.logo ? (
                        <img src={ws.logo} alt={ws.name} className="h-full w-full object-cover" />
                      ) : (
                        ws.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[16px] tracking-tight text-slate-900 truncate mb-0.5">{ws.name}</h3>
                      <p className="text-[13px] font-medium text-slate-500 truncate">Workspace</p>
                    </div>
                    <div className="pl-4">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors">
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button 
              className="mt-5 flex w-full items-center justify-center h-12 rounded-[1.25rem] border border-dashed border-slate-300/80 bg-transparent text-[13px] font-semibold text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50/50 transition-all"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={16} strokeWidth={2.5} className="mr-2 opacity-70" />
              Create a new workspace
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
