-- Migration script to add phone column to appointments table
-- This script is safe to run multiple times

-- Add phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'appointments' 
        AND column_name = 'phone'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE appointments ADD COLUMN phone VARCHAR(20);
        
        -- Add NOT NULL constraint after adding the column
        -- First, update any existing records to have a default phone value
        UPDATE appointments SET phone = 'N/A' WHERE phone IS NULL;
        
        -- Then add the NOT NULL constraint
        ALTER TABLE appointments ALTER COLUMN phone SET NOT NULL;
        
        RAISE NOTICE 'Column phone added to appointments table';
    ELSE
        RAISE NOTICE 'Column phone already exists in appointments table';
    END IF;
END $$;

-- Verify the column exists and show table structure
\d appointments; 