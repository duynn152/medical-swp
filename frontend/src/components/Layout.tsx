import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Users, Home, Menu, X, LogOut, User, BookOpen, Calendar, UserCheck, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getStoredUserInfo, clearAuth, isAuthenticated } from '../utils/api'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Check authentication on component mount
    if (!isAuthenticated()) {
      navigate('/login')
      return
    }
    
    const user = getStoredUserInfo()
    if (user) {
      setUserInfo(user)
    }
  }, [navigate])

  // Define navigation items with role-based access control
  const allNavigationItems = [
    { 
      name: 'Dashboard', 
      href: '/admin', 
      icon: Home,
      allowedRoles: ['ADMIN', 'DOCTOR', 'STAFF', 'PATIENT'] // All roles can access dashboard
    },
    { 
      name: 'Users', 
      href: '/admin/users', 
      icon: Users,
      allowedRoles: ['ADMIN'] // Only admin can manage users
    },
    { 
      name: 'Pending Approvals', 
      href: '/admin/pending-approvals', 
      icon: Clock,
      allowedRoles: ['DOCTOR'] // Only doctors can see appointments pending their approval
    },
    { 
      name: 'Patient Control', 
      href: '/admin/patients', 
      icon: UserCheck,
      allowedRoles: ['ADMIN', 'DOCTOR', 'STAFF'] // Admin, doctors and staff can manage patients
    },
    { 
      name: 'Blog Control', 
      href: '/admin/blogs', 
      icon: BookOpen,
      allowedRoles: ['ADMIN', 'DOCTOR', 'STAFF'] // Admin, doctors and staff can manage blogs
    },
    { 
      name: 'Booking Manager', 
      href: '/admin/bookings', 
      icon: Calendar,
      allowedRoles: ['ADMIN', 'STAFF'] // Admin and staff can manage bookings
    },
  ]

  // Filter navigation based on user role
  const navigation = userInfo 
    ? allNavigationItems.filter(item => item.allowedRoles.includes(userInfo.role))
    : []

  // Debug: Check userInfo and role filtering
  console.log('🐛 DEBUG - userInfo:', userInfo)
  console.log('🐛 DEBUG - userInfo.role:', userInfo?.role)
  console.log('🐛 DEBUG - navigation items after filter:', navigation.map(item => item.name))
  console.log('🐛 DEBUG - localStorage userInfo:', localStorage.getItem('userInfo'))
  
  // Debug: Add clear cache function
  if (userInfo?.role === 'DOCTOR' && navigation.length <= 1) {
    console.log('⚠️  DOCTOR role detected but no Blog Control tab visible')
    console.log('⚠️  Try clearing localStorage and login again')
  }

  const isCurrentPath = (path: string) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  // If not authenticated or no user info, don't render the layout
  if (!isAuthenticated() || !userInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex flex-col w-64 bg-white h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-semibold text-gray-900">Florism Care</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
                  isCurrentPath(item.href)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          
          {/* Mobile user info */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userInfo.fullName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userInfo.role}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full rounded-md"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          <div className="flex items-center p-6 border-b">
            <h1 className="text-xl font-semibold text-gray-900">Florism Care</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium ${
                  isCurrentPath(item.href)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          
          {/* Desktop user info */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userInfo.fullName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userInfo.role}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full rounded-md"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">Florism Care</h1>
            <div className="w-6 h-6"></div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout 