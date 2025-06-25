import { Users, Heart, Shield, Award } from 'lucide-react'

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Về chúng tôi</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chúng tôi là đơn vị tiên phong trong việc ứng dụng công nghệ vào chăm sóc sức khỏe, 
            mang đến trải nghiệm y tế hiện đại và chất lượng cao.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-lg p-8 mb-12 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sứ mệnh của chúng tôi</h2>
          <p className="text-gray-700 leading-relaxed">
            Cung cấp dịch vụ chăm sóc sức khỏe toàn diện, dễ tiếp cận và chất lượng cao 
            thông qua việc kết hợp công nghệ hiện đại với sự chăm sóc tận tâm của đội ngũ y bác sĩ chuyên nghiệp.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Tận tâm</h3>
            <p className="text-gray-600 text-sm">Luôn đặt sức khỏe bệnh nhân lên hàng đầu</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Chuyên nghiệp</h3>
            <p className="text-gray-600 text-sm">Đội ngũ y bác sĩ giàu kinh nghiệm</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Tin cậy</h3>
            <p className="text-gray-600 text-sm">Bảo mật thông tin và chất lượng dịch vụ</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Chất lượng</h3>
            <p className="text-gray-600 text-sm">Không ngừng nâng cao chất lượng dịch vụ</p>
          </div>
        </div>

        {/* Team */}
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Đội ngũ lãnh đạo</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-gray-900">BS. Nguyễn Văn A</h3>
              <p className="text-gray-600">Giám đốc Y khoa</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-gray-900">BS. Trần Thị B</h3>
              <p className="text-gray-600">Trưởng khoa Nội</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-gray-900">BS. Lê Văn C</h3>
              <p className="text-gray-600">Trưởng khoa Ngoại</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage 