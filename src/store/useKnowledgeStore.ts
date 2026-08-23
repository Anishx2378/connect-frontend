import { create } from 'zustand'

export interface KnowledgeCategory {
  id: string
  name: string
  description?: string
  icon?: string
  createdAt: string
  updatedAt: string
  workspaceId: string
  _count?: {
    articles: number
  }
}

export interface KnowledgeArticle {
  id: string
  title: string
  content: string
  coverImage?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  version: number
  categoryId: string
  workspaceId: string
  authorId: string
  author?: {
    id: string
    name: string
    avatar?: string
  }
  category?: {
    id: string
    name: string
  }
  isFavorited?: boolean
}

interface KnowledgeState {
  categories: KnowledgeCategory[]
  articles: KnowledgeArticle[]
  favorites: KnowledgeArticle[]
  
  setCategories: (categories: KnowledgeCategory[]) => void
  addCategory: (category: KnowledgeCategory) => void
  updateCategory: (id: string, updates: Partial<KnowledgeCategory>) => void
  removeCategory: (id: string) => void
  
  setArticles: (articles: KnowledgeArticle[]) => void
  addArticle: (article: KnowledgeArticle) => void
  updateArticle: (id: string, updates: Partial<KnowledgeArticle>) => void
  removeArticle: (id: string) => void
  
  setFavorites: (favorites: KnowledgeArticle[]) => void
  toggleFavoriteState: (id: string, isFavorited: boolean) => void
}

export const useKnowledgeStore = create<KnowledgeState>((set) => ({
  categories: [],
  articles: [],
  favorites: [],
  
  setCategories: (categories) => set({ categories }),
  addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (id, updates) => set((state) => ({
    categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  removeCategory: (id) => set((state) => ({
    categories: state.categories.filter(c => c.id !== id)
  })),
  
  setArticles: (articles) => set({ articles }),
  addArticle: (article) => set((state) => {
    const exists = state.articles.some(a => a.id === article.id)
    if (exists) {
      return { articles: state.articles.map(a => a.id === article.id ? { ...a, ...article } : a) }
    }
    return { articles: [article, ...state.articles] }
  }),
  updateArticle: (id, updates) => set((state) => ({
    articles: state.articles.map(a => a.id === id ? { ...a, ...updates } : a)
  })),
  removeArticle: (id) => set((state) => ({
    articles: state.articles.filter(a => a.id !== id),
    favorites: state.favorites.filter(a => a.id !== id)
  })),
  
  setFavorites: (favorites) => set({ favorites }),
  toggleFavoriteState: (id, isFavorited) => set((state) => {
    let newFavorites = [...state.favorites]
    if (isFavorited) {
      const article = state.articles.find(a => a.id === id)
      if (article && !newFavorites.some(f => f.id === id)) {
        newFavorites.unshift({ ...article, isFavorited: true })
      }
    } else {
      newFavorites = newFavorites.filter(f => f.id !== id)
    }
    
    return {
      favorites: newFavorites,
      articles: state.articles.map(a => a.id === id ? { ...a, isFavorited } : a)
    }
  })
}))
