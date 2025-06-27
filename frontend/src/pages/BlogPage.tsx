import { Calendar, User, Clock, Tag, Loader, AlertCircle } from 'lucide-react'
import { usePublicBlog } from '../contexts/PublicBlogContext'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BlogPage = () => {
  const { publishedBlogs, featuredBlogs, loading, error } = usePublicBlog()
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const navigate = useNavigate()

  const categories = ["Tất cả", "Tim mạch", "Ung thư", "Tiểu đường", "Phòng bệnh", "Thể dục", "Tâm thần"]

  const filteredBlogs = selectedCategory === 'Tất cả' 
    ? publishedBlogs.filter(blog => !blog.featured)
    : publishedBlogs.filter(blog => !blog.featured && blog.category === selectedCategory)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu blog...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center mb-8">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Blog Y Khoa</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chia sẻ kiến thức y khoa, mẹo sức khỏe và tin tức y tế mới nhất từ đội ngũ bác sĩ chuyên nghiệp
          </p>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 bg-white hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Posts */}
        {featuredBlogs.length > 0 && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Bài viết nổi bật</h2>
            {featuredBlogs.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden mb-12">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl.startsWith('http') ? post.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}${post.imageUrl}`}
                        alt={post.title}
                        className="h-64 md:h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`h-64 md:h-full bg-gray-200 flex items-center justify-center ${post.imageUrl ? 'hidden' : ''}`}>
                      <div className="text-center text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Hình ảnh</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        <Tag className="w-3 h-3 inline mr-1" />
                        {post.category}
                      </span>
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Bài viết nổi bật
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h2>
                    <p className="text-gray-600 mb-6">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(post.createdAt || post.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.readTime}
                        </span>
                      </div>
                      <button className="text-blue-600 font-medium hover:text-blue-700" onClick={() => navigate(`/blog/${post.id}`)}>
                        Đọc thêm →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Regular Blog Grid */}
        {filteredBlogs.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedCategory === 'Tất cả' ? 'Tất cả bài viết' : `Bài viết về ${selectedCategory}`}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((post) => (
                <article key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl.startsWith('http') ? post.imageUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}${post.imageUrl}`}
                      alt={post.title}
                      className="h-48 w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`h-48 bg-gray-200 flex items-center justify-center ${post.imageUrl ? 'hidden' : ''}`}>
                    <div className="text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Hình ảnh</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        <Tag className="w-3 h-3 inline mr-1" />
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDate(post.createdAt || post.date)}
                      </span>
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-700" onClick={() => navigate(`/blog/${post.id}`)}>
                        Đọc thêm →
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {publishedBlogs.length === 0 
                ? 'Hiện tại chưa có bài viết nào. Chúng tôi đang cập nhật nội dung mới.'
                : selectedCategory === 'Tất cả' 
                  ? 'Tất cả bài viết đều là featured'
                  : `Chưa có bài viết nào trong danh mục ${selectedCategory}`
              }
            </div>
            {publishedBlogs.length === 0 && (
              <p className="text-sm text-gray-400">
                Vui lòng quay lại sau để đọc những bài viết y khoa hữu ích
              </p>
            )}
          </div>
        )}

        {/* Load More */}
        {filteredBlogs.length > 6 && (
          <div className="text-center mt-12">
            <button className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors">
              Xem thêm bài viết
            </button>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="bg-pink-600 rounded-lg p-8 mt-16 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Đăng ký nhận tin tức y khoa</h3>
          <p className="mb-6">Nhận những thông tin y khoa mới nhất và mẹo sức khỏe hữu ích qua email</p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 py-2 rounded-md text-gray-900"
            />
            <button className="bg-white text-pink-600 px-6 py-2 rounded-md font-semibold hover:bg-gray-100 transition-colors">
              Đăng ký
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogPage 