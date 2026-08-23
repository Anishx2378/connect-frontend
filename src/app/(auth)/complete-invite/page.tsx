"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"
import Cookies from "js-cookie"
import { connectSocket } from "@/lib/socket"

import { Suspense } from "react"

function CompleteInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const setUser = useStore(state => state.setUser)
  const setWorkspaces = useStore(state => state.setWorkspaces)

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const firstName = (document.getElementById("firstName") as HTMLInputElement).value
    const lastName = (document.getElementById("lastName") as HTMLInputElement).value
    const password = (document.getElementById("password") as HTMLInputElement).value

    try {
      const res = await api.post("/auth/complete-invite", { token, firstName, lastName, password })
      
      Cookies.set("token", res.data.data.token, { expires: 7, path: '/' })
      const user = res.data.data.user
      setUser(user)
      setWorkspaces(user.workspaces || [])
      
      router.push("/workspace-select")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to complete setup. The invitation may be invalid.")
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-brand-100 text-center p-6">
           <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Link</h2>
           <p className="text-slate-600">No invitation token was found in the URL.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-brand-100">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-400 text-2xl font-bold text-white shadow-sm">
            C
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Complete Setup</CardTitle>
          <CardDescription>Join the workspace by completing your account.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="firstName">First Name</label>
                  <Input id="firstName" type="text" placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="lastName">Last Name</label>
                  <Input id="lastName" type="text" placeholder="Doe" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">Set a Password</label>
                <Input id="password" type="password" placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white mt-2" size="lg" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Join Workspace
              </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CompleteInvitePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-brand-500" size={32} /></div>}>
      <CompleteInviteContent />
    </Suspense>
  )
}
