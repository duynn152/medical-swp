import { useState } from 'react'
import { Calendar, Clock, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { apiService, CreateAppointmentRequest } from '../utils/api'

const AppointmentPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    appointmentDate: '',
    appointmentTime: '',
    department: '',
    reason: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
    appointmentId?: number
  }>({ type: null, message: '' })

  const departments = [
    'Khoa Nội tổng hợp',
    'Khoa Ngoại tổng hợp', 
    'Khoa Sản phụ khoa',
    'Khoa Nhi',
    'Khoa Mắt',
    'Khoa Tai mũi họng',
    'Khoa Da liễu',
    'Khoa Thần kinh'
  ]

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      // Validate required fields
      if (!formData.fullName || !formData.phone || !formData.appointmentDate || 
          !formData.appointmentTime || !formData.department) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc')
      }

      // Validate date format and value
      if (!isValidDate(formData.appointmentDate)) {
        throw new Error('Ngày khám không hợp lệ. Vui lòng chọn ngày từ hôm nay trở đi.')
      }

      console.log('Submitting appointment with date:', formData.appointmentDate)

      // Check time slot availability first
      if (formData.appointmentDate && formData.appointmentTime && formData.department) {
        console.log('Checking availability for:', {
          date: formData.appointmentDate,
          time: formData.appointmentTime,
          department: formData.department
        })
        
        const availability = await apiService.checkTimeSlotAvailability(
          formData.appointmentDate,
          formData.appointmentTime,
          formData.department
        )
        
        if (!availability.available) {
          throw new Error(availability.message)
        }
      }

      // Create appointment
      const appointmentRequest: CreateAppointmentRequest = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        department: formData.department,
        reason: formData.reason || undefined
      }

      const response = await apiService.createPublicAppointment(appointmentRequest)
      
      setSubmitStatus({
        type: 'success',
        message: response.message,
        appointmentId: response.appointmentId
      })

      // Reset form
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        appointmentDate: '',
        appointmentTime: '',
        department: '',
        reason: ''
      })

    } catch (error) {
      console.error('Error creating appointment:', error)
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Có lỗi xảy ra khi đặt lịch hẹn. Vui lòng thử lại.'
      })
    } finally {
      setIsSubmitting(false)
    }
      }
  
  // Add date validation function
  const isValidDate = (dateString: string) => {
    if (!dateString) return false
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date instanceof Date && !isNaN(date.getTime()) && date >= today
  }

  // Add console logging for debugging
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Log date changes for debugging
    if (name === 'appointmentDate') {
      console.log('Date selected:', value)
      console.log('Is valid date:', isValidDate(value))
    }
    
    setFormData({
      ...formData,
      [name]: value
    })
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Đặt lịch hẹn</h1>
          <p className="text-xl text-gray-600">
            Vui lòng điền thông tin để đặt lịch hẹn với bác sĩ
          </p>
        </div>

        {/* Success/Error Messages */}
        {submitStatus.type && (
          <div className={`mb-8 p-4 rounded-lg flex items-start space-x-3 ${
            submitStatus.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {submitStatus.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className="font-medium">{submitStatus.message}</p>
              {submitStatus.type === 'success' && submitStatus.appointmentId && (
                <div className="mt-2 text-sm">
                  <p><strong>Mã lịch hẹn:</strong> #{submitStatus.appointmentId}</p>
                  <p className="mt-1">📧 <strong>Email xác nhận đã được gửi tự động</strong> (nếu bạn cung cấp email)</p>
                  <p className="mt-1">🔔 Chúng tôi sẽ gửi email nhắc nhở 1 ngày trước ngày hẹn</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Họ và tên *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập họ và tên"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0123456789"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email (để nhận thông báo tự động)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@example.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Khoa khám *
                </label>
                <select
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="">Chọn khoa khám</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Ngày khám *
                  </label>
                  <input
                    type="date"
                    name="appointmentDate"
                    required
                    value={formData.appointmentDate}
                    onChange={handleChange}
                    min={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Giờ khám *
                  </label>
                  <select
                    name="appointmentTime"
                    required
                    value={formData.appointmentTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="">Chọn giờ khám</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do khám
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả triệu chứng hoặc lý do khám bệnh..."
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-md font-semibold transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-pink-600 text-white hover:bg-pink-700'
                }`}
              >
                {isSubmitting ? 'Đang đặt lịch...' : 'Đặt lịch hẹn'}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📧 Thông báo Email tự động</h3>
              <div className="space-y-3 text-blue-800 text-sm">
                <p>✅ <strong>Email xác nhận</strong> sẽ được gửi ngay sau khi đặt lịch</p>
                <p>🔔 <strong>Email nhắc nhở</strong> sẽ được gửi 1 ngày trước ngày hẹn</p>
                <p>📱 Bạn cũng sẽ nhận được thông báo khi lịch hẹn được xác nhận</p>
                <p className="text-xs text-blue-600 mt-2">
                  💡 Vui lòng cung cấp email để nhận thông báo tự động
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Thông tin liên hệ</h3>
              <div className="space-y-3 text-blue-800">
                <p><strong>Hotline:</strong> 1900 1234</p>
                <p><strong>Email:</strong> contact@medical.com</p>
                <p><strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP.HCM</p>
                <p><strong>Giờ làm việc:</strong> 8:00 - 17:00 (Thứ 2 - Thứ 7)</p>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Lưu ý quan trọng</h3>
              <ul className="space-y-2 text-green-800 text-sm">
                <li>• Vui lòng đến trước giờ hẹn 15 phút</li>
                <li>• Mang theo CMND và thẻ BHYT (nếu có)</li>
                <li>• Nhịn ăn 8 tiếng nếu cần xét nghiệm máu</li>
                <li>• Liên hệ trước 24h nếu cần hủy lịch</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">Cấp cứu 24/7</h3>
              <p className="text-yellow-800 text-sm">
                Trong trường hợp khẩn cấp, vui lòng gọi <strong>115</strong> 
                hoặc đến trực tiếp khoa Cấp cứu của bệnh viện.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppointmentPage 