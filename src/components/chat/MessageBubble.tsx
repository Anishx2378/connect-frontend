"use client"
import * as React from "react"
import dynamic from "next/dynamic"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

const Document = dynamic(() => import("react-pdf").then(mod => mod.Document), { ssr: false })
const Page = dynamic(() => import("react-pdf").then(mod => mod.Page), { ssr: false })

if (typeof window !== "undefined") {
  import("react-pdf").then(mod => {
    mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`
  })
}

import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  Film,
  Music,
  Archive,
  ZoomIn,
  ZoomOut,
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  X as XIcon,
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  ListOrdered, 
  List as ListIcon, 
  TextQuote, 
  Code,
  Type,
  TerminalSquare,
  Plus,
  Smile,
  SmilePlus,
  MessageSquareText,
  Moon,
  Sun,
  Pin
} from "lucide-react"

import { VoiceMessagePlayer } from "./VoiceMessagePlayer"
import { useStore } from "@/store/useStore"
import { getSocket } from "@/lib/socket"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import LinkExtension from '@tiptap/extension-link'
import { Button } from "@/components/ui/button"
import CodeBlock from '@tiptap/extension-code-block'
import EmojiPicker from 'emoji-picker-react'

const CustomCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      theme: {
        default: 'light',
        parseHTML: element => element.getAttribute('data-theme'),
        renderHTML: attributes => {
          return {
            'data-theme': attributes.theme,
          }
        },
      },
    }
  },
})

// Configure PDF.js worker dynamically above

interface Attachment {
  id: string
  url: string
  fileName: string
  fileType: string
}

function MessageEditor({ 
  initialContent, 
  onSave, 
  onCancel 
}: { 
  initialContent: string; 
  onSave: (html: string) => void; 
  onCancel: () => void 
}) {
  const [showFormatting, setShowFormatting] = React.useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CustomCodeBlock,
      Underline,
      LinkExtension.configure({ openOnClick: false })
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'w-full text-[15px] text-foreground bg-white min-h-[44px] p-3 focus:outline-none prose prose-sm prose-slate max-w-none prose-p:m-0 prose-pre:m-0 prose-ul:m-0 prose-li:m-0 outline-none'
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          onSave(view.state.doc.textContent.trim() === '' ? '' : view.dom.innerHTML)
          return true
        }
        if (event.key === 'Escape') {
          onCancel()
          return true
        }
        return false
      }
    }
  })

  return (
    <div className="mt-1">
      <div className="flex flex-col bg-white border border-border/50 rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary">
        {/* Top Formatting Toolbar */}
        {showFormatting && editor && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 bg-muted/80 border-b border-border/50 rounded-t-xl">
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('bold') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold size={15} strokeWidth={2.5} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('italic') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic size={15} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('underline') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon size={15} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('strike') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough size={15} />
            </Button>
            <div className="w-[1px] h-4 bg-slate-300 mx-1" />
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('link') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => {
              const url = window.prompt('URL')
              if (url) editor.chain().focus().setLink({ href: url }).run()
              else if (url === '') editor.chain().focus().unsetLink().run()
            }}>
              <LinkIcon size={15} />
            </Button>
            <div className="w-[1px] h-4 bg-slate-300 mx-1" />
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('orderedList') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered size={15} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('bulletList') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <ListIcon size={15} />
            </Button>
            <div className="w-[1px] h-4 bg-slate-300 mx-1" />
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('blockquote') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <TextQuote size={15} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('code') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => editor.chain().focus().toggleCode().run()}>
              <Code size={15} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${editor.isActive('codeBlock') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
              <TerminalSquare size={15} />
            </Button>
            {editor.isActive('codeBlock') && (
              <>
                <div className="w-[1px] h-4 bg-slate-300 mx-1" />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-foreground" 
                  onClick={() => {
                    const currentTheme = editor.getAttributes('codeBlock').theme;
                    editor.commands.updateAttributes('codeBlock', { theme: currentTheme === 'dark' ? 'light' : 'dark' });
                  }}
                  title="Toggle Code Theme"
                >
                  {editor.getAttributes('codeBlock').theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Text Input Area (Tiptap) */}
        <div className="relative">
          <EditorContent editor={editor} />
        </div>

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between px-2 pb-2 mt-1">
          <div className="flex items-center gap-0.5">
            {/* Attach File (Plus icon) - visually present but typically inactive or handled differently for edits, keep it for identical UI */}
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary cursor-not-allowed opacity-50"
              title="Attachments cannot be edited"
            >
              <Plus size={18} />
            </Button>
            
            {/* Toggle Formatting */}
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 rounded-full ${showFormatting ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
              onClick={() => setShowFormatting(!showFormatting)}
            >
              <Type size={16} strokeWidth={2.5} />
            </Button>
            
            {/* Emoji */}
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-secondary cursor-not-allowed opacity-50"
            >
              <Smile size={18} />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 bg-white text-foreground text-xs font-medium rounded border border-border/50 hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(editor?.getHTML() || '')}
              className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helper functions ─────────────────────────────────────────────────────────

const getFileIcon = (fileType: string, fileName: string, size = 24) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  const s = size
  if (fileType.startsWith("video/")) return <Film size={s} className="text-purple-500" />
  if (fileType.startsWith("audio/")) return <Music size={s} className="text-pink-500" />
  if (ext === "pdf") return <FileText size={s} className="text-red-500" />
  if (["doc", "docx"].includes(ext)) return <FileText size={s} className="text-blue-500" />
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet size={s} className="text-green-500" />
  if (["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "rb", "go", "rs", "json", "html", "css"].includes(ext))
    return <FileCode size={s} className="text-yellow-500" />
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return <Archive size={s} className="text-orange-500" />
  return <File size={s} className="text-muted-foreground" />
}

const getAccentColor = (fileType: string, fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  if (fileType.startsWith("video/")) return { border: "border-l-purple-400", bg: "bg-purple-50", badge: "bg-purple-100 text-purple-700" }
  if (fileType.startsWith("audio/")) return { border: "border-l-pink-400", bg: "bg-pink-50", badge: "bg-pink-100 text-pink-700" }
  if (ext === "pdf") return { border: "border-l-red-400", bg: "bg-red-50", badge: "bg-red-100 text-red-700" }
  if (["doc", "docx"].includes(ext)) return { border: "border-l-blue-400", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700" }
  if (["xls", "xlsx", "csv"].includes(ext)) return { border: "border-l-green-400", bg: "bg-green-50", badge: "bg-green-100 text-green-700" }
  if (["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "rb", "go", "rs", "json", "html", "css"].includes(ext))
    return { border: "border-l-yellow-400", bg: "bg-yellow-50", badge: "bg-yellow-100 text-yellow-700" }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return { border: "border-l-orange-400", bg: "bg-orange-50", badge: "bg-orange-100 text-orange-700" }
  return { border: "border-l-slate-400", bg: "bg-muted", badge: "bg-secondary text-foreground" }
}

const humanizeType = (fileType: string, fileName: string) => {
  const ext = fileName.split(".").pop()?.toUpperCase() || ""
  return ext ? `${ext} File` : fileType.split("/")[1]?.toUpperCase() || "File"
}

// ─── PDF Full-Screen Viewer Modal ─────────────────────────────────────────────

function PdfViewerModal({ url, fileName, onClose }: { url: string; fileName: string; onClose: () => void }) {
  const [numPages, setNumPages] = React.useState<number>(0)
  const [page, setPage] = React.useState(1)
  const [scale, setScale] = React.useState(1.0)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setPage((p) => Math.min(numPages, p + 1))
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setPage((p) => Math.max(1, p - 1))
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [numPages, onClose])

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-zinc-950/95 backdrop-blur-md">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30 shrink-0">
        <div className="flex items-center gap-3">
          <FileText size={18} className="text-red-400" />
          <span className="text-white font-medium text-sm truncate max-w-[300px]">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-white/60 text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn size={16} />
          </button>

          {/* Page navigation */}
          {numPages > 1 && (
            <>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-white/60 text-xs">
                {page} / {numPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                disabled={page === numPages}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          <div className="w-px h-5 bg-white/20 mx-1" />

          {/* Download */}
          <a
            href={url}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Download size={16} />
          </a>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-8 px-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="text-white/50 text-sm">Loading PDF…</span>
            </div>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => {
            setNumPages(numPages)
            setLoading(false)
          }}
          onLoadError={() => setLoading(false)}
          loading=""
          className="shadow-2xl"
        >
          <Page
            pageNumber={page}
            scale={scale}
            className="rounded-lg overflow-hidden shadow-2xl"
            renderAnnotationLayer
            renderTextLayer
          />
        </Document>
      </div>
    </div>
  )
}

// ─── Link Preview Card ────────────────────────────────────────────────────────
function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  if (!preview) return null
  const [imgError, setImgError] = React.useState(false)
  
  let siteName = preview.siteName
  let faviconUrl = preview.favicon
  if (!siteName) {
    try {
      siteName = new URL(preview.url).hostname.replace('www.', '')
    } catch (e) {
      siteName = preview.url
    }
  }
  // Resolve relative favicon to absolute
  if (faviconUrl && !faviconUrl.startsWith('http')) {
    try {
      faviconUrl = new URL(faviconUrl, preview.url).href
    } catch (e) {
      faviconUrl = undefined
    }
  }

  return (
    <a 
      href={preview.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="mt-2 block max-w-[440px] rounded-lg overflow-hidden bg-muted hover:bg-secondary/80 transition-colors border border-border/50 shadow-sm group"
    >
      <div className="flex border-l-[4px] border-l-blue-500">
        {/* Text content — left side */}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            {faviconUrl ? (
              <img src={faviconUrl} alt="" className="w-4 h-4 rounded object-contain shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
            ) : (
              <LinkIcon size={14} className="text-muted-foreground shrink-0" />
            )}
            <span className="text-[13px] font-semibold text-muted-foreground truncate">{siteName}</span>
          </div>
          <div className="text-[15px] font-semibold tracking-tight text-blue-700 group-hover:underline leading-snug line-clamp-2">
            {preview.title || preview.url}
          </div>
          {preview.description && (
            <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {preview.description}
            </p>
          )}
        </div>
      </div>
    </a>
  )
}

// ─── Document Preview Cards ───────────────────────────────────────────────────

function PdfPreviewCard({ att }: { att: Attachment }) {
  const [thumbLoaded, setThumbLoaded] = React.useState(false)
  const [thumbError, setThumbError] = React.useState(false)
  const [showViewer, setShowViewer] = React.useState(false)
  const colors = getAccentColor(att.fileType, att.fileName)

  return (
    <>
      <div
        className="mt-2 max-w-xs rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group"
        onClick={() => setShowViewer(true)}
      >
        {/* PDF first-page thumbnail */}
        <div className="relative bg-secondary border-b border-border/50 overflow-hidden" style={{ height: 200 }}>
          {!thumbError && (
            <Document
              file={att.url}
              onLoadSuccess={() => setThumbLoaded(true)}
              onLoadError={() => setThumbError(true)}
              loading=""
            >
              <Page
                pageNumber={1}
                width={288}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                className="pointer-events-none"
              />
            </Document>
          )}

          {/* Skeleton while loading */}
          {!thumbLoaded && !thumbError && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary">
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-border/50 border-t-slate-500 rounded-full animate-spin" />
                <span className="text-xs text-muted-foreground">Loading preview…</span>
              </div>
            </div>
          )}

          {/* Fallback if PDF fails to render */}
          {thumbError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50">
              <FileText size={48} className="text-red-200" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">
              Click to open
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-3 px-3 py-2.5 ${colors.bg}`}>
          <FileText size={20} className="text-red-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{att.fileName}</div>
            <div className="text-xs text-muted-foreground">PDF · Click to view</div>
          </div>
          <a
            href={att.url}
            download={att.fileName}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={16} />
          </a>
        </div>
      </div>

      {showViewer && (
        <PdfViewerModal url={att.url} fileName={att.fileName} onClose={() => setShowViewer(false)} />
      )}
    </>
  )
}

// ─── DOCX Full-Screen Viewer Modal ───────────────────────────────────────────

function DocxViewerModal({ htmlData, fileName, url, onClose }: { htmlData: string; fileName: string; url: string; onClose: () => void }) {
  const [scale, setScale] = React.useState(1.0)
  
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-zinc-950/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30 shrink-0">
        <div className="flex items-center gap-3">
          {getFileIcon("application/octet-stream", fileName, 18)}
          <span className="text-white font-medium text-sm truncate max-w-[300px]">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom */}
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-white/60 text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <a href={url} download={fileName} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <Download size={16} />
          </a>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex justify-center items-start">
        <div 
          className="bg-white p-8 sm:p-12 shadow-2xl overflow-hidden prose prose-sm sm:prose-base max-w-none origin-top transition-transform"
          style={{ 
            width: '100%', 
            maxWidth: '850px', 
            minHeight: '1100px',
            transform: `scale(${scale})`,
            marginBottom: scale > 1 ? `${(scale - 1) * 100}%` : '0'
          }} 
          dangerouslySetInnerHTML={{ __html: htmlData }} 
        />
      </div>
    </div>
  )
}

// ─── DOCX Thumbnail Preview Card ──────────────────────────────────────────────

function DocxPreviewCard({ att }: { att: Attachment }) {
  const [showViewer, setShowViewer] = React.useState(false)
  const [htmlData, setHtmlData] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const colors = getAccentColor(att.fileType, att.fileName)

  React.useEffect(() => {
    import("mammoth").then(mammoth => {
      fetch(att.url)
        .then(res => res.arrayBuffer())
        .then(buf => (mammoth.default || mammoth).convertToHtml({arrayBuffer: buf}))
        .then(result => {
           setHtmlData(result.value)
           setLoading(false)
        })
        .catch(err => {
           console.error("docx preview err:", err)
           setError(true)
           setLoading(false)
        })
    }).catch(err => {
       console.error("mammoth load err:", err)
       setError(true)
       setLoading(false)
    })
  }, [att.url])

  return (
    <>
      <div
        className="mt-2 max-w-xs rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group bg-white"
        onClick={() => !error && setShowViewer(true)}
      >
        <div className="relative bg-muted border-b border-border/50 overflow-hidden p-3" style={{ height: 200 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-border/50 border-t-slate-500 rounded-full animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
              {getFileIcon(att.fileType, att.fileName, 32)}
              <span className="text-xs">Preview unavailable</span>
            </div>
          )}

          {!loading && !error && htmlData && (
            <div className="opacity-80 scale-[0.4] origin-top-left w-[250%] h-[250%] pointer-events-none">
              <div className="bg-white p-4 text-xs prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlData }} />
            </div>
          )}

          {!error && (
            <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                Click to open
              </span>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-3 px-3 py-2.5 ${colors.bg}`}>
          <div className="shrink-0">{getFileIcon(att.fileType, att.fileName, 20)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{att.fileName}</div>
            <div className="text-xs text-muted-foreground">{humanizeType(att.fileType, att.fileName)} · Click to view</div>
          </div>
          <a
            href={att.url}
            download={att.fileName}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={16} />
          </a>
        </div>
      </div>

      {showViewer && (
        <DocxViewerModal htmlData={htmlData} url={att.url} fileName={att.fileName} onClose={() => setShowViewer(false)} />
      )}
    </>
  )
}

// ─── Spreadsheet Full-Screen Viewer Modal ─────────────────────────────────────

function SpreadsheetViewerModal({ data, fileName, url, onClose }: { data: string[][]; fileName: string; url: string; onClose: () => void }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-zinc-950/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30 shrink-0">
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={18} className="text-green-400" />
          <span className="text-white font-medium text-sm truncate max-w-[300px]">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={url} download={fileName} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <Download size={16} />
          </a>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl overflow-hidden shadow-2xl inline-block min-w-full">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-secondary text-secondary-foreground font-semibold border-b border-border/50">
              <tr>
                {data[0]?.map((header, i) => (
                  <th key={i} className="px-4 py-3 whitespace-nowrap">{header || ""}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-foreground">
              {data.slice(1).map((row, i) => (
                <tr key={i} className="hover:bg-muted">
                  {(row || []).map((cell, j) => (
                    <td key={j} className="px-4 py-2 whitespace-nowrap">{cell || ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Spreadsheet Thumbnail Preview Card ───────────────────────────────────────

function SpreadsheetPreviewCard({ att }: { att: Attachment }) {
  const [showViewer, setShowViewer] = React.useState(false)
  const [sheetData, setSheetData] = React.useState<string[][]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const colors = getAccentColor(att.fileType, att.fileName)

  React.useEffect(() => {
    fetch(att.url)
      .then(res => res.arrayBuffer())
      .then(buf => {
         import("xlsx").then(XLSX => {
            const wb = XLSX.read(buf, { type: 'array' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
            setSheetData(json as string[][]);
            setLoading(false);
         }).catch(err => {
            console.error(err);
            setError(true);
            setLoading(false);
         })
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [att.url])

  return (
    <>
      <div
        className="mt-2 max-w-xs rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group bg-white"
        onClick={() => !error && setShowViewer(true)}
      >
        <div className="relative bg-muted border-b border-border/50 overflow-hidden p-3" style={{ height: 200 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-border/50 border-t-slate-500 rounded-full animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
              {getFileIcon(att.fileType, att.fileName, 32)}
              <span className="text-xs">Preview unavailable</span>
            </div>
          )}

          {!loading && !error && sheetData.length > 0 && (
            <div className="opacity-80 scale-[0.6] origin-top-left w-[166%]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-border/50">
                    {sheetData[0]?.slice(0, 5).map((h, i) => (
                      <th key={i} className="p-2 text-secondary-foreground font-semibold tracking-tight bg-accent truncate max-w-[100px]">{h || ""}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheetData.slice(1, 8).map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {(row || []).slice(0, 5).map((c, j) => (
                        <td key={j} className="p-2 text-muted-foreground truncate max-w-[100px]">{c || ""}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!error && (
            <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                Click to open
              </span>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-3 px-3 py-2.5 ${colors.bg}`}>
          <div className="shrink-0">{getFileIcon(att.fileType, att.fileName, 20)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{att.fileName}</div>
            <div className="text-xs text-muted-foreground">{humanizeType(att.fileType, att.fileName)} · Click to view</div>
          </div>
          <a
            href={att.url}
            download={att.fileName}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={16} />
          </a>
        </div>
      </div>

      {showViewer && (
        <SpreadsheetViewerModal data={sheetData} url={att.url} fileName={att.fileName} onClose={() => setShowViewer(false)} />
      )}
    </>
  )
}

// ─── ZIP Full-Screen Viewer Modal ──────────────────────────────────────────────

function ZipViewerModal({ files, fileName, url, onClose }: { files: {name: string; dir: boolean}[]; fileName: string; url: string; onClose: () => void }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-zinc-950/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/30 shrink-0">
        <div className="flex items-center gap-3">
          <Archive size={18} className="text-orange-400" />
          <span className="text-white font-medium text-sm truncate max-w-[300px]">{fileName}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={url} download={fileName} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            <Download size={16} />
          </a>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-1">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex justify-center">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden max-h-full">
          <div className="bg-muted border-b border-border/50 px-4 py-3 font-medium text-foreground flex justify-between items-center shrink-0">
             <span>Archive Contents</span>
             <span className="text-xs text-muted-foreground font-normal">{files.length} items</span>
          </div>
          <div className="overflow-y-auto p-2">
            <table className="w-full text-left text-sm">
              <tbody>
                {files.map((f, i) => (
                  <tr key={i} className="hover:bg-muted border-b border-border/30 last:border-0 group">
                    <td className="px-4 py-2 w-8 shrink-0 text-muted-foreground group-hover:text-secondary-foreground">
                      {f.dir ? <File size={16} className="opacity-50" /> : <FileText size={16} />}
                    </td>
                    <td className={`px-4 py-2 truncate ${f.dir ? 'font-medium text-foreground' : 'text-secondary-foreground'}`}>
                      {f.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ZIP Thumbnail Preview Card ───────────────────────────────────────────────

function ZipPreviewCard({ att }: { att: Attachment }) {
  const [showViewer, setShowViewer] = React.useState(false)
  const [zipFiles, setZipFiles] = React.useState<{name: string, dir: boolean}[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const colors = getAccentColor(att.fileType, att.fileName)

  React.useEffect(() => {
    fetch(att.url)
      .then(res => res.arrayBuffer())
      .then(buf => {
         import("jszip").then(JSZip => {
            return (JSZip.default || JSZip).loadAsync(buf);
         }).then(zip => {
            const list: {name: string, dir: boolean}[] = [];
            zip.forEach((relativePath, zipEntry) => {
               list.push({ name: relativePath, dir: zipEntry.dir });
            });
            // Sort directories first
            list.sort((a, b) => {
               if (a.dir === b.dir) return a.name.localeCompare(b.name);
               return a.dir ? -1 : 1;
            });
            setZipFiles(list);
            setLoading(false);
         }).catch(err => {
            console.error(err);
            setError(true);
            setLoading(false);
         });
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [att.url])

  return (
    <>
      <div
        className="mt-2 max-w-xs rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group bg-white"
        onClick={() => !error && setShowViewer(true)}
      >
        <div className="relative bg-muted border-b border-border/50 overflow-hidden p-3" style={{ height: 200 }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-border/50 border-t-slate-500 rounded-full animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Archive size={32} />
              <span className="text-xs">Preview unavailable</span>
            </div>
          )}

          {!loading && !error && zipFiles.length > 0 && (
            <div className="absolute inset-0 p-3 overflow-hidden">
               <div className="text-xs font-semibold text-muted-foreground mb-2 border-b border-border/50 pb-1 flex justify-between">
                  <span>Archive</span>
                  <span>{zipFiles.length} items</span>
               </div>
               <div className="flex flex-col gap-1.5 opacity-80">
                 {zipFiles.slice(0, 7).map((f, i) => (
                   <div key={i} className="flex items-center gap-2 text-xs text-secondary-foreground truncate">
                      {f.dir ? <File size={12} className="opacity-50 shrink-0" /> : <FileText size={12} className="shrink-0" />}
                      <span className="truncate">{f.name.split('/').pop() || f.name}</span>
                   </div>
                 ))}
                 {zipFiles.length > 7 && (
                   <div className="text-xs text-muted-foreground italic mt-1 px-1">... and {zipFiles.length - 7} more</div>
                 )}
               </div>
            </div>
          )}

          {!error && (
            <div className="absolute inset-0 z-10 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                Click to open
              </span>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-3 px-3 py-2.5 ${colors.bg}`}>
          <div className="shrink-0">{getFileIcon(att.fileType, att.fileName, 20)}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{att.fileName}</div>
            <div className="text-xs text-muted-foreground">ZIP Archive · Click to view</div>
          </div>
          <a
            href={att.url}
            download={att.fileName}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download size={16} />
          </a>
        </div>
      </div>

      {showViewer && (
        <ZipViewerModal files={zipFiles} url={att.url} fileName={att.fileName} onClose={() => setShowViewer(false)} />
      )}
    </>
  )
}

// ─── Rich File Preview Card (docs, xlsx, zip, code, audio, video, etc.) ──────

function getRichTheme(fileType: string, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() || ""
  // Word docs
  if (["doc", "docx"].includes(ext))
    return {
      gradient: "from-blue-600 to-blue-700",
      iconBg: "bg-blue-500/20",
      iconColor: "text-white",
      badge: "bg-blue-100 text-blue-700",
      border: "border-l-blue-500",
      footerBg: "bg-blue-50",
      label: ext.toUpperCase() + " File",
    }
  // Excel / CSV
  if (["xls", "xlsx", "csv"].includes(ext))
    return {
      gradient: "from-emerald-600 to-emerald-700",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-white",
      badge: "bg-emerald-100 text-emerald-700",
      border: "border-l-emerald-500",
      footerBg: "bg-emerald-50",
      label: ext.toUpperCase() + " Spreadsheet",
    }
  // PowerPoint
  if (["ppt", "pptx"].includes(ext))
    return {
      gradient: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-400/20",
      iconColor: "text-white",
      badge: "bg-orange-100 text-orange-700",
      border: "border-l-orange-500",
      footerBg: "bg-orange-50",
      label: ext.toUpperCase() + " Presentation",
    }
  // Code files
  if (["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "rb", "go", "rs", "json", "html", "css", "sh", "yaml", "yml"].includes(ext))
    return {
      gradient: "from-violet-600 to-violet-700",
      iconBg: "bg-violet-400/20",
      iconColor: "text-white",
      badge: "bg-violet-100 text-violet-700",
      border: "border-l-violet-500",
      footerBg: "bg-violet-50",
      label: ext.toUpperCase() + " Source",
    }
  // Archives
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
    return {
      gradient: "from-amber-500 to-amber-600",
      iconBg: "bg-amber-400/20",
      iconColor: "text-white",
      badge: "bg-amber-100 text-amber-700",
      border: "border-l-amber-500",
      footerBg: "bg-amber-50",
      label: ext.toUpperCase() + " Archive",
    }
  // Audio
  if (fileType.startsWith("audio/"))
    return {
      gradient: "from-pink-500 to-rose-600",
      iconBg: "bg-pink-400/20",
      iconColor: "text-white",
      badge: "bg-pink-100 text-pink-700",
      border: "border-l-pink-500",
      footerBg: "bg-pink-50",
      label: (ext || "Audio").toUpperCase() + " Audio",
    }
  // Video
  if (fileType.startsWith("video/"))
    return {
      gradient: "from-purple-600 to-purple-700",
      iconBg: "bg-purple-400/20",
      iconColor: "text-white",
      badge: "bg-purple-100 text-purple-700",
      border: "border-l-purple-500",
      footerBg: "bg-purple-50",
      label: (ext || "Video").toUpperCase() + " Video",
    }
  // Text
  if (["txt", "md", "rtf"].includes(ext))
    return {
      gradient: "from-slate-500 to-slate-600",
      iconBg: "bg-slate-400/20",
      iconColor: "text-white",
      badge: "bg-secondary text-foreground",
      border: "border-l-slate-500",
      footerBg: "bg-muted",
      label: ext.toUpperCase() + " Text",
    }
  // Default
  return {
    gradient: "from-slate-500 to-slate-600",
    iconBg: "bg-slate-400/20",
    iconColor: "text-white",
    badge: "bg-secondary text-foreground",
    border: "border-l-slate-500",
    footerBg: "bg-muted",
    label: (ext || "File").toUpperCase() + " File",
  }
}

function RichFileCard({ att }: { att: Attachment }) {
  const theme = getRichTheme(att.fileType, att.fileName)
  const icon = getFileIcon(att.fileType, att.fileName, 40)
  const ext = att.fileName.split(".").pop()?.toUpperCase() || "FILE"

  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      download={att.fileName}
      className="group mt-2 max-w-xs rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 block no-underline"
    >
      {/* Thumbnail area */}
      <div className={`relative flex items-center justify-center bg-gradient-to-br ${theme.gradient} overflow-hidden`} style={{ height: 140 }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
        <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-white/5" />

        {/* Large icon in circle */}
        <div className={`relative z-10 w-20 h-20 rounded-2xl ${theme.iconBg} backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-200`}>
          <div className={theme.iconColor}>{icon}</div>
        </div>

        {/* Extension badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/25 backdrop-blur-sm text-white text-[10px] font-semibold tracking-tight tracking-wider">
          .{ext}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
            <Download size={12} /> Download
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center gap-3 px-3 py-2.5 ${theme.footerBg}`}>
        {getFileIcon(att.fileType, att.fileName, 20)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{att.fileName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{theme.label} · Click to download</div>
        </div>
        <Download size={16} className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </a>
  )
}

// ─── Image Preview Card (single image shown like PDF card) ────────────────────

function ImagePreviewCard({ att, onClick }: { att: Attachment; onClick: () => void }) {
  const [loaded, setLoaded] = React.useState(false)

  return (
    <div
      className="mt-2 max-w-xs rounded-xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-zoom-in group"
      onClick={onClick}
    >
      {/* Image thumbnail */}
      <div className="relative bg-secondary border-b border-border/50 overflow-hidden" style={{ height: 200 }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <div className="w-5 h-5 border-2 border-border/50 border-t-slate-500 rounded-full animate-spin" />
          </div>
        )}
        <img
          src={att.url}
          alt={att.fileName}
          onLoad={() => setLoaded(true)}
          className="w-full h-full object-cover"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">
            Click to enlarge
          </span>
        </div>
      </div>

      {/* Footer — teal/cyan for images */}
      <div className="flex items-center gap-3 px-3 py-2.5 bg-teal-50">
        <div className="w-5 h-5 rounded bg-teal-100 flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{att.fileName}</div>
          <div className="text-xs text-muted-foreground">Image · Click to view</div>
        </div>
        <a
          href={att.url}
          download={att.fileName}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download size={16} />
        </a>
      </div>
    </div>
  )
}


// ─── Image Grid + Lightbox ────────────────────────────────────────────────────

function ImageLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: Attachment[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = React.useState(startIndex)

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1))
      if (e.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [images.length, onClose])

  const current = images[index]
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white">
          <X size={24} />
        </button>
        <img
          src={current.url}
          alt={current.fileName}
          className="max-w-[85vw] max-h-[80vh] rounded-lg object-contain shadow-2xl"
        />
        <div className="mt-3 flex items-center gap-4 text-white/80 text-sm">
          <span className="font-medium">{current.fileName}</span>
          <a
            href={current.url}
            download={current.fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <Download size={14} /> Download
          </a>
        </div>
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="absolute left-[-50px] top-1/2 -translate-y-1/2 text-white/70 hover:text-white disabled:opacity-20"
            >
              <ChevronLeft size={36} />
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
              disabled={index === images.length - 1}
              className="absolute right-[-50px] top-1/2 -translate-y-1/2 text-white/70 hover:text-white disabled:opacity-20"
            >
              <ChevronRight size={36} />
            </button>
            <div className="mt-2 text-white/50 text-xs">
              {index + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ImagePreviewGrid({ images }: { images: Attachment[] }) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null)
  const count = images.length
  const gridClass =
    count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : count === 3 ? "grid-cols-3" : "grid-cols-2"
  const maxHeight = count === 1 ? "max-h-80" : "max-h-48"

  return (
    <>
      <div className={`grid ${gridClass} gap-1 mt-2 max-w-sm rounded-xl overflow-hidden border border-border/50 shadow-sm`}>
        {images.slice(0, 4).map((img, i) => (
          <div
            key={img.id}
            className={`relative overflow-hidden cursor-zoom-in group ${count === 3 && i === 0 ? "col-span-3" : ""}`}
            onClick={() => setLightboxIndex(i)}
          >
            <img src={img.url} alt={img.fileName} className={`w-full ${maxHeight} object-cover transition-transform duration-200 group-hover:scale-105`} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <Download size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
            </div>
            {i === 3 && count > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg">
                +{count - 4}
              </div>
            )}
          </div>
        ))}
      </div>
      {lightboxIndex !== null && (
        <ImageLightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </>
  )
}

// ─── Main MessageBubble ───────────────────────────────────────────────────────

interface LinkPreview {
  id: string
  url: string
  title?: string
  description?: string
  image?: string
  favicon?: string
  siteName?: string
}

export function MessageBubble({ 
  message, 
  onReplyClick,
  compact = false
}: { 
  message: { id: string; userId: string; userName: string; avatar: string; content: string; timestamp: string; createdAt: string | Date; attachments?: Attachment[]; linkPreviews?: LinkPreview[]; reactions?: any[]; replyCount?: number; isPinned?: boolean; pinnedBy?: { id: string; name: string } }, 
  onReplyClick?: () => void,
  compact?: boolean
}) {
  const imageAttachments = (message.attachments || []).filter((a) => a.fileType?.startsWith("image/"))
  const audioAttachments = (message.attachments || []).filter((a) => a.fileType?.startsWith("audio/"))
  const pdfAttachments = (message.attachments || []).filter((a) => a.fileName?.toLowerCase().endsWith(".pdf"))
  const spreadsheetAttachments = (message.attachments || []).filter(
    (a) => {
      const ext = a.fileName?.split(".").pop()?.toLowerCase() || ""
      return ["csv", "xls", "xlsx"].includes(ext)
    }
  )
  const docxAttachments = (message.attachments || []).filter(
    (a) => a.fileName?.toLowerCase().endsWith(".docx")
  )
  const zipAttachments = (message.attachments || []).filter(
    (a) => a.fileName?.toLowerCase().endsWith(".zip")
  )
  const fileAttachments = (message.attachments || []).filter(
    (a) => {
      const ext = a.fileName?.split(".").pop()?.toLowerCase() || ""
      return !a.fileType?.startsWith("image/") && !a.fileType?.startsWith("audio/") && !a.fileName?.toLowerCase().endsWith(".pdf") && !["csv", "xls", "xlsx", "docx", "zip"].includes(ext)
    }
  )

  // For image lightbox when using ImagePreviewCard (single image)
  const [singleImageLightbox, setSingleImageLightbox] = React.useState<number | null>(null)

  const currentUser = useStore((state) => state.user)
  const isMine = currentUser?.id === message.userId

  const [isEditing, setIsEditing] = React.useState(false)
  const [editContent, setEditContent] = React.useState(message.content)
  const [showOptions, setShowOptions] = React.useState(false)
  const [showHoverEmojiPicker, setShowHoverEmojiPicker] = React.useState(false)
  const [showInlineEmojiPicker, setShowInlineEmojiPicker] = React.useState(false)

  const toggleReaction = (emoji: string) => {
    const socket = getSocket()
    const hasReacted = message.reactions?.some(r => r.emoji === emoji && r.userId === currentUser?.id)
    if (hasReacted) {
      socket.emit("remove_reaction", { messageId: message.id, emoji })
    } else {
      socket.emit("add_reaction", { messageId: message.id, emoji })
    }
    setShowHoverEmojiPicker(false)
    setShowInlineEmojiPicker(false)
  }

  const groupedReactions = React.useMemo(() => {
    if (!message.reactions?.length) return []
    const groups: Record<string, { emoji: string, count: number, tooltip: string, hasReacted: boolean }> = {}
    message.reactions.forEach(r => {
      if (!groups[r.emoji]) groups[r.emoji] = { emoji: r.emoji, count: 0, tooltip: "", hasReacted: false }
      groups[r.emoji].count++
      const userName = r.user?.name || 'Unknown'
      groups[r.emoji].tooltip += (groups[r.emoji].tooltip ? ", " : "") + userName
      if (r.userId === currentUser?.id) groups[r.emoji].hasReacted = true
    })
    return Object.values(groups)
  }, [message.reactions, currentUser])

  const canEdit = React.useMemo(() => {
    if (!isMine || !message.createdAt) return false
    const diff = Date.now() - new Date(message.createdAt).getTime()
    return diff <= 20 * 60 * 1000 // 20 minutes
  }, [isMine, message.createdAt])

  const handleSaveEdit = (newHtmlContent?: string) => {
    const finalContent = newHtmlContent !== undefined ? newHtmlContent : editContent;
    if (!finalContent.trim() || finalContent === message.content) {
      setIsEditing(false)
      return
    }
    const socket = getSocket()
    socket.emit("edit_message", { messageId: message.id, newContent: finalContent })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this message?")) {
      const socket = getSocket()
      socket.emit("delete_message", { messageId: message.id })
    }
  }

  return (
    <div 
      className={`flex gap-3.5 px-6 -mx-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] group transition-colors duration-200 relative ${compact ? 'py-1 mt-0' : 'py-1.5 mt-3'}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <div className={`shrink-0 ${compact ? 'w-9 opacity-0 select-none' : 'mt-1'}`}>
        {/* Avatar */}
        {!compact && (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[14px] overflow-hidden shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            {message.avatar ? (
              <img src={message.avatar} alt={message.userName} className="h-full w-full object-cover" />
            ) : (
              message.userName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0 relative">
        {!compact && (
          <div className="flex items-center gap-2 mb-1 mt-0.5">
            <span className="font-semibold tracking-tight text-[14.5px] text-foreground leading-none truncate">{message.userName}</span>
            <span className="text-[11px] text-muted-foreground font-medium shrink-0 translate-y-[1px]">{message.timestamp}</span>
            {message.isPinned && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-semibold tracking-tight text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full ml-1 shrink-0 whitespace-nowrap" title="Pinned to this conversation">
                <Pin size={10} className="fill-amber-600 shrink-0" /> Pinned {message.pinnedBy && <span className="lowercase font-semibold opacity-90 truncate max-w-[80px]">by {currentUser?.id === message.pinnedBy.id ? 'you' : message.pinnedBy.name.split(" ")[0]}</span>}
              </span>
            )}
          </div>
        )}

        {isEditing ? (
          <MessageEditor
            initialContent={editContent}
            onSave={(newHtml) => {
              setEditContent(newHtml)
              handleSaveEdit(newHtml)
            }}
            onCancel={() => {
              setIsEditing(false)
              setEditContent(message.content)
            }}
          />
        ) : (
          message.content && (
            <div 
              className={`text-foreground mt-0.5 whitespace-pre-wrap break-words prose prose-slate max-w-none prose-p:leading-relaxed prose-p:m-0 prose-pre:m-0 prose-ul:m-0 prose-li:m-0 
              prose-blockquote:border-l-2 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-1
              prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:text-[#eb5757] dark:prose-code:text-[#ff7b72] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-[#0d0d0d] prose-pre:text-[#f8f8f2] prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-2 prose-pre:border prose-pre:border-black/10 dark:prose-pre:border-white/10
              ${
                (() => {
                  const textContent = message.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, '').trim();
                  // Check if it has any letters or numbers. If not, and it has content, it's likely just emojis.
                  const hasAlphanumeric = /[a-zA-Z0-9\p{L}\p{N}]/u.test(textContent);
                  const isOnlyEmojis = textContent.length > 0 && !hasAlphanumeric && /^[\p{Extended_Pictographic}\p{Emoji}\s\n\u200d\ufe0f]+$/u.test(textContent);
                  return isOnlyEmojis ? 'text-4xl leading-tight py-1' : 'text-[15px] prose-sm';
                })()
              }`}
              dangerouslySetInnerHTML={{ __html: message.content }} 
            />
          )
        )}

        {/* Link Previews */}
        {message.linkPreviews && message.linkPreviews.map((preview) => (
          <LinkPreviewCard key={preview.id} preview={preview} />
        ))}

        {/* Images — single image uses rich card, multiple use grid */}
        {imageAttachments.length === 1 && (
          <>
            <ImagePreviewCard att={imageAttachments[0]} onClick={() => setSingleImageLightbox(0)} />
            {singleImageLightbox !== null && (
              <ImageLightbox images={imageAttachments} startIndex={0} onClose={() => setSingleImageLightbox(null)} />
            )}
          </>
        )}
        {imageAttachments.length > 1 && <ImagePreviewGrid images={imageAttachments} />}

        {/* PDF preview cards */}
        {pdfAttachments.map((att) => (
          <PdfPreviewCard key={att.id} att={att} />
        ))}

        {/* Spreadsheet preview cards */}
        {spreadsheetAttachments.map((att) => (
          <SpreadsheetPreviewCard key={att.id} att={att} />
        ))}

        {/* DOCX preview cards */}
        {docxAttachments.map((att) => (
          <DocxPreviewCard key={att.id} att={att} />
        ))}

        {/* ZIP preview cards */}
        {zipAttachments.map((att) => (
          <ZipPreviewCard key={att.id} att={att} />
        ))}

        {/* Rich file preview cards (doc, ppt, code, etc.) */}
        {fileAttachments.map((att) => (
          <RichFileCard key={att.id} att={att} />
        ))}

        {/* Audio Player */}
        {audioAttachments.map((att) => (
          <div key={att.id} className="mt-2 mb-1">
            <VoiceMessagePlayer url={att.url} id={att.id} />
          </div>
        ))}

        {/* Reactions Display */}
        {groupedReactions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {groupedReactions.map(group => (
              <button
                key={group.emoji}
                onClick={() => toggleReaction(group.emoji)}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors border shadow-sm ${group.hasReacted ? 'bg-[#f5f5f7] border-brand-200 text-[#0071e3]' : 'bg-white border-border/50 text-secondary-foreground hover:bg-muted'}`}
                title={group.tooltip}
              >
                <span className="text-[14px] leading-none">{group.emoji}</span>
                <span>{group.count}</span>
              </button>
            ))}

            <div className="relative flex items-center">
              <button
                onClick={() => setShowInlineEmojiPicker(!showInlineEmojiPicker)}
                className="flex items-center justify-center w-[26px] h-[26px] rounded-full bg-secondary border border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm"
                title="Add reaction"
              >
                <SmilePlus size={14} />
              </button>
              {showInlineEmojiPicker && (
                <div className="absolute bottom-full mb-1 left-0 z-30 shadow-xl rounded-lg">
                  <EmojiPicker onEmojiClick={(e) => toggleReaction(e.emoji)} width={300} height={400} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reply Count Indicator */}
        {message.replyCount && message.replyCount > 0 ? (
          <div className="mt-2 mb-1">
            <button 
              onClick={() => { if(onReplyClick) onReplyClick(); }}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#0071e3] hover:text-[#0071e3] hover:underline bg-[#f5f5f7] px-2 py-1 rounded-lg transition-colors"
            >
              <MessageSquareText size={14} />
              {message.replyCount} {message.replyCount === 1 ? "reply" : "replies"}
            </button>
          </div>
        ) : null}
      </div>

      {!isEditing && showOptions && (
        <div className="absolute right-6 -top-4 flex items-center bg-white/90 dark:bg-black/80 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-lg shadow-sm overflow-visible z-20">
          <div className="relative flex items-center">
            {onReplyClick && (
              <button
                onClick={() => { onReplyClick(); setShowOptions(false); }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors rounded-l-lg"
                title="Reply in thread"
              >
                <MessageSquareText size={16} />
              </button>
            )}
            <button
              onClick={() => setShowHoverEmojiPicker(!showHoverEmojiPicker)}
              className={`p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${!onReplyClick ? 'rounded-l-lg' : 'border-l border-black/5 dark:border-white/10'} ${!isMine ? 'rounded-r-lg' : ''}`}
              title="Add reaction"
            >
              <Smile size={16} />
            </button>
            {showHoverEmojiPicker && (
              <div className="absolute top-full mt-1 right-0 z-30 shadow-xl rounded-lg">
                <EmojiPicker onEmojiClick={(e) => toggleReaction(e.emoji)} width={300} height={400} />
              </div>
            )}
            <button
              onClick={() => {
                const socket = getSocket();
                socket.emit("toggle_pin_message", { messageId: message.id });
                setShowOptions(false);
              }}
              className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-l border-black/5 dark:border-white/10"
              title={message.isPinned ? "Unpin message" : "Pin message"}
            >
              <Pin size={16} className={message.isPinned ? "text-amber-500 fill-amber-500" : ""} />
            </button>
          </div>
          {isMine && canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-l border-black/5 dark:border-white/10"
              title="Edit message (within 20 mins)"
            >
              <Pencil size={16} />
            </button>
          )}
          {isMine && (
            <button
              onClick={handleDelete}
              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors rounded-r-lg border-l border-black/5 dark:border-white/10"
              title="Delete message"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
