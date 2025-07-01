import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { apiService, CreateAppointmentRequest, DepartmentInfo } from '../utils/api'

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
    type: 'success' | 'error' | 'payment' | null
    message: string
    appointmentId?: number
  }>({ type: null, message: '' })

  const [departments, setDepartments] = useState<DepartmentInfo[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  // Check authentication and auto-fill user info
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    const userInfoStr = localStorage.getItem('userInfo')
    
    if (token && userInfoStr) {
      try {
        const user = JSON.parse(userInfoStr)
        if (user.role === 'PATIENT') {
          setIsLoggedIn(true)
          setUserInfo(user)
          
          // Auto-fill form with user information
          setFormData(prev => ({
            ...prev,
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '' // This might be empty if not in profile
          }))
        }
      } catch (error) {
        console.error('Error parsing user info:', error)
      }
    }
  }, [])

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsData = await apiService.getDepartments()
        setDepartments(departmentsData)
      } catch (error) {
        console.error('Error fetching departments:', error)
        // Fallback to basic departments if API fails
        setDepartments([
          { code: 'INTERNAL_MEDICINE', departmentName: 'Khoa Nội tổng hợp', specialtyName: 'Nội khoa' },
          { code: 'SURGERY', departmentName: 'Khoa Ngoại tổng hợp', specialtyName: 'Ngoại khoa' },
          { code: 'PEDIATRICS', departmentName: 'Khoa Nhi', specialtyName: 'Nhi khoa' },
          { code: 'GYNECOLOGY', departmentName: 'Khoa Sản phụ khoa', specialtyName: 'Phụ khoa' },
          { code: 'OPHTHALMOLOGY', departmentName: 'Khoa Mắt', specialtyName: 'Mắt' },
          { code: 'ENT', departmentName: 'Khoa Tai mũi họng', specialtyName: 'Tai mũi họng' },
          { code: 'DERMATOLOGY', departmentName: 'Khoa Da liễu', specialtyName: 'Da liễu' },
          { code: 'NEUROLOGY', departmentName: 'Khoa Thần kinh', specialtyName: 'Thần kinh' }
        ])
      } finally {
        setLoadingDepartments(false)
      }
    }

    fetchDepartments()
  }, [])

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
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Status for Patients */}
        {isLoggedIn && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-blue-800 font-medium">Bạn đã đăng nhập</p>
                <p className="text-blue-700 text-sm">
                  Thông tin cá nhân đã được tự động điền. Chào {userInfo?.fullName}!
                </p>
              </div>
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
                  {isLoggedIn && (
                    <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Đã đăng nhập
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoggedIn || isSubmitting}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isLoggedIn 
                      ? 'bg-gray-50 cursor-not-allowed text-gray-600' 
                      : ''
                  }`}
                  placeholder={isLoggedIn ? "Thông tin đã được tự động điền" : "Nhập họ và tên"}
                />
                {isLoggedIn && (
                  <p className="mt-1 text-sm text-blue-600">
                    Thông tin được lấy từ tài khoản của bạn
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Số điện thoại *
                    {isLoggedIn && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Đã đăng nhập
                      </span>
                    )}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoggedIn || isSubmitting}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isLoggedIn 
                        ? 'bg-gray-50 cursor-not-allowed text-gray-600' 
                        : ''
                    }`}
                    placeholder={isLoggedIn ? "Số điện thoại đã được tự động điền" : "0123456789"}
                  />
                  {isLoggedIn && (
                    <p className="mt-1 text-sm text-blue-600">
                      {formData.phone ? 'Số điện thoại từ tài khoản của bạn' : 'Chưa có số điện thoại trong tài khoản'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                    {isLoggedIn && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Đã đăng nhập
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoggedIn || isSubmitting}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isLoggedIn 
                        ? 'bg-gray-50 cursor-not-allowed text-gray-600' 
                        : ''
                    }`}
                    placeholder={isLoggedIn ? "Email đã được tự động điền" : "email@example.com"}
                  />
                  {isLoggedIn && (
                    <p className="mt-1 text-sm text-blue-600">
                      Email từ tài khoản đăng nhập
                    </p>
                  )}
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
                    <option key={dept.code} value={dept.code}>{dept.departmentName}</option>
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