-- Add shadowing_repetitions column to existing user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS shadowing_repetitions INTEGER DEFAULT 75;

-- Update any existing records to have the default value
UPDATE user_preferences 
SET shadowing_repetitions = 75 
WHERE shadowing_repetitions IS NULL; 