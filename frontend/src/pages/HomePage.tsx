import { useState, useEffect } from 'react'
import { Users, UserCheck, Activity, Calendar, DollarSign, TrendingUp, TrendingDown, RefreshCw, Eye, BarChart, Settings } from 'lucide-react'
import { apiService } from '../utils/api'
import { formatDate } from '../utils/dateFormat'
import toast from 'react-hot-toast'
import DataSeeder from '../components/DataSeeder'

interface DashboardStats {
  totalUsers: number
  activePatients: number
  totalAppointments: number
  todaysAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
}

interface RevenueStats {
  totalRevenue: number
  monthlyRevenue: number
  lastMonthRevenue: number
  paidAppointments: number
  pendingPayments: number
  averagePaymentAmount: number
  revenueGrowth: number
  paymentsByMonth: Array<{
    month: string
    amount: number
    count: number
  }>
}

const HomePage = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDataSeeder, setShowDataSeeder] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch multiple data sources in parallel
      const [appointments, users, appointmentStats] = await Promise.all([
        apiService.getAllAppointments(),
        apiService.getUsersByRole('PATIENT'),
        apiService.getAppointmentStats()
      ])

      // Calculate dashboard stats
      const stats: DashboardStats = {
        totalUsers: users.length + 50, // Add some mock admin/doctor users
        activePatients: users.length,
        totalAppointments: appointments.length,
        todaysAppointments: appointmentStats.todaysAppointments || 0,
        pendingAppointments: appointmentStats.pendingAppointments || 0,
        confirmedAppointments: appointmentStats.confirmedAppointments || 0
      }

      setDashboardStats(stats)

      // Calculate revenue stats
      const paidAppointments = appointments.filter(apt => apt.status === 'PAID' || apt.status === 'COMPLETED')
      const pendingPayments = appointments.filter(apt => apt.status === 'PAYMENT_REQUESTED' || apt.status === 'NEEDS_PAYMENT')
      
      // Mock payment amounts (in real app, this would come from payment data)
      const averagePayment = 500000 // 500k VND average
      const totalRevenue = paidAppointments.length * averagePayment
      
      // Calculate monthly revenue
      const now = new Date()
      const thisMonth = paidAppointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate)
        return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear()
      })
      
      const lastMonth = paidAppointments.filter(apt => {
        const aptDate = new Date(apt.appointmentDate)
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return aptDate.getMonth() === lastMonthDate.getMonth() && aptDate.getFullYear() === lastMonthDate.getFullYear()
      })

      const monthlyRevenue = thisMonth.length * averagePayment
      const lastMonthRevenue = lastMonth.length * averagePayment
      const revenueGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

      // Generate monthly revenue data for the last 6 months
      const paymentsByMonth = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthlyPaid = paidAppointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate)
          return aptDate.getMonth() === date.getMonth() && aptDate.getFullYear() === date.getFullYear()
        })
        
        paymentsByMonth.push({
          month: date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
          amount: monthlyPaid.length * averagePayment,
          count: monthlyPaid.length
        })
      }

      const revenue: RevenueStats = {
        totalRevenue,
        monthlyRevenue,
        lastMonthRevenue,
        paidAppointments: paidAppointments.length,
        pendingPayments: pendingPayments.length,
        averagePaymentAmount: averagePayment,
        revenueGrowth,
        paymentsByMonth
      }

      setRevenueStats(revenue)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Không thể tải dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-gray-50 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Florism Care - Nền tảng chăm sóc sức khỏe sinh sản</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowDataSeeder(!showDataSeeder)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showDataSeeder ? 'Ẩn' : 'Dev Tools'}
            </button>
            <button
              onClick={fetchDashboardData}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Data Seeder - Development Tool */}
      {showDataSeeder && (
        <DataSeeder />
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tổng người dùng</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardStats?.totalUsers || 0)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Bệnh nhân hoạt động</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardStats?.activePatients || 0)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Lịch hẹn hôm nay</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardStats?.todaysAppointments || 0)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tổng lịch hẹn</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(dashboardStats?.totalAppointments || 0)}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tổng quan doanh thu</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-2">Tổng doanh thu</p>
                  <p className="text-2xl font-bold">{formatCurrency(revenueStats?.totalRevenue || 0)}</p>
                  <p className="text-green-100 text-sm mt-2">{revenueStats?.paidAppointments || 0} lịch hẹn</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-100" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-2">Tháng này</p>
                  <p className="text-2xl font-bold">{formatCurrency(revenueStats?.monthlyRevenue || 0)}</p>
                  <div className="flex items-center mt-2">
                    {(revenueStats?.revenueGrowth || 0) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-blue-100 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-blue-100 mr-1" />
                    )}
                    <p className="text-blue-100 text-sm">
                      {revenueStats?.revenueGrowth ? (revenueStats.revenueGrowth > 0 ? '+' : '') + revenueStats.revenueGrowth.toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-100" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Chờ thanh toán</h3>
              <Eye className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(revenueStats?.pendingPayments || 0)}</p>
                <p className="text-sm text-gray-500 mt-1">lịch hẹn</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-600">
                  {formatCurrency((revenueStats?.pendingPayments || 0) * (revenueStats?.averagePaymentAmount || 0))}
                </p>
                <p className="text-sm text-gray-500">ước tính</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">6 tháng gần nhất</h3>
            <BarChart className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {revenueStats?.paymentsByMonth.map((month, index) => {
              const maxAmount = Math.max(...(revenueStats.paymentsByMonth.map(m => m.amount) || [0]))
              const widthPercentage = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{month.month}</span>
                    <span className="text-gray-500">{month.count} lịch</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(widthPercentage, 2)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 text-right">
                    {formatCurrency(month.amount)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all group">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900">Quản lý người dùng</h3>
                <p className="text-xs text-gray-500">Thêm, sửa tài khoản</p>
              </div>
            </div>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-green-300 transition-all group">
            <div className="flex items-center space-x-3">
              <div className="bg-green-50 p-2 rounded-lg group-hover:bg-green-100 transition-colors">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900">Lịch hẹn</h3>
                <p className="text-xs text-gray-500">Quản lý đặt lịch</p>
              </div>
            </div>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-purple-300 transition-all group">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-50 p-2 rounded-lg group-hover:bg-purple-100 transition-colors">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900">Doanh thu</h3>
                <p className="text-xs text-gray-500">Báo cáo tài chính</p>
              </div>
            </div>
          </button>

          <button className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-orange-300 transition-all group">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-50 p-2 rounded-lg group-hover:bg-orange-100 transition-colors">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-gray-900">Hệ thống</h3>
                <p className="text-xs text-gray-500">Giám sát trạng thái</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage 