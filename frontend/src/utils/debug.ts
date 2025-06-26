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