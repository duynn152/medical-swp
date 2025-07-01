import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Heart, Menu, X, User, LogOut, Calendar, FileText, Settings, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userInfo = localStorage.getItem('userInfo')
    
    if (token && userInfo) {
      try {
        const userData = JSON.parse(userInfo)
        setUser(userData)
      } catch (error) {
        // Invalid user info, clear storage
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (userDropdownOpen && !target.closest('.user-dropdown')) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userDropdownOpen])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userInfo')
    setUser(null)
    setUserDropdownOpen(false)
    navigate('/')
  }

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

  // Menu items for patient
  const patientMenuItems = [
    { name: 'Hồ sơ cá nhân', icon: User, href: '/profile' },
    { name: 'Lịch hẹn của tôi', icon: Calendar, href: '/my-appointments' },
    { name: 'Lịch sử khám', icon: FileText, href: '/medical-history' },
    { name: 'Cài đặt', icon: Settings, href: '/settings' },
  ]

  // Menu items for other roles (admin, doctor, staff)
  const adminMenuItems = [
    { name: 'Dashboard', icon: Settings, href: '/admin' },
  ]

  // Get menu items based on user role
  const getMenuItems = () => {
    if (!user) return []
    return user.role === 'PATIENT' ? patientMenuItems : adminMenuItems
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

            {/* User Menu or Login Button */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                // User is logged in - show avatar and dropdown
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors"
                  >
                    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.fullName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-24 truncate">
                      {user.fullName || user.username}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.fullName || user.username}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded mt-1 inline-block">
                          {user.role}
                        </p>
                      </div>
                      <div className="py-1">
                        {getMenuItems().map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <item.icon className="w-4 h-4 mr-3 text-gray-400" />
                            {item.name}
                          </Link>
                        ))}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <LogOut className="w-4 h-4 mr-3 text-red-400" />
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // User is not logged in - show login button
                <Link
                  to="/login"
                  className="bg-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-700 transition-colors"
                >
                  Đăng nhập
                </Link>
              )}
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
                
                {user ? (
                  // Mobile user menu for all logged-in users
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="px-2 py-2 bg-gray-50 rounded-lg mb-3">
                      <p className="text-sm font-medium text-gray-900">{user.fullName || user.username}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded mt-1 inline-block">
                        {user.role}
                      </p>
                    </div>
                    {getMenuItems().map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        <item.icon className="w-4 h-4 mr-3 text-gray-400" />
                        {item.name}
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center w-full px-2 py-2 text-sm text-red-700 hover:bg-red-50 rounded mt-2"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-red-400" />
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  // Mobile login button
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg font-medium text-center hover:bg-pink-700 transition-colors"
                  >
                    Đăng nhập
                  </Link>
                )}
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