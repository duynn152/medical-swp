#!/bin/bash

# Script to fix phone column in appointments table
# This script will help resolve the issue where phone data is not being saved

echo "🔧 Fixing phone column in appointments table..."

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client not found. Please install postgresql-client:"
    echo "   - macOS: brew install postgresql"
    echo "   - Ubuntu: sudo apt-get install postgresql-client"
    echo "   - Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Database connection details (from application.yml)
DB_HOST=${DB_HOST:-"dpg-d1dqqlbipnbc73djckq0-a.oregon-postgres.render.com"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"florism_db"}
DB_USER=${DB_USER:-"florism_db_user"}
DB_PASSWORD=${DB_PASSWORD:-"kZ2vDOaXY9OK8rOw0KXVQy7k3Eel6iNp"}

echo "📊 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"

# Run the migration script
echo "🚀 Running phone column migration..."
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "../add_phone_column.sql"

if [ $? -eq 0 ]; then
    echo "✅ Phone column migration completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Restart your Spring Boot application"
    echo "2. Test creating a new appointment with phone number"
    echo "3. Verify that phone numbers are being saved correctly"
else
    echo "❌ Migration failed. Please check the error messages above."
    echo ""
    echo "🔍 Troubleshooting:"
    echo "1. Verify database connection details"
    echo "2. Check if you have permission to modify the database"
    echo "3. Ensure the database is accessible"
fi 