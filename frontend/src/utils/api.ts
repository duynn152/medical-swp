const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Debug logging for production
console.log('🔧 API Configuration:')
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
console.log('Final API_BASE_URL:', API_BASE_URL)
console.log('Environment MODE:', import.meta.env.MODE)

export interface LoginRequest {
  usernameOrEmail: string
  password: string
}

export interface LoginResponse {
  token: string
  userId: number
  username: string
  email: string
  fullName: string
  role: string
}

export interface User {
  id: number
  username: string
  email: string
  fullName: string
  birth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  role: 'ADMIN' | 'DOCTOR' | 'STAFF' | 'PATIENT'
  specialty?: string
  phone?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  fullName: string
  birth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  role: 'ADMIN' | 'DOCTOR' | 'STAFF' | 'PATIENT'
  specialty?: string
  phone?: string
  active?: boolean
}

export interface ImportResult {
  success: number
  failed: number
  errors: string[]
  users: User[]
}

export interface SpecialtyInfo {
  code: string
  displayName: string
}

export interface DepartmentInfo {
  code: string
  departmentName: string
  specialtyName: string
}

export interface Appointment {
  id: number
  fullName: string
  phone: string
  email: string
  appointmentDate: string
  appointmentTime: string
  department: string
  reason?: string
  status: 'PENDING' | 'AWAITING_DOCTOR_APPROVAL' | 'CONFIRMED' | 'PAYMENT_REQUESTED' | 'PAID' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  emailSent: boolean
  reminderSent: boolean
  paymentRequested: boolean
  paymentCompleted: boolean
  paymentAmount?: number
  paymentRequestedAt?: string
  paymentCompletedAt?: string
  user?: User
  doctor?: User
  notes?: string
  doctorNotifiedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateAppointmentRequest {
  fullName: string
  phone: string
  email: string
  appointmentDate: string
  appointmentTime: string
  department: string
  reason?: string
}

export interface AppointmentResponse {
  appointmentId: number
  message: string
  appointment: Appointment
}

export interface AppointmentStats {
  totalAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  todaysAppointments: number
}

export interface Comment {
  id: number
  authorName: string
  authorEmail?: string
  content: string
  blogPost?: any
  approved: boolean
  likeCount?: number
  dislikeCount?: number
  replies?: Comment[]
  createdAt: string
  updatedAt: string
}

export interface CreateCommentRequest {
  authorName: string
  authorEmail?: string
  content: string
}

export interface CommentReaction {
  id: number
  reactionType: 'LIKE' | 'DISLIKE'
  createdAt: string
}

export interface ReactionResponse {
  success: boolean
  message: string
  reaction?: CommentReaction | null
}

export interface CommentResponse {
  success: boolean
  message: string
  comment?: Comment
  comments?: Comment[]
  count?: number
}

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken')
    console.log('Debug: Auth token from localStorage:', token ? 'Token exists' : 'No token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
    console.log('Debug: Request headers:', headers)
    return headers
  }

  private getAuthHeadersForUpload() {
    const token = localStorage.getItem('authToken')
    return {
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    return response.json()
  }

  async validateToken(): Promise<boolean> {
    const token = localStorage.getItem('authToken')
    if (!token) return false

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      if (response.ok) {
        const data = await response.json()
        return data.valid
      }
      return false
    } catch {
      return false
    }
  }

  // User endpoints
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    return response.json()
  }

  async getUserById(id: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user')
    }

    return response.json()
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/role/${role}`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch users by role')
    }

    return response.json()
  }

  async searchUsers(name: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/search?name=${encodeURIComponent(name)}`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to search users')
    }

    return response.json()
  }

  async createUser(user: CreateUserRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(user)
    })

    if (!response.ok) {
      throw new Error('Failed to create user')
    }

    return response.json()
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(user)
    })

    if (!response.ok) {
      let errorMessage = 'Failed to update user'
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    return response.json()
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to delete user')
    }
  }

  async deactivateUser(id: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}/deactivate`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to deactivate user')
    }

    return response.json()
  }

  async getMedicalSpecialties(): Promise<SpecialtyInfo[]> {
    const response = await fetch(`${API_BASE_URL}/users/specialties`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch medical specialties')
    }

    return response.json()
  }

  async getDepartments(): Promise<DepartmentInfo[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/public/departments`, {
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch departments')
    }

    return response.json()
  }

  async importUsers(formData: FormData): Promise<ImportResult> {
    const response = await fetch(`${API_BASE_URL}/users/import`, {
      method: 'POST',
      headers: this.getAuthHeadersForUpload(),
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to import users')
    }

    return response.json()
  }

  // Appointment endpoints
  async createPublicAppointment(appointment: CreateAppointmentRequest): Promise<AppointmentResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create appointment')
    }

    return response.json()
  }

  async checkTimeSlotAvailability(date: string, time: string, department: string): Promise<{ available: boolean; message: string }> {
    const params = new URLSearchParams({
      date,
      time,
      department
    })

    const response = await fetch(`${API_BASE_URL}/appointments/public/availability?${params}`, {
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to check availability')
    }

    return response.json()
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch appointments')
    }

    return response.json()
  }

  async getAppointmentById(id: number): Promise<Appointment> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch appointment')
    }

    return response.json()
  }

  async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(appointment)
    })

    if (!response.ok) {
      let errorMessage = 'Failed to update appointment'
      try {
        const error = await response.json()
        errorMessage = error.error || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    // Check if response has content before parsing JSON
    const contentLength = response.headers.get('content-length')
    if (contentLength === '0' || response.status === 204) {
      // For empty responses, return a minimal appointment object with updated status
      return { 
        id, 
        ...appointment,
        updatedAt: new Date().toISOString()
      } as Appointment
    }

    return response.json()
  }

  async confirmAppointment(id: number): Promise<AppointmentResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/confirm`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to confirm appointment')
    }

    return response.json()
  }

  async confirmAppointmentWithDoctor(id: number, doctorId: number): Promise<AppointmentResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/confirm-with-doctor`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ doctorId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to confirm appointment with doctor')
    }

    return response.json()
  }

  async cancelAppointment(id: number, reason?: string): Promise<AppointmentResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason: reason || 'Cancelled by user' })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel appointment')
    }

    return response.json()
  }

  async getAppointmentsByStatus(status: string): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/status/${status}`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch appointments by status')
    }

    return response.json()
  }

  async getTodaysAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/today`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch today\'s appointments')
    }

    return response.json()
  }

  async getUpcomingAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/upcoming`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch upcoming appointments')
    }

    return response.json()
  }

  async searchAppointments(searchTerm: string): Promise<Appointment[]> {
    const params = new URLSearchParams()
    if (searchTerm) params.append('q', searchTerm)

    const response = await fetch(`${API_BASE_URL}/appointments/search?${params}`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to search appointments')
    }

    return response.json()
  }

  async getAppointmentStats(): Promise<AppointmentStats> {
    const response = await fetch(`${API_BASE_URL}/appointments/stats`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch appointment stats')
    }

    return response.json()
  }

  async deleteAppointment(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to delete appointment')
    }
  }

  async requestPayment(id: number, amount: number): Promise<AppointmentResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/request-payment`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ amount })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to request payment')
    }

    return response.json()
  }

  async getMyPatientsAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/my-patients`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch my patients appointments')
    }

    return response.json()
  }

  // Patient-specific endpoints
  async getMyAppointments(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/my-appointments`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch my appointments')
    }

    return response.json()
  }

  async updateMyProfile(profileData: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Failed to update profile')
    }

    return response.json()
  }

  async getMyProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch profile')
    }

    return response.json()
  }

  async getMyMedicalHistory(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/my-medical-history`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch medical history')
    }

    return response.json()
  }

  // Comment endpoints
  async getCommentsByBlogPost(blogPostId: number): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/blog/${blogPostId}`, {
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }

    return response.json()
  }

  async createComment(blogPostId: number, commentData: CreateCommentRequest): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/blog/${blogPostId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create comment')
    }

    return response.json()
  }

  async deleteComment(commentId: number): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/admin/${commentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete comment')
    }

    return response.json()
  }

  async approveComment(commentId: number): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/admin/${commentId}/approve`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to approve comment')
    }

    return response.json()
  }

  async rejectComment(commentId: number): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/admin/${commentId}/reject`, {
      method: 'PUT',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to reject comment')
    }

    return response.json()
  }

  // Reaction endpoints
  async addReaction(commentId: number, reactionType: 'LIKE' | 'DISLIKE'): Promise<ReactionResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactionType })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to add reaction')
    }

    return response.json()
  }

  async getMyReaction(commentId: number): Promise<ReactionResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/my-reaction`, {
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to get reaction')
    }

    return response.json()
  }

  async createReply(commentId: number, replyData: CreateCommentRequest): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(replyData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create reply')
    }

    return response.json()
  }

  async getReplies(commentId: number): Promise<CommentResponse> {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/replies`, {
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch replies')
    }

    return response.json()
  }

  // New workflow methods
  async assignDoctorToAppointment(id: number, doctorId: number): Promise<AppointmentResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/assign-doctor`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ doctorId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to assign doctor to appointment')
    }

    return response.json()
  }

  async doctorAcceptAppointment(id: number, response?: string): Promise<AppointmentResponse> {
    const apiResponse = await fetch(`${API_BASE_URL}/appointments/${id}/doctor-accept`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ response: response || 'Accepted by doctor' })
    })

    if (!apiResponse.ok) {
      const error = await apiResponse.json()
      throw new Error(error.error || 'Failed to accept appointment')
    }

    return apiResponse.json()
  }

  async doctorDeclineAppointment(id: number, reason?: string): Promise<AppointmentResponse> {
    const response = await fetch(`${API_BASE_URL}/appointments/${id}/doctor-decline`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason: reason || 'Declined by doctor' })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to decline appointment')
    }

    return response.json()
  }

  async getAppointmentsPendingMyApproval(): Promise<Appointment[]> {
    const response = await fetch(`${API_BASE_URL}/appointments/pending-my-approval`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      throw new Error('Failed to fetch appointments pending approval')
    }

    return response.json()
  }

  // Email notification for appointment updates
  async sendAppointmentUpdateNotification(appointmentId: number, updateData: {
    patientEmail: string
    patientName: string
    changes: string[]
    newAppointmentDate?: string
    newAppointmentTime?: string
    newDepartment?: string
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/send-update-notification`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        return response.json()
      }
      
      // If endpoint returns 403/404, it means email service is not implemented yet
      if (response.status === 403 || response.status === 404) {
        console.log('📧 Email would be sent:', {
          to: updateData.patientEmail,
          subject: 'Thông báo thay đổi lịch hẹn khám bệnh',
          changes: updateData.changes,
          appointmentId
        })
        
        // Simulate email sending for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return { 
          success: true, 
          message: 'Email notification simulated (backend email service not yet implemented)' 
        }
      }
      
      // For other errors, try fallback
      return this.sendGenericEmail({
        to: updateData.patientEmail,
        subject: 'Thông báo thay đổi lịch hẹn khám bệnh',
        content: this.buildUpdateEmailContent(appointmentId, updateData)
      })
    } catch (error) {
      return { success: false, message: 'Email service temporarily unavailable' }
    }
  }

  // Generic email service fallback
  private async sendGenericEmail(emailData: {
    to: string
    subject: string
    content: string
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/email/send`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(emailData)
      })

      if (response.ok) {
        return { success: true, message: 'Email sent successfully' }
      } else if (response.status === 403 || response.status === 404) {
        // Email service not implemented in backend
        console.log('📧 Email would be sent (generic):', emailData)
        return { 
          success: true, 
          message: 'Email notification simulated (backend email service not yet implemented)' 
        }
      } else {
        return { success: false, message: 'Email service temporarily unavailable' }
      }
    } catch (error) {
      return { success: false, message: 'Email service temporarily unavailable' }
    }
  }

  // Build email content for appointment updates
  private buildUpdateEmailContent(appointmentId: number, updateData: {
    patientName: string
    changes: string[]
    newAppointmentDate?: string
    newAppointmentTime?: string
    newDepartment?: string
  }): string {
    return `
Kính chào ${updateData.patientName},

Thông tin lịch hẹn khám bệnh của bạn (Mã số: ${appointmentId}) đã được cập nhật:

Những thay đổi được thực hiện:
${updateData.changes.map(change => `- ${change}`).join('\n')}

${updateData.newAppointmentDate ? `Ngày hẹn mới: ${updateData.newAppointmentDate}` : ''}
${updateData.newAppointmentTime ? `Giờ hẹn mới: ${updateData.newAppointmentTime}` : ''}
${updateData.newDepartment ? `Khoa khám mới: ${updateData.newDepartment}` : ''}

Vui lòng kiểm tra lại thông tin và sắp xếp thời gian phù hợp.

Trân trọng,
Phòng khám Y tế
    `.trim()
  }
}

export const apiService = new ApiService()

// Auth utilities
export const getStoredUserInfo = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

export const clearAuth = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('userInfo')
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken')
} 