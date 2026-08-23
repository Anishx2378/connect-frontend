"use client"

import * as React from "react"
import { useTeamStore } from "@/store/useTeamStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Folder, CheckCircle, Clock, Calendar as CalendarIcon, MessageSquare } from "lucide-react"

export default function TeamOverviewPage() {
  const { getActiveTeam } = useTeamStore()
  const team = getActiveTeam()

  if (!team) return null

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Main Stats Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Users className="h-6 w-6 text-brand-500 mb-2" />
                <p className="text-sm text-slate-500 font-medium">Active Members</p>
                <p className="text-2xl font-bold text-slate-900">{team._count?.members || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Folder className="h-6 w-6 text-brand-500 mb-2" />
                <p className="text-sm text-slate-500 font-medium">Projects</p>
                <p className="text-2xl font-bold text-slate-900">{team._count?.projects || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <CheckCircle className="h-6 w-6 text-emerald-500 mb-2" />
                <p className="text-sm text-slate-500 font-medium">Tasks Done</p>
                <p className="text-2xl font-bold text-slate-900">42</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Clock className="h-6 w-6 text-amber-500 mb-2" />
                <p className="text-sm text-slate-500 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-slate-900">18</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-slate-500">
                <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                No recent activity.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <Card className="shadow-sm border-slate-200 bg-brand-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-brand-800 uppercase tracking-wider flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 bg-white rounded-lg flex flex-col items-center justify-center text-brand-600 font-bold border border-brand-200 shrink-0 shadow-sm">
                    <span className="text-[10px] leading-none uppercase">Jul</span>
                    <span className="text-sm leading-none mt-1">12</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Q3 Planning Session</p>
                    <p className="text-xs text-slate-500">10:00 AM - 11:30 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Pinned Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 border-l-2 border-brand-500 pl-3 py-1">
                Welcome to the new {team.name} workspace! Please review the updated documentation in the Resources tab.
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
