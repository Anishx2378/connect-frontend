"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Book, Bookmark, Clock, Plus, ArrowRight, Library, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { useStore } from "@/store/useStore"
import { useKnowledgeStore } from "@/store/useKnowledgeStore"

export default function KnowledgeBaseHub() {
  const router = useRouter()
  const activeWorkspaceId = useStore((state) => state.activeWorkspaceId)
  
  const { categories, articles, favorites, setCategories, setArticles, setFavorites } = useKnowledgeStore()
  
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    if (!activeWorkspaceId) return
    
    const fetchKbData = async () => {
      setLoading(true)
      try {
        const [catsRes, articlesRes, favsRes] = await Promise.all([
          api.get(`/knowledge/categories?workspaceId=${activeWorkspaceId}`),
          api.get(`/knowledge/articles?workspaceId=${activeWorkspaceId}&limit=5`),
          api.get(`/knowledge/favorites?workspaceId=${activeWorkspaceId}`)
        ])
        
        setCategories(catsRes.data.data)
        setArticles(articlesRes.data.data)
        setFavorites(favsRes.data.data)
      } catch (error) {
        console.error("Failed to fetch knowledge base data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchKbData()
  }, [activeWorkspaceId, setCategories, setArticles, setFavorites])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header / Hero Section */}
      <div className="bg-white border-b border-slate-200 px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 mb-2 shadow-sm">
            <Library className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">How can we help?</h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">Search our knowledge base for SOPs, guidelines, product specs, and more.</p>
          
          <div className="max-w-2xl mx-auto relative mt-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search for articles, policies, or topics..." 
              className="pl-12 h-14 text-base bg-slate-50 border-slate-200 rounded-xl shadow-sm hover:border-brand-300 focus:border-brand-500 focus:ring-brand-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Categories Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Book className="h-5 w-5 text-brand-500" /> Browse Categories
              </h2>
              <Button variant="outline" size="sm" className="text-slate-600 bg-white" onClick={() => {/* TODO: Implement create category modal */}}>
                <Plus className="h-4 w-4 mr-2" /> New Category
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <div 
                  key={category.id} 
                  onClick={() => router.push(`/knowledge/categories/${category.id}`)}
                  className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-brand-50 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100" />
                  <div className="relative">
                    <h3 className="font-semibold text-slate-900 text-lg mb-2 group-hover:text-brand-600 transition-colors">{category.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] mb-4">
                      {category.description || "No description provided."}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                      <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        {category._count?.articles || 0} articles
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500 transition-colors transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredCategories.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <p className="text-slate-500">No categories found matching your search.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Favorites */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Bookmark className="h-5 w-5 text-amber-500" /> Favorites
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {favorites.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {favorites.map(article => (
                      <div 
                        key={article.id} 
                        onClick={() => router.push(`/knowledge/articles/${article.id}`)}
                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="mt-1 bg-amber-50 p-1.5 rounded text-amber-600 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 text-sm mb-1">{article.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{article.category?.name}</span>
                            <span>•</span>
                            <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    You haven't favorited any articles yet.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Articles */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-500" /> Recently Updated
              </h2>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {articles.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {articles.map(article => (
                      <div 
                        key={article.id} 
                        onClick={() => router.push(`/knowledge/articles/${article.id}`)}
                        className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="mt-1 bg-blue-50 p-1.5 rounded text-blue-600 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 text-sm mb-1">{article.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>By {article.author?.name}</span>
                            <span>•</span>
                            <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No articles have been created recently.
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
