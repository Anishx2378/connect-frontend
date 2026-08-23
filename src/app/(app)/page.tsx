"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare, UserPlus, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, FileText, File } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"

const taskData = [
  { name: 'Tue', completed: 40, created: 24 },
  { name: 'Wed', completed: 30, created: 13 },
  { name: 'Thu', completed: 20, created: 98 },
  { name: 'Fri', completed: 27, created: 39 },
  { name: 'Sat', completed: 18, created: 48 },
  { name: 'Sun', completed: 23, created: 38 },
];

const sparklineData1 = [{ value: 10 }, { value: 12 }, { value: 15 }, { value: 13 }, { value: 20 }, { value: 18 }, { value: 25 }, { value: 34 }]
const sparklineData2 = [{ value: 4 }, { value: 4.5 }, { value: 5 }, { value: 4.8 }, { value: 5.2 }]
const sparklineData3 = [{ value: 10 }, { value: 9 }, { value: 8 }, { value: 8 }, { value: 7 }]
const sparklineData4 = [{ value: 75 }, { value: 80 }, { value: 82 }, { value: 85 }, { value: 89 }]

interface DashboardStats {
  channelsCount: number
  usersCount: number
  dmsCount: number
  recentActivity: {
    id: string
    content: string
    createdAt: string
    sender: { id: string, name: string, avatar: string | null }
    channel: { name: string } | null
  }[]
}

export default function DashboardPage() {
  const currentUser = useStore((state) => state.user)
  const [stats, setStats] = React.useState<DashboardStats | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/users/dashboard")
        setStats(res.data.data)
      } catch (err) {
        console.error("Failed to load dashboard stats", err)
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchStats()
    }
  }, [currentUser])

  if (loading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-background">
        <div className="animate-spin text-muted-foreground rounded-full border-t-2 border-muted-foreground h-6 w-6"></div>
      </div>
    )
  }

  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const dateStr = today.toLocaleDateString('en-US', options);

  // Minimalist chart theme colors
  const accentColor = "var(--primary, #0071e3)"; 
  const secondaryColor = "var(--muted-foreground, #86868b)";
  return (
    <div className="p-8 md:p-12 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700 bg-background min-h-full font-sans antialiased text-foreground">
      
      {/* Top Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground">
            Good morning, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2 font-medium tracking-tight">
            {dateStr} · You have 12 tasks and 4 meetings today
          </p>
        </div>
      </div>

      {/* 4 Stat Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="flex flex-col group p-6 rounded-[20px] bg-background border border-border/50 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[14px] font-medium text-muted-foreground tracking-tight">Tasks completed</span>
            <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full"><ArrowUpRight size={12} className="mr-0.5" /> 12%</span>
          </div>
          <div className="text-3xl font-semibold text-foreground tracking-tight leading-none mb-12">34</div>
          <div className="h-[40px] w-[110%] -ml-[5%] absolute bottom-4 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData1}>
                <Line type="monotone" dataKey="value" stroke="#5c5cff" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex flex-col group p-6 rounded-[20px] bg-background border border-border/50 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[14px] font-medium text-muted-foreground tracking-tight">Focus hours</span>
            <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full"><ArrowUpRight size={12} className="mr-0.5" /> 8%</span>
          </div>
          <div className="text-3xl font-semibold text-foreground tracking-tight leading-none mb-12">5.2h</div>
          <div className="h-[40px] w-[110%] -ml-[5%] absolute bottom-4 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData2}>
                <Line type="monotone" dataKey="value" stroke="#5c5cff" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex flex-col group p-6 rounded-[20px] bg-background border border-border/50 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[14px] font-medium text-muted-foreground tracking-tight">Open reviews</span>
            <span className="text-[12px] font-medium text-amber-600 dark:text-amber-400 flex items-center bg-amber-500/10 px-2 py-0.5 rounded-full"><ArrowDownRight size={12} className="mr-0.5" /> 3</span>
          </div>
          <div className="text-3xl font-semibold text-foreground tracking-tight leading-none mb-12">7</div>
          <div className="h-[40px] w-[110%] -ml-[5%] absolute bottom-4 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData3}>
                <Line type="monotone" dataKey="value" stroke={secondaryColor} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="flex flex-col group p-6 rounded-[20px] bg-background border border-border/50 shadow-sm transition-all hover:shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[14px] font-medium text-muted-foreground tracking-tight">Sprint velocity</span>
            <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center bg-emerald-500/10 px-2 py-0.5 rounded-full"><ArrowUpRight size={12} className="mr-0.5" /> 5%</span>
          </div>
          <div className="text-3xl font-semibold text-foreground tracking-tight leading-none mb-12">89%</div>
          <div className="h-[40px] w-[110%] -ml-[5%] absolute bottom-4 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData4}>
                <Line type="monotone" dataKey="value" stroke="#5c5cff" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-10 grid-cols-1 xl:grid-cols-3 pt-4">
        {/* LEFT COLUMN - 2/3 width */}
        <div className="xl:col-span-2 space-y-12">
          
          {/* Active Projects */}
          <section>
            <div className="flex justify-between items-baseline mb-6 border-b border-border/40 pb-3">
              <h2 className="text-[15px] font-medium text-foreground tracking-tight">Active Projects</h2>
              <a href="#" className="text-[13px] font-medium text-[#5c5cff] hover:underline">View all</a>
            </div>
            
            <div className="space-y-2">
              {/* Project 1 */}
              <div className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center text-[11px] font-medium text-foreground tracking-wider border border-border/50">ATL</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14.5px] font-medium text-foreground tracking-tight">Atlas Mobile Redesign</h4>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="text-[13px] text-muted-foreground mt-0.5 tracking-tight">On track · Due Jun 28</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-40">
                  <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5c5cff] rounded-full" style={{ width: '72%' }} />
                  </div>
                  <span className="text-[13px] font-medium text-foreground w-8 text-right">72%</span>
                </div>
              </div>

              {/* Project 2 */}
              <div className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center text-[11px] font-medium text-foreground tracking-wider border border-border/50">BIL</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14.5px] font-medium text-foreground tracking-tight">Billing v2 Migration</h4>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    </div>
                    <div className="text-[13px] text-muted-foreground mt-0.5 tracking-tight">At risk · Due Jul 04</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-40">
                  <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5c5cff] rounded-full" style={{ width: '41%' }} />
                  </div>
                  <span className="text-[13px] font-medium text-foreground w-8 text-right">41%</span>
                </div>
              </div>

              {/* Project 3 */}
              <div className="group flex items-center justify-between py-2.5 px-3 -mx-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center text-[11px] font-medium text-foreground tracking-wider border border-border/50">AIB</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14.5px] font-medium text-foreground tracking-tight">AI Insights Beta</h4>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="text-[13px] text-muted-foreground mt-0.5 tracking-tight">On track · Due Jun 22</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-40">
                  <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                    <div className="h-full bg-[#5c5cff] rounded-full" style={{ width: '88%' }} />
                  </div>
                  <span className="text-[13px] font-medium text-foreground w-8 text-right">88%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Task Progress Chart */}
          <section>
            <div className="flex justify-between items-baseline mb-6 border-b border-border/40 pb-3">
              <h2 className="text-[15px] font-medium text-foreground tracking-tight">Task Progress</h2>
            </div>
            <div className="flex gap-12 mb-6">
              <div>
                <div className="text-3xl font-semibold text-foreground tracking-tight leading-none">113</div>
                <div className="text-[13px] text-muted-foreground mt-1.5 font-medium tracking-tight">Completed</div>
              </div>
              <div>
                <div className="text-3xl font-semibold text-foreground tracking-tight leading-none">59%</div>
                <div className="text-[13px] text-muted-foreground mt-1.5 font-medium tracking-tight">Completion rate</div>
              </div>
            </div>
            
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={taskData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5c5cff" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#5c5cff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground, #86868b)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground, #86868b)' }} />
                  <Tooltip 
                    cursor={{ stroke: 'var(--border, #d2d2d7)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '12px', backgroundColor: 'var(--background)' }}
                    itemStyle={{ fontSize: '13px', color: 'var(--foreground)' }}
                    labelStyle={{ fontSize: '11px', fontWeight: '500', color: 'var(--muted-foreground)', marginBottom: '4px', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="completed" stroke="#5c5cff" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" activeDot={{ r: 4, strokeWidth: 0, fill: '#5c5cff' }} />
                  <Area type="monotone" dataKey="created" stroke="var(--border, #d2d2d7)" strokeWidth={2} fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex items-baseline justify-between mb-5 border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
              <h2 className="text-[16px] font-semibold text-foreground tracking-tight">Recent Activity</h2>
              <a href="#" className="text-[13px] font-medium text-[#5c5cff] hover:underline">Timeline</a>
            </div>
            
            {!stats?.recentActivity?.length ? (
              <div className="text-[13.5px] text-muted-foreground py-4">No recent activity.</div>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.slice(0, 5).map((msg) => (
                  <div key={msg.id} className="flex gap-4 items-start group">
                    <div className="h-10 w-10 rounded-full bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center shrink-0 text-foreground font-semibold text-[11px] overflow-hidden border border-black/5 dark:border-white/5">
                      {msg.sender.avatar ? (
                        <img src={msg.sender.avatar} alt={msg.sender.name} className="h-full w-full object-cover grayscale opacity-80 transition-all group-hover:grayscale-0 group-hover:opacity-100" />
                      ) : (
                        msg.sender.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-[14.5px] text-foreground leading-snug tracking-tight">
                        <span className="font-semibold">{msg.sender.name}</span> posted in <span className="font-medium text-muted-foreground">#{msg.channel?.name || 'general'}</span>
                      </p>
                      <p className="text-[13.5px] text-muted-foreground mt-0.5 line-clamp-1 tracking-tight">{msg.content ? msg.content.replace(/<[^>]*>?/gm, '').trim() : 'Sent an attachment'}</p>
                      <div className="text-[11px] text-muted-foreground font-semibold mt-2 uppercase tracking-wider opacity-60">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN - 1/3 width */}
        <div className="space-y-10">
          
          {/* Productivity Score */}
          <section className="p-8 rounded-[20px] bg-background border border-border/50 shadow-sm">
            <h2 className="text-[15px] font-medium text-foreground tracking-tight mb-8">Productivity</h2>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-secondary/60"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#5c5cff]"
                    strokeWidth="3"
                    strokeDasharray="87, 100"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[20px] font-semibold text-foreground tracking-tight">87</span>
                </div>
              </div>
              <div>
                <div className="text-[15px] font-medium text-foreground tracking-tight">Excellent</div>
                <div className="text-[13px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium tracking-tight">+6 from last week</div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-[13px] mb-2.5 tracking-tight">
                  <span className="text-muted-foreground font-medium">Focus time</span>
                  <span className="font-medium text-foreground">92</span>
                </div>
                <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5c5cff] rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-2.5 tracking-tight">
                  <span className="text-muted-foreground font-medium">On-time delivery</span>
                  <span className="font-medium text-foreground">84</span>
                </div>
                <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5c5cff] rounded-full" style={{ width: '84%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-2.5 tracking-tight">
                  <span className="text-muted-foreground font-medium">Collaboration</span>
                  <span className="font-medium text-foreground">78</span>
                </div>
                <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5c5cff] rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            </div>
          </section>

          {/* Today's meetings */}
          <section>
            <div className="flex justify-between items-baseline mb-5 border-b border-border/40 pb-3">
              <h2 className="text-[15px] font-medium text-foreground tracking-tight">Schedule</h2>
              <span className="text-[13px] text-muted-foreground font-medium">4 events</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex gap-5 group cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] py-2 px-3 -mx-3 rounded-xl transition-colors">
                <div className="text-[13px] font-medium text-muted-foreground w-12 shrink-0 pt-0.5">09:30</div>
                <div>
                  <h5 className="text-[14px] font-medium text-foreground tracking-tight">Design sync</h5>
                  <p className="text-[13px] text-muted-foreground mt-0.5 tracking-tight">Atlas Team</p>
                </div>
              </div>

              <div className="flex gap-5 group cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] py-2 px-3 -mx-3 rounded-xl transition-colors">
                <div className="text-[13px] font-medium text-muted-foreground w-12 shrink-0 pt-0.5">11:00</div>
                <div>
                  <h5 className="text-[14px] font-medium text-foreground tracking-tight">Risk review</h5>
                  <p className="text-[13px] text-muted-foreground mt-0.5 tracking-tight">Billing v2</p>
                </div>
              </div>

              <div className="flex gap-5 group cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] py-2 px-3 -mx-3 rounded-xl transition-colors">
                <div className="text-[13px] font-medium text-muted-foreground w-12 shrink-0 pt-0.5">14:15</div>
                <div>
                  <h5 className="text-[14px] font-medium text-foreground tracking-tight">1:1 with Kai</h5>
                  <p className="text-[13px] text-muted-foreground mt-0.5 tracking-tight">Video call</p>
                </div>
              </div>

              <div className="flex gap-5 group cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] py-2 px-3 -mx-3 rounded-xl transition-colors">
                <div className="text-[13px] font-medium text-muted-foreground w-12 shrink-0 pt-0.5">16:00</div>
                <div>
                  <h5 className="text-[14px] font-medium text-foreground tracking-tight">Leadership</h5>
                  <p className="text-[13px] text-muted-foreground mt-0.5 tracking-tight">Weekly sync</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Files */}
          <section>
            <div className="flex justify-between items-baseline mb-5 border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
              <h2 className="text-[16px] font-semibold text-foreground tracking-tight">Recent Files</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-4 cursor-pointer group py-2.5 px-3 -mx-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 transition-colors">
                  <FileText size={16} className="text-foreground" />
                </div>
                <div>
                  <h5 className="text-[14.5px] font-semibold text-foreground tracking-tight">Atlas Redesign Spec</h5>
                  <p className="text-[13.5px] text-muted-foreground tracking-tight mt-0.5 font-medium">Priya · 20m ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 cursor-pointer group py-2.5 px-3 -mx-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 transition-colors">
                  <File size={16} className="text-foreground" />
                </div>
                <div>
                  <h5 className="text-[14.5px] font-semibold text-foreground tracking-tight">Q3 Budget Model</h5>
                  <p className="text-[13.5px] text-muted-foreground tracking-tight mt-0.5 font-medium">Sam · 1h ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 cursor-pointer group py-2.5 px-3 -mx-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                <div className="h-10 w-10 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 transition-colors">
                  <FileText size={16} className="text-foreground" />
                </div>
                <div>
                  <h5 className="text-[14.5px] font-semibold text-foreground tracking-tight">atlas-flows-v4.fig</h5>
                  <p className="text-[13.5px] text-muted-foreground tracking-tight mt-0.5 font-medium">Diego · 24m ago</p>
                </div>
              </div>
            </div>
          </section>

          {/* Announcements */}
          <section className="p-8 rounded-[20px] bg-background border border-border/50 shadow-sm">
            <h2 className="text-[15px] font-medium text-foreground tracking-tight mb-6">Announcements</h2>
            
            <div className="space-y-6">
              <div>
                <div className="text-[11px] font-medium text-[#5c5cff] tracking-wider uppercase mb-1">Company</div>
                <h5 className="text-[14px] font-medium text-foreground mb-1 tracking-tight">All-hands moved to Thursday</h5>
                <p className="text-[13px] text-muted-foreground leading-relaxed tracking-tight">Q3 planning presentation at 10:00 in the main room. — Sam</p>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#5c5cff] tracking-wider uppercase mb-1">Product</div>
                <h5 className="text-[14px] font-medium text-foreground mb-1 tracking-tight">New AI credits policy</h5>
                <p className="text-[13px] text-muted-foreground leading-relaxed tracking-tight">Every workspace now gets 5,000 monthly AI credits included.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
