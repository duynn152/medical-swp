import React, { useState, useEffect } from 'react'
import { Send, User, MessageCircle } from 'lucide-react'
import { apiService, CreateCommentRequest } from '../utils/api'
import toast from 'react-hot-toast'

interface CommentFormProps {
  blogPostId: number
  onCommentAdded: () => void
}

const CommentForm: React.FC<CommentFormProps> = ({ blogPostId, onCommentAdded }) => {
  const [formData, setFormData] = useState<CreateCommentRequest>({
    authorName: '',
    content: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<CreateCommentRequest>>({})
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check if user is logged in and auto-fill name
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        setFormData(prev => ({
          ...prev,
          authorName: user.fullName || user.username || ''
        }))
        setIsLoggedIn(true)
      } catch (error) {
        console.error('Error parsing user info:', error)
      }
    }
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateCommentRequest> = {}

    if (!formData.authorName.trim()) {
      newErrors.authorName = 'Vui lòng nhập tên của bạn'
    } else if (formData.authorName.length > 100) {
      newErrors.authorName = 'Tên không được vượt quá 100 ký tự'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Vui lòng nhập nội dung bình luận'
    } else if (formData.content.length > 1000) {
      newErrors.content = 'Bình luận không được vượt quá 1000 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name as keyof CreateCommentRequest]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await apiService.createComment(blogPostId, formData)
      
      if (response.success) {
        toast.success(response.message || 'Bình luận đã được thêm thành công!')
        
        // Reset form
        setFormData({
          authorName: '',
          content: ''
        })
        
        // Notify parent component to refresh comments
        onCommentAdded()
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi thêm bình luận')
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi thêm bình luận')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
        Để lại bình luận
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              id="authorName"
              name="authorName"
              value={formData.authorName}
              onChange={handleInputChange}
              disabled={isLoggedIn}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                isLoggedIn 
                  ? 'bg-gray-50 cursor-not-allowed text-gray-600' 
                  : errors.authorName 
                    ? 'border-red-500' 
                    : 'border-gray-300'
              }`}
              placeholder={isLoggedIn ? "Tên của bạn đã được tự động điền" : "Nhập họ và tên của bạn"}
              maxLength={100}
            />
          </div>
          {errors.authorName && (
            <p className="mt-1 text-sm text-red-600">{errors.authorName}</p>
          )}
        </div>

        {/* Content Field */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Nội dung bình luận *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${
              errors.content ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.content ? (
              <p className="text-sm text-red-600">{errors.content}</p>
            ) : (
              <p className="text-sm text-gray-500">
                Tối đa 1000 ký tự ({formData.content.length}/1000)
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            } text-white`}
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Đang gửi...' : 'Gửi bình luận'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default CommentForm 