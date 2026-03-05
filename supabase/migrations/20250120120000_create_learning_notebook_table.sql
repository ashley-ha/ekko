-- Create learning_notebook table
CREATE TABLE learning_notebook (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    video_title TEXT,
    video_channel TEXT,
    segment_index INTEGER NOT NULL,
    segment_text TEXT NOT NULL,
    segment_start DECIMAL(10,3) NOT NULL,
    segment_end DECIMAL(10,3) NOT NULL,
    status TEXT DEFAULT 'unfamiliar' CHECK (status IN ('unfamiliar', 'needs_work', 'memorized')),
    difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
    personal_notes TEXT,
    practice_count INTEGER DEFAULT 0,
    last_practiced TIMESTAMP WITH TIME ZONE,
    mastery_score INTEGER DEFAULT 0 CHECK (mastery_score >= 0 AND mastery_score <= 100),
    streak_days INTEGER DEFAULT 0,
    times_reviewed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, video_id, segment_index)
);

-- Create indexes for better performance
CREATE INDEX idx_learning_notebook_user_id ON learning_notebook(user_id);
CREATE INDEX idx_learning_notebook_status ON learning_notebook(status);
CREATE INDEX idx_learning_notebook_video_id ON learning_notebook(video_id);
CREATE INDEX idx_learning_notebook_last_practiced ON learning_notebook(last_practiced);
CREATE INDEX idx_learning_notebook_mastery_score ON learning_notebook(mastery_score);
CREATE INDEX idx_learning_notebook_created_at ON learning_notebook(created_at);

-- Enable RLS
ALTER TABLE learning_notebook ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notebook entries" ON learning_notebook
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notebook entries" ON learning_notebook
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebook entries" ON learning_notebook
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebook entries" ON learning_notebook
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_notebook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_learning_notebook_updated_at_trigger
    BEFORE UPDATE ON learning_notebook
    FOR EACH ROW
    EXECUTE FUNCTION update_learning_notebook_updated_at();

-- Create function to calculate learning stats
CREATE OR REPLACE FUNCTION get_learning_stats(user_uuid UUID)
RETURNS TABLE (
    total_phrases INTEGER,
    memorized_phrases INTEGER,
    needs_work_phrases INTEGER,
    unfamiliar_phrases INTEGER,
    average_mastery_score DECIMAL(5,2),
    total_practice_sessions INTEGER,
    current_streak INTEGER,
    mastery_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_phrases,
        COUNT(CASE WHEN status = 'memorized' THEN 1 END)::INTEGER as memorized_phrases,
        COUNT(CASE WHEN status = 'needs_work' THEN 1 END)::INTEGER as needs_work_phrases,
        COUNT(CASE WHEN status = 'unfamiliar' THEN 1 END)::INTEGER as unfamiliar_phrases,
        COALESCE(AVG(mastery_score), 0)::DECIMAL(5,2) as average_mastery_score,
        COALESCE(SUM(practice_count), 0)::INTEGER as total_practice_sessions,
        COALESCE(MAX(streak_days), 0)::INTEGER as current_streak,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN status = 'memorized' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100)::DECIMAL(5,2)
            ELSE 0::DECIMAL(5,2)
        END as mastery_percentage
    FROM learning_notebook 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 