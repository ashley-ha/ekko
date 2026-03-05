-- Verify your Supabase database has these tables with proper structure

-- Check shadowing_sessions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shadowing_sessions'
ORDER BY ordinal_position;

-- Check shadowing_segment_attempts table  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shadowing_segment_attempts'
ORDER BY ordinal_position;

-- Check for unique constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    string_agg(kcu.column_name, ', ') as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_name IN ('shadowing_sessions', 'shadowing_segment_attempts')
GROUP BY tc.constraint_name, tc.table_name;

-- Sample query to check saved progress
SELECT 
    s.video_id,
    s.total_segments,
    COUNT(DISTINCT sa.segment_index) as segments_practiced,
    SUM(sa.attempt_count) as total_attempts,
    MAX(sa.updated_at) as last_practice
FROM shadowing_sessions s
LEFT JOIN shadowing_segment_attempts sa ON s.id = sa.session_id
WHERE s.user_id = auth.uid()
GROUP BY s.id, s.video_id, s.total_segments
ORDER BY MAX(sa.updated_at) DESC
LIMIT 10;