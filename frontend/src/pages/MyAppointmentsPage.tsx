import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, MapPin, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { apiService, Appointment } from '../utils/api'
import { formatDate } from '../utils/dateFormat'
import toast from 'react-hot-toast'

const MyAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      const response = await apiService.getMyAppointments()
      setAppointments(response)
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Có lỗi khi tải danh sách lịch hẹn')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'AWAITING_DOCTOR_APPROVAL':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'PAYMENT_REQUESTED':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'PAID':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="w-4 h-4" />
      case 'PENDING':
        return <AlertCircle className="w-4 h-4" />
      case 'AWAITING_DOCTOR_APPROVAL':
        return <AlertCircle className="w-4 h-4" />
      case 'PAYMENT_REQUESTED':
        return <AlertCircle className="w-4 h-4" />
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />
      case 'NO_SHOW':
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Đã xác nhận'
      case 'PENDING':
        return 'Đang chờ'
      case 'AWAITING_DOCTOR_APPROVAL':
        return 'Chờ bác sĩ phê duyệt'
      case 'PAYMENT_REQUESTED':
        return 'Yêu cầu thanh toán'
      case 'PAID':
        return 'Đã thanh toán'
      case 'COMPLETED':
        return 'Đã hoàn thành'
      case 'CANCELLED':
        return 'Đã hủy'
      case 'NO_SHOW':
        return 'Không đến'
      default:
        return status
    }
  }

  const getDepartmentName = (department: any) => {
    if (typeof department === 'string') {
      return department
    }
    return department?.departmentName || department?.specialtyName || 'Không xác định'
  }

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true
    if (filter === 'upcoming') return ['PENDING', 'AWAITING_DOCTOR_APPROVAL', 'CONFIRMED', 'PAYMENT_REQUESTED', 'PAID'].includes(appointment.status)
    if (filter === 'completed') return appointment.status === 'COMPLETED'
    if (filter === 'cancelled') return ['CANCELLED', 'NO_SHOW'].includes(appointment.status)
    return true
  })

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      // TODO: Call API to cancel appointment
      // await apiService.cancelMyAppointment(appointmentId)
      
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === appointmentId 
            ? { ...apt, status: 'CANCELLED' as const }
            : apt
        )
      )
      toast.success('Đã hủy lịch hẹn thành công')
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Có lỗi khi hủy lịch hẹn')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách lịch hẹn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch hẹn của tôi</h1>
          <p className="text-gray-600">Quản lý và theo dõi các lịch hẹn khám bệnh của bạn</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex space-x-1">
            {[
              { key: 'all', label: 'Tất cả', count: appointments.length },
              { key: 'upcoming', label: 'Sắp tới', count: appointments.filter(a => ['PENDING', 'AWAITING_DOCTOR_APPROVAL', 'CONFIRMED', 'PAYMENT_REQUESTED', 'PAID'].includes(a.status)).length },
              { key: 'completed', label: 'Đã hoàn thành', count: appointments.filter(a => a.status === 'COMPLETED').length },
              { key: 'cancelled', label: 'Đã hủy', count: appointments.filter(a => ['CANCELLED', 'NO_SHOW'].includes(a.status)).length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? 'bg-pink-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch hẹn</h3>
              <p className="text-gray-600">Bạn chưa có lịch hẹn nào trong danh mục này.</p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{appointment.fullName}</h3>
                      <p className="text-gray-600">{getDepartmentName(appointment.department)}</p>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(appointment.status)}`}>
                    {getStatusIcon(appointment.status)}
                    <span>{getStatusText(appointment.status)}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(appointment.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{appointment.appointmentTime}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{getDepartmentName(appointment.department)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{appointment.phone}</span>
                  </div>
                </div>

                {appointment.reason && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>Lý do:</strong> {appointment.reason}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {['PENDING', 'AWAITING_DOCTOR_APPROVAL'].includes(appointment.status) && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Hủy lịch hẹn
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default MyAppointmentsPage 