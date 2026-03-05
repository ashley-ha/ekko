-- Create pronunciation_analyses table
CREATE TABLE pronunciation_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_text TEXT NOT NULL,
    user_transcript TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    rhythm_score INTEGER CHECK (rhythm_score >= 0 AND rhythm_score <= 100),
    intonation_score INTEGER CHECK (intonation_score >= 0 AND intonation_score <= 100),
    phoneme_errors JSONB DEFAULT '[]',
    feedback TEXT,
    detailed_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create high_frequency_phrases table
CREATE TABLE high_frequency_phrases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phrase TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    contexts JSONB DEFAULT '[]',
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
    category TEXT,
    usage TEXT,
    translation TEXT,
    next_review TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 day',
    repetitions INTEGER DEFAULT 0,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shadowing_sessions table
CREATE TABLE shadowing_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    video_id TEXT NOT NULL,
    transcript JSONB,
    total_segments INTEGER DEFAULT 0,
    completed_segments INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    total_repetitions INTEGER DEFAULT 0,
    session_duration INTEGER, -- in seconds
    extracted_phrases_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shadowing_segment_attempts table
CREATE TABLE shadowing_segment_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES shadowing_sessions(id) ON DELETE CASCADE,
    segment_index INTEGER NOT NULL,
    segment_text TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    best_score INTEGER CHECK (best_score >= 0 AND best_score <= 100),
    latest_score INTEGER CHECK (latest_score >= 0 AND latest_score <= 100),
    total_time_spent INTEGER DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create practice_sessions table (for spaced repetition tracking)
CREATE TABLE practice_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_url TEXT,
    start_time DECIMAL(10,3),
    end_time DECIMAL(10,3),
    pronunciation_score INTEGER CHECK (pronunciation_score >= 0 AND pronunciation_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_pronunciation_analyses_user_id ON pronunciation_analyses(user_id);
CREATE INDEX idx_pronunciation_analyses_created_at ON pronunciation_analyses(created_at);

CREATE INDEX idx_high_frequency_phrases_user_id ON high_frequency_phrases(user_id);
CREATE INDEX idx_high_frequency_phrases_next_review ON high_frequency_phrases(next_review);
CREATE INDEX idx_high_frequency_phrases_phrase ON high_frequency_phrases(phrase);

CREATE INDEX idx_shadowing_sessions_user_id ON shadowing_sessions(user_id);
CREATE INDEX idx_shadowing_sessions_video_id ON shadowing_sessions(video_id);
CREATE INDEX idx_shadowing_sessions_created_at ON shadowing_sessions(created_at);

CREATE INDEX idx_shadowing_segment_attempts_session_id ON shadowing_segment_attempts(session_id);
CREATE INDEX idx_shadowing_segment_attempts_segment_index ON shadowing_segment_attempts(segment_index);

CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_created_at ON practice_sessions(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE pronunciation_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE high_frequency_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadowing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadowing_segment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for pronunciation_analyses
CREATE POLICY "Users can view their own pronunciation analyses" ON pronunciation_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pronunciation analyses" ON pronunciation_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for high_frequency_phrases
CREATE POLICY "Users can view their own phrases" ON high_frequency_phrases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phrases" ON high_frequency_phrases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phrases" ON high_frequency_phrases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own phrases" ON high_frequency_phrases
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for shadowing_sessions
CREATE POLICY "Users can view their own shadowing sessions" ON shadowing_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shadowing sessions" ON shadowing_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shadowing sessions" ON shadowing_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for shadowing_segment_attempts
CREATE POLICY "Users can view their own segment attempts" ON shadowing_segment_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM shadowing_sessions 
            WHERE shadowing_sessions.id = shadowing_segment_attempts.session_id 
            AND shadowing_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own segment attempts" ON shadowing_segment_attempts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM shadowing_sessions 
            WHERE shadowing_sessions.id = shadowing_segment_attempts.session_id 
            AND shadowing_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own segment attempts" ON shadowing_segment_attempts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM shadowing_sessions 
            WHERE shadowing_sessions.id = shadowing_segment_attempts.session_id 
            AND shadowing_sessions.user_id = auth.uid()
        )
    );

-- Policies for practice_sessions
CREATE POLICY "Users can view their own practice sessions" ON practice_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions" ON practice_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_high_frequency_phrases_updated_at 
    BEFORE UPDATE ON high_frequency_phrases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shadowing_sessions_updated_at 
    BEFORE UPDATE ON shadowing_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shadowing_segment_attempts_updated_at 
    BEFORE UPDATE ON shadowing_segment_attempts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 