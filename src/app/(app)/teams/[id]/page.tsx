"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function TeamDetailsRedirectPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params.id as string

  useEffect(() => {
    if (teamId) {
      router.replace(`/teams/${teamId}/overview`)
    }
  }, [teamId, router])

  return null
}
