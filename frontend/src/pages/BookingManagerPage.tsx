import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Mail, Building2, Check, X, Eye, Search, AlertCircle, CheckCircle, XCircle, Calendar as CalendarIcon, TrendingUp, UserCheck, Trash2, Edit, UserPlus } from 'lucide-react'
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
  status: 'PENDING' | 'AWAITING_DOCTOR_APPROVAL' | 'CONFIRMED' | 'PAYMENT_REQUESTED' | 'PAID' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
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

  // Bulk selection states
  const [selectedAppointments, setSelectedAppointments] = useState<Set<number>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Bulk permanent delete states
  const [showBulkPermanentDeleteConfirm, setShowBulkPermanentDeleteConfirm] = useState(false)
  const [bulkPermanentDeleting, setBulkPermanentDeleting] = useState(false)

  // Bulk cancel states
  const [showBulkCancelConfirm, setShowBulkCancelConfirm] = useState(false)
  const [bulkCancelling, setBulkCancelling] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')

  // Bulk paid states
  const [showBulkPaidConfirm, setShowBulkPaidConfirm] = useState(false)
  const [bulkMarking, setBulkMarking] = useState(false)

  // Doctor selection modal states
  const [showDoctorModal, setShowDoctorModal] = useState(false)
  const [selectedAppointmentForConfirm, setSelectedAppointmentForConfirm] = useState<Appointment | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null)
  const [confirmingWithDoctor, setConfirmingWithDoctor] = useState(false)
  const [specialties, setSpecialties] = useState<Array<{code: string, displayName: string}>>([])
  const [departments, setDepartments] = useState<DepartmentInfo[]>([])

  // Payment request modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<Appointment | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [requestingPayment, setRequestingPayment] = useState(false)

  // Edit appointment modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState<Appointment | null>(null)
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    appointmentDate: '',
    appointmentTime: '',
    department: '',
    reason: ''
  })
  const [updatingAppointment, setUpdatingAppointment] = useState(false)

  // View modal edit states
  const [isEditingInView, setIsEditingInView] = useState(false)
  const [viewEditData, setViewEditData] = useState({
    fullName: '',
    phone: '',
    email: '',
    appointmentDate: '',
    appointmentTime: '',
    department: ''
  })

  // Create account states
  const [creatingAccount, setCreatingAccount] = useState(false)

  // Bulk request payment states
  const [showBulkRequestPaymentConfirm, setShowBulkRequestPaymentConfirm] = useState(false)
  const [bulkRequestingPayment, setBulkRequestingPayment] = useState(false)
  const [bulkPaymentAmount, setBulkPaymentAmount] = useState<string>('')

  // Helper functions for date/time validation
  const getMinValidDate = () => {
    const now = new Date()
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    
    // If it's late in the day (after 22:00), set min date to tomorrow
    if (now.getHours() >= 22) {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toISOString().split('T')[0]
    }
    
    return now.toISOString().split('T')[0]
  }

  const getValidTimeSlots = (selectedDate: string) => {
    const allTimeSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '13:30', '14:00', '14:30', '15:00',
      '15:30', '16:00', '16:30', '17:00'
    ]

    if (!selectedDate) return allTimeSlots

    const now = new Date()
    const selectedDateObj = new Date(selectedDate)
    const isToday = selectedDateObj.toDateString() === now.toDateString()

    if (!isToday) {
      return allTimeSlots // All times valid for future dates
    }

    // For today, only show times that are at least 2 hours from now
    const minValidTime = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const minHour = minValidTime.getHours()
    const minMinute = minValidTime.getMinutes()

    return allTimeSlots.filter(timeSlot => {
      const [hour, minute] = timeSlot.split(':').map(Number)
      return hour > minHour || (hour === minHour && minute >= minMinute)
    })
  }

  // Handle editing in view modal
  const handleEditInView = (appointment: Appointment) => {
    setViewEditData({
      fullName: appointment.fullName,
      phone: appointment.phone,
      email: appointment.email,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      department: appointment.department
    })
    setIsEditingInView(true)
  }

  const handleSaveInView = async () => {
    if (!selectedAppointment) return

    // Validate required fields
    if (!viewEditData.fullName.trim() || !viewEditData.phone.trim() || !viewEditData.appointmentDate || !viewEditData.appointmentTime || !viewEditData.department) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    // Basic validation - the date/time options are already filtered to be valid

    setUpdatingAppointment(true)
    try {
      // Check time slot availability if date/time/department changed
      const hasDateTimeChange = 
        viewEditData.appointmentDate !== selectedAppointment.appointmentDate ||
        viewEditData.appointmentTime !== selectedAppointment.appointmentTime ||
        viewEditData.department !== selectedAppointment.department

      if (hasDateTimeChange) {
        const availability = await apiService.checkTimeSlotAvailability(
          viewEditData.appointmentDate,
          viewEditData.appointmentTime,
          viewEditData.department
        )
        
        if (!availability.available) {
          toast.error(availability.message)
          return
        }
      }

      // Update appointment
      await apiService.updateAppointment(selectedAppointment.id, {
        fullName: viewEditData.fullName.trim(),
        phone: viewEditData.phone.trim(),
        email: viewEditData.email.trim(),
        appointmentDate: viewEditData.appointmentDate,
        appointmentTime: viewEditData.appointmentTime,
        department: viewEditData.department
      })

      // Update the local state
      const updatedAppointment = {
        ...selectedAppointment,
        fullName: viewEditData.fullName.trim(),
        phone: viewEditData.phone.trim(),
        email: viewEditData.email.trim(),
        appointmentDate: viewEditData.appointmentDate,
        appointmentTime: viewEditData.appointmentTime,
        department: viewEditData.department
      }
      setSelectedAppointment(updatedAppointment)

      // Refresh appointments list
      await fetchAppointments()
      
      setIsEditingInView(false)
      
      // Send notification email about appointment changes
      try {
        if (selectedAppointment.email) {
          // Determine what changed to customize email content
          const changes = []
          if (viewEditData.fullName !== selectedAppointment.fullName) changes.push('họ tên')
          if (viewEditData.phone !== selectedAppointment.phone) changes.push('số điện thoại')
          if (viewEditData.email !== selectedAppointment.email) changes.push('email')
          if (viewEditData.appointmentDate !== selectedAppointment.appointmentDate) changes.push('ngày hẹn')
          if (viewEditData.appointmentTime !== selectedAppointment.appointmentTime) changes.push('giờ hẹn')
          if (viewEditData.department !== selectedAppointment.department) changes.push('khoa khám')

          if (changes.length > 0) {
            // Send email notification about changes
            try {
              const emailResult = await apiService.sendAppointmentUpdateNotification(selectedAppointment.id, {
                patientEmail: selectedAppointment.email,
                patientName: selectedAppointment.fullName,
                changes: changes,
                newAppointmentDate: viewEditData.appointmentDate,
                newAppointmentTime: viewEditData.appointmentTime,
                newDepartment: getDepartmentDisplayName(viewEditData.department)
              })
              
              if (emailResult.success) {
                if (emailResult.message.includes('simulated')) {
                  toast.success(`Thông tin đã được cập nhật (thay đổi: ${changes.join(', ')}). Email thông báo sẽ được triển khai trong phiên bản tiếp theo.`)
                } else {
                  toast.success(`Thông tin đã được cập nhật và email thông báo đã được gửi đến bệnh nhân (thay đổi: ${changes.join(', ')})`)
                }
              } else {
                toast.success(`Thông tin đã được cập nhật (thay đổi: ${changes.join(', ')}). Không thể gửi email thông báo: ${emailResult.message}`)
              }
            } catch (emailError) {
              console.error('Error sending email notification:', emailError)
              toast.success(`Thông tin đã được cập nhật (thay đổi: ${changes.join(', ')}). Không thể gửi email thông báo`)
            }
          } else {
            toast.success('Thông tin đã được cập nhật thành công')
          }
        } else {
          toast.success('Thông tin đã được cập nhật thành công (không có email để gửi thông báo)')
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError)
        toast.success('Thông tin đã được cập nhật thành công (không thể gửi email thông báo)')
      }
    } catch (error: any) {
      console.error('Error updating appointment:', error)
      toast.error(error.message || 'Không thể cập nhật thông tin')
    } finally {
      setUpdatingAppointment(false)
    }
  }

  const handleCancelEditInView = () => {
    setIsEditingInView(false)
    setViewEditData({
      fullName: '',
      phone: '',
      email: '',
      appointmentDate: '',
      appointmentTime: '',
      department: ''
    })
  }

  // Get department display name from code
  const getDepartmentDisplayName = (departmentCode: string) => {
    const department = departments.find(dept => dept.code === departmentCode)
    return department?.departmentName || departmentCode
  }

  // Get relevant doctors for a specific appointment department
  // Now that departments and specialties are synchronized, we can do direct mapping
  const getRelevantDoctors = (department: string): Doctor[] => {
    return doctors.filter(doctor => 
      !doctor.specialty || // Include doctors without specialty (general practice)
      doctor.specialty === department || // Direct match with department code
      doctor.specialty === 'GENERAL_PRACTICE' // Always include general practice doctors
    )
  }

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    AWAITING_DOCTOR_APPROVAL: 'bg-purple-100 text-purple-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
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
    PAYMENT_REQUESTED: 'Yêu cầu thanh toán',
    PAID: 'Đã thanh toán',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
    NO_SHOW: 'Không đến'
  }

  useEffect(() => {
    fetchAppointments()
    fetchStats()
    fetchDoctors()
    fetchSpecialties()
    fetchDepartments()
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
      toast.error('Không thể tải danh sách bác sĩ')
    }
  }

  const fetchSpecialties = async () => {
    try {
      const specialtiesData = await apiService.getMedicalSpecialties()
      setSpecialties(specialtiesData)
    } catch (error) {
      console.error('Error fetching specialties:', error)
      toast.error('Không thể tải danh sách chuyên khoa')
    }
  }

  const fetchDepartments = async () => {
    try {
      const departmentsData = await apiService.getDepartments()
      setDepartments(departmentsData)
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Không thể tải danh sách khoa')
    }
  }

  const handleConfirmWithDoctor = async () => {
    if (!selectedAppointmentForConfirm || !selectedDoctorId) {
      toast.error('Vui lòng chọn bác sĩ')
      return
    }

    setConfirmingWithDoctor(true)
    try {
      await apiService.assignDoctorToAppointment(selectedAppointmentForConfirm.id, selectedDoctorId)
      
      await fetchAppointments()
      await fetchStats()
      
      setShowDoctorModal(false)
      setSelectedAppointmentForConfirm(null)
      setSelectedDoctorId(null)
      
      toast.success('Bác sĩ đã được chỉ định. Chờ bác sĩ phản hồi.')
    } catch (error) {
      console.error('Error assigning doctor to appointment:', error)
      toast.error('Không thể chỉ định bác sĩ')
    } finally {
      setConfirmingWithDoctor(false)
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
      // Get the current appointment to validate workflow
      const currentAppointment = appointments.find(apt => apt.id === id)
      if (!currentAppointment) {
        toast.error('Không tìm thấy lịch hẹn')
        return
      }

      // Enforce workflow restrictions
      const currentStatus = currentAppointment.status
      
      if (status === 'CONFIRMED' && currentStatus !== 'AWAITING_DOCTOR_APPROVAL') {
        toast.error('Chỉ có thể confirm lịch hẹn đang chờ bác sĩ phản hồi')
        return
      }
      
      if (status === 'AWAITING_DOCTOR_APPROVAL' && currentStatus !== 'PENDING') {
        toast.error('Chỉ có thể assign doctor cho lịch hẹn PENDING')
        return
      }
      
      if (status === 'PAYMENT_REQUESTED' && currentStatus !== 'CONFIRMED') {
        toast.error('Chỉ có thể yêu cầu thanh toán sau khi đã confirm')
        return
      }

      if (status === 'COMPLETED' && currentStatus !== 'PAID') {
        toast.error('Chỉ có thể hoàn thành lịch hẹn sau khi đã thanh toán')
        return
      }

      // Handle status updates through appropriate API calls
      if (status === 'CANCELLED') {
        await apiService.cancelAppointment(id, reason || 'Cancelled by staff')
      } else {
        // For other status changes, use the general update API
        await apiService.updateAppointment(id, { 
          status: status as 'PENDING' | 'AWAITING_DOCTOR_APPROVAL' | 'CONFIRMED' | 'PAYMENT_REQUESTED' | 'PAID' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
        })
      }
      
      await fetchAppointments()
      await fetchStats()
      
      // Auto create patient account when appointment is completed
      if (status === 'COMPLETED' && currentAppointment.email) {
        try {
          const result = await createPatientAccount(currentAppointment)
          if (result.success) {
            toast.success(`Lịch hẹn hoàn thành. Tài khoản bệnh nhân đã được tạo tự động. Password: 123456`)
          } else if (result.message.includes('đã tồn tại')) {
            toast.success(`Lịch hẹn hoàn thành. Bệnh nhân đã có tài khoản`)
          } else {
            toast.success(`Lịch hẹn hoàn thành. Không thể tạo tài khoản: ${result.message}`)
          }
        } catch (error) {
          console.error('Error auto-creating account on completion:', error)
          toast.success('Lịch hẹn hoàn thành. Không thể tạo tài khoản tự động')
        }
        return // Exit early since we already showed a message
      }
      
      const statusLabelsMap = {
        'PENDING': 'chờ xác nhận',
        'AWAITING_DOCTOR_APPROVAL': 'chờ bác sĩ phản hồi',
        'CONFIRMED': 'xác nhận',
        'PAYMENT_REQUESTED': 'yêu cầu thanh toán',
        'PAID': 'đã thanh toán',
        'COMPLETED': 'hoàn thành',
        'CANCELLED': 'hủy',
        'NO_SHOW': 'không đến'
      }
      
      toast.success(`Lịch hẹn đã được cập nhật thành ${statusLabelsMap[status as keyof typeof statusLabelsMap] || status}`)
    } catch (error) {
      console.error('Error updating appointment status:', error)
      toast.error('Không thể cập nhật trạng thái lịch hẹn')
    }
  }

  const handleRequestPayment = async (appointment: Appointment) => {
    setSelectedAppointmentForPayment(appointment)
    setPaymentAmount('')
    setShowPaymentModal(true)
  }

  const handlePaymentRequest = async () => {
    if (!selectedAppointmentForPayment || !paymentAmount) {
      toast.error('Vui lòng nhập số tiền thanh toán')
      return
    }

    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0')
      return
    }

    setRequestingPayment(true)
    try {
      await apiService.requestPayment(selectedAppointmentForPayment.id, amount)
      await fetchAppointments()
      await fetchStats()
      
      setShowPaymentModal(false)
      setSelectedAppointmentForPayment(null)
      setPaymentAmount('')
      
      toast.success('Yêu cầu thanh toán đã được gửi')
    } catch (error) {
      console.error('Error requesting payment:', error)
      toast.error('Không thể gửi yêu cầu thanh toán')
    } finally {
      setRequestingPayment(false)
    }
  }

  // Create account function (single appointment)
  const handleCreateAccount = async (appointment: Appointment) => {
    if (!appointment.email) {
      toast.error('Bệnh nhân phải có email để tạo tài khoản')
      return
    }

    setCreatingAccount(true)
    try {
      const result = await createPatientAccount(appointment)
      
      if (result.success) {
        toast.success(`${result.message}. Password: 123456`)
      } else {
        if (result.message.includes('đã tồn tại')) {
          toast.success(result.message)
        } else {
          toast.error(result.message)
        }
      }
    } catch (error: any) {
      console.error('Error creating account:', error)
      toast.error(error.message || 'Không thể tạo tài khoản')
    } finally {
      setCreatingAccount(false)
    }
  }

  // Edit appointment functions
  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointmentForEdit(appointment)
    setEditFormData({
      fullName: appointment.fullName,
      phone: appointment.phone,
      email: appointment.email,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      department: appointment.department,
      reason: appointment.reason || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateAppointment = async () => {
    if (!selectedAppointmentForEdit) return

    // Validate required fields
    if (!editFormData.fullName || !editFormData.phone || !editFormData.appointmentDate || !editFormData.appointmentTime || !editFormData.department) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    // Validate date format and value
    const appointmentDate = new Date(editFormData.appointmentDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (appointmentDate < today) {
      toast.error('Ngày khám không thể là ngày đã qua')
      return
    }

    setUpdatingAppointment(true)
    try {
      // Check time slot availability if date/time/department changed
      const hasDateTimeChange = 
        editFormData.appointmentDate !== selectedAppointmentForEdit.appointmentDate ||
        editFormData.appointmentTime !== selectedAppointmentForEdit.appointmentTime ||
        editFormData.department !== selectedAppointmentForEdit.department

      if (hasDateTimeChange) {
        const availability = await apiService.checkTimeSlotAvailability(
          editFormData.appointmentDate,
          editFormData.appointmentTime,
          editFormData.department
        )
        
        if (!availability.available) {
          toast.error(availability.message)
          return
        }
      }

      // Update appointment
      await apiService.updateAppointment(selectedAppointmentForEdit.id, {
        fullName: editFormData.fullName,
        phone: editFormData.phone,
        email: editFormData.email,
        appointmentDate: editFormData.appointmentDate,
        appointmentTime: editFormData.appointmentTime,
        department: editFormData.department,
        reason: editFormData.reason || undefined
      })

      await fetchAppointments()
      await fetchStats()
      
      setShowEditModal(false)
      setSelectedAppointmentForEdit(null)
      setEditFormData({
        fullName: '',
        phone: '',
        email: '',
        appointmentDate: '',
        appointmentTime: '',
        department: '',
        reason: ''
      })
      
      toast.success('Lịch hẹn đã được cập nhật thành công')
    } catch (error: any) {
      console.error('Error updating appointment:', error)
      toast.error(error.message || 'Không thể cập nhật lịch hẹn')
    } finally {
      setUpdatingAppointment(false)
    }
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5)
  }

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('vi-VN')
  }

  const getSpecialtyDisplayName = (specialtyCode?: string) => {
    if (!specialtyCode) return 'Đa khoa'
    const specialty = specialties.find(s => s.code === specialtyCode)
    return specialty?.displayName || specialtyCode
  }

  const StatusIcon = ({ status }: { status: string }) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons]
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null
  }

  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAppointments(new Set())
      setSelectAll(false)
    } else {
      const allIds = new Set(filteredAppointments.map(apt => apt.id))
      setSelectedAppointments(allIds)
      setSelectAll(true)
    }
  }

  const handleSelectAppointment = (id: number) => {
    const newSelected = new Set(selectedAppointments)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedAppointments(newSelected)
    setSelectAll(newSelected.size === filteredAppointments.length && filteredAppointments.length > 0)
  }



  // Bulk permanent delete functions
  const handleBulkPermanentDelete = async () => {
    if (selectedAppointments.size === 0) {
      toast.error('Vui lòng chọn ít nhất một lịch hẹn để xóa')
      return
    }
    setShowBulkPermanentDeleteConfirm(true)
  }

  const confirmBulkPermanentDelete = async () => {
    setBulkPermanentDeleting(true)
    try {
      console.log('Starting permanent delete for appointments:', Array.from(selectedAppointments))
      
      const deletePromises = Array.from(selectedAppointments).map(async (id) => {
        console.log(`Deleting appointment ${id}...`)
        try {
          await apiService.deleteAppointment(id)
          console.log(`Successfully deleted appointment ${id}`)
          return id
        } catch (error) {
          console.error(`Failed to delete appointment ${id}:`, error)
          throw error
        }
      })
      
      await Promise.all(deletePromises)
      
      console.log('All appointments deleted, refreshing data...')
      
      // Force refresh by clearing appointments first
      setAppointments([])
      setFilteredAppointments([])
      
      await fetchAppointments()
      await fetchStats()
      
      setSelectedAppointments(new Set())
      setSelectAll(false)
      setShowBulkPermanentDeleteConfirm(false)
      
      toast.success(`Đã xóa vĩnh viễn ${selectedAppointments.size} lịch hẹn`)
      console.log('Data refresh completed')
    } catch (error) {
      console.error('Error permanently deleting appointments:', error)
      toast.error('Không thể xóa vĩnh viễn một số lịch hẹn')
    } finally {
      setBulkPermanentDeleting(false)
    }
  }

  // Bulk cancel functions
  const handleBulkCancel = async () => {
    if (selectedAppointments.size === 0) {
      toast.error('Vui lòng chọn ít nhất một lịch hẹn để hủy')
      return
    }
    setCancellationReason('')
    setShowBulkCancelConfirm(true)
  }

  const confirmBulkCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy lịch hẹn')
      return
    }

    setBulkCancelling(true)
    let successCount = 0
    let errorCount = 0

    try {
      const cancelPromises = Array.from(selectedAppointments).map(async (id) => {
        try {
          // Cancel appointment with reason via the API
          await apiService.cancelAppointment(id, cancellationReason.trim())
          successCount++
          return id
        } catch (error) {
          console.error(`Failed to cancel appointment ${id}:`, error)
          errorCount++
          throw error
        }
      })
      
      await Promise.allSettled(cancelPromises)
      
      await fetchAppointments()
      await fetchStats()
      
      setSelectedAppointments(new Set())
      setSelectAll(false)
      setShowBulkCancelConfirm(false)
      setCancellationReason('')
      
      if (successCount > 0) {
        toast.success(`Đã hủy thành công ${successCount} lịch hẹn và gửi email thông báo`)
      }
      if (errorCount > 0) {
        toast.error(`Có ${errorCount} lịch hẹn không thể hủy`)
      }
    } catch (error) {
      console.error('Error bulk cancelling appointments:', error)
      toast.error('Không thể hủy một số lịch hẹn')
    } finally {
      setBulkCancelling(false)
    }
  }

  // Bulk paid functions
  const handleBulkPaid = async () => {
    if (selectedAppointments.size === 0) {
      toast.error('Vui lòng chọn ít nhất một lịch hẹn để đánh dấu đã thanh toán')
      return
    }
    setShowBulkPaidConfirm(true)
  }

  const confirmBulkPaid = async () => {
    console.log('🔍 DEBUG: confirmBulkPaid started')
    console.log('🔍 DEBUG: selectedAppointments:', Array.from(selectedAppointments))
    
    setBulkMarking(true)
    let successCount = 0
    let errorCount = 0
    let emailSuccessCount = 0
    let emailErrorCount = 0

    try {
      const selectedIds = Array.from(selectedAppointments)
      console.log('🔍 DEBUG: selectedIds:', selectedIds)
      
      // First, mark appointments as paid
      const paidPromises = selectedIds.map(async (id) => {
        console.log('🔍 DEBUG: Processing appointment ID:', id)
        try {
          await apiService.updateAppointment(id, { status: 'PAID' })
          successCount++
          console.log('✅ Successfully updated appointment', id, 'to PAID')
          return id
        } catch (error) {
          console.error(`❌ Failed to mark appointment ${id} as paid:`, error)
          errorCount++
          throw error
        }
      })
      
      console.log('🔍 DEBUG: Waiting for appointment updates...')
      const results = await Promise.allSettled(paidPromises)
      console.log('🔍 DEBUG: Update results:', results)
      
      // Then, send email notifications for successfully updated appointments
      const successfulIds = selectedIds.filter((id, index) => {
        const result = results[index]
        const isSuccess = result.status === 'fulfilled'
        console.log('🔍 DEBUG: Appointment', id, 'update success:', isSuccess)
        return isSuccess
      })

      console.log('🔍 DEBUG: successfulIds after filtering:', successfulIds)
      console.log('🔍 DEBUG: successCount:', successCount, 'errorCount:', errorCount)

      if (successfulIds.length > 0) {
        // Send email notifications
        console.log('🔍 DEBUG: Starting email notifications for', successfulIds.length, 'appointments')
        
        const emailPromises = successfulIds.map(async (appointmentId) => {
          try {
            const appointment = appointments.find(apt => apt.id === appointmentId)
            console.log('🔍 DEBUG: Processing appointment', appointmentId, 'email:', appointment?.email)
            
            if (appointment && appointment.email) {
              console.log('🔍 DEBUG: Sending payment confirmation email to', appointment.email)
              
              // Send payment confirmation email
              const emailResult = await apiService.sendPaymentConfirmationEmail(appointmentId, {
                patientEmail: appointment.email,
                patientName: appointment.fullName,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.appointmentTime,
                department: getDepartmentDisplayName(appointment.department)
              })
              
              console.log('🔍 DEBUG: Email result for appointment', appointmentId, ':', emailResult)
              
              if (emailResult.success) {
                emailSuccessCount++
                console.log('✅ Email sent successfully for appointment', appointmentId)
              } else {
                emailErrorCount++
                console.log('❌ Email failed for appointment', appointmentId, ':', emailResult.message)
              }
            } else {
              console.log('⚠️ DEBUG: Skipping appointment', appointmentId, '- no email or appointment not found')
            }
          } catch (emailError) {
            console.error(`❌ Failed to send payment confirmation email for appointment ${appointmentId}:`, emailError)
            emailErrorCount++
          }
        })

        console.log('🔍 DEBUG: Waiting for all email promises to complete...')
        await Promise.allSettled(emailPromises)
        console.log('🔍 DEBUG: Email notifications completed. Success:', emailSuccessCount, 'Errors:', emailErrorCount)
      }
      
      await fetchAppointments()
      await fetchStats()
      
      setSelectedAppointments(new Set())
      setSelectAll(false)
      setShowBulkPaidConfirm(false)
      
      // Show comprehensive success/error messages
      if (successCount > 0) {
        if (emailSuccessCount > 0) {
          toast.success(`Đã đánh dấu ${successCount} lịch hẹn là đã thanh toán và gửi email thông báo đến ${emailSuccessCount} bệnh nhân`)
        } else {
          toast.success(`Đã đánh dấu ${successCount} lịch hẹn là đã thanh toán`)
        }
      }
      
      if (emailErrorCount > 0) {
        toast.success(`Lưu ý: ${emailErrorCount} email thông báo không thể gửi, nhưng trạng thái đã được cập nhật`)
      }
      
      if (errorCount > 0) {
        toast.error(`Có ${errorCount} lịch hẹn không thể đánh dấu`)
      }
    } catch (error) {
      console.error('Error bulk marking appointments as paid:', error)
      toast.error('Không thể đánh dấu một số lịch hẹn')
    } finally {
      setBulkMarking(false)
    }
  }

  // Check if account already exists by email
  const checkAccountExists = async (email: string): Promise<boolean> => {
    try {
      const users = await apiService.searchUsers(email)
      return users.some(user => user.email.toLowerCase() === email.toLowerCase())
    } catch (error) {
      console.error('Error checking account existence:', error)
      return false
    }
  }

  // Create account for a single patient
  const createPatientAccount = async (appointment: Appointment): Promise<{ success: boolean; message: string }> => {
    try {
      // Check if account already exists
      const accountExists = await checkAccountExists(appointment.email)
      if (accountExists) {
        return { success: false, message: `Tài khoản với email ${appointment.email} đã tồn tại` }
      }

      // Create new patient account
      const newUser = await apiService.createUser({
        username: appointment.email,
        email: appointment.email,
        password: '123456',
        fullName: appointment.fullName,
        role: 'PATIENT',
        phone: appointment.phone,
        active: true
      })

      return { success: true, message: `Tạo tài khoản thành công cho ${appointment.fullName}` }
    } catch (error: any) {
      return { success: false, message: `Lỗi tạo tài khoản cho ${appointment.fullName}: ${error.message}` }
    }
  }

  // Bulk create accounts function
  const handleBulkCreateAccounts = async () => {
    if (selectedAppointments.size === 0) {
      toast.error('Vui lòng chọn ít nhất một lịch hẹn để tạo tài khoản')
      return
    }

    // Filter appointments that have email
    const appointmentsWithEmail = appointments.filter(apt => 
      selectedAppointments.has(apt.id) && apt.email && apt.email.trim() !== ''
    )

    if (appointmentsWithEmail.length === 0) {
      toast.error('Không có lịch hẹn nào có email để tạo tài khoản')
      return
    }

    setCreatingAccount(true)
    let successCount = 0
    let errorCount = 0
    let skipCount = 0

    try {
      const createPromises = appointmentsWithEmail.map(async (appointment) => {
        const result = await createPatientAccount(appointment)
        if (result.success) {
          successCount++
        } else {
          if (result.message.includes('đã tồn tại')) {
            skipCount++
          } else {
            errorCount++
          }
        }
        return result
      })

      await Promise.all(createPromises)

      setSelectedAppointments(new Set())
      setSelectAll(false)

      // Show results
      if (successCount > 0) {
        toast.success(`Đã tạo thành công ${successCount} tài khoản mới. Password mặc định: 123456`)
      }
      if (skipCount > 0) {
        toast.success(`Đã bỏ qua ${skipCount} tài khoản đã tồn tại`)
      }
      if (errorCount > 0) {
        toast.error(`Có ${errorCount} tài khoản không thể tạo`)
      }
    } catch (error) {
      console.error('Error bulk creating accounts:', error)
      toast.error('Có lỗi xảy ra khi tạo tài khoản hàng loạt')
    } finally {
      setCreatingAccount(false)
    }
  }

  // Reset selection when filtered appointments change
  useEffect(() => {
    setSelectedAppointments(new Set())
    setSelectAll(false)
  }, [filteredAppointments])

  // Helper function to handle status changes with confirmation
  const handleStatusChangeWithConfirmation = async (
    appointmentId: number, 
    newStatus: string, 
    reason?: string,
    confirmMessage?: string
  ) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return
    }
    
    try {
      await updateAppointmentStatus(appointmentId, newStatus, reason)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // Bulk request payment functions
  const handleBulkRequestPayment = async () => {
    setShowBulkRequestPaymentConfirm(true)
  }

  const confirmBulkRequestPayment = async () => {
    if (!bulkPaymentAmount.trim() || isNaN(Number(bulkPaymentAmount))) {
      toast.error('Vui lòng nhập số tiền hợp lệ')
      return
    }

    setBulkRequestingPayment(true)
    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    try {
      const selectedIds = Array.from(selectedAppointments)
      
      for (const appointmentId of selectedIds) {
        try {
          const appointment = appointments.find(apt => apt.id === appointmentId)
          if (!appointment) {
            failedCount++
            errors.push(`Lịch hẹn #${appointmentId}: Không tìm thấy`)
            continue
          }

          // Check if appointment is in CONFIRMED status
          if (appointment.status !== 'CONFIRMED') {
            failedCount++
            errors.push(`Lịch hẹn #${appointmentId}: Trạng thái không hợp lệ (${statusLabels[appointment.status]})`)
            continue
          }

          await apiService.requestPayment(appointmentId, Number(bulkPaymentAmount))
          successCount++
        } catch (error: any) {
          failedCount++
          errors.push(`Lịch hẹn #${appointmentId}: ${error.message}`)
        }
      }

      if (successCount > 0) {
        await fetchAppointments()
        await fetchStats()
        setSelectedAppointments(new Set())
        setSelectAll(false)
      }

      if (failedCount === 0) {
        toast.success(`Đã yêu cầu thanh toán thành công cho ${successCount} lịch hẹn`)
      } else {
        toast.error(`Thành công: ${successCount}, Thất bại: ${failedCount}. Chi tiết lỗi: ${errors.join(', ')}`)
      }
    } catch (error) {
      console.error('Error bulk requesting payment:', error)
      toast.error('Có lỗi xảy ra khi yêu cầu thanh toán')
    } finally {
      setBulkRequestingPayment(false)
      setShowBulkRequestPaymentConfirm(false)
      setBulkPaymentAmount('')
    }
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

      {/* Filters and Bulk Actions */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col gap-4">
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
                <option value="PAYMENT_REQUESTED">Yêu cầu thanh toán</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
                <option value="NO_SHOW">Không đến</option>
                <option value="AWAITING_DOCTOR_APPROVAL">Đang chờ xác nhận</option>
              </select>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedAppointments.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900">
                  Đã chọn {selectedAppointments.size} lịch hẹn
                </span>
                <button
                  onClick={() => {
                    setSelectedAppointments(new Set())
                    setSelectAll(false)
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkRequestPayment}
                  className="flex items-center px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm"
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Request Payment
                </button>
                <button
                  onClick={handleBulkPaid}
                  className="flex items-center px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark Paid
                </button>
                <button
                  onClick={handleBulkCancel}
                  className="flex items-center px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleBulkCreateAccounts}
                  disabled={creatingAccount}
                  className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {creatingAccount ? 'Creating...' : 'Create Accounts'}
                </button>
                <button
                  onClick={handleBulkPermanentDelete}
                  className="flex items-center px-3 py-1 bg-gray-800 text-white rounded-md hover:bg-gray-900 text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
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
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter ? 'Không tìm thấy lịch hẹn phù hợp' : 'Chưa có lịch hẹn nào'}
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedAppointments.has(appointment.id)}
                        onChange={() => handleSelectAppointment(appointment.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
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
                      {/* Readonly status badge instead of select dropdown */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                        <StatusIcon status={appointment.status} />
                        <span className="ml-1">{statusLabels[appointment.status]}</span>
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setIsEditingInView(false)
                            setViewEditData({ fullName: '', phone: '', email: '', appointmentDate: '', appointmentTime: '', department: '' })
                            setShowDetailModal(true)
                          }}
                          className="px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-400"
                        >
                          View
                        </button>

                        {/* Only keep Assign button for PENDING status - requires specific doctor selection */}
                        {appointment.status === 'PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedAppointmentForConfirm(appointment)
                              setShowDoctorModal(true)
                              setShowDetailModal(false)
                            }}
                            className="px-3 py-1 border border-green-300 rounded-md text-sm font-medium text-green-600 bg-white hover:bg-green-50 hover:border-green-400"
                          >
                            Assign Doctor
                          </button>
                        )}
                        
                        {/* Show Confirm button for AWAITING_DOCTOR_APPROVAL - specific workflow step */}
                        {appointment.status === 'AWAITING_DOCTOR_APPROVAL' && (
                          <button
                            onClick={() => handleStatusChangeWithConfirmation(appointment.id, 'CONFIRMED')}
                            className="px-3 py-1 border border-green-300 rounded-md text-sm font-medium text-green-600 bg-white hover:bg-green-50 hover:border-green-400"
                          >
                            Confirm
                          </button>
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
                  onClick={() => {
                    setShowDetailModal(false)
                    setIsEditingInView(false)
                    setViewEditData({ fullName: '', phone: '', email: '', appointmentDate: '', appointmentTime: '', department: '' })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Họ tên</label>
                    {isEditingInView ? (
                      <input
                        type="text"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={viewEditData.fullName}
                        onChange={(e) => setViewEditData({...viewEditData, fullName: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{selectedAppointment.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    {isEditingInView ? (
                      <input
                        type="tel"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={viewEditData.phone}
                        onChange={(e) => setViewEditData({...viewEditData, phone: e.target.value})}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{selectedAppointment.phone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  {isEditingInView ? (
                    <input
                      type="email"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={viewEditData.email}
                      onChange={(e) => setViewEditData({...viewEditData, email: e.target.value})}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.email}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày hẹn</label>
                    {isEditingInView ? (
                      <input
                        type="date"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={viewEditData.appointmentDate}
                        min={getMinValidDate()}
                        onChange={(e) => {
                          setViewEditData({...viewEditData, appointmentDate: e.target.value, appointmentTime: ''})
                        }}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedAppointment.appointmentDate)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Giờ hẹn</label>
                    {isEditingInView ? (
                      <select
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={viewEditData.appointmentTime}
                        onChange={(e) => setViewEditData({...viewEditData, appointmentTime: e.target.value})}
                      >
                        <option value="">Chọn giờ khám</option>
                        {getValidTimeSlots(viewEditData.appointmentDate).map(timeSlot => (
                          <option key={timeSlot} value={timeSlot}>{timeSlot}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{formatTime(selectedAppointment.appointmentTime)}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Khoa khám</label>
                  {isEditingInView ? (
                    <select
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={viewEditData.department}
                      onChange={(e) => setViewEditData({...viewEditData, department: e.target.value})}
                    >
                      <option value="">Chọn khoa khám</option>
                      {departments.map((dept) => (
                        <option key={dept.code} value={dept.code}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{getDepartmentDisplayName(selectedAppointment.department)}</p>
                  )}
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
              
              <div className="mt-6 flex justify-end space-x-3">
                {isEditingInView ? (
                  <>
                    <button
                      onClick={handleCancelEditInView}
                      disabled={updatingAppointment}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveInView}
                      disabled={updatingAppointment || !viewEditData.fullName.trim() || !viewEditData.phone.trim() || !viewEditData.appointmentDate || !viewEditData.appointmentTime || !viewEditData.department}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {updatingAppointment && (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      )}
                      {updatingAppointment ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setIsEditingInView(false)
                        setViewEditData({ fullName: '', phone: '', email: '', appointmentDate: '', appointmentTime: '', department: '' })
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={() => handleEditInView(selectedAppointment)}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
                    >
                      Chỉnh sửa
                    </button>
                    {selectedAppointment.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setSelectedAppointmentForConfirm(selectedAppointment)
                          setShowDoctorModal(true)
                          setShowDetailModal(false)
                        }}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Chỉ định bác sĩ
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Selection Modal */}
      {showDoctorModal && selectedAppointmentForConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chỉ định bác sĩ cho lịch hẹn #{selectedAppointmentForConfirm.id}
                </h3>
                <button
                  onClick={() => {
                    setShowDoctorModal(false)
                    setSelectedDoctorId(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Thông tin lịch hẹn:</h4>
                <p className="text-sm text-gray-600">
                  <strong>Bệnh nhân:</strong> {selectedAppointmentForConfirm.fullName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Khoa:</strong> {getDepartmentDisplayName(selectedAppointmentForConfirm.department)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Ngày giờ:</strong> {formatDateWithTime(selectedAppointmentForConfirm.appointmentDate, selectedAppointmentForConfirm.appointmentTime)}
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Chọn bác sĩ:</h4>
                <p className="text-sm text-gray-600">
                  Hiển thị các bác sĩ có chuyên khoa phù hợp với <strong>{getDepartmentDisplayName(selectedAppointmentForConfirm.department)}</strong>
                </p>
                {getRelevantDoctors(selectedAppointmentForConfirm.department).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">
                      <User className="w-12 h-12 mx-auto text-gray-300" />
                    </div>
                    <p className="text-gray-500">
                      Không có bác sĩ nào phù hợp với khoa <strong>{getDepartmentDisplayName(selectedAppointmentForConfirm.department)}</strong>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Vui lòng thêm bác sĩ có chuyên khoa phù hợp hoặc bác sĩ đa khoa
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                    {getRelevantDoctors(selectedAppointmentForConfirm.department).map((doctor) => (
                      <button
                        key={doctor.id}
                        onClick={() => setSelectedDoctorId(doctor.id)}
                        className={`w-full p-4 border rounded-lg text-left transition-colors ${
                          selectedDoctorId === doctor.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{doctor.fullName}</h5>
                            {doctor.specialty && (
                              <p className="text-sm text-gray-600 mt-1">
                                Chuyên khoa: {getSpecialtyDisplayName(doctor.specialty)}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{doctor.email}</p>
                          </div>
                          {selectedDoctorId === doctor.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDoctorModal(false)
                    setSelectedDoctorId(null)
                  }}
                  disabled={confirmingWithDoctor}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmWithDoctor}
                  disabled={!selectedDoctorId || confirmingWithDoctor || getRelevantDoctors(selectedAppointmentForConfirm.department).length === 0}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {confirmingWithDoctor && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {getRelevantDoctors(selectedAppointmentForConfirm.department).length === 0 
                    ? 'Không có bác sĩ phù hợp' 
                    : 'Chỉ định bác sĩ'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Request Modal */}
      {showPaymentModal && selectedAppointmentForPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Yêu cầu thanh toán cho lịch hẹn #{selectedAppointmentForPayment.id}
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setSelectedAppointmentForPayment(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Thông tin lịch hẹn:</h4>
                <p className="text-sm text-gray-600">
                  <strong>Bệnh nhân:</strong> {selectedAppointmentForPayment.fullName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Khoa:</strong> {getDepartmentDisplayName(selectedAppointmentForPayment.department)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Ngày giờ:</strong> {formatDateWithTime(selectedAppointmentForPayment.appointmentDate, selectedAppointmentForPayment.appointmentTime)}
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Nhập số tiền thanh toán:</h4>
                <input
                  type="text"
                  placeholder="Nhập số tiền thanh toán"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handlePaymentRequest}
                  disabled={requestingPayment}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {requestingPayment && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {requestingPayment ? 'Đang xử lý...' : 'Gửi yêu cầu thanh toán'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Permanent Delete Confirm Modal */}
      {showBulkPermanentDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Xác nhận xóa vĩnh viễn
                </h3>
                <button
                  onClick={() => setShowBulkPermanentDeleteConfirm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-red-600">
                  <Trash2 className="w-6 h-6 mr-2" />
                  <span className="font-medium">Cảnh báo: Hành động không thể hoàn tác!</span>
                </div>
                <p className="text-sm text-gray-600">
                  Bạn có chắc chắn muốn <strong>xóa vĩnh viễn</strong> {selectedAppointments.size} lịch hẹn đã chọn?
                </p>
                <p className="text-xs text-red-500">
                  Dữ liệu sẽ bị xóa hoàn toàn khỏi hệ thống và không thể khôi phục.
                </p>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkPermanentDeleteConfirm(false)}
                  disabled={bulkPermanentDeleting}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmBulkPermanentDelete}
                  disabled={bulkPermanentDeleting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {bulkPermanentDeleting && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {bulkPermanentDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditModal && selectedAppointmentForEdit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Chỉnh sửa lịch hẹn #{selectedAppointmentForEdit.id}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedAppointmentForEdit(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Họ tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={editFormData.fullName}
                      onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Ngày khám <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={editFormData.appointmentDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setEditFormData({...editFormData, appointmentDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Giờ khám <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={editFormData.appointmentTime}
                      onChange={(e) => setEditFormData({...editFormData, appointmentTime: e.target.value})}
                      required
                    >
                      <option value="">Chọn giờ khám</option>
                      <option value="08:00">08:00</option>
                      <option value="08:30">08:30</option>
                      <option value="09:00">09:00</option>
                      <option value="09:30">09:30</option>
                      <option value="10:00">10:00</option>
                      <option value="10:30">10:30</option>
                      <option value="11:00">11:00</option>
                      <option value="11:30">11:30</option>
                      <option value="13:30">13:30</option>
                      <option value="14:00">14:00</option>
                      <option value="14:30">14:30</option>
                      <option value="15:00">15:00</option>
                      <option value="15:30">15:30</option>
                      <option value="16:00">16:00</option>
                      <option value="16:30">16:30</option>
                      <option value="17:00">17:00</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Khoa khám <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({...editFormData, department: e.target.value})}
                    required
                  >
                    <option value="">Chọn khoa khám</option>
                    {departments.map((dept) => (
                      <option key={dept.code} value={dept.code}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Lý do khám
                  </label>
                  <textarea
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nhập lý do khám bệnh..."
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData({...editFormData, reason: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedAppointmentForEdit(null)
                  }}
                  disabled={updatingAppointment}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateAppointment}
                  disabled={updatingAppointment || !editFormData.fullName || !editFormData.phone || !editFormData.appointmentDate || !editFormData.appointmentTime || !editFormData.department}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {updatingAppointment && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {updatingAppointment ? 'Đang cập nhật...' : 'Cập nhật lịch hẹn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Cancel Confirm Modal */}
      {showBulkCancelConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Xác nhận hủy lịch hẹn
                </h3>
                <button
                  onClick={() => setShowBulkCancelConfirm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-orange-600">
                  <X className="w-6 h-6 mr-2" />
                  <span className="font-medium">Hủy lịch hẹn</span>
                </div>
                <p className="text-sm text-gray-600">
                  Bạn có chắc chắn muốn <strong>hủy</strong> {selectedAppointments.size} lịch hẹn đã chọn?
                </p>
                <p className="text-xs text-gray-500">
                  Trạng thái các lịch hẹn sẽ được chuyển thành "Đã hủy" và email thông báo sẽ được gửi đến bệnh nhân.
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do hủy lịch hẹn <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Nhập lý do hủy lịch hẹn..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {cancellationReason.length}/500 ký tự
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkCancelConfirm(false)}
                  disabled={bulkCancelling}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Đóng
                </button>
                <button
                  onClick={confirmBulkCancel}
                  disabled={bulkCancelling || !cancellationReason.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {bulkCancelling && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {bulkCancelling ? 'Đang hủy...' : 'Hủy lịch hẹn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Paid Confirm Modal */}
      {showBulkPaidConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Xác nhận đã thanh toán
                </h3>
                <button
                  onClick={() => setShowBulkPaidConfirm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-purple-600">
                  <Check className="w-6 h-6 mr-2" />
                  <span className="font-medium">Đánh dấu đã thanh toán</span>
                </div>
                <p className="text-sm text-gray-600">
                  Bạn có chắc chắn muốn đánh dấu <strong>{selectedAppointments.size}</strong> lịch hẹn đã chọn là <strong>đã thanh toán</strong>?
                </p>
                <p className="text-xs text-gray-500">
                  Trạng thái các lịch hẹn sẽ được chuyển thành "Đã thanh toán".
                </p>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkPaidConfirm(false)}
                  disabled={bulkMarking}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmBulkPaid}
                  disabled={bulkMarking}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {bulkMarking && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {bulkMarking ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Request Payment Confirm Modal */}
      {showBulkRequestPaymentConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Xác nhận yêu cầu thanh toán
                </h3>
                <button
                  onClick={() => setShowBulkRequestPaymentConfirm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-teal-600">
                  <UserPlus className="w-6 h-6 mr-2" />
                  <span className="font-medium">Yêu cầu thanh toán</span>
                </div>
                <p className="text-sm text-gray-600">
                  Bạn có chắc chắn muốn yêu cầu thanh toán cho <strong>{selectedAppointments.size}</strong> lịch hẹn đã chọn?
                </p>
                <p className="text-xs text-gray-500">
                  Nhập số tiền thanh toán và gửi yêu cầu thanh toán cho tất cả các lịch hẹn đã chọn.
                </p>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số tiền thanh toán (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập số tiền thanh toán"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={bulkPaymentAmount}
                    onChange={(e) => setBulkPaymentAmount(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkRequestPaymentConfirm(false)}
                  disabled={bulkRequestingPayment}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmBulkRequestPayment}
                  disabled={bulkRequestingPayment}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {bulkRequestingPayment && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {bulkRequestingPayment ? 'Đang xử lý...' : 'Xác nhận yêu cầu thanh toán'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingManagerPage 