"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"

interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateChannelModal({ isOpen, onClose }: CreateChannelModalProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isPrivate, setIsPrivate] = React.useState("false")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  
  const setChannels = useStore((state: any) => state.setChannels)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Channel name is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Clean up the name (lowercase, no spaces, optional prefix hash)
      const formattedName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '')
      const finalName = formattedName.startsWith('#') ? formattedName : `#${formattedName}`

      await api.post("/channels", { 
        name: finalName, 
        description, 
        isPrivate: isPrivate === "true" 
      })
      
      setName("")
      setDescription("")
      setIsPrivate("false")
      
      // Refresh channels in the global store
      try {
        const channelsRes = await api.get("/channels")
        setChannels(channelsRes.data.data)
      } catch (err) {
        console.error("Failed to refresh channels", err)
      }
      
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create channel")
    } finally {
      setLoading(false)
    }
  }

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setName("")
      setDescription("")
      setIsPrivate("false")
      setError("")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] font-sans antialiased rounded-2xl p-6 border-[#d2d2d7]/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] gap-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="tracking-tight text-[#1d1d1f] text-lg font-semibold">Create Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-[13px] rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#1d1d1f]" htmlFor="name">
              Channel Name <span className="text-red-500">*</span>
            </label>
            <div className="flex shadow-sm rounded-lg overflow-hidden border border-[#d2d2d7]/50 focus-within:ring-2 focus-within:ring-[#0071e3]/20 focus-within:border-[#0071e3] transition-all">
              <span className="inline-flex items-center justify-center w-10 bg-[#fbfbfd] text-[#86868b] text-[13px] border-r border-[#d2d2d7]/50">
                #
              </span>
              <Input
                id="name"
                className="flex-1 h-9 rounded-none border-0 text-[13px] focus-visible:ring-0 focus-visible:border-0 shadow-none px-3"
                placeholder="e.g. general, announcements"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#1d1d1f]">
              Privacy
            </label>
            <Select value={isPrivate} onValueChange={(val) => setIsPrivate(val as string)} disabled={loading}>
              <SelectTrigger className="w-full h-9 border-[#d2d2d7]/50 text-[13px] focus:ring-[#0071e3]/20 focus:border-[#0071e3] rounded-lg shadow-sm">
                <span>{isPrivate === "true" ? "Private — Invite only" : "Public — Anyone can join"}</span>
              </SelectTrigger>
              <SelectContent className="rounded-lg border-[#d2d2d7]/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-[392px]">
                <SelectItem value="false" className="text-[13px] py-2 pr-8 cursor-pointer">Public — Anyone can join</SelectItem>
                <SelectItem value="true" className="text-[13px] py-2 pr-8 cursor-pointer">Private — Invite only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[#1d1d1f]" htmlFor="description">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              className="border-[#d2d2d7]/50 text-[13px] focus-visible:ring-2 focus-visible:ring-[#0071e3]/20 focus-visible:border-[#0071e3] rounded-lg shadow-sm min-h-[80px] resize-none"
              placeholder="What is this channel for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <DialogFooter className="pt-4 border-t border-[#d2d2d7]/50 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="h-9 px-4 text-[13px] font-medium rounded-lg border-[#d2d2d7]/50 text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#0071e3] hover:bg-[#0077ED] text-[13px] rounded-lg text-white" 
              disabled={loading || !name.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Channel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
