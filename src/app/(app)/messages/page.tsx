"use client"

import { useStore } from "@/store/useStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2, MessageSquare } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

export default function MessagesPage() {
  const router = useRouter()
  const channels = useStore((state) => state.channels)
  const dms = useStore((state) => state.dms)

  useEffect(() => {
    // If there are channels, redirect to the first one (typically general)
    if (channels.length > 0) {
      const generalChannel = channels.find(c => c.name.replace('#', '') === 'general')
      if (generalChannel) {
        router.replace(`/channel/general`)
      } else {
        router.replace(`/channel/${channels[0].name.replace('#', '')}`)
      }
    } else if (dms.length > 0) {
      router.replace(`/dm/${dms[0].id}`)
    }
  }, [channels, dms, router])

  return (
    <div className="flex h-full items-center justify-center bg-background">
      {channels.length === 0 && dms.length === 0 ? (
        <EmptyState 
          icon={MessageSquare} 
          title="No messages yet" 
          description="Start a conversation by creating a channel or sending a direct message."
        />
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading messages...</p>
        </div>
      )}
    </div>
  )
}
