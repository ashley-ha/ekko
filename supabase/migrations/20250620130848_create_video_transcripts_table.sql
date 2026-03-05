-- Create video_transcripts table for caching transcript data
CREATE TABLE video_transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id TEXT NOT NULL UNIQUE,
    title TEXT,
    channel TEXT,
    language_code TEXT DEFAULT 'ko',
    transcript_data JSONB NOT NULL,
    api_source TEXT DEFAULT 'poix',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for fast video ID lookups
CREATE INDEX idx_video_transcripts_video_id ON video_transcripts(video_id);
CREATE INDEX idx_video_transcripts_language ON video_transcripts(language_code);
CREATE INDEX idx_video_transcripts_created_at ON video_transcripts(created_at);

-- Add a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_video_transcripts_updated_at 
    BEFORE UPDATE ON video_transcripts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();