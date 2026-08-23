"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import logoImg from "../../../../public/logo.jpeg"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import api from "@/lib/api"
import Cookies from "js-cookie"
import { useStore } from "@/store/useStore"
import { connectSocket } from "@/lib/socket"

export default function LoginPage() {
  const router = useRouter()
  const setUser = useStore((state) => state.setUser)
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const email = (document.getElementById("email") as HTMLInputElement).value
    const password = (document.getElementById("password") as HTMLInputElement).value

    try {
      const res = await api.post("/auth/login", { email, password })
      
      // Save token
      Cookies.set("token", res.data.data.token, { expires: 7, path: '/' })
      
      // The API returns { token, user, workspaces } as siblings
      const user = res.data.data.user
      const workspaces = res.data.data.workspaces || []
      setUser(user)
      
      const setWorkspaces = useStore.getState().setWorkspaces
      setWorkspaces(workspaces)
      
      // Do NOT connect socket yet — wait until a workspace is selected
      // connectSocket()

      router.push("/workspace-select")
      router.refresh()
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] p-4 sm:p-8 selection:bg-brand-500/30">
      <div className="w-full max-w-[420px] rounded-[2rem] bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/[0.04]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-brand-500 text-4xl font-semibold text-white shadow-sm ring-1 ring-black/10">
            C
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 mb-1">
            Sign In
          </h1>
          <p className="text-[15px] font-medium text-slate-500">
            Welcome back to Coderaxo Connect
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-500/20">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-600 px-1" htmlFor="email">
                Email
              </label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                required 
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-[15px] placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500 transition-all" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-600 px-1" htmlFor="password">
                Password
              </label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-[15px] placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-brand-500/20 focus-visible:border-brand-500 transition-all" 
              />
            </div>
          </div>

          <div className="pt-2">
            <Button 
              disabled={loading} 
              className="h-12 w-full rounded-xl bg-brand-500 text-[15px] font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors" 
              type="submit"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-[14px] text-slate-500 font-medium">
              Don't have an account?{" "}
            </span>
            <Link 
              href="/register" 
              className="text-[14px] font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
