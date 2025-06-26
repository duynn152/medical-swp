import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Mail, Building2, Check, X, Eye, Search, AlertCircle, CheckCircle, XCircle, Calendar as CalendarIcon, TrendingUp } from 'lucide-react'
import { apiService } from '../utils/api'
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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  notes?: string
  emailSent: boolean
  reminderSent: boolean
  createdAt: string
  updatedAt: string
  doctor?: {
    id: number
    fullName: string
  }
}

interface AppointmentStats {
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  noShow: number
  todayTotal: number
  upcomingTotal: number
}

const BookingManagerPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<AppointmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    NO_SHOW: 'bg-gray-100 text-gray-800'
  }

  const statusIcons = {
    PENDING: AlertCircle,
    CONFIRMED: CheckCircle,
    COMPLETED: Check,
    CANCELLED: XCircle,
    NO_SHOW: X
  }

  const statusLabels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
    NO_SHOW: 'Không đến'
  }

  useEffect(() => {
    fetchAppointments()
    fetchStats()
  }, [])

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchTerm, statusFilter])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const data = await apiService.getAllAppointments()
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Không thể tải danh sách lịch hẹn')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await apiService.getAppointmentStats()
      // Map the response to match our interface
      const mappedStats = {
        total: data.totalAppointments || 0,
        pending: data.pendingAppointments || 0,
        confirmed: data.confirmedAppointments || 0,
        completed: 0, // Add these if available in API
        cancelled: 0,
        noShow: 0,
        todayTotal: data.todaysAppointments || 0,
        upcomingTotal: 0 // Add if available in API
      }
      setStats(mappedStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set default stats to prevent crashes
      setStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        todayTotal: 0,
        upcomingTotal: 0
      })
    }
  }

  const filterAppointments = () => {
    let filtered = appointments

    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.phone.includes(searchTerm) ||
        apt.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.department.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(apt => apt.status === statusFilter)
    }

    setFilteredAppointments(filtered)
  }

  const updateAppointmentStatus = async (id: number, status: string, reason?: string) => {
    try {
      if (status === 'CONFIRMED') {
        await apiService.confirmAppointment(id)
      } else if (status === 'CANCELLED') {
        await apiService.cancelAppointment(id, reason || 'Cancelled by staff')
      }
      
      await fetchAppointments()
      await fetchStats()
      toast.success(`Lịch hẹn đã được ${status === 'CONFIRMED' ? 'xác nhận' : 'hủy'}`)
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast.error('Không thể cập nhật trạng thái lịch hẹn')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Lịch hẹn</h1>
          <p className="text-gray-600">Quản lý và theo dõi tất cả lịch hẹn khám bệnh</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Tổng số</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Chờ xác nhận</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Đã xác nhận</p>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Check className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Đã hủy</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Hôm nay</p>
                <p className="text-2xl font-bold text-purple-600">{stats.todayTotal}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Sắp tới</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.upcomingTotal}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại, email, khoa..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
              <option value="NO_SHOW">Không đến</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter ? 'Không tìm thấy lịch hẹn phù hợp' : 'Chưa có lịch hẹn nào'}
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
                        {appointment.department}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                        <StatusIcon status={appointment.status} />
                        <span className="ml-1">
                          {statusLabels[appointment.status]}
                        </span>
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setShowDetailModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {appointment.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'CONFIRMED')}
                              className="text-green-600 hover:text-green-900"
                              title="Xác nhận"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'CANCELLED')}
                              className="text-red-600 hover:text-red-900"
                              title="Hủy lịch"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
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
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.department}</p>
                </div>
                
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
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Đóng
                </button>
                {selectedAppointment.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => {
                        updateAppointmentStatus(selectedAppointment.id, 'CONFIRMED')
                        setShowDetailModal(false)
                      }}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Xác nhận
                    </button>
                    <button
                      onClick={() => {
                        updateAppointmentStatus(selectedAppointment.id, 'CANCELLED')
                        setShowDetailModal(false)
                      }}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Hủy lịch
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingManagerPage 