#!/bin/bash

# Script to initialize sample blog data
# Usage: ./scripts/init-blog-data.sh

API_BASE="http://localhost:8080/api/blogs"

echo "🚀 Initializing sample blog data..."

# Sample blog posts
create_blog() {
    local title="$1"
    local excerpt="$2"
    local content="$3"
    local author="$4"
    local category="$5"
    local status="$6"
    local featured="$7"
    local readTime="$8"

    curl -X POST "$API_BASE" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"excerpt\": \"$excerpt\",
            \"content\": \"$content\",
            \"author\": \"$author\",
            \"category\": \"$category\",
            \"status\": \"$status\",
            \"featured\": $featured,
            \"readTime\": \"$readTime\"
        }" \
        -s -w "\n%{http_code}\n" | tail -1
}

# Check if backend is running
echo "📡 Checking backend connection..."
if ! curl -s "$API_BASE/stats" > /dev/null; then
    echo "❌ Backend is not running on localhost:8080"
    echo "Please start the backend first: cd backend && mvn spring-boot:run"
    exit 1
fi

echo "✅ Backend is running"

# Create sample blog posts
echo "📝 Creating sample blog posts..."

# Featured blog post
echo "Creating featured blog post..."
STATUS=$(create_blog \
    "10 Lời khuyên để có một trái tim khỏe mạnh" \
    "Tìm hiểu những cách đơn giản để bảo vệ sức khỏe tim mạch và phòng ngừa các bệnh lý tim mạch phổ biến trong cuộc sống hàng ngày." \
    "# 10 Lời khuyên để có một trái tim khỏe mạnh\n\nTrái tim là cơ quan quan trọng nhất trong cơ thể con người. Dưới đây là 10 lời khuyên giúp bạn duy trì một trái tim khỏe mạnh:\n\n## 1. Tập thể dục thường xuyên\nTập thể dục ít nhất 30 phút mỗi ngày giúp tăng cường sức khỏe tim mạch.\n\n## 2. Ăn uống lành mạnh\nChế độ ăn giàu rau xanh, trái cây và hạn chế chất béo có hại.\n\n## 3. Không hút thuốc\nThuốc lá là một trong những nguyên nhân chính gây bệnh tim mạch.\n\n## 4. Kiểm soát cân nặng\nDuy trì cân nặng hợp lý giúp giảm áp lực lên tim.\n\n## 5. Quản lý stress\nStress mạn tính có thể ảnh hưởng xấu đến sức khỏe tim mạch." \
    "BS. Nguyễn Thu Hà" \
    "Tim mạch" \
    "PUBLISHED" \
    true \
    "5 phút")

if [ "$STATUS" = "201" ]; then
    echo "✅ Featured blog created successfully"
else
    echo "❌ Failed to create featured blog (HTTP $STATUS)"
fi

# Regular blog posts
echo "Creating regular blog posts..."

create_blog \
    "Tầm quan trọng của việc tầm soát ung thư" \
    "Khám phá tại sao việc tầm soát ung thư sớm có thể cứu sống và các loại tầm soát nào bạn cần quan tâm theo từng độ tuổi." \
    "# Tầm quan trọng của việc tầm soát ung thư\n\nTầm soát ung thư là việc kiểm tra để phát hiện ung thư trước khi có triệu chứng...\n\n## Các loại tầm soát quan trọng\n- Tầm soát ung thư vú\n- Tầm soát ung thư cổ tử cung\n- Tầm soát ung thư đại trực tràng" \
    "BS. Lê Văn Minh" \
    "Ung thư" \
    "PUBLISHED" \
    false \
    "7 phút" > /dev/null

create_blog \
    "Dinh dưỡng hợp lý cho người bệnh tiểu đường" \
    "Hướng dẫn chi tiết về chế độ ăn uống phù hợp giúp kiểm soát đường huyết hiệu quả và duy trì chất lượng cuộc sống." \
    "# Dinh dưỡng hợp lý cho người bệnh tiểu đường\n\nChế độ ăn uống đóng vai trò quan trọng trong việc kiểm soát tiểu đường...\n\n## Nguyên tắc dinh dưỡng\n- Ăn đúng giờ\n- Kiểm soát lượng carbohydrate\n- Tăng cường chất xơ" \
    "BS. Trần Thị Lan" \
    "Tiểu đường" \
    "PUBLISHED" \
    false \
    "6 phút" > /dev/null

create_blog \
    "Cách phòng ngừa cảm cúm mùa đông" \
    "Những biện pháp đơn giản nhưng hiệu quả để bảo vệ bản thân và gia đình khỏi cảm cúm trong mùa lạnh." \
    "# Cách phòng ngừa cảm cúm mùa đông\n\nMùa đông là thời điểm cảm cúm dễ bùng phát...\n\n## Biện pháp phòng ngừa\n- Rửa tay thường xuyên\n- Đeo khẩu trang nơi đông người\n- Tăng cường sức đề kháng" \
    "BS. Hoàng Văn Đức" \
    "Phòng bệnh" \
    "PUBLISHED" \
    false \
    "4 phút" > /dev/null

# Draft blog post
create_blog \
    "Tập thể dục đúng cách cho người cao tuổi" \
    "Gợi ý các bài tập an toàn và hiệu quả dành riêng cho người cao tuổi để duy trì sức khỏe và phòng ngừa tai nạn." \
    "# Tập thể dục đúng cách cho người cao tuổi\n\nNgười cao tuổi cần tập thể dục phù hợp để duy trì sức khỏe...\n\n## Các bài tập phù hợp\n- Đi bộ\n- Yoga nhẹ nhàng\n- Bơi lội\n- Tập cơ bản" \
    "BS. Mai Thị Hương" \
    "Thể dục" \
    "DRAFT" \
    false \
    "8 phút" > /dev/null

create_blog \
    "Chăm sóc sức khỏe tâm thần" \
    "Hiểu rõ về tầm quan trọng của sức khỏe tâm thần và cách duy trì trạng thái tinh thần tốt trong cuộc sống hiện đại." \
    "# Chăm sóc sức khỏe tâm thần\n\nSức khỏe tâm thần quan trọng không kém sức khỏe thể chất...\n\n## Cách chăm sóc\n- Thiền định\n- Giao lưu xã hội\n- Duy trì thói quen tốt\n- Tìm kiếm sự hỗ trợ khi cần" \
    "BS. Phạm Văn Nam" \
    "Tâm thần" \
    "PUBLISHED" \
    false \
    "10 phút" > /dev/null

echo "✅ Sample blog posts created successfully"

# Get statistics
echo "📊 Blog statistics:"
curl -s "$API_BASE/stats" | jq '.' 2>/dev/null || echo "Install jq to see formatted stats"

echo ""
echo "🎉 Blog data initialization completed!"
echo "📝 Access Admin Blog Control: http://localhost:5173/admin/blogs"
echo "👀 View Public Blog: http://localhost:5173/blog" 