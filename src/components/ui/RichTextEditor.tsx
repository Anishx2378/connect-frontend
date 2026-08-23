import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { Bold, Italic, Strikethrough, Underline as UnderlineIcon, List, ListOrdered, Link as LinkIcon, Quote, Code } from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50/50 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : ''}`}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : ''}`}
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${editor.isActive('underline') ? 'bg-slate-200 text-slate-900' : ''}`}
      >
        <UnderlineIcon size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${editor.isActive('strike') ? 'bg-slate-200 text-slate-900' : ''}`}
      >
        <Strikethrough size={16} />
      </button>
      
      <div className="w-px h-4 bg-slate-300 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : ''}`}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : ''}`}
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : ''}`}
      >
        <Quote size={16} />
      </button>
      
      <div className="w-px h-4 bg-slate-300 mx-1" />
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${editor.isActive('codeBlock') ? 'bg-slate-200 text-slate-900' : ''}`}
      >
        <Code size={16} />
      </button>
      
      <button
        type="button"
        onClick={() => {
          const previousUrl = editor.getAttributes('link').href
          const url = window.prompt('URL', previousUrl)
          if (url === null) {
            return
          }
          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
          }
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }}
        className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${editor.isActive('link') ? 'bg-slate-200 text-slate-900' : ''}`}
      >
        <LinkIcon size={16} />
      </button>
    </div>
  )
}

export function RichTextEditor({ content, onChange, placeholder = 'Add description...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-slate max-w-none focus:outline-none min-h-[150px] p-4 bg-white rounded-b-lg border border-t-0 border-slate-200',
      },
    },
  })

  return (
    <div className="rounded-lg shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
