import { Heart, MessageCircle, Calendar, TestTube, BookOpen, Shield, Users, Clock } from 'lucide-react'

const ServicesPage = () => {
  const services = [
    {
      icon: Calendar,
      name: 'Theo dõi chu kỳ sinh sản',
      description: 'Ứng dụng thông minh giúp theo dõi chu kỳ kinh nguyệt, dự đoán ngày rụng trứng và tư vấn kế hoạch hóa gia đình.',
      features: [
        'Theo dõi chu kỳ kinh nguyệt tự động',
        'Dự đoán ngày rụng trứng chính xác',
        'Nhắc nhở uống thuốc tránh thai',
        'Theo dõi các triệu chứng PMS',
        'Lập kế hoạch thụ thai an toàn'
      ],
      color: 'pink'
    },
    {
      icon: MessageCircle,
      name: 'Tư vấn trực tuyến',
      description: 'Kết nối với các chuyên gia tư vấn sức khỏe sinh sản qua video call, chat hoặc phone call.',
      features: [
        'Tư vấn 1-1 với chuyên gia',
        'Video call bảo mật',
        'Chat trực tuyến 24/7', 
        'Tư vấn kế hoạch hóa gia đình',
        'Hỗ trợ tâm lý về giới tính'
      ],
      color: 'blue'
    },
    {
      icon: TestTube,
      name: 'Xét nghiệm STIs',
      description: 'Dịch vụ xét nghiệm tầm soát các bệnh lây truyền qua đường tình dục với quy trình an toàn và bảo mật.',
      features: [
        'Xét nghiệm HIV/AIDS',
        'Xét nghiệm Giang mai (Syphilis)',
        'Xét nghiệm Lậu (Gonorrhea)',
        'Xét nghiệm Chlamydia',
        'Xét nghiệm HPV và Herpes'
      ],
      color: 'green'
    },
    {
      icon: BookOpen,
      name: 'Giáo dục giới tính',
      description: 'Nội dung giáo dục toàn diện về sức khỏe sinh sản, an toàn tình dục và kiến thức giới tính.',
      features: [
        'Kiến thức cơ bản về giới tính',
        'Phương pháp tránh thai an toàn',
        'Phòng ngừa bệnh STIs',
        'Chăm sóc sức khỏe sinh sản',
        'Hướng dẫn quan hệ an toàn'
      ],
      color: 'purple'
    },
    {
      icon: Heart,
      name: 'Chăm sóc sức khỏe phụ nữ',
      description: 'Dịch vụ chăm sóc sức khỏe chuyên biệt dành cho phụ nữ ở mọi độ tuổi.',
      features: [
        'Khám phụ khoa định kỳ',
        'Tầm soát ung thư cổ tử cung',
        'Tư vấn mãn kinh',
        'Chăm sóc thai kỳ',
        'Điều trị rối loạn nội tiết'
      ],
      color: 'red'
    },
    {
      icon: Users,
      name: 'Tư vấn cặp đôi',
      description: 'Dịch vụ tư vấn chuyên sâu dành cho các cặp đôi về sức khỏe sinh sản và kế hoạch hóa gia đình.',
      features: [
        'Tư vấn kế hoạch thụ thai',
        'Điều trị vô sinh hiếm muộn',
        'Tư vấn tình dục học',
        'Hỗ trợ tâm lý cặp đôi',
        'Tư vấn phương pháp tránh thai'
      ],
      color: 'indigo'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      pink: 'bg-pink-100 text-pink-600',
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    }
    return colors[color] || colors.pink
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dịch vụ chăm sóc sức khỏe sinh sản</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chúng tôi cung cấp đầy đủ các dịch vụ chăm sóc sức khỏe sinh sản chuyên nghiệp, 
            từ tư vấn, giáo dục đến xét nghiệm và theo dõi sức khỏe
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${getColorClasses(service.color)}`}>
                <service.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{service.name}</h3>
              <p className="text-gray-600 mb-6">{service.description}</p>
              <ul className="space-y-3">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-start">
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Process */}
        <div className="bg-white rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Quy trình dịch vụ của chúng tôi
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">1. Đăng ký tài khoản</h3>
              <p className="text-gray-600 text-sm">
                Tạo tài khoản cá nhân với thông tin được bảo mật hoàn toàn
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">2. Đặt lịch tư vấn</h3>
              <p className="text-gray-600 text-sm">
                Chọn dịch vụ phù hợp và đặt lịch tư vấn với chuyên gia
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">3. Tư vấn trực tuyến</h3>
              <p className="text-gray-600 text-sm">
                Gặp gỡ chuyên gia qua video call hoặc chat bảo mật
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-3">4. Theo dõi sức khỏe</h3>
              <p className="text-gray-600 text-sm">
                Sử dụng ứng dụng để theo dõi và chăm sóc sức khỏe hàng ngày
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg p-8 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Bảng giá dịch vụ</h2>
            <p className="text-pink-100">Giá cả minh bạch, không phát sinh chi phí ẩn</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-4">Gói Cơ bản</h3>
              <div className="text-3xl font-bold mb-4">Miễn phí</div>
              <ul className="space-y-2 text-sm text-pink-100">
                <li>• Theo dõi chu kỳ cơ bản</li>
                <li>• Đọc blog giáo dục</li>
                <li>• Chat với bot tư vấn</li>
              </ul>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-6 text-center border-2 border-white">
              <h3 className="text-xl font-semibold mb-4">Gói Tiêu chuẩn</h3>
              <div className="text-3xl font-bold mb-4">199.000đ/tháng</div>
              <ul className="space-y-2 text-sm text-pink-100">
                <li>• Tất cả tính năng cơ bản</li>
                <li>• Tư vấn trực tuyến 1-1</li>
                <li>• Theo dõi chu kỳ nâng cao</li>
                <li>• Hỗ trợ 24/7</li>
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-4">Gói Premium</h3>
              <div className="text-3xl font-bold mb-4">399.000đ/tháng</div>
              <ul className="space-y-2 text-sm text-pink-100">
                <li>• Tất cả tính năng tiêu chuẩn</li>
                <li>• Xét nghiệm STIs định kỳ</li>
                <li>• Tư vấn chuyên sâu</li>
                <li>• Báo cáo sức khỏe chi tiết</li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-lg p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Câu hỏi thường gặp
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Thông tin của tôi có được bảo mật không?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Tất cả thông tin cá nhân được mã hóa và bảo mật theo tiêu chuẩn quốc tế. 
                Chúng tôi cam kết không chia sẻ thông tin với bên thứ ba.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Tư vấn viên có chuyên nghiệp không?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Tất cả tư vấn viên đều có bằng cấp chuyên môn và nhiều năm kinh nghiệm 
                trong lĩnh vực sức khỏe sinh sản.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Kết quả xét nghiệm STIs có chính xác không?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Chúng tôi hợp tác với các phòng xét nghiệm uy tín, 
                sử dụng công nghệ hiện đại đảm bảo độ chính xác cao nhất.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Tôi có thể hủy dịch vụ bất kỳ lúc nào không?</h3>
              <p className="text-gray-600 text-sm mb-4">
                Bạn có thể hủy hoặc thay đổi gói dịch vụ bất kỳ lúc nào 
                mà không mất phí hủy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicesPage 