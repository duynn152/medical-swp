// Centralized API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

console.log('🔧 Global API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL,
  MODE: import.meta.env.MODE
})

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  BLOGS: `${API_BASE_URL}/blogs`,
  PUBLIC_BLOGS: `${API_BASE_URL}/public/blogs`,
  USERS: `${API_BASE_URL}/users`,
  AUTH: `${API_BASE_URL}/auth`,
  APPOINTMENTS: `${API_BASE_URL}/appointments`,
}

export default API_CONFIG 