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

interface BlogContextType {
  blogs: BlogPost[]
  loading: boolean
  error: string | null
  refreshBlogs: () => Promise<void>
  getPublishedBlogs: () => BlogPost[]
  getFeaturedBlogs: () => BlogPost[]
  addBlog: (blog: Omit<BlogPost, 'id' | 'createdAt'>) => Promise<BlogPost>
  updateBlog: (id: number, updatedBlog: Partial<BlogPost>) => Promise<BlogPost>
  deleteBlog: (id: number) => Promise<void>
  toggleFeatured: (id: number) => Promise<BlogPost>
  changeStatus: (id: number, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => Promise<BlogPost>
  uploadImage: (file: File) => Promise<string>
}

const BlogContext = createContext<BlogContextType | undefined>(undefined)

export const useBlog = () => {
  const context = useContext(BlogContext)
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider')
  }
  return context
}

interface BlogProviderProps {
  children: ReactNode
}

const API_BASE = 'http://localhost:8080/api/blogs'

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  return headers
}

// Helper function to make authenticated requests
const makeRequest = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  }

  const response = await fetch(url, defaultOptions)
  
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Không có quyền truy cập. Vui lòng đăng nhập.')
    } else if (response.status === 401) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    } else {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  }
  
  return response
}

export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all blogs from backend
  const refreshBlogs = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try admin endpoint first (with auth), fallback to public endpoint
      let response
      try {
        response = await makeRequest(`${API_BASE}`)
      } catch (adminError) {
        // If admin fails (403/401), try public endpoint for published blogs only
        response = await fetch('http://localhost:8080/api/public/blogs/published')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }
      const data = await response.json()
      setBlogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blogs')
      console.error('Error fetching blogs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load blogs on component mount
  useEffect(() => {
    refreshBlogs()
  }, [])

  const getPublishedBlogs = () => {
    return blogs.filter(blog => blog.status === 'PUBLISHED')
  }

  const getFeaturedBlogs = () => {
    return blogs.filter(blog => blog.status === 'PUBLISHED' && blog.featured)
  }

  const addBlog = async (blogData: Omit<BlogPost, 'id' | 'createdAt'>): Promise<BlogPost> => {
    try {
      const response = await makeRequest(`${API_BASE}`, {
        method: 'POST',
        body: JSON.stringify(blogData),
      })
      
      const newBlog = await response.json()
      setBlogs(prev => [newBlog, ...prev])
      return newBlog
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create blog')
      throw err
    }
  }

  const updateBlog = async (id: number, updatedBlog: Partial<BlogPost>): Promise<BlogPost> => {
    try {
      const response = await makeRequest(`${API_BASE}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedBlog),
      })
      
      const updated = await response.json()
      setBlogs(prev => prev.map(blog => blog.id === id ? updated : blog))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update blog')
      throw err
    }
  }

  const deleteBlog = async (id: number): Promise<void> => {
    try {
      await makeRequest(`${API_BASE}/${id}`, {
        method: 'DELETE',
      })
      
      setBlogs(prev => prev.filter(blog => blog.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blog')
      throw err
    }
  }

  const toggleFeatured = async (id: number): Promise<BlogPost> => {
    try {
      const response = await makeRequest(`${API_BASE}/${id}/featured`, {
        method: 'PUT',
      })
      
      const updated = await response.json()
      setBlogs(prev => prev.map(blog => blog.id === id ? updated : blog))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle featured')
      throw err
    }
  }

  const changeStatus = async (id: number, status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'): Promise<BlogPost> => {
    try {
      const response = await makeRequest(`${API_BASE}/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      
      const updated = await response.json()
      setBlogs(prev => prev.map(blog => blog.id === id ? updated : blog))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change status')
      throw err
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
      
      const response = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        headers,
        body: formData,
      })
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Không có quyền upload hình ảnh. Vui lòng đăng nhập.')
        } else if (response.status === 401) {
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        } else {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
      }
      
      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }
      
      return data.imageUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      throw err
    }
  }

  const value: BlogContextType = {
    blogs,
    loading,
    error,
    refreshBlogs,
    getPublishedBlogs,
    getFeaturedBlogs,
    addBlog,
    updateBlog,
    deleteBlog,
    toggleFeatured,
    changeStatus,
    uploadImage
  }

  return (
    <BlogContext.Provider value={value}>
      {children}
    </BlogContext.Provider>
  )
} 