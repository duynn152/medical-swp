// Debug utility to check authentication status
export const debugAuth = async () => {
  const token = localStorage.getItem('authToken')
  
  console.log('🔍 Debug Authentication Status:')
  console.log('Token exists:', !!token)
  console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null')
  
  if (!token) {
    console.log('❌ No token found. Please login first.')
    return
  }
  
  try {
    // Call backend debug endpoint
    const response = await fetch('http://localhost:8080/api/auth/debug', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('🎯 Backend auth debug:', data)
    } else {
      console.log('❌ Debug endpoint failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.log('❌ Debug request failed:', error)
  }
}

export const checkUserRole = () => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    const user = JSON.parse(userInfo)
    console.log('👤 Current user role:', user.role)
    console.log('✅ Blog creation allowed for:', ['ADMIN', 'DOCTOR', 'STAFF'].includes(user.role))
    return user.role
  }
  console.log('❌ No user info found')
  return null
}

// Call this function in browser console to debug
export const runDebug = async () => {
  checkUserRole()
  await debugAuth()
}

// Debug utility to check environment variables in production
export const debugEnvironment = () => {
  console.log('🔧 Environment Debug Info:')
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
  console.log('VITE_APP_NAME:', import.meta.env.VITE_APP_NAME)
  console.log('VITE_NODE_ENV:', import.meta.env.VITE_NODE_ENV)
  console.log('MODE:', import.meta.env.MODE)
  console.log('PROD:', import.meta.env.PROD)
  console.log('DEV:', import.meta.env.DEV)
}

// Export for use in components
export default debugEnvironment 