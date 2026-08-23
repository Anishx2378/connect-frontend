"use client"

import * as React from "react"
import { Sidebar } from "./Sidebar"
import { MessagesSidebar } from "./MessagesSidebar"
import { Topbar } from "./Topbar"
import { Toaster, toast } from "react-hot-toast"
import { getSocket } from "@/lib/socket"
import { usePathname, useRouter } from "next/navigation"
import { X } from "lucide-react"

// ─── Notification Sound (browser-autoplay-safe) ──────────────
let _audioCtx: AudioContext | null = null;
let _audioUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (_audioCtx) return _audioCtx;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    _audioCtx = new AC();
    return _audioCtx;
  } catch { return null; }
}

// Resume audio context on the very first user gesture (click / keydown).
// After that the context stays "running" for the lifetime of the page.
if (typeof window !== "undefined") {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().then(() => { _audioUnlocked = true; });
    } else {
      _audioUnlocked = true;
    }
    window.removeEventListener("click", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("click", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Make sure the context is running (belt-and-suspenders)
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;

    // ── Tone 1: 880 Hz (A5) ──
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 880;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // ── Tone 2: 1320 Hz (E6) — slightly delayed for a "ding-dong" ──
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 1320;
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);
  } catch (err) {
    console.error("Notification sound failed:", err);
  }
};

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()

  React.useEffect(() => {
    import("js-cookie").then((Cookies) => {
      const activeWorkspaceId = Cookies.default.get("activeWorkspaceId")
      if (!activeWorkspaceId && pathname !== "/workspace-select" && pathname !== "/accept-invite") {
        router.push("/workspace-select")
      }
    })
    
    const socket = getSocket()
    
    const handleNotification = (data: { title: string, body: string, url: string, type?: string, senderName?: string, senderAvatar?: string, channelName?: string }) => {
      console.log("RECEIVED NOTIFICATION:", data)
      playNotificationSound()

      // Don't show toast if user is already on that exact page
      if (pathname === data.url) {
        console.log("Ignoring notification because user is on the same page")
        return
      }

      console.log("Displaying toast...")
      toast.custom(
        (t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-slate-200 p-4`}>
            <div className="flex items-start gap-4 w-full">
              <div className="h-12 w-12 shrink-0 rounded-lg bg-brand-100 flex items-center justify-center overflow-hidden">
                {data.senderAvatar ? (
                  <img src={data.senderAvatar} alt={data.senderName || ""} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-brand-700 font-semibold text-lg">
                    {(data.senderName || "U").split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div 
                className="flex flex-col cursor-pointer flex-1 min-w-0" 
                onClick={() => {
                  toast.dismiss(t.id)
                  router.push(data.url)
                }}
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-base text-slate-900 truncate">{data.senderName || data.title}</span>
                  {data.type === 'channel' && data.channelName && (
                    <span className="text-sm text-slate-500 truncate">#{data.channelName}</span>
                  )}
                  {data.type === 'dm' && (
                    <span className="text-sm text-slate-500 truncate">Direct Message</span>
                  )}
                </div>
                <div className="text-[15px] text-slate-800 mt-1 line-clamp-3 leading-relaxed">{data.body}</div>
              </div>
              <button 
                onClick={() => toast.dismiss(t.id)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0 -mt-1 -mr-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        ),
        {
          duration: 12000,
          position: "bottom-right",
        }
      )
    }

    const handleIncomingWave = (data: { roomId: string, roomType: 'channel' | 'dm', roomName: string, callerName: string, callerAvatar: string }) => {
      console.log("INCOMING WAVE:", data)
      playNotificationSound()
      
      const url = data.roomType === 'channel' 
        ? `/wave/channel/${data.roomId}` 
        : `/wave/dm/${data.roomId}`

      toast.custom(
        (t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-black/5 overflow-hidden border border-white/40`}>
            <div className="p-4 flex items-start gap-4">
              <div className="relative h-12 w-12 shrink-0 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden ring-2 ring-green-500 ring-offset-2">
                {data.callerAvatar ? (
                  <img src={data.callerAvatar} alt={data.callerName || ""} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-brand-700 font-semibold text-lg">
                    {(data.callerName || "U").split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="absolute inset-0 bg-green-500/20 animate-pulse pointer-events-none" />
              </div>
              <div className="flex flex-col flex-1 min-w-0 pt-1">
                <span className="font-bold text-[15px] text-slate-900 truncate">Incoming Wave</span>
                <span className="text-[13px] text-slate-600 truncate mt-0.5">{data.callerName} started a wave in {data.roomName}</span>
              </div>
            </div>
            <div className="flex border-t border-slate-200/50 bg-slate-50/50">
              <button 
                onClick={() => {
                  toast.dismiss(t.id)
                }}
                className="flex-1 py-3 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Decline
              </button>
              <div className="w-px bg-slate-200/50" />
              <button 
                onClick={() => {
                  toast.dismiss(t.id)
                  window.open(url, '_blank')
                }}
                className="flex-1 py-3 text-[14px] font-bold text-green-600 hover:bg-green-50 transition-colors"
              >
                Join Wave
              </button>
            </div>
          </div>
        ),
        {
          duration: 30000,
          position: "bottom-right",
          id: `wave-${data.roomId}` // Prevent duplicate toasts
        }
      )
    }

    socket.on("new_notification", handleNotification)
    socket.on("incoming_wave", handleIncomingWave)

    return () => {
      socket.off("new_notification", handleNotification)
      socket.off("incoming_wave", handleIncomingWave)
    }
  }, [pathname, router])

  const hideNavigation = pathname === "/workspace-select" || pathname === "/accept-invite" || pathname === "/complete-invite" || pathname.startsWith("/wave")

  const isMessagesRoute = pathname.startsWith('/channel') || pathname.startsWith('/dm') || pathname === '/messages'

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Toaster />
      {!hideNavigation && (
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      )}
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {!hideNavigation && <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />}
        <div className="flex flex-1 overflow-hidden">
          {!hideNavigation && isMessagesRoute && <MessagesSidebar />}
          <main className="flex-1 overflow-y-auto bg-white">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
