"use client"

import * as React from "react"
import { Settings } from "lucide-react"

export default function TeamCalendarPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="text-center py-24 bg-white rounded-xl border border-slate-200 border-dashed">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Settings className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Calendar</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">This section is currently under development. Check back later for updates.</p>
      </div>
    </div>
  )
}
