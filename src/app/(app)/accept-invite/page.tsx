"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"
import Cookies from "js-cookie"

import { Suspense } from "react"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const user = useStore((state) => state.user)
  const setWorkspaces = useStore((state) => state.setWorkspaces)
  const workspaces = useStore((state) => state.workspaces)

  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = React.useState("")
  const [hasTried, setHasTried] = React.useState(false)

  React.useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("No invitation token found.")
      return
    }

    if (!user) {
      if (!Cookies.get("token")) {
         router.push(`/complete-invite?token=${token}`)
         return
      } else {
         api.get("/auth/me").then(res => {
           const fetchedUser = res.data.data
           useStore.getState().setUser(fetchedUser)
           useStore.getState().setWorkspaces(fetchedUser.workspaces || [])
         }).catch(err => {
           Cookies.remove('token')
           router.push(`/complete-invite?token=${token}`)
         })
         return
      }
    }

    if (hasTried) return

    const accept = async () => {
      setHasTried(true)
      try {
        const res = await api.post("/auth/accept-invite", { token })
        setStatus("success")
        
        // Optionally refresh workspaces in global store if we want to immediately select it
        try {
           const wsRes = await api.get("/workspaces")
           setWorkspaces(wsRes.data.data)
        } catch(e) {}

      } catch (err: any) {
        setStatus("error")
        setErrorMessage(err.response?.data?.message || "Failed to accept invitation. It may have expired.")
      }
    }

    accept()
  }, [token, user, hasTried, router, setWorkspaces])

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-brand-100 text-center">
        <CardHeader className="space-y-4 pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
            {status === "loading" && <Loader2 className="animate-spin text-brand-500" size={32} />}
            {status === "success" && <CheckCircle2 className="text-green-500" size={32} />}
            {status === "error" && <XCircle className="text-red-500" size={32} />}
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            {status === "loading" && "Joining Workspace..."}
            {status === "success" && "Welcome to the Workspace!"}
            {status === "error" && "Invitation Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we accept your invitation..."}
            {status === "success" && "You have successfully joined the workspace."}
            {status === "error" && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && (
            <Button className="w-full bg-brand-500 hover:bg-brand-600" size="lg" onClick={() => router.push("/workspace-select")}>
              Go to Workspace
            </Button>
          )}
          {status === "error" && (
            <Button className="w-full bg-slate-900 hover:bg-slate-800" size="lg" onClick={() => router.push("/")}>
              Go to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-brand-500" size={32} /></div>}>
      <AcceptInviteContent />
    </Suspense>
  )
}
