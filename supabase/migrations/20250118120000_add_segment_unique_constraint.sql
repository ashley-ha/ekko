-- Add unique constraint to shadowing_segment_attempts table
-- This allows for proper upsert functionality when saving segment attempts

ALTER TABLE shadowing_segment_attempts 
ADD CONSTRAINT unique_session_segment 
UNIQUE (session_id, segment_index); 