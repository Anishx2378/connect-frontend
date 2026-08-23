"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [name, setName] = React.useState("")
  const [handle, setHandle] = React.useState("")
  const [department, setDepartment] = React.useState("")
  const [visibility, setVisibility] = React.useState("Private")
  const [description, setDescription] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Team name is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      await api.post("/teams", { name, handle, description, department, visibility })
      setName("")
      setHandle("")
      setDepartment("")
      setVisibility("Private")
      setDescription("")
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create team")
    } finally {
      setLoading(false)
    }
  }

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setName("")
      setHandle("")
      setDepartment("")
      setVisibility("Private")
      setDescription("")
      setError("")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="name">
                Team Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                placeholder="e.g. Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="handle">
                Team Handle
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
                  @
                </span>
                <Input
                  id="handle"
                  className="rounded-l-none"
                  placeholder="engineering"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="department">
                Department
              </label>
              <Input
                id="department"
                placeholder="e.g. Product"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Visibility
              </label>
              <Select value={visibility} onValueChange={(val) => setVisibility(val || "")} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="description">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              placeholder="What is this team responsible for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand-500 hover:bg-brand-600" disabled={loading || !name.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
