import { useState } from 'react'
import { Database, AlertCircle, RefreshCw } from 'lucide-react'
import { apiService } from '../utils/api'
import toast from 'react-hot-toast'

const DataSeeder = () => {
  const [seeding, setSeeding] = useState(false)
  const [seedCount, setSeedCount] = useState(0)

  // Sample data for realistic appointments
  const samplePatients = [
    { name: 'Nguyễn Thị Hương', email: 'huong.nguyen@gmail.com', phone: '0912345678' },
    { name: 'Trần Văn Minh', email: 'minh.tran@yahoo.com', phone: '0987654321' },
    { name: 'Lê Thị Lan', email: 'lan.le@gmail.com', phone: '0901234567' },
    { name: 'Phạm Quang Dũng', email: 'dung.pham@gmail.com', phone: '0934567890' },
    { name: 'Hoàng Thị Mai', email: 'mai.hoang@yahoo.com', phone: '0945678901' },
    { name: 'Vũ Văn Hải', email: 'hai.vu@gmail.com', phone: '0956789012' },
    { name: 'Đặng Thị Linh', email: 'linh.dang@gmail.com', phone: '0967890123' },
    { name: 'Bùi Minh Tuấn', email: 'tuan.bui@yahoo.com', phone: '0978901234' },
    { name: 'Ngô Thị Hồng', email: 'hong.ngo@gmail.com', phone: '0989012345' },
    { name: 'Đinh Văn Khoa', email: 'khoa.dinh@gmail.com', phone: '0990123456' },
    { name: 'Lương Thị Thảo', email: 'thao.luong@yahoo.com', phone: '0911234567' },
    { name: 'Trịnh Quang Nam', email: 'nam.trinh@gmail.com', phone: '0922345678' },
    { name: 'Dương Thị Yến', email: 'yen.duong@gmail.com', phone: '0933456789' },
    { name: 'Võ Minh Đức', email: 'duc.vo@yahoo.com', phone: '0944567890' },
    { name: 'Phan Thị Nga', email: 'nga.phan@gmail.com', phone: '0955678901' }
  ]

  const departments = [
    'REPRODUCTIVE_HEALTH',
    'GYNECOLOGY', 
    'OBSTETRICS',
    'FAMILY_PLANNING',
    'STI_TESTING',
    'FERTILITY',
    'GENERAL_PRACTICE'
  ]

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:30', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00'
  ]

  const reasons = [
    'Khám định kỳ',
    'Tư vấn kế hoạch hóa gia đình',
    'Khám sức khỏe sinh sản',
    'Xét nghiệm STI',
    'Tư vấn có thai',
    'Khám phụ khoa',
    'Tư vấn hiếm muộn',
    'Khám thai định kỳ',
    'Tư vấn sức khỏe tình dục',
    'Khám tổng quát'
  ]

  const appointmentStatuses = [
    { status: 'COMPLETED', weight: 40 }, // 40% completed
    { status: 'PAID', weight: 25 },      // 25% paid 
    { status: 'CANCELLED', weight: 15 }, // 15% cancelled
    { status: 'NO_SHOW', weight: 10 },   // 10% no show
    { status: 'PAYMENT_REQUESTED', weight: 10 } // 10% payment requested
  ]

  const getRandomStatus = () => {
    const random = Math.random() * 100
    let cumulative = 0
    
    for (const { status, weight } of appointmentStatuses) {
      cumulative += weight
      if (random <= cumulative) {
        return status
      }
    }
    return 'COMPLETED'
  }

  const getRandomDate = (monthsBack: number) => {
    const now = new Date()
    const targetMonth = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0)
    
    // Random date within the target month
    const randomDay = Math.floor(Math.random() * endOfMonth.getDate()) + 1
    const randomDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), randomDay)
    
    // Don't create future appointments
    if (randomDate > now) {
      return now.toISOString().split('T')[0]
    }
    
    return randomDate.toISOString().split('T')[0]
  }

  const getRandomElement = <T,>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)]
  }

  const generateRandomAppointment = (monthsBack: number) => {
    const patient = getRandomElement(samplePatients)
    const department = getRandomElement(departments)
    const timeSlot = getRandomElement(timeSlots)
    const reason = getRandomElement(reasons)
    const appointmentDate = getRandomDate(monthsBack)

    return {
      fullName: patient.name,
      email: patient.email,
      phone: patient.phone,
      appointmentDate,
      appointmentTime: timeSlot,
      department,
      reason
    }
  }

  const seedData = async () => {
    setSeeding(true)
    setSeedCount(0)
    let totalCreated = 0
    
    try {
      // Create appointments for each of the last 6 months
      for (let month = 0; month < 6; month++) {
        // Generate 8-15 appointments per month for variety
        const appointmentsThisMonth = Math.floor(Math.random() * 8) + 8
        
        for (let i = 0; i < appointmentsThisMonth; i++) {
          try {
            const appointmentData = generateRandomAppointment(month)
            
            // Create the appointment
            const response = await apiService.createPublicAppointment(appointmentData)
            
            // Wait a bit to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Set the appointment to a final status to make it appear in history
            const appointmentId = response.appointmentId
            const finalStatus = getRandomStatus()
            
            // Update to final status
            await apiService.updateAppointment(appointmentId, { 
              status: finalStatus as any
            })
            
            totalCreated++
            setSeedCount(totalCreated)
            
            // Small delay between appointments
            await new Promise(resolve => setTimeout(resolve, 50))
            
          } catch (error) {
            console.error('Error creating appointment:', error)
            // Continue with next appointment even if one fails
          }
        }
        
        // Brief pause between months
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      toast.success(`Đã tạo thành công ${totalCreated} lịch hẹn mẫu!`)
      
    } catch (error) {
      console.error('Error seeding data:', error)
      toast.error('Có lỗi khi tạo dữ liệu mẫu')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Data Seeder</h3>
            <p className="text-sm text-gray-600">Tạo dữ liệu mẫu cho dashboard</p>
          </div>
        </div>
        
        {seeding && (
          <div className="flex items-center space-x-2 text-blue-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Đã tạo: {seedCount}</span>
          </div>
        )}
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Tính năng này sẽ:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Tạo 50-90 lịch hẹn mẫu phân bổ qua 6 tháng</li>
              <li>Đa dạng trạng thái: COMPLETED, PAID, CANCELLED, NO_SHOW</li>
              <li>Thông tin bệnh nhân và khoa khám ngẫu nhiên</li>
              <li>Giúp dashboard hiển thị biểu đồ sinh động</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={seedData}
        disabled={seeding}
        className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
          seeding
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
        }`}
      >
        {seeding ? (
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang tạo dữ liệu... ({seedCount})</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Tạo dữ liệu mẫu</span>
          </div>
        )}
      </button>

      <div className="mt-3 text-xs text-gray-500 text-center">
        ⚠️ Chỉ sử dụng trong môi trường development
      </div>
    </div>
  )
}

export default DataSeeder 