import { useState, useEffect } from 'react'
import { Search, Filter, Users, Eye, Edit, UserPlus, FileText, Calendar, Clock, CheckCircle, XCircle, X } from 'lucide-react'
import { apiService, Appointment, User, getStoredUserInfo } from '../utils/api'

interface PatientWithAppointments {
  user: User | null
  fullName: string
  email: string
  phone: string
  totalAppointments: number
  confirmedAppointments: number
  lastAppointment: string
  nextAppointment?: string
  appointments: Appointment[]
}

const PatientControlPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [patients, setPatients] = useState<PatientWithAppointments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Doctor notes modal states
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [selectedPatientForNotes, setSelectedPatientForNotes] = useState<PatientWithAppointments | null>(null)
  const [selectedAppointmentForNotes, setSelectedAppointmentForNotes] = useState<Appointment | null>(null)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // Load patients with confirmed/payment requested appointments on component mount
  useEffect(() => {
    loadPatientsWithAppointments()
  }, [])

  const loadPatientsWithAppointments = async () => {
    try {
      setLoading(true)
      
      // Get current user info to check role
      const userInfo = getStoredUserInfo()
      const isDoctor = userInfo?.role === 'DOCTOR'
      
      // Get appointments based on user role
      const allAppointments = isDoctor 
        ? await apiService.getMyPatientsAppointments()  // Doctor: only their patients
        : await apiService.getAllAppointments()         // Admin/Staff: all appointments
      
      // Filter confirmed appointments (include PAYMENT_REQUESTED and PAID as they are also confirmed patients)
      const confirmedAppointments = allAppointments.filter(apt => 
        apt.status === 'CONFIRMED' || apt.status === 'PAYMENT_REQUESTED' || apt.status === 'PAID'
      )
      
      // Group appointments by patient (email as unique identifier)
      const patientMap = new Map<string, PatientWithAppointments>()
      
      confirmedAppointments.forEach(appointment => {
        const email = appointment.email
        const existingPatient = patientMap.get(email)
        
        if (existingPatient) {
          existingPatient.appointments.push(appointment)
          existingPatient.totalAppointments += 1
          // Count both CONFIRMED, PAYMENT_REQUESTED and PAID as confirmed
          if (appointment.status === 'CONFIRMED' || appointment.status === 'PAYMENT_REQUESTED' || appointment.status === 'PAID') {
            existingPatient.confirmedAppointments += 1
          }
          
          // Update last appointment date
          if (new Date(appointment.appointmentDate) > new Date(existingPatient.lastAppointment)) {
            existingPatient.lastAppointment = appointment.appointmentDate
          }
          
          // Check for next appointment (future dates)
          const appointmentDate = new Date(appointment.appointmentDate)
          const now = new Date()
          if (appointmentDate > now) {
            if (!existingPatient.nextAppointment || appointmentDate < new Date(existingPatient.nextAppointment)) {
              existingPatient.nextAppointment = appointment.appointmentDate
            }
          }
        } else {
          // Create new patient record
          const newPatient: PatientWithAppointments = {
            user: appointment.user || null,
            fullName: appointment.fullName,
            email: appointment.email,
            phone: appointment.phone,
            totalAppointments: 1,
            confirmedAppointments: 1, // Both CONFIRMED and PAYMENT_REQUESTED count as confirmed
            lastAppointment: appointment.appointmentDate,
            nextAppointment: new Date(appointment.appointmentDate) > new Date() ? appointment.appointmentDate : undefined,
            appointments: [appointment]
          }
          patientMap.set(email, newPatient)
        }
      })
      
      // Convert map to array
      const patientsArray = Array.from(patientMap.values())
      
      // Sort by last appointment date (most recent first)
      patientsArray.sort((a, b) => new Date(b.lastAppointment).getTime() - new Date(a.lastAppointment).getTime())
      
      setPatients(patientsArray)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to load patients with appointments')
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.toLowerCase().includes(searchTerm.toLowerCase())
    
    const hasNextAppointment = !!patient.nextAppointment
    const matchesStatus = selectedStatus === '' || 
      (selectedStatus === 'upcoming' && hasNextAppointment) ||
      (selectedStatus === 'past' && !hasNextAppointment)
    
    return matchesSearch && matchesStatus
  })

  // Pagination calculations
  const totalItems = filteredPatients.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Reset pagination when search/filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus])

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString).toLocaleDateString('vi-VN')
    return timeString ? `${date} ${timeString}` : date
  }

  const getStatusColor = (hasUpcoming: boolean) => {
    return hasUpcoming 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800'
  }

  // Doctor functions
  const handleOpenNotesModal = (patient: PatientWithAppointments, appointment: Appointment) => {
    setSelectedPatientForNotes(patient)
    setSelectedAppointmentForNotes(appointment)
    setDoctorNotes(appointment.notes || '')
    setShowNotesModal(true)
  }

  const handleSaveNotes = async () => {
    if (!selectedAppointmentForNotes) return

    try {
      setSavingNotes(true)
      await apiService.updateAppointment(selectedAppointmentForNotes.id, {
        notes: doctorNotes
      })
      
      // Refresh data
      await loadPatientsWithAppointments()
      setShowNotesModal(false)
      setSelectedPatientForNotes(null)
      setSelectedAppointmentForNotes(null)
      setDoctorNotes('')
    } catch (error) {
      console.error('Error saving notes:', error)
      setError('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleUpdateAppointmentStatus = async (appointmentId: number, newStatus: 'COMPLETED' | 'NO_SHOW') => {
    try {
      await apiService.updateAppointment(appointmentId, {
        status: newStatus
      })
      
      // Refresh data
      await loadPatientsWithAppointments()
    } catch (error) {
      console.error('Error updating appointment status:', error)
      setError('Failed to update appointment status')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Patient Control</h1>
          <p className="text-gray-600">
            {getStoredUserInfo()?.role === 'DOCTOR' 
              ? 'Manage your assigned patients with confirmed appointments, payment requests, and completed payments'
              : 'Manage patients with confirmed appointments, payment requests, and completed payments'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Patients</option>
              <option value="upcoming">With Upcoming Appointments</option>
              <option value="past">Past Appointments Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <p className="text-2xl font-semibold text-gray-900">{patients.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">With Upcoming Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {patients.filter(p => p.nextAppointment).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Confirmed Appointments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {patients.reduce((sum, p) => sum + p.confirmedAppointments, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {getStoredUserInfo()?.role === 'DOCTOR' 
              ? `Your Assigned Patients with Confirmed/Payment Requested/Paid Appointments (${filteredPatients.length} found)`
              : `Patients with Confirmed/Payment Requested/Paid Appointments (${filteredPatients.length} found)`
            }
          </h3>
        </div>
        
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
                  Appointments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Appointment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPatients.map((patient, index) => (
                <tr key={`${patient.email}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                      {patient.user && (
                        <>
                          <div className="text-xs text-gray-400">@{patient.user.username}</div>
                          <div className="text-xs text-gray-500">
                            {patient.user.gender} {patient.user.birth && `• ${formatDate(patient.user.birth)}`}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.email}</div>
                    <div className="text-sm text-gray-500">{patient.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-col">
                      <span className="font-medium">{patient.totalAppointments} total</span>
                      <span className="text-xs text-green-600">{patient.confirmedAppointments} confirmed</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(patient.lastAppointment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {patient.nextAppointment ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(true)}`}>
                        {formatDate(patient.nextAppointment)}
                      </span>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(false)}`}>
                        None scheduled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800"
                        title="View patient details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-purple-600 hover:text-purple-800"
                        title="View appointment history"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-orange-600 hover:text-orange-800"
                        title="Medical records"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      
                      {/* Doctor-specific actions */}
                      {getStoredUserInfo()?.role === 'DOCTOR' && patient.appointments.length > 0 && (
                        <>
                          <button 
                            className="text-cyan-600 hover:text-cyan-800"
                            title="Add examination notes"
                            onClick={() => handleOpenNotesModal(patient, patient.appointments[0])}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-800"
                            title="Mark as completed"
                            onClick={() => handleUpdateAppointmentStatus(patient.appointments[0].id, 'COMPLETED')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800"
                            title="Mark as no show"
                            onClick={() => handleUpdateAppointmentStatus(patient.appointments[0].id, 'NO_SHOW')}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Doctor Notes Modal */}
      {showNotesModal && selectedPatientForNotes && selectedAppointmentForNotes && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Examination Notes for {selectedPatientForNotes.fullName}
                </h3>
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Appointment Details:</h4>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {formatDate(selectedAppointmentForNotes.appointmentDate)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Time:</strong> {selectedAppointmentForNotes.appointmentTime}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Reason:</strong> {selectedAppointmentForNotes.reason || 'Not specified'}
                </p>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Examination Notes:
                </label>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter examination notes, diagnosis, treatment plan, etc..."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowNotesModal(false)}
                  disabled={savingNotes}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {savingNotes && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientControlPage 