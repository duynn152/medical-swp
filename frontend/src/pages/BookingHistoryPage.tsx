import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Mail, Building2, Check, X, Eye, Search, AlertCircle, CheckCircle, XCircle, Calendar as CalendarIcon, TrendingUp, UserCheck, Download, Filter, FileText } from 'lucide-react'
import { apiService, DepartmentInfo } from '../utils/api'
import { formatDate, formatDateWithTime } from '../utils/dateFormat'
import toast from 'react-hot-toast'

interface Appointment {
  id: number
  fullName: string
  phone: string
  email: string
  appointmentDate: string
  appointmentTime: string
  department: string
  reason?: string
  status: 'PENDING' | 'AWAITING_DOCTOR_APPROVAL' | 'CONFIRMED' | 'NEEDS_PAYMENT' | 'PAYMENT_REQUESTED' | 'PAID' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  notes?: string
  emailSent: boolean
  reminderSent: boolean
  paymentRequested: boolean
  paymentCompleted: boolean
  paymentRequestedAt?: string
  paymentCompletedAt?: string
  createdAt: string
  updatedAt: string
  doctor?: {
    id: number
    fullName: string
    specialty?: string
  }
}

interface Doctor {
  id: number
  fullName: string
  specialty?: string
  email: string
}

interface HistoryStats {
  totalCompleted: number
  totalCancelled: number
  totalNoShow: number
  totalRevenue: number
  averageCompletionTime: number
  mostPopularDepartment: string
  thisMonthCompleted: number
  lastMonthCompleted: number
}

const BookingHistoryPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [dateRangeFilter, setDateRangeFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [departments, setDepartments] = useState<DepartmentInfo[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [specialties, setSpecialties] = useState<Array<{code: string, displayName: string}>>([])

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    AWAITING_DOCTOR_APPROVAL: 'bg-purple-100 text-purple-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    NEEDS_PAYMENT: 'bg-green-100 text-green-800',
    PAYMENT_REQUESTED: 'bg-orange-100 text-orange-800',
    PAID: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    NO_SHOW: 'bg-gray-100 text-gray-800'
  }

  const statusIcons = {
    PENDING: AlertCircle,
    AWAITING_DOCTOR_APPROVAL: Clock,
    CONFIRMED: CheckCircle,
    NEEDS_PAYMENT: UserCheck,
    PAYMENT_REQUESTED: TrendingUp,
    PAID: Check,
    COMPLETED: Check,
    CANCELLED: XCircle,
    NO_SHOW: X
  }

  const statusLabels = {
    PENDING: 'Chờ xác nhận',
    AWAITING_DOCTOR_APPROVAL: 'Chờ bác sĩ phản hồi',
    CONFIRMED: 'Đã xác nhận',
    NEEDS_PAYMENT: 'Cần thanh toán',
    PAYMENT_REQUESTED: 'Cần thanh toán',
    PAID: 'Đã thanh toán',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
    NO_SHOW: 'Không đến'
  }

  useEffect(() => {
    fetchAppointments()
    fetchDepartments()
    fetchDoctors()
    fetchSpecialties()
  }, [])

  useEffect(() => {
    filterAppointments()
    calculateStats()
  }, [appointments, searchTerm, statusFilter, departmentFilter, dateRangeFilter, startDate, endDate])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const data = await apiService.getAllAppointments()
      // Only get historical appointments (completed, cancelled, no-show)
      const historicalAppointments = (data || []).filter(apt => 
        ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(apt.status)
      )
      setAppointments(historicalAppointments)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Không thể tải lịch sử lịch hẹn')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const departmentsData = await apiService.getDepartments()
      setDepartments(departmentsData)
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchDoctors = async () => {
    try {
      const users = await apiService.getUsersByRole('DOCTOR')
      const doctorsList = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        specialty: user.specialty,
        email: user.email
      }))
      setDoctors(doctorsList)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    }
  }

  const fetchSpecialties = async () => {
    try {
      const specialtiesData = await apiService.getMedicalSpecialties()
      setSpecialties(specialtiesData)
    } catch (error) {
      console.error('Error fetching specialties:', error)
    }
  }

  const getDepartmentDisplayName = (departmentCode: string) => {
    const department = departments.find(dept => dept.code === departmentCode)
    return department?.departmentName || departmentCode
  }

  const getSpecialtyDisplayName = (specialtyCode?: string) => {
    if (!specialtyCode) return 'Đa khoa'
    const specialty = specialties.find(s => s.code === specialtyCode)
    return specialty?.displayName || specialtyCode
  }

  const filterAppointments = () => {
    let filtered = appointments

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.phone.includes(searchTerm) ||
        apt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.doctor?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        filtered = filtered.filter(apt => apt.status === 'COMPLETED')
      } else if (statusFilter === 'cancelled') {
        filtered = filtered.filter(apt => apt.status === 'CANCELLED')
      } else if (statusFilter === 'no-show') {
        filtered = filtered.filter(apt => apt.status === 'NO_SHOW')
      }
    }

    // Filter by department
    if (departmentFilter) {
      filtered = filtered.filter(apt => apt.department === departmentFilter)
    }

    // Filter by date range
    if (dateRangeFilter !== 'all') {
      const now = new Date()
      let filterStartDate: Date
      
      switch (dateRangeFilter) {
        case 'today':
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          filtered = filtered.filter(apt => new Date(apt.appointmentDate) >= filterStartDate)
          break
        case 'week':
          filterStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(apt => new Date(apt.appointmentDate) >= filterStartDate)
          break
        case 'month':
          filterStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
          filtered = filtered.filter(apt => new Date(apt.appointmentDate) >= filterStartDate)
          break
        case 'quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          filtered = filtered.filter(apt => new Date(apt.appointmentDate) >= quarterStart)
          break
        case 'year':
          filterStartDate = new Date(now.getFullYear(), 0, 1)
          filtered = filtered.filter(apt => new Date(apt.appointmentDate) >= filterStartDate)
          break
        case 'custom':
          if (startDate && endDate) {
            filtered = filtered.filter(apt => {
              const aptDate = new Date(apt.appointmentDate)
              return aptDate >= new Date(startDate) && aptDate <= new Date(endDate)
            })
          }
          break
      }
    }

    // Sort by appointment date (newest first)
    filtered.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())

    setFilteredAppointments(filtered)
  }

  const calculateStats = () => {
    const completed = appointments.filter(apt => apt.status === 'COMPLETED')
    const cancelled = appointments.filter(apt => apt.status === 'CANCELLED')
    const noShow = appointments.filter(apt => apt.status === 'NO_SHOW')

    // Calculate this month vs last month completed
    const now = new Date()
    const thisMonth = completed.filter(apt => {
      const aptDate = new Date(apt.appointmentDate)
      return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear()
    })
    
    const lastMonth = completed.filter(apt => {
      const aptDate = new Date(apt.appointmentDate)
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return aptDate.getMonth() === lastMonthDate.getMonth() && aptDate.getFullYear() === lastMonthDate.getFullYear()
    })

    // Find most popular department
    const departmentCounts = appointments.reduce((acc, apt) => {
      acc[apt.department] = (acc[apt.department] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const mostPopularDeptCode = Object.keys(departmentCounts).reduce((a, b) => 
      departmentCounts[a] > departmentCounts[b] ? a : b, ''
    )

    setStats({
      totalCompleted: completed.length,
      totalCancelled: cancelled.length,
      totalNoShow: noShow.length,
      totalRevenue: 0, // This would need to be calculated from payment data
      averageCompletionTime: 0, // This would need more complex calculation
      mostPopularDepartment: getDepartmentDisplayName(mostPopularDeptCode) || 'N/A',
      thisMonthCompleted: thisMonth.length,
      lastMonthCompleted: lastMonth.length
    })
  }

  const exportToCSV = () => {
    if (filteredAppointments.length === 0) {
      toast.error('Không có dữ liệu để xuất')
      return
    }

    const headers = [
      'ID',
      'Họ tên',
      'Số điện thoại',
      'Email',
      'Ngày hẹn',
      'Giờ hẹn',
      'Khoa',
      'Bác sĩ',
      'Trạng thái',
      'Lý do khám',
      'Ngày tạo',
      'Ngày cập nhật'
    ]

    const csvContent = [
      headers.join(','),
      ...filteredAppointments.map(apt => [
        apt.id,
        `"${apt.fullName}"`,
        apt.phone,
        apt.email,
        apt.appointmentDate,
        apt.appointmentTime,
        `"${getDepartmentDisplayName(apt.department)}"`,
        `"${apt.doctor?.fullName || 'Chưa có bác sĩ'}"`,
        statusLabels[apt.status],
        `"${apt.reason || ''}"`,
        new Date(apt.createdAt).toLocaleDateString('vi-VN'),
        new Date(apt.updatedAt).toLocaleDateString('vi-VN')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `booking-history-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Đã xuất dữ liệu thành công')
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('vi-VN')
  }

  const StatusIcon = ({ status }: { status: string }) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons]
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lịch sử Đặt lịch</h1>
          <p className="text-gray-600">Theo dõi và phân tích lịch sử các lịch hẹn đã hoàn thành</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredAppointments.length === 0}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 mr-2" />
          Xuất CSV
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalCompleted}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Đã hủy</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalCancelled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <X className="w-8 h-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Không đến</p>
                <p className="text-2xl font-bold text-gray-600">{stats.totalNoShow}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Tháng này</p>
                <p className="text-2xl font-bold text-blue-600">{stats.thisMonthCompleted}</p>
                <p className="text-xs text-gray-500">
                  {stats.lastMonthCompleted > 0 
                    ? `${stats.thisMonthCompleted > stats.lastMonthCompleted ? '+' : ''}${((stats.thisMonthCompleted - stats.lastMonthCompleted) / stats.lastMonthCompleted * 100).toFixed(1)}%`
                    : 'Tháng đầu tiên'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Khoa phổ biến nhất</h3>
            <div className="flex items-center">
              <Building2 className="w-6 h-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-xl font-bold text-purple-600">{stats.mostPopularDepartment}</p>
                <p className="text-sm text-gray-500">Được đặt lịch nhiều nhất</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tỷ lệ hoàn thành</h3>
            <div className="flex items-center">
              <div className="w-full">
                {(stats.totalCompleted + stats.totalCancelled + stats.totalNoShow) > 0 ? (
                  <>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Hoàn thành</span>
                      <span>{((stats.totalCompleted / (stats.totalCompleted + stats.totalCancelled + stats.totalNoShow)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(stats.totalCompleted / (stats.totalCompleted + stats.totalCancelled + stats.totalNoShow)) * 100}%` }}
                      ></div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500">Chưa có dữ liệu</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="xl:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, SĐT, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
              <option value="no-show">Không đến</option>
            </select>
          </div>
          
          {/* Department Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">Tất cả khoa</option>
              {departments.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày qua</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm này</option>
              <option value="custom">Tùy chọn</option>
            </select>
          </div>
          
          {/* Custom Date Range */}
          {dateRangeFilter === 'custom' && (
            <>
              <div>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Từ ngày"
                />
              </div>
              <div>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="Đến ngày"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Lịch sử lịch hẹn ({filteredAppointments.length})
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>Sắp xếp theo ngày mới nhất</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bệnh nhân
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lịch hẹn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Khoa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bác sĩ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' || departmentFilter || dateRangeFilter !== 'all' 
                      ? 'Không tìm thấy lịch hẹn phù hợp với bộ lọc' 
                      : 'Chưa có lịch sử lịch hẹn'}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: #{appointment.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="w-4 h-4 mr-1 text-gray-400" />
                          {appointment.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="w-4 h-4 mr-1 text-gray-400" />
                          {appointment.email}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDate(appointment.appointmentDate)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {formatTime(appointment.appointmentTime)}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building2 className="w-4 h-4 mr-1 text-gray-400" />
                        {getDepartmentDisplayName(appointment.department)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <User className="w-4 h-4 mr-1 text-gray-400" />
                        {appointment.doctor?.fullName || 'Chưa có bác sĩ'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                        <StatusIcon status={appointment.status} />
                        <span className="ml-1">{statusLabels[appointment.status]}</span>
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment)
                          setShowDetailModal(true)
                        }}
                        className="px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-400"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Chi tiết lịch hẹn #{selectedAppointment.id}</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.phone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.email}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày hẹn</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedAppointment.appointmentDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giờ hẹn</label>
                    <p className="mt-1 text-sm text-gray-900">{formatTime(selectedAppointment.appointmentTime)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Khoa khám</label>
                  <p className="mt-1 text-sm text-gray-900">{getDepartmentDisplayName(selectedAppointment.department)}</p>
                </div>
                
                {selectedAppointment.doctor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bác sĩ phụ trách</label>
                    <div className="mt-1">
                      <p className="text-sm font-medium text-gray-900">{selectedAppointment.doctor.fullName}</p>
                      {selectedAppointment.doctor.specialty && (
                        <p className="text-xs text-gray-600">Chuyên khoa: {getSpecialtyDisplayName(selectedAppointment.doctor.specialty)}</p>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lý do khám</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.reason || 'Không có'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedAppointment.status]}`}>
                    <StatusIcon status={selectedAppointment.status} />
                    <span className="ml-1">{statusLabels[selectedAppointment.status]}</span>
                  </span>
                </div>
                
                {selectedAppointment.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.notes}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedAppointment.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cập nhật cuối</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedAppointment.updatedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span className={selectedAppointment.emailSent ? 'text-green-600' : 'text-gray-500'}>
                      Email {selectedAppointment.emailSent ? 'đã gửi' : 'chưa gửi'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className={selectedAppointment.reminderSent ? 'text-green-600' : 'text-gray-500'}>
                      Nhắc nhở {selectedAppointment.reminderSent ? 'đã gửi' : 'chưa gửi'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingHistoryPage 