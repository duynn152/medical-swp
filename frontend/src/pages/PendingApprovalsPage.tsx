import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Mail, Building2, Check, X, AlertCircle, RefreshCw } from 'lucide-react'
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
  status: 'AWAITING_DOCTOR_APPROVAL'
  notes?: string
  createdAt: string
  updatedAt: string
  doctorNotifiedAt?: string
}

const PendingApprovalsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [acceptResponse, setAcceptResponse] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchPendingAppointments()
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchPendingAppointments, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPendingAppointments = async () => {
    try {
      setLoading(true)
      const data = await apiService.getAppointmentsPendingMyApproval()
      setAppointments(data || [])
    } catch (error) {
      console.error('Error fetching pending appointments:', error)
      toast.error('Không thể tải danh sách lịch hẹn cần phê duyệt')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptAppointment = async () => {
    if (!selectedAppointment) return

    setProcessing(true)
    try {
      await apiService.doctorAcceptAppointment(selectedAppointment.id, acceptResponse)
      await fetchPendingAppointments()
      setShowAcceptModal(false)
      setSelectedAppointment(null)
      setAcceptResponse('')
      toast.success('Đã chấp nhận lịch hẹn thành công')
    } catch (error) {
      console.error('Error accepting appointment:', error)
      toast.error('Không thể chấp nhận lịch hẹn')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeclineAppointment = async () => {
    if (!selectedAppointment) return

    setProcessing(true)
    try {
      await apiService.doctorDeclineAppointment(selectedAppointment.id, declineReason)
      await fetchPendingAppointments()
      setShowDeclineModal(false)
      setSelectedAppointment(null)
      setDeclineReason('')
      toast.success('Đã từ chối lịch hẹn. Lịch hẹn sẽ được staff xử lý lại.')
    } catch (error) {
      console.error('Error declining appointment:', error)
      toast.error('Không thể từ chối lịch hẹn')
    } finally {
      setProcessing(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách lịch hẹn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Appointments Pending Your Approval</h1>
          <p className="text-gray-600">
            Những lịch hẹn đã được staff chỉ định cho bạn và đang chờ phản hồi
          </p>
        </div>
        <button
          onClick={fetchPendingAppointments}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{appointments.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {appointments.filter(apt => apt.appointmentDate === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Urgent (Next 24h)</p>
              <p className="text-2xl font-semibold text-gray-900">
                {appointments.filter(apt => {
                  const aptDate = new Date(apt.appointmentDate)
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  return aptDate <= tomorrow
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Appointments Waiting for Your Response ({appointments.length})
          </h3>
        </div>
        
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Appointments</h3>
            <p className="text-gray-500">
              Không có lịch hẹn nào đang chờ phê duyệt của bạn
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appointment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
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
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {appointment.doctorNotifiedAt ? formatDateTime(appointment.doctorNotifiedAt) : 'N/A'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setShowDetailModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md transition-colors"
                          title="View Details"
                        >
                          View
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setShowAcceptModal(true)
                          }}
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-md transition-colors"
                          title="Accept Appointment"
                        >
                          Accept
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setShowDeclineModal(true)
                          }}
                          className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md transition-colors"
                          title="Decline Appointment"
                        >
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Appointment Details #{selectedAppointment.id}
                </h3>
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
                    <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedAppointment.phone}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.email}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedAppointment.appointmentDate)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <p className="mt-1 text-sm text-gray-900">{formatTime(selectedAppointment.appointmentTime)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.department}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedAppointment.reason || 'No reason provided'}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDateTime(selectedAppointment.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned to You</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedAppointment.doctorNotifiedAt ? formatDateTime(selectedAppointment.doctorNotifiedAt) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setShowAcceptModal(true)
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setShowDeclineModal(true)
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accept Modal */}
      {showAcceptModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Accept Appointment #{selectedAppointment.id}
                </h3>
                <button
                  onClick={() => setShowAcceptModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Patient:</strong> {selectedAppointment.fullName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date & Time:</strong> {formatDate(selectedAppointment.appointmentDate)} at {formatTime(selectedAppointment.appointmentTime)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Department:</strong> {selectedAppointment.department}
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Response Message (Optional)
                </label>
                <textarea
                  value={acceptResponse}
                  onChange={(e) => setAcceptResponse(e.target.value)}
                  placeholder="Add any notes for the patient or staff..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAcceptModal(false)}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptAppointment}
                  disabled={processing}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {processing && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {processing ? 'Accepting...' : 'Accept Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && selectedAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Decline Appointment #{selectedAppointment.id}
                </h3>
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Patient:</strong> {selectedAppointment.fullName}
                </p>
                <p className="text-sm text-red-800">
                  <strong>Date & Time:</strong> {formatDate(selectedAppointment.appointmentDate)} at {formatTime(selectedAppointment.appointmentTime)}
                </p>
                <p className="text-sm text-red-800 mt-2">
                  If you decline, this appointment will return to PENDING status and staff will need to assign another doctor.
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Please provide a reason for declining this appointment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeclineAppointment}
                  disabled={processing || !declineReason.trim()}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {processing && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {processing ? 'Declining...' : 'Decline Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingApprovalsPage 