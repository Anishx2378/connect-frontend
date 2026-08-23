"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import api from "@/lib/api"

import { Suspense } from "react"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = React.useState("")

  React.useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("No verification token found in the URL.")
      return
    }

    const verify = async () => {
      try {
        await api.post("/auth/verify-email", { token })
        setStatus("success")
      } catch (err: any) {
        setStatus("error")
        setErrorMessage(err.response?.data?.message || "Failed to verify email. The link may be invalid or expired.")
      }
    }

    verify()
  }, [token])

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
            {status === "loading" && "Verifying Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Please wait while we verify your email address..."}
            {status === "success" && "Your email has been successfully verified. You can now log in to your account."}
            {status === "error" && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && (
            <Button className="w-full bg-brand-500 hover:bg-brand-600" size="lg" onClick={() => router.push("/login")}>
              Proceed to Login
            </Button>
          )}
          {status === "error" && (
            <Button className="w-full bg-slate-900 hover:bg-slate-800" size="lg" onClick={() => router.push("/login")}>
              Back to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-brand-500" size={32} /></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
