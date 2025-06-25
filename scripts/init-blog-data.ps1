# PowerShell script to initialize sample blog data
# Usage: .\scripts\init-blog-data.ps1

$API_BASE = "http://localhost:8080/api/blogs"

Write-Host "🚀 Initializing sample blog data..." -ForegroundColor Cyan

# Function to create blog post
function Create-Blog {
    param(
        [string]$Title,
        [string]$Excerpt,
        [string]$Content,
        [string]$Author,
        [string]$Category,
        [string]$Status,
        [bool]$Featured,
        [string]$ReadTime
    )

    $body = @{
        title = $Title
        excerpt = $Excerpt
        content = $Content
        author = $Author
        category = $Category
        status = $Status
        featured = $Featured
        readTime = $ReadTime
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $API_BASE -Method Post -Body $body -ContentType "application/json"
        return $true
    }
    catch {
        Write-Host "❌ Error creating blog: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check if backend is running
Write-Host "📡 Checking backend connection..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$API_BASE/stats" -Method Get | Out-Null
    Write-Host "✅ Backend is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend is not running on localhost:8080" -ForegroundColor Red
    Write-Host "Please start the backend first: cd backend && mvn spring-boot:run" -ForegroundColor Yellow
    exit 1
}

# Create sample blog posts
Write-Host "📝 Creating sample blog posts..." -ForegroundColor Yellow

# Featured blog post
Write-Host "Creating featured blog post..." -ForegroundColor White
$success = Create-Blog `
    -Title "10 Lời khuyên để có một trái tim khỏe mạnh" `
    -Excerpt "Tìm hiểu những cách đơn giản để bảo vệ sức khỏe tim mạch và phòng ngừa các bệnh lý tim mạch phổ biến trong cuộc sống hàng ngày." `
    -Content "# 10 Lời khuyên để có một trái tim khỏe mạnh`n`nTrái tim là cơ quan quan trọng nhất trong cơ thể con người. Dưới đây là 10 lời khuyên giúp bạn duy trì một trái tim khỏe mạnh:`n`n## 1. Tập thể dục thường xuyên`nTập thể dục ít nhất 30 phút mỗi ngày giúp tăng cường sức khỏe tim mạch.`n`n## 2. Ăn uống lành mạnh`nChế độ ăn giàu rau xanh, trái cây và hạn chế chất béo có hại.`n`n## 3. Không hút thuốc`nThuốc lá là một trong những nguyên nhân chính gây bệnh tim mạch.`n`n## 4. Kiểm soát cân nặng`nDuy trì cân nặng hợp lý giúp giảm áp lực lên tim.`n`n## 5. Quản lý stress`nStress mạn tính có thể ảnh hưởng xấu đến sức khỏe tim mạch." `
    -Author "BS. Nguyễn Thu Hà" `
    -Category "Tim mạch" `
    -Status "PUBLISHED" `
    -Featured $true `
    -ReadTime "5 phút"

if ($success) {
    Write-Host "✅ Featured blog created successfully" -ForegroundColor Green
}

# Regular blog posts
Write-Host "Creating regular blog posts..." -ForegroundColor White

Create-Blog `
    -Title "Tầm quan trọng của việc tầm soát ung thư" `
    -Excerpt "Khám phá tại sao việc tầm soát ung thư sớm có thể cứu sống và các loại tầm soát nào bạn cần quan tâm theo từng độ tuổi." `
    -Content "# Tầm quan trọng của việc tầm soát ung thư`n`nTầm soát ung thư là việc kiểm tra để phát hiện ung thư trước khi có triệu chứng...`n`n## Các loại tầm soát quan trọng`n- Tầm soát ung thư vú`n- Tầm soát ung thư cổ tử cung`n- Tầm soát ung thư đại trực tràng" `
    -Author "BS. Lê Văn Minh" `
    -Category "Ung thư" `
    -Status "PUBLISHED" `
    -Featured $false `
    -ReadTime "7 phút" | Out-Null

Create-Blog `
    -Title "Dinh dưỡng hợp lý cho người bệnh tiểu đường" `
    -Excerpt "Hướng dẫn chi tiết về chế độ ăn uống phù hợp giúp kiểm soát đường huyết hiệu quả và duy trì chất lượng cuộc sống." `
    -Content "# Dinh dưỡng hợp lý cho người bệnh tiểu đường`n`nChế độ ăn uống đóng vai trò quan trọng trong việc kiểm soát tiểu đường...`n`n## Nguyên tắc dinh dưỡng`n- Ăn đúng giờ`n- Kiểm soát lượng carbohydrate`n- Tăng cường chất xơ" `
    -Author "BS. Trần Thị Lan" `
    -Category "Tiểu đường" `
    -Status "PUBLISHED" `
    -Featured $false `
    -ReadTime "6 phút" | Out-Null

Create-Blog `
    -Title "Cách phòng ngừa cảm cúm mùa đông" `
    -Excerpt "Những biện pháp đơn giản nhưng hiệu quả để bảo vệ bản thân và gia đình khỏi cảm cúm trong mùa lạnh." `
    -Content "# Cách phòng ngừa cảm cúm mùa đông`n`nMùa đông là thời điểm cảm cúm dễ bùng phát...`n`n## Biện pháp phòng ngừa`n- Rửa tay thường xuyên`n- Đeo khẩu trang nơi đông người`n- Tăng cường sức đề kháng" `
    -Author "BS. Hoàng Văn Đức" `
    -Category "Phòng bệnh" `
    -Status "PUBLISHED" `
    -Featured $false `
    -ReadTime "4 phút" | Out-Null

# Draft blog post
Create-Blog `
    -Title "Tập thể dục đúng cách cho người cao tuổi" `
    -Excerpt "Gợi ý các bài tập an toàn và hiệu quả dành riêng cho người cao tuổi để duy trì sức khỏe và phòng ngừa tai nạn." `
    -Content "# Tập thể dục đúng cách cho người cao tuổi`n`nNgười cao tuổi cần tập thể dục phù hợp để duy trì sức khỏe...`n`n## Các bài tập phù hợp`n- Đi bộ`n- Yoga nhẹ nhàng`n- Bơi lội`n- Tập cơ bản" `
    -Author "BS. Mai Thị Hương" `
    -Category "Thể dục" `
    -Status "DRAFT" `
    -Featured $false `
    -ReadTime "8 phút" | Out-Null

Create-Blog `
    -Title "Chăm sóc sức khỏe tâm thần" `
    -Excerpt "Hiểu rõ về tầm quan trọng của sức khỏe tâm thần và cách duy trì trạng thái tinh thần tốt trong cuộc sống hiện đại." `
    -Content "# Chăm sóc sức khỏe tâm thần`n`nSức khỏe tâm thần quan trọng không kém sức khỏe thể chất...`n`n## Cách chăm sóc`n- Thiền định`n- Giao lưu xã hội`n- Duy trì thói quen tốt`n- Tìm kiếm sự hỗ trợ khi cần" `
    -Author "BS. Phạm Văn Nam" `
    -Category "Tâm thần" `
    -Status "PUBLISHED" `
    -Featured $false `
    -ReadTime "10 phút" | Out-Null

Write-Host "✅ Sample blog posts created successfully" -ForegroundColor Green

# Get statistics
Write-Host "📊 Blog statistics:" -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$API_BASE/stats" -Method Get
    Write-Host "Total: $($stats.total), Published: $($stats.published), Draft: $($stats.draft), Featured: $($stats.featured)" -ForegroundColor White
}
catch {
    Write-Host "Could not fetch statistics" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Blog data initialization completed!" -ForegroundColor Green
Write-Host "📝 Access Admin Blog Control: http://localhost:5173/admin/blogs" -ForegroundColor Cyan
Write-Host "👀 View Public Blog: http://localhost:5173/blog" -ForegroundColor Cyan 