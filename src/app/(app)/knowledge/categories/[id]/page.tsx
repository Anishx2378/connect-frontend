"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Search, FileText, Clock, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"
import { KnowledgeArticle, KnowledgeCategory } from "@/store/useKnowledgeStore"
import Link from "next/link"

export default function KnowledgeCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const categoryId = params.id as string
  const activeWorkspaceId = useStore((state) => state.activeWorkspaceId)
  
  const [category, setCategory] = React.useState<KnowledgeCategory | null>(null)
  const [articles, setArticles] = React.useState<KnowledgeArticle[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    if (!activeWorkspaceId || !categoryId) return
    
    const fetchCategoryAndArticles = async () => {
      setLoading(true)
      try {
        const [catRes, artRes] = await Promise.all([
          api.get(`/knowledge/categories?workspaceId=${activeWorkspaceId}`), // We fetch all to find the specific one since no single endpoint was created for category details, wait, I can just use the articles endpoint which returns the category info, or filter the categories list.
          api.get(`/knowledge/articles?workspaceId=${activeWorkspaceId}&categoryId=${categoryId}`)
        ])
        
        const foundCat = catRes.data.data.find((c: any) => c.id === categoryId)
        if (foundCat) setCategory(foundCat)
        
        setArticles(artRes.data.data)
      } catch (error) {
        console.error("Failed to fetch category data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCategoryAndArticles()
  }, [activeWorkspaceId, categoryId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 h-full">
        <FileText className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900">Category not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/knowledge")}>
          Back to Knowledge Base
        </Button>
      </div>
    )
  }

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (a.tags && a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-6 sm:px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/knowledge" className="hover:text-brand-600 transition-colors">Knowledge Base</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{category.name}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{category.name}</h1>
              {category.description && (
                <p className="text-slate-500 mt-1 text-base max-w-2xl">{category.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="text-slate-600">
                <Settings2 className="h-4 w-4 mr-2" /> Settings
              </Button>
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700" onClick={() => router.push(`/knowledge/articles/new?categoryId=${category.id}`)}>
                <Plus className="h-4 w-4 mr-2" /> New Article
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 sm:p-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search articles in this category..." 
                className="pl-9 bg-white border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500 font-medium">
              {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {filteredArticles.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filteredArticles.map(article => (
                  <div 
                    key={article.id} 
                    onClick={() => router.push(`/knowledge/articles/${article.id}`)}
                    className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="mt-0.5 bg-slate-100 p-2 rounded-lg text-slate-500 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate mb-1">
                          {article.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <img src={article.author?.avatar || "/default-avatar.png"} alt={article.author?.name} className="h-4 w-4 rounded-full object-cover bg-slate-200" />
                            {article.author?.name}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Updated {new Date(article.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0 sm:justify-end">
                        {article.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                            {tag}
                          </span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                            +{article.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No articles found</h3>
                <p className="text-slate-500 max-w-sm mb-6">
                  {searchQuery ? "No articles match your search criteria." : "This category is empty. Create the first article to get started."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => router.push(`/knowledge/articles/new?categoryId=${category.id}`)} className="bg-brand-600 hover:bg-brand-700">
                    <Plus className="h-4 w-4 mr-2" /> Create First Article
                  </Button>
                )}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}
