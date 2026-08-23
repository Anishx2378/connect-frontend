"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const firstName = (document.getElementById("firstName") as HTMLInputElement).value
    const lastName = (document.getElementById("lastName") as HTMLInputElement).value
    const email = (document.getElementById("email") as HTMLInputElement).value
    const password = (document.getElementById("password") as HTMLInputElement).value
    const confirmPassword = (document.getElementById("confirmPassword") as HTMLInputElement).value

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    try {
      await api.post("/auth/signup", { firstName, lastName, email, password })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-brand-100">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-400 text-2xl font-bold text-white shadow-sm">
            C
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Create an account</CardTitle>
          <CardDescription>Join the Coderaxo Connect platform</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="p-4 bg-green-50 text-green-800 rounded-lg text-center space-y-2 border border-green-200">
              <p className="font-semibold text-lg">Check your email</p>
              <p className="text-sm">We've sent a verification link to your email address. Please verify your email to log in.</p>
            </div>
          ) : (
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
                <label className="text-sm font-medium text-slate-700" htmlFor="email">Email address</label>
                <Input id="email" type="email" placeholder="name@company.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
                <Input id="password" type="password" placeholder="••••••••" required minLength={6} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="confirmPassword">Confirm Password</label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" className="w-full bg-brand-500 hover:bg-brand-600" size="lg" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Create Account
              </Button>
            </form>
          )}
        </CardContent>
        {!success && (
          <CardFooter className="flex flex-col pt-2 pb-6">
            <div className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                Sign in
              </Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
