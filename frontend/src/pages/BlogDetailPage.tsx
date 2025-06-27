import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, User, Clock, Tag, ArrowLeft, Loader, AlertCircle } from 'lucide-react'

interface BlogPost {
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

const BlogDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) {
        setError('ID bài viết không hợp lệ')
        setLoading(false)
        return
      }

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
    const response = await fetch(`${API_BASE_URL}/public/blogs/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Không tìm thấy bài viết')
          } else {
            setError('Có lỗi xảy ra khi tải bài viết')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setBlog(data)
      } catch (err) {
        setError('Có lỗi xảy ra khi tải bài viết')
        console.error('Error fetching blog:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
  }, [id])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/## (.*?)(<br>|<\/p>)/g, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>')
      .replace(/# (.*?)(<br>|<\/p>)/g, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-6">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/blog')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang blog
          </button>
        </div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy bài viết</h1>
          <p className="text-gray-600 mb-6">Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={() => navigate('/blog')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang blog
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/blog')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang blog
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              <Tag className="w-4 h-4 inline mr-1" />
              {blog.category}
            </span>
            {blog.featured && (
              <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                Bài viết nổi bật
              </span>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
          
          <div className="flex items-center gap-6 text-gray-600">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {blog.author}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {formatDate(blog.createdAt || blog.date)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {blog.readTime}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Featured Image */}
          {blog.imageUrl && (
            <div className="aspect-video w-full">
              <img
                src={blog.imageUrl.startsWith('http') ? blog.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}${blog.imageUrl}`}
                alt={blog.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          <div className="p-8">
            {/* Excerpt */}
            <div className="text-xl text-gray-700 font-medium mb-8 pb-8 border-b border-gray-200">
              {blog.excerpt}
            </div>
            
            {/* Content */}
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatContent(blog.content) }}
            />
          </div>
        </article>
        
        {/* Related Actions */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/blog')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Xem thêm bài viết khác
          </button>
        </div>
      </div>
    </div>
  )
}

export default BlogDetailPage 