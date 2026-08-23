"use client"

import * as React from "react"
import { 
  Send, 
  Plus, 
  Smile, 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Link as LinkIcon, 
  ListOrdered, 
  List as ListIcon, 
  TextQuote, 
  Code,
  Type,
  AtSign,
  Video,
  Mic,
  TerminalSquare,
  Moon,
  Sun,
  Trash2,
  Square
} from "lucide-react"
import { Button } from "@/components/ui/button"
import EmojiPicker from "emoji-picker-react"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'
import { MentionList } from './MentionList'
import api from '@/lib/api'
import CodeBlock from '@tiptap/extension-code-block'
import { LiveAudioVisualizer } from './LiveAudioVisualizer'

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

interface ChatInputProps {
  placeholder?: string
  onSendMessage: (content: string, file?: File) => void
  onTyping?: (isTyping: boolean) => void
}

export function ChatInput({ placeholder = "Message...", onSendMessage, onTyping }: ChatInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [showFormatting, setShowFormatting] = React.useState(true)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isEmpty, setIsEmpty] = React.useState(true)
  
  // Voice recording state
  const [isRecording, setIsRecording] = React.useState(false)
  const [recordingTime, setRecordingTime] = React.useState(0)
  const [mediaStream, setMediaStream] = React.useState<MediaStream | null>(null)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const typingRef = React.useRef(false)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const isMentionPopupOpenRef = React.useRef(false)
  
  const usersRef = React.useRef<any[]>([])
  
  React.useEffect(() => {
    api.get('/users').then(res => {
      usersRef.current = res.data.data
    }).catch(console.error)
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CustomCodeBlock,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-md cursor-pointer',
        },
        suggestion: {
          items: ({ query }) => {
            const list = usersRef.current.map(u => ({ id: u.id, label: u.name, avatar: u.avatar }))
            list.unshift({ id: 'channel', label: 'channel', avatar: null })
            list.unshift({ id: 'all', label: 'all', avatar: null })
            
            return list.filter(item => item.label.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
          },
          render: () => {
            let component: ReactRenderer
            let popup: any

            return {
              onStart: props => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                })

                if (!props.clientRect) {
                  return
                }

                isMentionPopupOpenRef.current = true

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as any,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'top-start',
                  theme: 'transparent',
                })
              },
              onUpdate(props) {
                component.updateProps(props)

                if (!props.clientRect) {
                  return
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as any,
                })
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup[0].hide()
                  return true
                }
                return (component.ref as any)?.onKeyDown(props)
              },
              onExit() {
                isMentionPopupOpenRef.current = false
                if (popup && popup[0]) {
                  popup[0].destroy()
                }
                component.destroy()
              },
            }
          },
        },
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'w-full max-h-48 min-h-[48px] px-4 py-3 overflow-y-auto bg-transparent outline-none text-[15px] text-foreground prose prose-sm prose-slate max-w-none prose-p:m-0 prose-pre:m-0 prose-ul:m-0 prose-li:m-0',
      },
      handleKeyDown: (view, event) => {
        if (isMentionPopupOpenRef.current && (event.key === 'Enter' || event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
          return false
        }
        if (event.key === 'Enter' && event.shiftKey) {
          // Instead of hard break, split the block so lists work correctly on the new line
          event.preventDefault()
          editor?.commands.splitBlock()
          return true
        }
        if (event.key === 'Enter' && !event.shiftKey) {
          // Allow default Enter behavior (new line/item) inside lists and code blocks
          if (editor?.isActive('bulletList') || editor?.isActive('orderedList') || editor?.isActive('codeBlock')) {
            return false
          }

          event.preventDefault()
          handleSubmit()
          return true
        }
        return false
      }
    },
    onUpdate: ({ editor }) => {
      const isCurrentlyEmpty = editor.isEmpty
      setIsEmpty(isCurrentlyEmpty)
      
      if (!isCurrentlyEmpty) {
        if (!typingRef.current) {
          typingRef.current = true
          onTyping?.(true)
        }
        
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          typingRef.current = false
          onTyping?.(false)
        }, 2000)
      } else {
        if (typingRef.current) {
          typingRef.current = false
          onTyping?.(false)
        }
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }
    },
  })

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!editor) return

    const content = editor.getHTML()
    
    if (isEmpty && !selectedFile) return
    
    // Pass empty string if no text, otherwise pass html
    onSendMessage(isEmpty ? "" : content, selectedFile || undefined)
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (typingRef.current) {
      typingRef.current = false
      onTyping?.(false)
    }
    
    editor.commands.clearContent()
    setIsEmpty(true)
    setSelectedFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      setMediaStream(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error("Error accessing microphone:", err)
    }
  }

  const stopRecording = (cancel = false) => {
    if (mediaRecorderRef.current && isRecording) {
      if (cancel) {
        mediaRecorderRef.current.onstop = () => {
           mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
        }
      } else {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' })
          onSendMessage("", audioFile)
          mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop())
        }
      }
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setMediaStream(null)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }

  return (
    <div className="px-4 pb-6 pt-2 bg-background">
      <form 
        onSubmit={handleSubmit}
        className="flex flex-col bg-white dark:bg-white/[0.02] border border-border rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] focus-within:shadow-sm focus-within:border-black/20 dark:focus-within:border-white/20 transition-all duration-300 relative overflow-hidden"
      >
        {/* Top Formatting Toolbar */}
        {!isRecording && showFormatting && editor && (
          <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border bg-black/[0.01] dark:bg-white/[0.01]">
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('bold') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => editor.chain().focus().toggleBold().run()}>
              <Bold size={14} strokeWidth={2.5} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('italic') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => editor.chain().focus().toggleItalic().run()}>
              <Italic size={14} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('underline') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => editor.chain().focus().toggleUnderline().run()}>
              <UnderlineIcon size={14} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('strike') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough size={14} />
            </Button>
            <div className="w-[1px] h-3 bg-border mx-1" />
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('link') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => {
              const url = window.prompt('URL')
              if (url) editor.chain().focus().setLink({ href: url }).run()
              else if (url === '') editor.chain().focus().unsetLink().run()
            }}>
              <LinkIcon size={14} />
            </Button>
            <div className="w-[1px] h-3 bg-border mx-1" />
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('orderedList') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered size={14} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('bulletList') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => editor.chain().focus().toggleBulletList().run()}>
              <ListIcon size={14} />
            </Button>
            <div className="w-[1px] h-3 bg-border mx-1" />
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('blockquote') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <TextQuote size={14} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('code') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => editor.chain().focus().toggleCode().run()}>
              <Code size={14} />
            </Button>
            <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${editor.isActive('codeBlock') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
              <TerminalSquare size={14} />
            </Button>
            {editor.isActive('codeBlock') && (
              <>
                <div className="w-[1px] h-3 bg-border mx-1" />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-md text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]" 
                  onClick={() => {
                    const currentTheme = editor.getAttributes('codeBlock').theme;
                    editor.commands.updateAttributes('codeBlock', { theme: currentTheme === 'dark' ? 'light' : 'dark' });
                  }}
                  title="Toggle Code Theme"
                >
                  {editor.getAttributes('codeBlock').theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Text Input Area (Tiptap) */}
        {!isRecording ? (
          <>
            <div className="relative">
              <style dangerouslySetInnerHTML={{__html: `
                .is-editor-empty:first-child::before {
                  content: attr(data-placeholder);
                  float: left;
                  color: #64748b;
                  pointer-events: none;
                  height: 0;
                }
              `}} />
              <EditorContent editor={editor} />
            </div>

            {/* File Attachment Pill */}
            {selectedFile && (
              <div className="px-3 pb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-primary">
                  <span className="truncate max-w-[200px] font-medium">{selectedFile.name}</span>
                  <button 
                    type="button" 
                    className="text-primary hover:text-primary p-0.5 rounded-full hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-2 pb-2 mt-1">
              <div className="flex items-center gap-1">
                {/* Attach File (Plus icon) */}
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus size={18} />
                </Button>
                
                {/* Toggle Formatting */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 rounded-full transition-colors ${showFormatting ? 'bg-primary/10 text-primary hover:text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`}
                  onClick={() => setShowFormatting(!showFormatting)}
                >
                  <Type size={16} strokeWidth={2.5} />
                </Button>
                
                {/* Emoji */}
                <div className="relative">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-full transition-colors ${showEmojiPicker ? 'bg-primary/10 text-primary hover:text-primary' : 'text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'}`}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile size={18} />
                  </Button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-10 left-0 z-50 shadow-xl rounded-xl bg-background border border-border">
                      <EmojiPicker 
                        onEmojiClick={(emojiData) => {
                          if (editor) editor.chain().focus().insertContent(emojiData.emoji).run()
                          setShowEmojiPicker(false)
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Mentions */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
                  onClick={() => {
                    if (editor) editor.chain().focus().insertContent('@').run()
                  }}
                >
                  <AtSign size={18} />
                </Button>

                <div className="w-[1px] h-4 bg-border mx-1" />

                {/* Video */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
                >
                  <Video size={18} />
                </Button>

                {/* Mic */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
                  onClick={startRecording}
                >
                  <Mic size={18} />
                </Button>
              </div>

              {/* Send Button */}
              <div className="flex items-center gap-2 pr-1">
                <Button 
                  type="submit" 
                  disabled={isEmpty && !selectedFile}
                  size="icon" 
                  className={`h-8 w-8 rounded-lg transition-all ${
                    (isEmpty && !selectedFile) 
                      ? 'bg-transparent text-muted-foreground/30' 
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm'
                  }`}
                >
                  <Send size={15} strokeWidth={2.5} className={`${(isEmpty && !selectedFile) ? '' : 'translate-x-[1px]'}`} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 flex items-center justify-between bg-background rounded-xl border-t-0 mx-0 mt-0">
            <div className="flex items-center gap-3 ml-2 flex-shrink-0">
              <div className="h-3.5 w-3.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-200" />
              <span className="font-semibold text-foreground tracking-wide text-sm font-mono w-12">
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            <div className="flex-1 mx-6 flex items-center">
              <LiveAudioVisualizer stream={mediaStream} />
            </div>

            <div className="flex items-center gap-2 mr-1 flex-shrink-0">
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => stopRecording(true)}>
                <Trash2 size={16} className="mr-1.5" />
                Cancel
              </Button>
              <Button type="button" size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm rounded-full px-4" onClick={() => stopRecording(false)}>
                <Send size={14} className="mr-1.5" />
                Send
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
