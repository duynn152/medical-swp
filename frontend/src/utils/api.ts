const API_BASE_URL = 'http://localhost:8080/api'

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
  active?: boolean
}

export interface ImportResult {
  success: number
  failed: number
  errors: string[]
  users: User[]
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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  emailSent: boolean
  reminderSent: boolean
  user?: User
  doctor?: User
  notes?: string
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
      const error = await response.json()
      throw new Error(error.error || 'Failed to update appointment')
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