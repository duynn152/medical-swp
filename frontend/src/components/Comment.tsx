import React, { useState, useEffect } from 'react'
import { Comment as CommentType, apiService } from '../utils/api'
import { MessageCircle, User, Calendar, ThumbsUp, ThumbsDown, Reply, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface CommentProps {
  comment: CommentType
  onReplyAdded?: () => void
  onCommentDeleted?: () => void
}

const Comment: React.FC<CommentProps> = ({ comment, onReplyAdded, onCommentDeleted }) => {
  const [userReaction, setUserReaction] = useState<'LIKE' | 'DISLIKE' | null>(null)
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0)
  const [dislikeCount, setDislikeCount] = useState(comment.dislikeCount || 0)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyData, setReplyData] = useState({ authorName: '', content: '' })
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)

  useEffect(() => {
    // Load user's reaction when component mounts
    loadUserReaction()
    // Check if user is logged in and auto-fill name for replies
    checkUserLogin()
  }, [comment.id])

  const checkUserLogin = () => {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        setReplyData(prev => ({
          ...prev,
          authorName: user.fullName || user.username || ''
        }))
        setIsLoggedIn(true)
        
        // Check if user can delete comments (admin, staff only)
        const allowedRoles = ['ADMIN', 'STAFF']
        setCanDelete(allowedRoles.includes(user.role))
      } catch (error) {
        console.error('Error parsing user info:', error)
      }
    }
  }

  const loadUserReaction = async () => {
    try {
      const response = await apiService.getMyReaction(comment.id)
      if (response.success && response.reaction) {
        setUserReaction(response.reaction.reactionType)
      }
    } catch (error) {
      // Silently handle error - user might not have reacted yet
    }
  }

  const handleReaction = async (reactionType: 'LIKE' | 'DISLIKE') => {
    try {
      const response = await apiService.addReaction(comment.id, reactionType)
      
      if (response.success) {
        // Update local state based on response
        if (response.reaction) {
          setUserReaction(response.reaction.reactionType)
        } else {
          setUserReaction(null) // Reaction was removed
        }
        
        // Update counts (in real app, should refetch from server)
        if (reactionType === 'LIKE') {
          if (userReaction === 'LIKE') {
            setLikeCount(prev => prev - 1)
          } else {
            setLikeCount(prev => prev + 1)
            if (userReaction === 'DISLIKE') {
              setDislikeCount(prev => prev - 1)
            }
          }
        } else {
          if (userReaction === 'DISLIKE') {
            setDislikeCount(prev => prev - 1)
          } else {
            setDislikeCount(prev => prev + 1)
            if (userReaction === 'LIKE') {
              setLikeCount(prev => prev - 1)
            }
          }
        }
        
        toast.success(response.message)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi react bình luận')
    }
  }

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!replyData.authorName.trim() || !replyData.content.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin')
      return
    }

    setIsSubmittingReply(true)
    
    try {
      const response = await apiService.createReply(comment.id, replyData)
      
      if (response.success) {
        toast.success('Trả lời đã được thêm thành công!')
        setReplyData({ authorName: '', content: '' })
        setShowReplyForm(false)
        onReplyAdded?.()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi tạo trả lời')
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleDeleteComment = async () => {
    if (!canDelete) return
    
    // Add confirmation dialog
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      return
    }
    
    setIsDeleting(true)
    try {
      const response = await apiService.deleteComment(comment.id)
      if (response.success) {
        toast.success('Bình luận đã được xóa thành công!')
        // Immediately hide the comment from UI
        setIsDeleted(true)
        // Add a small delay to ensure backend has processed the deletion
        setTimeout(() => {
          onCommentDeleted?.()
        }, 500)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi xóa bình luận')
    } finally {
      setIsDeleting(false)
    }
  }

  // Hide comment if it's been deleted
  if (isDeleted) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {getInitials(comment.authorName)}
          </div>
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-gray-900">{comment.authorName}</span>
            <span className="text-gray-500 text-sm flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(comment.createdAt)}
            </span>
          </div>
          
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
            {comment.content}
          </p>

          {/* Reaction Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleReaction('LIKE')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                userReaction === 'LIKE'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={() => handleReaction('DISLIKE')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                userReaction === 'DISLIKE'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{dislikeCount}</span>
            </button>

            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Reply className="w-4 h-4" />
              <span>Trả lời</span>
            </button>

            {/* Delete Button for Admin/Staff */}
            {canDelete && (
              <button
                onClick={handleDeleteComment}
                disabled={isDeleting}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Đang xóa...' : 'Xóa'}</span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={isLoggedIn ? "Tên của bạn đã được tự động điền" : "Tên của bạn"}
                  value={replyData.authorName}
                  onChange={(e) => setReplyData(prev => ({ ...prev, authorName: e.target.value }))}
                  disabled={isLoggedIn}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isLoggedIn 
                      ? 'bg-gray-100 cursor-not-allowed text-gray-600' 
                      : ''
                  }`}
                  maxLength={100}
                />
                <textarea
                  placeholder="Nội dung trả lời..."
                  value={replyData.content}
                  onChange={(e) => setReplyData(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  maxLength={1000}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowReplyForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReply}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmittingReply ? 'Đang gửi...' : 'Gửi trả lời'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 ml-4 border-l-2 border-gray-200 pl-4">
              {comment.replies.map((reply) => (
                <Comment 
                  key={reply.id} 
                  comment={reply}
                  onReplyAdded={onReplyAdded}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Comment 