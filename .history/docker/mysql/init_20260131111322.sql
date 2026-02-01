-- =============================================================================
-- MISSION LAUNCHPAD - MySQL Init Script
-- This runs when the container first starts
-- =============================================================================

-- Create database if not exists (just in case)
CREATE DATABASE IF NOT EXISTS mission_launchpad CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE mission_launchpad;

-- Grant privileges
GRANT ALL PRIVILEGES ON mission_launchpad.* TO 'mission_user'@'%';
FLUSH PRIVILEGES;

-- Note: Laravel migrations will create the actual tables
-- This script just ensures the database is ready
