import React, { useState, useEffect } from 'react'
import { MessageCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { apiService, Comment as CommentType } from '../utils/api'
import Comment from './Comment'
import CommentForm from './CommentForm'
import toast from 'react-hot-toast'

interface CommentListProps {
  blogPostId: number
}

const CommentList: React.FC<CommentListProps> = ({ blogPostId }) => {
  const [comments, setComments] = useState<CommentType[]>([])
  const [commentsCount, setCommentsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiService.getCommentsByBlogPost(blogPostId)
      
      if (response.success) {
        setComments(response.comments || [])
        setCommentsCount(response.count || 0)
      } else {
        setError('Không thể tải bình luận')
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
      setError('Có lỗi xảy ra khi tải bình luận')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommentAdded = () => {
    // Refresh comments when a new comment is added
    fetchComments()
  }

  const handleRefresh = () => {
    fetchComments()
  }

  useEffect(() => {
    fetchComments()
  }, [blogPostId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mr-2" />
            <span className="text-gray-600">Đang tải bình luận...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center py-8 text-center">
            <div>
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
            Bình luận ({commentsCount})
          </h2>
          
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Làm mới bình luận"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        {commentsCount > 0 && (
          <p className="text-gray-600 mt-2">
            Cảm ơn bạn đã quan tâm và chia sẻ ý kiến về bài viết này!
          </p>
        )}
      </div>

      {/* Comment Form */}
      <CommentForm 
        blogPostId={blogPostId}
        onCommentAdded={handleCommentAdded}
      />

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Tất cả bình luận ({comments.length})
          </h3>
          
          {comments.map((comment) => (
            <Comment 
              key={comment.id} 
              comment={comment}
              onReplyAdded={handleCommentAdded}
              onCommentDeleted={handleCommentAdded}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có bình luận nào
            </h3>
            <p className="text-gray-600 mb-4">
              Hãy là người đầu tiên chia sẻ ý kiến về bài viết này!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentList 