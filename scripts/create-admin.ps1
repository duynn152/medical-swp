# Medical SWP - Create Admin Tool (PowerShell Version)
# Usage: .\scripts\create-admin.ps1

param(
    [string]$BackendUrl = "http://localhost:8080"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-BackendConnection {
    Write-ColorOutput "Checking backend connection..." $Yellow
    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/api/actuator/health" -Method GET -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✓ Backend is running" $Green
            return $true
        }
    }
    catch {
        Write-ColorOutput "✗ Backend is not running or not accessible" $Red
        Write-ColorOutput "Please make sure the backend server is running on $BackendUrl" $Red
        return $false
    }
}

function Test-Email {
    param([string]$Email)
    return $Email -match "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
}

function New-AdminUser {
    param(
        [string]$Username,
        [string]$Email,
        [string]$Password,
        [string]$FullName,
        [string]$Birth,
        [string]$Gender
    )

    Write-ColorOutput "Creating admin user..." $Yellow

    $body = @{
        username = $Username
        email = $Email
        password = $Password
        fullName = $FullName
        birth = $Birth
        gender = $Gender
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "$BackendUrl/api/auth/create-first-admin" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✓ Admin user created successfully!" $Green
            Write-ColorOutput "Username: $Username" $Green
            Write-ColorOutput "Email: $Email" $Green
            Write-ColorOutput "Role: ADMIN" $Green
            return $true
        }
    }
    catch {
        Write-ColorOutput "✗ Failed to create admin user" $Red
        Write-ColorOutput "Error: $($_.Exception.Message)" $Red
        if ($_.Exception.Response) {
            Write-ColorOutput "HTTP Status: $($_.Exception.Response.StatusCode)" $Red
        }
        return $false
    }
}

# Main script
Write-ColorOutput "========================================" $Blue
Write-ColorOutput "    Medical SWP - Create Admin Tool     " $Blue
Write-ColorOutput "========================================" $Blue
Write-Host

# Check backend connection
if (-not (Test-BackendConnection)) {
    exit 1
}

Write-Host
Write-ColorOutput "Please provide the following information:" $Blue
Write-Host

# Get username
do {
    $username = Read-Host "Username"
} while ([string]::IsNullOrWhiteSpace($username) -and (Write-ColorOutput "Username cannot be empty" $Red))

# Get email
do {
    $email = Read-Host "Email"
    if (-not (Test-Email $email)) {
        Write-ColorOutput "Please enter a valid email address" $Red
    }
} while (-not (Test-Email $email))

# Get password
do {
    $password = Read-Host "Password" -AsSecureString
    $password_plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
    
    if ($password_plain.Length -lt 6) {
        Write-ColorOutput "Password must be at least 6 characters" $Red
        continue
    }
    
    $confirm_password = Read-Host "Confirm Password" -AsSecureString
    $confirm_password_plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirm_password))
    
    if ($password_plain -ne $confirm_password_plain) {
        Write-ColorOutput "Passwords do not match" $Red
        continue
    }
    
    break
} while ($true)

# Get full name
do {
    $fullname = Read-Host "Full Name"
} while ([string]::IsNullOrWhiteSpace($fullname) -and (Write-ColorOutput "Full name cannot be empty" $Red))

# Get birth date
do {
    $birth = Read-Host "Birth Date (YYYY-MM-DD)"
} while ($birth -notmatch "^\d{4}-\d{2}-\d{2}$" -and (Write-ColorOutput "Please enter date in YYYY-MM-DD format" $Red))

# Get gender
Write-Host "Gender:"
Write-Host "1) MALE"
Write-Host "2) FEMALE"
Write-Host "3) OTHER"

do {
    $genderChoice = Read-Host "Select gender (1-3)"
    switch ($genderChoice) {
        "1" { $gender = "MALE"; break }
        "2" { $gender = "FEMALE"; break }
        "3" { $gender = "OTHER"; break }
        default { 
            Write-ColorOutput "Please select 1, 2, or 3" $Red
            continue
        }
    }
    break
} while ($true)

Write-Host
Write-ColorOutput "Creating admin user with the following details:" $Yellow
Write-Host "Username: $username"
Write-Host "Email: $email"
Write-Host "Full Name: $fullname"
Write-Host "Birth Date: $birth"
Write-Host "Gender: $gender"
Write-Host "Role: ADMIN"
Write-Host

$confirm = Read-Host "Continue? (y/N)"
if ($confirm -match "^[Yy]$") {
    New-AdminUser -Username $username -Email $email -Password $password_plain -FullName $fullname -Birth $birth -Gender $gender
}
else {
    Write-ColorOutput "Operation cancelled" $Yellow
} 