import React, { useState, useEffect, useMemo } from 'react'
import { useBlog, BlogPost } from '../contexts/BlogContext'
import { 
  Plus, Edit2, Trash2, Eye, AlertCircle, 
  Loader, Search, Filter, Calendar, Tag, User,
  Upload, X, ImageIcon, Save
} from 'lucide-react'
import { runDebug } from '../utils/debug'

const BlogControlPage = () => {
  const { 
    blogs, 
    loading,
    error,
    addBlog,
    updateBlog,
    deleteBlog, 
    toggleFeatured, 
    changeStatus,
    uploadImage
  } = useBlog()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showModal, setShowModal] = useState(false)
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null)
  const [actionLoading, setActionLoading] = useState<{ [key: number]: string }>({})
  const [formLoading, setFormLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})
  const [selectedBlogs, setSelectedBlogs] = useState<number[]>([])

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    author: '',
    category: 'Tim mạch',
    status: 'DRAFT' as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
    featured: false,
    readTime: '',
    imageUrl: ''
  })

  const categories = ["Tim mạch", "Ung thư", "Tiểu đường", "Phòng bệnh", "Thể dục", "Tâm thần"]

  const filteredBlogs = searchTerm === '' && statusFilter === 'all' && categoryFilter === 'all' 
    ? blogs
    : blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             blog.author.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || blog.status === statusFilter.toUpperCase()
        const matchesCategory = categoryFilter === 'all' || blog.category === categoryFilter
        
        return matchesSearch && matchesStatus && matchesCategory
      }).sort((a, b) => {
        let compareResult = 0
        
        switch (sortBy) {
          case 'status':
            compareResult = a.status.localeCompare(b.status)
            break
          case 'title':
            compareResult = a.title.localeCompare(b.title)
            break
          case 'author':
            compareResult = a.author.localeCompare(b.author)
            break
          case 'category':
            compareResult = a.category.localeCompare(b.category)
            break
          case 'date':
          default:
            const dateA = new Date(a.date || a.createdAt || 0).getTime()
            const dateB = new Date(b.date || b.createdAt || 0).getTime()
            compareResult = dateA - dateB
            break
        }
        
        return sortOrder === 'asc' ? compareResult : -compareResult
      })

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBlogs(filteredBlogs.map(blog => blog.id))
    } else {
      setSelectedBlogs([])
    }
  }

  const handleSelectBlog = (blogId: number, checked: boolean) => {
    if (checked) {
      setSelectedBlogs(prev => [...prev, blogId])
    } else {
      setSelectedBlogs(prev => prev.filter(id => id !== blogId))
    }
  }

  const isAllSelected = filteredBlogs.length > 0 && selectedBlogs.length === filteredBlogs.length
  const isIndeterminate = selectedBlogs.length > 0 && selectedBlogs.length < filteredBlogs.length

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedBlogs.length === 0) return
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedBlogs.length} bài viết đã chọn?`)) {
      setActionLoading(prev => {
        const newState = { ...prev }
        selectedBlogs.forEach(id => {
          newState[id] = 'delete'
        })
        return newState
      })
      
      try {
        await Promise.all(selectedBlogs.map(id => deleteBlog(id)))
        setSelectedBlogs([])
      } catch (error) {
        console.error('Error deleting blogs:', error)
        alert('Có lỗi xảy ra khi xóa các bài viết')
      } finally {
        setActionLoading(prev => {
          const newState = { ...prev }
          selectedBlogs.forEach(id => {
            delete newState[id]
          })
          return newState
        })
      }
    }
  }

  const handleBulkStatusChange = async (newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    if (selectedBlogs.length === 0) return
    
    setActionLoading(prev => {
      const newState = { ...prev }
      selectedBlogs.forEach(id => {
        newState[id] = 'status'
      })
      return newState
    })
    
    try {
      await Promise.all(selectedBlogs.map(id => changeStatus(id, newStatus)))
      setSelectedBlogs([])
    } catch (error) {
      console.error('Error changing status:', error)
      alert('Có lỗi xảy ra khi thay đổi trạng thái')
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        selectedBlogs.forEach(id => {
          delete newState[id]
        })
        return newState
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      author: '',
      category: 'Tim mạch',
      status: 'DRAFT',
      featured: false,
      readTime: '',
      imageUrl: ''
    })
    setFormErrors({})
  }

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {}

    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề là bắt buộc'
    } else if (formData.title.length > 200) {
      errors.title = 'Tiêu đề không được vượt quá 200 ký tự'
    }

    if (!formData.excerpt.trim()) {
      errors.excerpt = 'Tóm tắt là bắt buộc'
    } else if (formData.excerpt.length > 500) {
      errors.excerpt = 'Tóm tắt không được vượt quá 500 ký tự'
    }

    if (!formData.content.trim()) {
      errors.content = 'Nội dung là bắt buộc'
    }

    if (!formData.author.trim()) {
      errors.author = 'Tác giả là bắt buộc'
    } else if (formData.author.length > 100) {
      errors.author = 'Tên tác giả không được vượt quá 100 ký tự'
    }

    if (formData.readTime && formData.readTime.length > 20) {
      errors.readTime = 'Thời gian đọc không được vượt quá 20 ký tự'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setFormLoading(true)
    try {
      if (editingBlog) {
        // Update existing blog
        await updateBlog(editingBlog.id, formData)
      } else {
        // Create new blog
        await addBlog(formData)
      }
      
      setShowModal(false)
      resetForm()
      setEditingBlog(null)
    } catch (error) {
      console.error('Error saving blog:', error)
      alert(editingBlog ? 'Có lỗi xảy ra khi cập nhật bài viết' : 'Có lỗi xảy ra khi tạo bài viết')
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddBlog = () => {
    resetForm()
    setEditingBlog(null)
    setShowModal(true)
  }

  const handleEditBlog = (blog: BlogPost) => {
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      author: blog.author,
      category: blog.category,
      status: blog.status,
      featured: blog.featured,
      readTime: blog.readTime || '',
      imageUrl: blog.imageUrl || ''
    })
    setEditingBlog(blog)
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
    setEditingBlog(null)
  }

  const handleDeleteBlog = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      setActionLoading(prev => ({ ...prev, [id]: 'delete' }))
      try {
        await deleteBlog(id)
      } catch (error) {
        console.error('Error deleting blog:', error)
        alert('Có lỗi xảy ra khi xóa bài viết')
      } finally {
        setActionLoading(prev => {
          const newState = { ...prev }
          delete newState[id]
          return newState
        })
      }
    }
  }

  const handleToggleFeatured = async (id: number) => {
    setActionLoading(prev => ({ ...prev, [id]: 'featured' }))
    try {
      await toggleFeatured(id)
    } catch (error) {
      console.error('Error toggling featured:', error)
      alert('Có lỗi xảy ra khi thay đổi trạng thái nổi bật')
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    }
  }

  const handleChangeStatus = async (id: number, newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    setActionLoading(prev => ({ ...prev, [id]: 'status' }))
    try {
      await changeStatus(id, newStatus)
    } catch (error) {
      console.error('Error changing status:', error)
      alert('Có lỗi xảy ra khi thay đổi trạng thái')
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return
    
    setImageUploading(true)
    try {
      const imageUrl = await uploadImage(file)
      handleInputChange('imageUrl', imageUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Có lỗi xảy ra khi upload hình ảnh: ' + error)
    } finally {
      setImageUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Blog</h1>
          <p className="text-gray-600">Quản lý tất cả bài viết blog y khoa (Dữ liệu từ Database)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => runDebug()}
            className="bg-yellow-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition-colors text-sm"
            title="Debug authentication - Mở Console (F12) để xem kết quả"
          >
            🔍 Debug Auth
          </button>
          <button
            onClick={handleAddBlog}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm bài viết mới
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="min-w-[150px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="min-w-[150px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="author">Sort by Author</option>
              <option value="status">Sort by Status</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="min-w-[120px]">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBlogs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-blue-700 font-medium">
                Đã chọn {selectedBlogs.length} bài viết
              </span>
              <button
                onClick={() => setSelectedBlogs([])}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Bỏ chọn tất cả
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as any)
                    e.target.value = ''
                  }
                }}
                className="px-3 py-1 text-sm border border-blue-300 rounded-md bg-white"
                defaultValue=""
              >
                <option value="" disabled>Thay đổi trạng thái</option>
                <option value="PUBLISHED">Đã xuất bản</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
              </select>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Xóa đã chọn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{blogs.length}</div>
          <div className="text-sm text-gray-600">Tổng bài viết</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {blogs.filter(b => b.status === 'PUBLISHED').length}
          </div>
          <div className="text-sm text-gray-600">Đã xuất bản</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">
            {blogs.filter(b => b.status === 'DRAFT').length}
          </div>
          <div className="text-sm text-gray-600">Bản nháp</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-red-600">
            {blogs.filter(b => b.featured).length}
          </div>
          <div className="text-sm text-gray-600">Bài nổi bật</div>
        </div>
      </div>

      {/* Blog List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bài viết
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tác giả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBlogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedBlogs.includes(blog.id)}
                      onChange={(e) => handleSelectBlog(blog.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      {/* Image Thumbnail */}
                      <div className="flex-shrink-0">
                        {blog.imageUrl ? (
                          <img
                            src={blog.imageUrl.startsWith('http') ? blog.imageUrl : `http://localhost:8080/api${blog.imageUrl}`}
                            alt={blog.title}
                            className="w-16 h-16 object-cover rounded-md border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI0IDI4TDMwIDM0TDM2IDI4TDQwIDMyVjQwSDI0VjI4WiIgZmlsbD0iI0E3QjJCOSIvPgo8Y2lyY2xlIGN4PSIyOCIgY3k9IjI2IiByPSIyIiBmaWxsPSIjQTdCMkI5Ii8+Cjwvc3ZnPgo=';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {blog.title}
                          </div>
                          {blog.featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Nổi bật
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {blog.excerpt}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {blog.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-900">{blog.author}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {blog.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={blog.status}
                      onChange={(e) => handleChangeStatus(blog.id, e.target.value as any)}
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 ${getStatusColor(blog.status)}`}
                    >
                      <option value="PUBLISHED">Đã xuất bản</option>
                      <option value="DRAFT">Bản nháp</option>
                      <option value="ARCHIVED">Đã lưu trữ</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(blog.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(`/blog/${blog.id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Xem bài viết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditBlog(blog)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa bài viết"
                        disabled={actionLoading[blog.id] === 'delete'}
                      >
                        {actionLoading[blog.id] === 'delete' ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(blog.id)}
                        className={`${blog.featured ? 'text-red-600 hover:text-red-900' : 'text-gray-400 hover:text-gray-600'}`}
                        title={blog.featured ? 'Bỏ nổi bật' : 'Đặt nổi bật'}
                        disabled={actionLoading[blog.id] === 'featured'}
                      >
                        {actionLoading[blog.id] === 'featured' ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          '⭐'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBlogs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">Không tìm thấy bài viết nào</div>
            <button
              onClick={handleAddBlog}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Thêm bài viết đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit Blog */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingBlog ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Title */}
                <div className="flex flex-col">
                  <label htmlFor="title" className="text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Nhập tiêu đề bài viết..."
                    className={`mt-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.title && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>
                  )}
                </div>

                {/* Excerpt */}
                <div className="flex flex-col">
                  <label htmlFor="excerpt" className="text-sm font-medium text-gray-700 mb-1">
                    Tóm tắt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="excerpt"
                    name="excerpt"
                    rows={3}
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    placeholder="Nhập tóm tắt ngắn gọn về bài viết..."
                    className={`mt-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      formErrors.excerpt ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.excerpt && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.excerpt}</p>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col">
                  <label htmlFor="content" className="text-sm font-medium text-gray-700 mb-1">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    rows={8}
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Nhập nội dung chi tiết của bài viết..."
                    className={`mt-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      formErrors.content ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {formErrors.content && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.content}</p>
                  )}
                </div>

                {/* Image Upload */}
                <div className="flex flex-col">
                  <label htmlFor="imageUrl" className="text-sm font-medium text-gray-700 mb-1">
                    Hình ảnh
                  </label>
                  <div className="space-y-3">
                    {imageUploading && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Loader className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Đang upload hình ảnh...</span>
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      disabled={imageUploading}
                      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    
                    {/* Preview uploaded image */}
                    {formData.imageUrl && (
                      <div className="relative">
                        <img
                          src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `http://localhost:8080/api${formData.imageUrl}`}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTI0IDI4TDMwIDM0TDM2IDI4TDQwIDMyVjQwSDI0VjI4WiIgZmlsbD0iI0E3QjJCOSIvPgo8Y2lyY2xlIGN4PSIyOCIgY3k9IjI2IiByPSIyIiBmaWxsPSIjQTdCMkI5Ii8+Cjwvc3ZnPgo=';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleInputChange('imageUrl', '')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Hỗ trợ định dạng: JPG, PNG, GIF, WebP. Kích thước tối đa: 5MB
                    </p>
                  </div>
                </div>

                {/* Two columns layout for Author and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Author */}
                  <div className="flex flex-col">
                    <label htmlFor="author" className="text-sm font-medium text-gray-700 mb-1">
                      Tác giả <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      placeholder="Nhập tên tác giả..."
                      className={`mt-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.author ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.author && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.author}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="flex flex-col">
                    <label htmlFor="category" className="text-sm font-medium text-gray-700 mb-1">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Two columns layout for Status and Read Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="flex flex-col">
                    <label htmlFor="status" className="text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value as any)}
                      className="mt-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="DRAFT">Bản nháp</option>
                      <option value="PUBLISHED">Đã xuất bản</option>
                      <option value="ARCHIVED">Đã lưu trữ</option>
                    </select>
                  </div>

                  {/* Read Time */}
                  <div className="flex flex-col">
                    <label htmlFor="readTime" className="text-sm font-medium text-gray-700 mb-1">
                      Thời gian đọc
                    </label>
                    <input
                      type="text"
                      id="readTime"
                      name="readTime"
                      value={formData.readTime}
                      onChange={(e) => handleInputChange('readTime', e.target.value)}
                      placeholder="vd: 5 phút"
                      className={`mt-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.readTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.readTime && (
                      <p className="mt-1 text-xs text-red-500">{formErrors.readTime}</p>
                    )}
                  </div>
                </div>

                {/* Featured */}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="featured"
                    name="featured"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                    Đánh dấu là bài viết nổi bật
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={formLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingBlog ? 'Cập nhật' : 'Tạo mới'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogControlPage 