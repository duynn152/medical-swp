#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default backend URL
BACKEND_URL="http://localhost:8080"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    Medical SWP - Create Admin Tool     ${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Function to check if backend is running
check_backend() {
    echo -e "${YELLOW}Checking backend connection...${NC}"
    if curl -s --connect-timeout 5 "$BACKEND_URL/api/actuator/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Backend is not running or not accessible${NC}"
        echo -e "${RED}Please make sure the backend server is running on $BACKEND_URL${NC}"
        return 1
    fi
}

# Function to validate email
validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Function to create admin user
create_admin() {
    local username=$1
    local email=$2
    local password=$3
    local fullname=$4
    local birth=$5
    local gender=$6

    echo -e "${YELLOW}Creating admin user...${NC}"

    # Create JSON payload
    local json_payload=$(cat <<EOF
{
    "username": "$username",
    "email": "$email", 
    "password": "$password",
    "fullName": "$fullname",
    "birth": "$birth",
    "gender": "$gender"
}
EOF
)

    # Make API call
    local response=$(curl -s -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/create-first-admin" \
        -H "Content-Type: application/json" \
        -d "$json_payload")

    local http_code="${response: -3}"
    local response_body="${response%???}"

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Admin user created successfully!${NC}"
        echo -e "${GREEN}Username: $username${NC}"
        echo -e "${GREEN}Email: $email${NC}"
        echo -e "${GREEN}Role: ADMIN${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to create admin user${NC}"
        echo -e "${RED}HTTP Code: $http_code${NC}"
        if [ ! -z "$response_body" ]; then
            echo -e "${RED}Error: $response_body${NC}"
        fi
        return 1
    fi
}

# Main script
main() {
    # Check backend connection first
    if ! check_backend; then
        exit 1
    fi

    echo
    echo -e "${BLUE}Please provide the following information:${NC}"
    echo

    # Get username
    while true; do
        read -p "Username: " username
        if [ ! -z "$username" ]; then
            break
        else
            echo -e "${RED}Username cannot be empty${NC}"
        fi
    done

    # Get email
    while true; do
        read -p "Email: " email
        if validate_email "$email"; then
            break
        else
            echo -e "${RED}Please enter a valid email address${NC}"
        fi
    done

    # Get password
    while true; do
        read -s -p "Password: " password
        echo
        if [ ${#password} -ge 6 ]; then
            read -s -p "Confirm Password: " confirm_password
            echo
            if [ "$password" = "$confirm_password" ]; then
                break
            else
                echo -e "${RED}Passwords do not match${NC}"
            fi
        else
            echo -e "${RED}Password must be at least 6 characters${NC}"
        fi
    done

    # Get full name
    while true; do
        read -p "Full Name: " fullname
        if [ ! -z "$fullname" ]; then
            break
        else
            echo -e "${RED}Full name cannot be empty${NC}"
        fi
    done

    # Get birth date
    while true; do
        read -p "Birth Date (YYYY-MM-DD): " birth
        if [[ $birth =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
            break
        else
            echo -e "${RED}Please enter date in YYYY-MM-DD format${NC}"
        fi
    done

    # Get gender
    echo "Gender:"
    echo "1) MALE"
    echo "2) FEMALE"
    echo "3) OTHER"
    while true; do
        read -p "Select gender (1-3): " gender_choice
        case $gender_choice in
            1) gender="MALE"; break;;
            2) gender="FEMALE"; break;;
            3) gender="OTHER"; break;;
            *) echo -e "${RED}Please select 1, 2, or 3${NC}";;
        esac
    done

    echo
    echo -e "${YELLOW}Creating admin user with the following details:${NC}"
    echo "Username: $username"
    echo "Email: $email"
    echo "Full Name: $fullname"
    echo "Birth Date: $birth"
    echo "Gender: $gender"
    echo "Role: ADMIN"
    echo

    read -p "Continue? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        create_admin "$username" "$email" "$password" "$fullname" "$birth" "$gender"
    else
        echo -e "${YELLOW}Operation cancelled${NC}"
        exit 0
    fi
}

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}curl is required but not installed. Please install curl first.${NC}"
    exit 1
fi

# Run main function
main 