import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface BlogPost {
  id: number
  title: string
  excerpt: string
  content: string
  author: string
  date?: string
  createdAt?: string
  category: string
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'
  featured: boolean
  readTime: string
  imageUrl?: string
}

interface PublicBlogContextType {
  publishedBlogs: BlogPost[]
  featuredBlogs: BlogPost[]
  loading: boolean
  error: string | null
  refreshBlogs: () => Promise<void>
  getBlogsByCategory: (category: string) => BlogPost[]
  searchBlogs: (query: string) => Promise<BlogPost[]>
}

const PublicBlogContext = createContext<PublicBlogContextType | undefined>(undefined)

export const usePublicBlog = () => {
  const context = useContext(PublicBlogContext)
  if (!context) {
    throw new Error('usePublicBlog must be used within a PublicBlogProvider')
  }
  return context
}

interface PublicBlogProviderProps {
  children: ReactNode
}

// Use environment variable for API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const PUBLIC_API_BASE = `${API_BASE_URL}/public/blogs`

console.log('🔧 PublicBlogContext API Configuration:', { API_BASE_URL, PUBLIC_API_BASE })

export const PublicBlogProvider: React.FC<PublicBlogProviderProps> = ({ children }) => {
  const [publishedBlogs, setPublishedBlogs] = useState<BlogPost[]>([])
  const [featuredBlogs, setFeaturedBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch published blogs from public API
  const refreshBlogs = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch published and featured blogs in parallel
      const [publishedResponse, featuredResponse] = await Promise.all([
        fetch(`${PUBLIC_API_BASE}/published`),
        fetch(`${PUBLIC_API_BASE}/featured`)
      ])

      if (!publishedResponse.ok || !featuredResponse.ok) {
        throw new Error('Failed to fetch blog data')
      }

      const [publishedData, featuredData] = await Promise.all([
        publishedResponse.json(),
        featuredResponse.json()
      ])

      setPublishedBlogs(publishedData)
      setFeaturedBlogs(featuredData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blogs')
      console.error('Error fetching public blogs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load blogs on component mount
  useEffect(() => {
    refreshBlogs()
  }, [])

  const getBlogsByCategory = (category: string) => {
    if (category === 'Tất cả') {
      return publishedBlogs.filter(blog => !blog.featured)
    }
    return publishedBlogs.filter(blog => blog.category === category && !blog.featured)
  }

  const searchBlogs = async (query: string): Promise<BlogPost[]> => {
    try {
      const response = await fetch(`${PUBLIC_API_BASE}/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Search failed')
      }
      return await response.json()
    } catch (err) {
      console.error('Error searching blogs:', err)
      return []
    }
  }

  const value: PublicBlogContextType = {
    publishedBlogs,
    featuredBlogs,
    loading,
    error,
    refreshBlogs,
    getBlogsByCategory,
    searchBlogs
  }

  return (
    <PublicBlogContext.Provider value={value}>
      {children}
    </PublicBlogContext.Provider>
  )
} 