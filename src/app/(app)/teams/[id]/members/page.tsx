"use client"

import * as React from "react"
import { useTeamStore } from "@/store/useTeamStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Mail, UserPlus, Settings2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function TeamMembersPage() {
  const { getActiveTeam } = useTeamStore()
  const team = getActiveTeam()
  const [searchQuery, setSearchQuery] = React.useState("")

  if (!team) return null

  const filteredMembers = team.members?.filter(m => 
    m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search members by name or role..." 
            className="pl-10 h-10 bg-white border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-slate-600">
            <Settings2 className="h-4 w-4 mr-2" /> Manage Roles
          </Button>
          <Button className="bg-brand-600 hover:bg-brand-700">
            <UserPlus className="h-4 w-4 mr-2" /> Invite Members
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMembers.map((member) => (
          <div key={member.userId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="relative">
                {member.user.avatar ? (
                  <img src={member.user.avatar} alt={member.user.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg ring-2 ring-slate-100">
                    {member.user.name.charAt(0)}
                  </div>
                )}
                {member.user.isOnline ? (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                ) : (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-slate-300 ring-2 ring-white" />
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-slate-100 hover:text-slate-900 h-8 w-8 text-slate-400">
                  <Settings2 className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Message</DropdownMenuItem>
                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                  <DropdownMenuItem>Change Role</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Remove from Team</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <h3 className="font-semibold text-slate-900 truncate">{member.user.name}</h3>
            <p className="text-sm text-slate-500 truncate">{member.user.designation || "Team Member"}</p>
            
            <div className="mt-4 flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                {member.role}
              </span>
              {team.lead?.id === member.userId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-700">
                  Lead
                </span>
              )}
            </div>
          </div>
        ))}
        {filteredMembers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-200">
            No members found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
