"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit, Bookmark, Share2, Clock, Calendar, FileText, ChevronLeft, ChevronRight, Hash, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"
import { KnowledgeArticle } from "@/store/useKnowledgeStore"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function ArticleReadingPage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string
  const activeWorkspaceId = useStore((state) => state.activeWorkspaceId)
  
  const [article, setArticle] = React.useState<KnowledgeArticle | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [sidebarOpen, setSidebarOpen] = React.useState(true)
  const [relatedArticles, setRelatedArticles] = React.useState<KnowledgeArticle[]>([])

  React.useEffect(() => {
    if (!activeWorkspaceId || !articleId) return
    
    const fetchArticle = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/knowledge/articles/${articleId}`)
        setArticle(res.data.data)
        
        // Fetch related articles from same category
        if (res.data.data.categoryId) {
          const relRes = await api.get(`/knowledge/articles?workspaceId=${activeWorkspaceId}&categoryId=${res.data.data.categoryId}&limit=5`)
          setRelatedArticles(relRes.data.data.filter((a: any) => a.id !== articleId))
        }
      } catch (error) {
        console.error("Failed to fetch article:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (articleId !== 'new') {
      fetchArticle()
    }
  }, [activeWorkspaceId, articleId])

  const toggleFavorite = async () => {
    if (!article) return
    try {
      const res = await api.post(`/knowledge/articles/${article.id}/favorite`)
      setArticle({ ...article, isFavorited: res.data.data.isFavorited })
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
    }
  }

  const shareArticle = () => {
    navigator.clipboard.writeText(window.location.href)
    alert("Article link copied to clipboard!")
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white">
        <div className="h-14 border-b border-slate-200 bg-slate-50/50 flex items-center px-6">
           <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-slate-200 rounded mb-8"></div>
            <div className="h-4 w-full max-w-2xl bg-slate-200 rounded mb-4"></div>
            <div className="h-4 w-full max-w-xl bg-slate-200 rounded mb-4"></div>
            <div className="h-4 w-full max-w-2xl bg-slate-200 rounded mb-4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 h-full">
        <FileText className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Article not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/knowledge")}>
          Back to Knowledge Base
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Topbar / Breadcrumbs */}
      <div className="h-14 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-500 overflow-hidden">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 mr-2" onClick={() => router.push(`/knowledge/categories/${article.categoryId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Link href="/knowledge" className="hover:text-brand-600 transition-colors whitespace-nowrap">Knowledge Base</Link>
          <span className="text-slate-300">/</span>
          <Link href={`/knowledge/categories/${article.categoryId}`} className="hover:text-brand-600 transition-colors whitespace-nowrap truncate max-w-[150px]">
            {article.category?.name}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-medium truncate">{article.title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700" onClick={shareArticle}>
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
          <Button variant="ghost" size="sm" className={article.isFavorited ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50" : "text-slate-500 hover:text-slate-700"} onClick={toggleFavorite}>
            {article.isFavorited ? <BookmarkCheck className="h-4 w-4 mr-2 fill-current" /> : <Bookmark className="h-4 w-4 mr-2" />}
            {article.isFavorited ? 'Favorited' : 'Favorite'}
          </Button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white" onClick={() => router.push(`/knowledge/articles/${article.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Category Context */}
        {sidebarOpen && (
          <div className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-slate-200/60 bg-slate-50/80 sticky top-0 backdrop-blur-sm">
              <h3 className="font-semibold text-slate-900 text-sm">{article.category?.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Articles in this category</p>
            </div>
            <div className="p-2 space-y-0.5">
              <div className="px-3 py-2 bg-brand-50 text-brand-700 rounded-md text-sm font-medium">
                <FileText className="h-4 w-4 inline-block mr-2 text-brand-500" />
                {article.title}
              </div>
              {relatedArticles.map(rel => (
                <Link key={rel.id} href={`/knowledge/articles/${rel.id}`} className="block px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md text-sm transition-colors truncate">
                  <FileText className="h-4 w-4 inline-block mr-2 text-slate-400" />
                  {rel.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-white relative scroll-smooth">
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute left-4 top-4 h-8 w-8 rounded-full shadow-sm bg-white/80 backdrop-blur border-slate-200 z-10 text-slate-500 hover:text-slate-700 hidden md:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          <div className="max-w-3xl mx-auto py-12 px-8 sm:px-12 min-h-full">
            {article.coverImage && (
              <img src={article.coverImage} alt="Cover" className="w-full h-64 object-cover rounded-xl mb-12 shadow-sm border border-slate-100" />
            )}
            
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-12 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img src={article.author?.avatar || "/default-avatar.png"} alt={article.author?.name} className="h-6 w-6 rounded-full object-cover bg-slate-200" />
                <span className="font-medium text-slate-700">{article.author?.name}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                Updated {new Date(article.updatedAt).toLocaleDateString()}
              </div>
            </div>

            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-a:text-brand-600 hover:prose-a:text-brand-500 prose-img:rounded-xl">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {article.content || "*No content*"}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Info Panel */}
        <div className="w-72 border-l border-slate-200 bg-slate-50/30 shrink-0 overflow-y-auto hidden xl:block">
          <div className="p-6 space-y-8">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">About this article</h4>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">Created</div>
                    <div className="text-slate-500 text-xs">{new Date(article.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">Last Modified</div>
                    <div className="text-slate-500 text-xs">{new Date(article.updatedAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-700">Version</div>
                    <div className="text-slate-500 text-xs">v{article.version}</div>
                  </div>
                </div>
              </div>
            </div>

            {article.tags && article.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map(tag => (
                    <span key={tag} className="bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
