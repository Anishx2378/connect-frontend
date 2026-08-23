"use client"

import * as React from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Save, Loader2, Image as ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"
import { useKnowledgeStore } from "@/store/useKnowledgeStore"
import Link from "next/link"

export default function ArticleEditPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  const articleId = params.id as string
  const initialCategoryId = searchParams.get('categoryId')
  const isNew = articleId === 'new'
  
  const activeWorkspaceId = useStore((state) => state.activeWorkspaceId)
  const { categories, addArticle, updateArticle } = useKnowledgeStore()
  
  const [loading, setLoading] = React.useState(!isNew)
  const [saving, setSaving] = React.useState(false)
  
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [categoryId, setCategoryId] = React.useState(initialCategoryId || "")
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState("")
  const [coverImage, setCoverImage] = React.useState("")

  React.useEffect(() => {
    if (categories.length > 0 && !categoryId && isNew) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId, isNew])

  React.useEffect(() => {
    if (!activeWorkspaceId || isNew) return
    
    const fetchArticle = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/knowledge/articles/${articleId}`)
        const article = res.data.data
        setTitle(article.title)
        setContent(article.content)
        setCategoryId(article.categoryId)
        setTags(article.tags || [])
        setCoverImage(article.coverImage || "")
      } catch (error) {
        console.error("Failed to fetch article:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchArticle()
  }, [activeWorkspaceId, articleId, isNew])

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !categoryId) return
    
    setSaving(true)
    try {
      const payload = {
        title,
        content,
        categoryId,
        tags,
        coverImage,
        workspaceId: activeWorkspaceId
      }

      if (isNew) {
        const res = await api.post('/knowledge/articles', payload)
        addArticle(res.data.data)
        router.push(`/knowledge/articles/${res.data.data.id}`)
      } else {
        const res = await api.patch(`/knowledge/articles/${articleId}`, payload)
        updateArticle(articleId, res.data.data)
        router.push(`/knowledge/articles/${articleId}`)
      }
    } catch (error) {
      console.error("Failed to save article:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Topbar */}
      <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 mr-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-slate-900">
            {isNew ? 'Create New Article' : 'Edit Article'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-slate-600 bg-white" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white" onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isNew ? 'Publish' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-6 sm:px-8 space-y-6">
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Article Title</label>
              <Input 
                placeholder="e.g. Employee Onboarding Guide" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold h-12 bg-slate-50 border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-10">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Cover Image URL (Optional)</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://example.com/image.jpg" 
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="bg-slate-50 border-slate-200 h-10 flex-1"
                  />
                  {coverImage && (
                    <div className="h-10 w-10 shrink-0 border border-slate-200 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                      <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-brand-50 text-brand-700 px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1 border border-brand-100">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-brand-900 rounded-full p-0.5 hover:bg-brand-200 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <Input 
                placeholder="Type a tag and press Enter" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="bg-slate-50 border-slate-200 h-10"
              />
            </div>
            
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col" style={{ minHeight: '600px' }}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <h3 className="font-semibold text-slate-900">Content (Markdown)</h3>
              <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded font-medium">Supports GitHub Flavored Markdown</div>
            </div>
            
            <Textarea
              placeholder="Write your article content here using markdown..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none bg-slate-50 border-slate-200 focus-visible:ring-1 p-4 font-mono text-sm leading-relaxed"
            />
          </div>
          
        </div>
      </div>
    </div>
  )
}
