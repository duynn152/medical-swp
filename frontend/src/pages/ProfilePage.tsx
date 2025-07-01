import React, { useState, useEffect } from 'react'
import { User, Mail, Calendar, MapPin, Phone, Edit3, Save, X } from 'lucide-react'
import { apiService } from '../utils/api'
import toast from 'react-hot-toast'

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    birth: '',
    gender: '',
    phone: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profile = await apiService.getMyProfile()
      setUser(profile)
      setFormData({
        fullName: profile.fullName || '',
        birth: profile.birth || '',
        gender: profile.gender || '',
        phone: profile.phone || ''
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Có lỗi khi tải thông tin người dùng')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Prepare update data with proper types
      const updateData: any = {
        fullName: formData.fullName,
        birth: formData.birth || null,
        gender: formData.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
        phone: formData.phone || null
      }
      
      // Remove empty values
      if (!updateData.birth) delete updateData.birth
      if (!updateData.gender) delete updateData.gender
      if (!updateData.phone) delete updateData.phone
      
      const updatedUser = await apiService.updateMyProfile(updateData)
      
      // Update user state with response
      setUser(updatedUser)
      
      // Update localStorage userInfo as well
      const currentUserInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const updatedUserInfo = { ...currentUserInfo, ...updatedUser }
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
      
      setIsEditing(false)
      toast.success('Cập nhật thông tin thành công!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Có lỗi khi cập nhật thông tin')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      fullName: user?.fullName || '',
      birth: user?.birth || '',
      gender: user?.gender || '',
      phone: user?.phone || ''
    })
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không thể tải thông tin người dùng</p>
          <button 
            onClick={loadProfile}
            className="mt-4 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {user.fullName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.fullName || user.username}</h1>
                <p className="text-gray-500">{user.email}</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mt-2">
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isEditing
                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                  : 'bg-pink-600 hover:bg-pink-700 text-white'
              }`}
            >
              {isEditing ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Hủy</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin cá nhân</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Họ và tên
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {user.fullName || 'Chưa cập nhật'}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <p className="text-gray-900 bg-gray-100 px-3 py-2 rounded-lg">
                {user.email}
                <span className="text-xs text-gray-500 ml-2">(Không thể thay đổi)</span>
              </p>
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Ngày sinh
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="birth"
                  value={formData.birth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {user.birth ? new Date(user.birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giới tính
              </label>
              {isEditing ? (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {user.gender === 'MALE' ? 'Nam' : user.gender === 'FEMALE' ? 'Nữ' : user.gender === 'OTHER' ? 'Khác' : 'Chưa cập nhật'}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Số điện thoại
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {user.phone || 'Chưa cập nhật'}
                </p>
              )}
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  saving 
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage 