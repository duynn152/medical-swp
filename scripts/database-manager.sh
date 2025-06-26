#!/bin/bash

# Medical SWP - Database Manager & Admin Tools
# Comprehensive database management and admin creation tool

# Database connection info
DB_HOST="dpg-d1dqqlbipnbc73djckq0-a.oregon-postgres.render.com"
DB_PORT="5432"
DB_NAME="florism_db"
DB_USER="florism_db_user"
DB_PASSWORD="kZ2vDOaXY9OK8rOw0KXVQy7k3Eel6iNp"

# Backend URL for admin creation
BACKEND_URL="http://localhost:8080"

echo "============================================="
echo "  Medical SWP - Database Manager & Admin   "
echo "============================================="
echo

# Function to test database connection
test_db_connection() {
    echo "Testing database connection..."
    export PGPASSWORD="$DB_PASSWORD"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" > /dev/null 2>&1; then
        echo "✓ Database connection successful"
        return 0
    else
        echo "✗ Database connection failed"
        return 1
    fi
}

# Function to test backend connection
test_backend_connection() {
    echo "Testing backend connection..."
    if curl -s --connect-timeout 5 "$BACKEND_URL/api/actuator/health" > /dev/null 2>&1; then
        echo "✓ Backend is running"
        return 0
    else
        echo "✗ Backend is not running"
        echo "Please start the backend first: ./run-app.sh"
        return 1
    fi
}

# Function to show database info
show_db_info() {
    echo "=== Database Information ==="
    echo "Host: $DB_HOST"
    echo "Port: $DB_PORT"
    echo "Database: $DB_NAME"
    echo "User: $DB_USER"
    echo
    
    echo "=== Database Version ==="
    export PGPASSWORD="$DB_PASSWORD"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();"
    echo
    
    echo "=== Database Size ==="
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT pg_size_pretty(pg_database_size('$DB_NAME')) as database_size;
    "
    echo
}

# Function to show users
show_users() {
    echo "=== Users in Database ==="
    export PGPASSWORD="$DB_PASSWORD"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            id,
            username,
            email,
            full_name,
            role,
            active,
            created_at
        FROM users 
        ORDER BY created_at DESC;
    "
    echo
}

# Function to show statistics
show_statistics() {
    echo "=== Database Statistics ==="
    export PGPASSWORD="$DB_PASSWORD"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        -- Show table row counts
        SELECT 
            'Table: ' || tablename as metric,
            (SELECT count(*) FROM pg_class WHERE relname = tablename) as table_exists,
            CASE 
                WHEN (SELECT count(*) FROM pg_class WHERE relname = tablename) > 0 
                THEN (
                    SELECT n_tup_ins - n_tup_del 
                    FROM pg_stat_user_tables 
                    WHERE relname = tablename
                )
                ELSE 0 
            END as row_count
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
        
        -- Additional specific metrics if tables exist
        SELECT '--- User Statistics ---' as section, '' as details, '' as count
        UNION ALL
        SELECT 
            'Total Users' as section,
            '' as details,
            COALESCE(count(*)::text, '0') as count
        FROM users
        WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users')
        UNION ALL
        SELECT 
            'Active Users' as section,
            '' as details,
            COALESCE(count(*)::text, '0') as count
        FROM users 
        WHERE active = true AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users')
        UNION ALL
        SELECT 
            'Admin Users' as section,
            '' as details,
            COALESCE(count(*)::text, '0') as count
        FROM users 
        WHERE role = 'ADMIN' AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users')
        UNION ALL
        SELECT '--- Content Statistics ---' as section, '' as details, '' as count
        UNION ALL
        SELECT 
            'Total Blog Posts' as section,
            '' as details,
            COALESCE(count(*)::text, '0') as count
        FROM blog_posts
        WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'blog_posts')
        UNION ALL
        SELECT 
            'Published Posts' as section,
            '' as details,
            COALESCE(count(*)::text, '0') as count
        FROM blog_posts 
        WHERE status = 'PUBLISHED' AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'blog_posts')
        UNION ALL
        SELECT '--- Appointment Statistics ---' as section, '' as details, '' as count
        UNION ALL
        SELECT 
            'Total Appointments' as section,
            '' as details,
            COALESCE(count(*)::text, '0') as count
        FROM appointments
        WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'appointments')
        UNION ALL
        SELECT 
            'Pending Appointments' as section,
            '' as details,
            COALESCE(count(*)::text, '0') as count
        FROM appointments 
        WHERE status = 'PENDING' AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'appointments')
        UNION ALL
        SELECT 
            'Confirmed Appointments' as section,
            '' as details,
            COALESCE(count(*)::text, '0') as count
        FROM appointments 
        WHERE status = 'CONFIRMED' AND EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'appointments');
    "
    echo
}

# Function to backup database
backup_database() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "Creating database backup..."
    
    export PGPASSWORD="$DB_PASSWORD"
    pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_file"
    
    if [ $? -eq 0 ]; then
        echo "✓ Backup created successfully: $backup_file"
    else
        echo "✗ Backup failed"
    fi
}

# Function to clear all data
clear_data() {
    echo "WARNING: This will delete ALL data but keep table structure!"
    read -p "Are you sure? Type 'CLEAR' to confirm: " confirm
    
    if [ "$confirm" = "CLEAR" ]; then
        echo "Clearing all data..."
        export PGPASSWORD="$DB_PASSWORD"
        
        # Get all table names and truncate them
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            DO \$\$
            DECLARE
                table_record RECORD;
            BEGIN
                -- Disable foreign key checks temporarily
                SET session_replication_role = replica;
                
                -- Truncate all tables
                FOR table_record IN 
                    SELECT tablename 
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(table_record.tablename) || ' RESTART IDENTITY CASCADE;';
                END LOOP;
                
                -- Re-enable foreign key checks
                SET session_replication_role = DEFAULT;
            END \$\$;
        "
        echo "✓ All data cleared from all tables"
    else
        echo "Operation cancelled"
    fi
}

# Function to reset database
reset_database() {
    echo "WARNING: This will delete ALL tables and data!"
    read -p "Are you sure? Type 'RESET' to confirm: " confirm
    
    if [ "$confirm" = "RESET" ]; then
        echo "Resetting database..."
        export PGPASSWORD="$DB_PASSWORD"
        
        # Drop all tables, sequences, and other objects
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            DO \$\$
            DECLARE
                table_record RECORD;
                sequence_record RECORD;
            BEGIN
                -- Drop all tables
                FOR table_record IN 
                    SELECT tablename 
                    FROM pg_tables 
                    WHERE schemaname = 'public'
                LOOP
                    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(table_record.tablename) || ' CASCADE;';
                END LOOP;
                
                -- Drop all sequences
                FOR sequence_record IN 
                    SELECT sequencename 
                    FROM pg_sequences 
                    WHERE schemaname = 'public'
                LOOP
                    EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(sequence_record.sequencename) || ' CASCADE;';
                END LOOP;
            END \$\$;
        "
        echo "✓ Database reset completed"
        echo "Restart the backend to recreate tables"
    else
        echo "Operation cancelled"
    fi
}

# Function to create admin user
create_admin() {
    if ! test_backend_connection; then
        return 1
    fi
    
    echo "=== Create Admin User ==="
    echo
    
    # Get username
    while true; do
        read -p "Username: " username
        if [ ! -z "$username" ]; then
            break
        else
            echo "Username cannot be empty"
        fi
    done
    
    # Get email
    while true; do
        read -p "Email: " email
        if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        else
            echo "Please enter a valid email address"
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
                echo "Passwords do not match"
            fi
        else
            echo "Password must be at least 6 characters"
        fi
    done
    
    # Get full name
    while true; do
        read -p "Full Name: " fullname
        if [ ! -z "$fullname" ]; then
            break
        else
            echo "Full name cannot be empty"
        fi
    done
    
    # Get birth date
    while true; do
        read -p "Birth Date (YYYY-MM-DD): " birth
        if [[ $birth =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
            break
        else
            echo "Please enter date in YYYY-MM-DD format"
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
            *) echo "Please select 1, 2, or 3";;
        esac
    done
    
    echo
    echo "Creating admin user..."
    
    # Create JSON payload and call API
    response=$(curl -s -w "%{http_code}" -X POST "$BACKEND_URL/api/auth/create-first-admin" \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"fullName\": \"$fullname\",
            \"birth\": \"$birth\",
            \"gender\": \"$gender\"
        }")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✓ Admin user created successfully!"
        echo "Username: $username"
        echo "Email: $email"
        echo "Role: ADMIN"
    else
        echo "✗ Failed to create admin user"
        echo "HTTP Code: $http_code"
        if [ ! -z "$response_body" ]; then
            echo "Error: $response_body"
        fi
    fi
}

# Function to run custom SQL
run_custom_sql() {
    echo "=== Custom SQL Query ==="
    echo "Enter your SQL query:"
    echo "Example: SELECT * FROM users LIMIT 5;"
    echo
    
    read -p "SQL> " sql_query
    
    if [ ! -z "$sql_query" ]; then
        echo "Executing query..."
        export PGPASSWORD="$DB_PASSWORD"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql_query"
    else
        echo "No query entered"
    fi
}

# Main menu
show_menu() {
    echo "=== Main Menu ==="
    echo "1) Test Connections (DB + Backend)"
    echo "2) Show Database Info"
    echo "3) Show Users"
    echo "4) Show Statistics"
    echo "5) Create Admin User"
    echo "6) Backup Database"
    echo "7) Clear All Data"
    echo "8) Reset Database"
    echo "9) Run Custom SQL"
    echo "0) Exit"
    echo
}

# Main function
main() {
    # Test database connection first
    if ! test_db_connection; then
        echo "Database connection failed. Please check your connection."
        exit 1
    fi
    
    while true; do
        echo
        show_menu
        read -p "Select an option (0-9): " choice
        echo
        
        case $choice in
            1) 
                test_db_connection
                test_backend_connection
                ;;
            2) show_db_info ;;
            3) show_users ;;
            4) show_statistics ;;
            5) create_admin ;;
            6) backup_database ;;
            7) clear_data ;;
            8) reset_database ;;
            9) run_custom_sql ;;
            0) 
                echo "Goodbye!"
                exit 0
                ;;
            *)
                echo "Invalid option. Please try again."
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
    done
}

# Check dependencies
if ! command -v psql &> /dev/null; then
    echo "Error: psql (PostgreSQL client) is not installed."
    echo "Please install: brew install postgresql"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed."
    exit 1
fi

# Run main function
main 