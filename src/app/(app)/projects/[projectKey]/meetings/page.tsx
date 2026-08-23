"use client"

import React from 'react'
import { Video, Calendar, Clock, Plus, Users, Play } from 'lucide-react'

export default function ProjectMeetingsPage() {
  const upcomingMeetings = [
    { id: 1, title: 'Weekly Sync', date: 'Today', time: '2:00 PM - 3:00 PM', attendees: 4 },
    { id: 2, title: 'Design Review', date: 'Tomorrow', time: '10:00 AM - 11:30 AM', attendees: 3 },
  ]

  const pastMeetings = [
    { id: 3, title: 'Project Kickoff', date: 'Oct 20, 2026', duration: '1h 30m', hasRecording: true },
    { id: 4, title: 'Architecture Planning', date: 'Oct 22, 2026', duration: '2h 00m', hasRecording: true },
  ]

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-8 py-6 border-b border-border/60 bg-white shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Meetings</h1>
          <p className="text-sm text-muted-foreground">Schedule and review project meetings</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={16} />
          Schedule Meeting
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Upcoming */}
        <section>
          <h2 className="text-[14px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar size={16} /> Upcoming Meetings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMeetings.map(meeting => (
              <div key={meeting.id} className="bg-white p-5 rounded-xl shadow-sm border border-brand-200/60 hover:shadow-md transition-all group">
                <h3 className="font-bold text-foreground text-[16px] mb-3">{meeting.title}</h3>
                <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground mb-4 font-medium">
                  <span className="flex items-center gap-1.5"><Calendar size={14} className="text-muted-foreground" /> {meeting.date}</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} className="text-muted-foreground" /> {meeting.time}</span>
                  <span className="flex items-center gap-1.5"><Users size={14} className="text-muted-foreground" /> {meeting.attendees}</span>
                </div>
                <button className="w-full bg-primary/10 hover:bg-brand-100 text-primary font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                  <Video size={16} /> Join Call
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Past */}
        <section>
          <h2 className="text-[14px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={16} /> Past Meetings
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-border/60 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {pastMeetings.map(meeting => (
                <div key={meeting.id} className="p-5 flex items-center justify-between hover:bg-muted transition-colors">
                  <div>
                    <h3 className="font-semibold text-foreground text-[15px] mb-1">{meeting.title}</h3>
                    <div className="flex items-center gap-3 text-[13px] text-muted-foreground font-medium">
                      <span>{meeting.date}</span>
                      <span>•</span>
                      <span>{meeting.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-4 py-2 text-sm font-medium text-secondary-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
                      View Notes
                    </button>
                    {meeting.hasRecording && (
                      <button className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-brand-100 transition-colors flex items-center gap-2">
                        <Play size={14} /> Watch Recording
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
