import { Outlet, Link, useLocation } from 'react-router-dom'
import { Heart, Menu, X } from 'lucide-react'
import { useState } from 'react'

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Trang chủ', href: '/' },
    { name: 'About us', href: '/about' },
    { name: 'Dịch vụ', href: '/services' },
    { name: 'Đặt lịch hẹn', href: '/appointment' },
    { name: 'Blog', href: '/blog' },
  ]

  const isCurrentPath = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-pink-600 p-2 rounded-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Florism Care</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isCurrentPath(item.href)
                      ? 'text-pink-600 border-b-2 border-pink-600 pb-4'
                      : 'text-gray-600 hover:text-pink-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Login Button */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="bg-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-700 transition-colors"
              >
                Đăng nhập
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isCurrentPath(item.href)
                        ? 'text-pink-600'
                        : 'text-gray-600 hover:text-pink-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg font-medium text-center hover:bg-pink-700 transition-colors"
                >
                  Đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-pink-600 p-2 rounded-lg">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">Florism Care</span>
              </div>
              <p className="text-gray-400 text-sm">
                Hệ thống quản lý y tế hiện đại, mang đến dịch vụ chăm sóc sức khỏe chất lượng cao.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Liên kết nhanh</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white">Trang chủ</Link></li>
                <li><Link to="/about" className="hover:text-white">Về chúng tôi</Link></li>
                <li><Link to="/services" className="hover:text-white">Dịch vụ</Link></li>
                <li><Link to="/appointment" className="hover:text-white">Đặt lịch hẹn</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold mb-4">Dịch vụ</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Khám tổng quát</li>
                <li>Tim mạch</li>
                <li>Sản phụ khoa</li>
                <li>Nhi khoa</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Hotline: 1900 1234</li>
                <li>Email: contact@medical.com</li>
                <li>Địa chỉ: 123 Đường ABC</li>
                <li>Quận 1, TP.HCM</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Florism Care. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout 