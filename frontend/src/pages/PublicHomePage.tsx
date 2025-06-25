import { Link } from 'react-router-dom'
import { Calendar, Heart, Users, Star, Shield, Award, Phone, Mail, MapPin, MessageCircle, TestTube, BookOpen } from 'lucide-react'

const PublicHomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-pink-50 to-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Chăm sóc sức khỏe <span className="text-pink-600">sinh sản</span> toàn diện
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Nền tảng chăm sóc sức khỏe sinh sản hiện đại với dịch vụ tư vấn chuyên nghiệp, 
            theo dõi chu kỳ kinh nguyệt và xét nghiệm STIs an toàn, bảo mật.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/appointment" 
              className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
            >
              Đặt lịch tư vấn
            </Link>
            <Link 
              to="/services" 
              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Tìm hiểu dịch vụ
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Dịch vụ chăm sóc sức khỏe sinh sản
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Theo dõi chu kỳ</h3>
              <p className="text-gray-600">
                Ứng dụng thông minh giúp theo dõi chu kỳ kinh nguyệt, dự đoán ngày rụng trứng và thời gian thụ thai
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Tư vấn trực tuyến</h3>
              <p className="text-gray-600">
                Kết nối với các chuyên gia tư vấn sức khỏe sinh sản có kinh nghiệm qua video call hoặc chat
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TestTube className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Xét nghiệm STIs</h3>
              <p className="text-gray-600">
                Dịch vụ xét nghiệm các bệnh lây truyền qua đường tình dục với quy trình bảo mật và kết quả chính xác
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Niềm tin từ khách hàng</h2>
            <p className="text-gray-600">Những con số chứng minh chất lượng dịch vụ của chúng tôi</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-pink-600 mb-2">5,000+</div>
              <div className="text-gray-600">Người dùng tin tưởng</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-600 mb-2">20+</div>
              <div className="text-gray-600">Chuyên gia tư vấn</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">10+</div>
              <div className="text-gray-600">Năm kinh nghiệm</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">98%</div>
              <div className="text-gray-600">Độ hài lòng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tại sao chọn Florism Care?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cam kết mang đến dịch vụ chăm sóc sức khỏe sinh sản tốt nhất với công nghệ hiện đại và đội ngũ chuyên nghiệp
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Bảo mật tuyệt đối</h3>
              <p className="text-gray-600 text-sm">Thông tin cá nhân được mã hóa và bảo vệ theo tiêu chuẩn quốc tế</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Đội ngũ chuyên nghiệp</h3>
              <p className="text-gray-600 text-sm">Bác sĩ có chứng chỉ và kinh nghiệm lâu năm trong lĩnh vực sức khỏe sinh sản</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Chất lượng đảm bảo</h3>
              <p className="text-gray-600 text-sm">Được kiểm định và tuân thủ các tiêu chuẩn y tế nghiêm ngặt</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-pink-600 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Liên hệ tư vấn miễn phí</h2>
            <p className="text-pink-100">Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ bạn</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <Phone className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Hotline tư vấn</h3>
              <p className="text-pink-100">1900 1234 (24/7)</p>
            </div>
            <div>
              <MessageCircle className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Chat trực tuyến</h3>
              <p className="text-pink-100">Tư vấn qua website</p>
            </div>
            <div>
              <Mail className="w-8 h-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-pink-100">support@healthcare.com</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PublicHomePage 