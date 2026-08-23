"use client"

import * as React from "react"
import { useTeamStore } from "@/store/useTeamStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash, Save } from "lucide-react"

export default function TeamSettingsPage() {
  const { getActiveTeam } = useTeamStore()
  const team = getActiveTeam()

  if (!team) return null

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      
      <div>
        <h2 className="text-xl font-bold text-slate-900">Team Settings</h2>
        <p className="text-sm text-slate-500">Manage team preferences and configuration</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Team Name</label>
            <Input defaultValue={team.name} className="max-w-md" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Team Handle</label>
            <div className="flex max-w-md">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm">
                @
              </span>
              <Input defaultValue={team.handle} className="rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Textarea defaultValue={team.description} className="max-w-md" rows={3} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Visibility</label>
            <Select defaultValue={team.visibility || "Private"}>
              <SelectTrigger className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Private">Private (Invite only)</SelectItem>
                <SelectItem value="Public">Public (Anyone in workspace can join)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button className="bg-brand-600 hover:bg-brand-700">
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="bg-red-50 rounded-xl border border-red-100 overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600/80 mb-4">Deleting this team will remove all associated data, channels, and member associations. This action cannot be undone.</p>
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700 shadow-sm">
            <Trash className="h-4 w-4 mr-2" /> Delete Team
          </Button>
        </div>
      </div>

    </div>
  )
}
