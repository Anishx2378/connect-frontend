import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, Users, CreditCard, LayoutDashboard, MessageSquare, FolderKanban, CheckSquare, Sparkles, BarChart2, Library, LogOut, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

import api from "@/lib/api"
import { connectSocket, disconnectSocket } from "@/lib/socket"
import { useStore } from "@/store/useStore"
import Cookies from "js-cookie"

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const pathname = usePathname()
  const setUser = useStore((state) => state.setUser)
  const user = useStore((state) => state.user)
  const workspaces = useStore((state) => state.workspaces)
  const activeWorkspaceId = useStore((state) => state.activeWorkspaceId)
  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId)
  
  const channels = useStore((state) => state.channels)
  const dms = useStore((state) => state.dms)
  const setChannels = useStore((state) => state.setChannels)
  const setDms = useStore((state) => state.setDms)
  const setWorkspaces = useStore((state) => state.setWorkspaces)
  const setActiveWorkspaceId = useStore((state) => state.setActiveWorkspaceId)
  
  const [myTasksCount, setMyTasksCount] = React.useState(0)
  
  const router = useRouter()

  React.useEffect(() => {
    if (!user) {
      api.get("/auth/me").then(res => {
        const fetchedUser = res.data.data
        setUser(fetchedUser)

        if (fetchedUser.workspaces) {
          setWorkspaces(fetchedUser.workspaces)
        }

        const savedWorkspaceId = Cookies.get("activeWorkspaceId")
        if (savedWorkspaceId) {
          setActiveWorkspaceId(savedWorkspaceId)
        }

        connectSocket()
      }).catch(err => {
        console.error("Not authenticated", err)
      })
    } else {
      connectSocket()
      
      api.get("/channels").then(res => setChannels(res.data.data)).catch(console.error)
      api.get("/tasks?assignedToMe=true").then(res => setMyTasksCount(res.data.data.length)).catch(console.error)
      
      api.get("/dms").then(res => {
        const formattedDms = res.data.data.map((dm: any) => {
          const otherUser = dm.user1Id === user.id ? dm.user2 : dm.user1
          return { 
            id: dm.id, 
            name: otherUser?.name || "Unknown", 
            avatar: otherUser?.avatar, 
            isOnline: otherUser?.isOnline,
            unreadCount: dm.unreadCount || 0
          }
        })
        setDms(formattedDms)
      }).catch(console.error)
    }
  }, [user, setUser, setWorkspaces, setActiveWorkspaceId, activeWorkspaceId, setChannels, setDms])

  const totalUnreadMessages = channels.reduce((sum, c) => sum + (c.unreadCount || 0), 0) + 
                              dms.reduce((sum, d) => sum + (d.unreadCount || 0), 0)

  const isMessagesActive = pathname === "/messages" || pathname.startsWith("/channel") || pathname.startsWith("/dm")

  const NavItem = ({ href, icon: Icon, isActive, badge, title }: { href: string, icon: any, isActive: boolean, badge?: number, title: string }) => (
    <Link 
      href={href} 
      title={isExpanded ? undefined : title}
      className={cn(
        "relative flex items-center rounded-lg transition-all duration-200 group outline-none",
        isExpanded ? "h-[34px] w-full px-3 justify-start gap-2.5 mx-0" : "h-10 w-10 justify-center mx-auto rounded-xl",
        isActive 
          ? (isExpanded 
              ? "bg-black/[0.03] dark:bg-white/[0.05] text-foreground font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-full before:bg-primary" 
              : "bg-primary/10 text-primary")
          : "text-muted-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.02] hover:text-foreground"
      )}
    >
      <Icon size={isExpanded ? 16 : 18} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-colors duration-200 shrink-0", isActive ? "text-primary" : "")} />
      {isExpanded && (
        <span className={cn("text-[13.5px] truncate flex-1", isActive ? "font-semibold" : "font-medium")}>{title}</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          "flex items-center justify-center rounded-full font-bold shadow-sm",
          isExpanded 
            ? "ml-auto h-4 px-1.5 text-[10px] bg-primary text-white"
            : "absolute -top-1 -right-1 flex h-4 min-w-4 px-1 text-[9px] bg-destructive text-white ring-2 ring-sidebar"
        )}>
          {badge}
        </span>
      )}
    </Link>
  )

  const isWorkspaceAdmin = currentWorkspace && (currentWorkspace.role === "ADMIN" || currentWorkspace.role === "OWNER");

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden backdrop-blur-sm transition-opacity" onClick={onClose} />
      )}
      <aside
        className={cn(
          "relative fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-300 md:relative border-r border-sidebar-border shadow-[1px_0_0_0_rgba(0,0,0,0.02)]",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          isExpanded ? "w-[240px] px-3" : "w-[72px] items-center"
        )}
      >
        {/* Workspace Switcher Node */}
        <div className={cn("flex shrink-0 items-center", isExpanded ? "h-[72px] w-full py-4" : "h-[72px] w-full justify-center")}>
          <div 
            onClick={() => router.push("/workspace-select")}
            title={isExpanded ? undefined : currentWorkspace?.name || "Select Workspace"}
            className={cn(
              "group flex cursor-pointer items-center rounded-xl bg-transparent transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.05]",
              isExpanded ? "h-[38px] w-full px-2 gap-2.5" : "h-11 w-11 justify-center bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.05]"
            )}
          >
            {currentWorkspace?.logo ? (
              <img src={currentWorkspace.logo} alt="Workspace Logo" className={cn("rounded-md object-cover shrink-0 shadow-sm", isExpanded ? "h-6 w-6" : "h-full w-full rounded-xl")} />
            ) : (
              <div className={cn("flex items-center justify-center rounded-md bg-gradient-to-br from-primary/80 to-primary text-white shadow-sm shrink-0", isExpanded ? "h-6 w-6 text-[12px]" : "h-full w-full rounded-xl text-[16px]")}>
                <span className="font-semibold">
                  {currentWorkspace?.name ? currentWorkspace.name.charAt(0).toUpperCase() : "C"}
                </span>
              </div>
            )}
            {isExpanded && (
              <div className="flex-1 min-w-0 flex items-center justify-between">
                <span className="text-[14px] font-semibold truncate text-foreground tracking-tight">
                  {currentWorkspace?.name || "Select Workspace"}
                </span>
                <ChevronDown size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="w-full px-4 mb-2">
          <div className="w-full h-[1px] bg-sidebar-border opacity-50" />
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex flex-col gap-2 py-2">
          <NavItem href="/" icon={LayoutDashboard} isActive={pathname === "/"} title="Dashboard" />
          <NavItem href="/messages" icon={MessageSquare} isActive={isMessagesActive} badge={totalUnreadMessages} title="Messages" />
          <NavItem href="/projects" icon={FolderKanban} isActive={pathname === "/projects" || pathname.startsWith("/projects/")} title="Projects" />
          <NavItem href="/tasks" icon={CheckSquare} isActive={pathname === "/tasks"} badge={myTasksCount} title="My Tasks" />
          
          <div className="w-8 h-[1px] bg-sidebar-border rounded-full my-1 opacity-50 mx-auto" />
          
          <NavItem href="/ai-hub" icon={Sparkles} isActive={pathname === "/ai-hub"} title="AI Hub" />
          <NavItem href="/analytics" icon={BarChart2} isActive={pathname === "/analytics"} title="Analytics" />
          
          <div className="w-8 h-[1px] bg-sidebar-border rounded-full my-1 opacity-50 mx-auto" />
          
          <NavItem href="/knowledge" icon={Library} isActive={pathname === "/knowledge" || pathname.startsWith("/knowledge/")} title="Knowledge Base" />
          <NavItem href="/teams" icon={Users} isActive={pathname === "/teams" || pathname.startsWith("/teams/")} title="Team" />
        </div>

        {/* Bottom Actions */}
        <div className="w-full shrink-0 flex flex-col items-center gap-1.5 pb-4 pt-2">
          {isWorkspaceAdmin ? (
            <NavItem href="/admin" icon={Settings} isActive={pathname === "/admin"} title="Admin Settings" />
          ) : (
            <NavItem href="/settings" icon={Settings} isActive={pathname === "/settings"} title="Settings" />
          )}
          <NavItem href="/billing" icon={CreditCard} isActive={pathname === "/billing"} title="Billing" />
          
          <div className={cn("mt-1 relative group flex items-center w-full rounded-xl transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer", isExpanded ? "p-1.5 justify-between" : "p-1.5 justify-center")} onClick={() => router.push("/settings")}>
            <div 
              className={cn("rounded-full flex items-center justify-center text-sidebar-accent-foreground font-bold overflow-hidden ring-1 ring-black/5 dark:ring-white/10 shrink-0", isExpanded ? "h-7 w-7" : "h-9 w-9")}
              title={isExpanded ? undefined : "Profile Settings"}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className={cn("text-[11px] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 w-full h-full flex items-center justify-center")}>
                  {user?.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            
            {isExpanded && (
              <div className="flex-1 min-w-0 mx-2.5 flex flex-col justify-center text-left">
                <span className="text-[13px] font-medium text-foreground truncate tracking-tight">{user?.name}</span>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation()
                Cookies.remove("token")
                disconnectSocket()
                window.location.href = "/login"
              }}
              className={cn(
                "text-muted-foreground hover:text-destructive transition-colors duration-200",
                isExpanded ? "" : "absolute -right-12 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto bg-destructive text-destructive-foreground p-2 rounded-full shadow-lg translate-x-[-10px] group-hover:translate-x-0"
              )}
              title="Log out"
            >
              <LogOut size={isExpanded ? 16 : 16} />
            </button>
          </div>
        </div>

        {/* Floating Expand/Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-6 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-sidebar-accent text-muted-foreground z-[60] transition-transform hover:scale-110"
          title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>
    </>
  )
}
