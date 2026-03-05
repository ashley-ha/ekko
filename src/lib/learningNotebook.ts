import { supabase } from './supabase';
import type { NotebookEntry } from '../store/useAppStore';

export interface LearningStats {
  totalPhrases: number;
  memorizedPhrases: number;
  needsWorkPhrases: number;
  unfamiliarPhrases: number;
  averageMasteryScore: number;
  totalPracticeSessions: number;
  currentStreak: number;
  masteryPercentage: number;
}

// Transform database row to NotebookEntry
const transformDbRowToEntry = (row: any): NotebookEntry => ({
  id: row.id,
  videoId: row.video_id,
  videoTitle: row.video_title,
  videoChannel: row.video_channel,
  segmentIndex: row.segment_index,
  text: row.segment_text,
  start: row.segment_start,
  end: row.segment_end,
  status: row.status,
  difficultyRating: row.difficulty_rating,
  personalNotes: row.personal_notes,
  practiceCount: row.practice_count,
  lastPracticed: row.last_practiced ? new Date(row.last_practiced) : undefined,
  masteryScore: row.mastery_score,
  streakDays: row.streak_days,
  timesReviewed: row.times_reviewed,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Transform NotebookEntry to database row
const transformEntryToDbRow = (entry: NotebookEntry) => ({
  video_id: entry.videoId,
  video_title: entry.videoTitle,
  video_channel: entry.videoChannel,
  segment_index: entry.segmentIndex,
  segment_text: entry.text,
  segment_start: entry.start,
  segment_end: entry.end,
  status: entry.status,
  difficulty_rating: entry.difficultyRating,
  personal_notes: entry.personalNotes,
  practice_count: entry.practiceCount || 0,
  last_practiced: entry.lastPracticed?.toISOString(),
  mastery_score: entry.masteryScore || 0,
  streak_days: entry.streakDays || 0,
  times_reviewed: entry.timesReviewed || 0,
});

export const learningNotebookService = {
  // Get all notebook entries for the current user
  async getAllEntries(): Promise<{ data: NotebookEntry[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('learning_notebook')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notebook entries:', error);
        return { data: [], error: error.message };
      }

      const entries = data?.map(transformDbRowToEntry) || [];
      return { data: entries, error: null };
    } catch (err) {
      console.error('Unexpected error fetching notebook entries:', err);
      return { data: [], error: 'An unexpected error occurred' };
    }
  },

  // Add a new entry to the notebook
  async addEntry(entry: Omit<NotebookEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: NotebookEntry | null; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: 'User not authenticated' };
      }

      const dbRow = {
        user_id: user.user.id,
        ...transformEntryToDbRow(entry),
      };

      const { data, error } = await supabase
        .from('learning_notebook')
        .insert(dbRow)
        .select()
        .single();

      if (error) {
        console.error('Error adding notebook entry:', error);
        return { data: null, error: error.message };
      }

      return { data: transformDbRowToEntry(data), error: null };
    } catch (err) {
      console.error('Unexpected error adding notebook entry:', err);
      return { data: null, error: 'An unexpected error occurred' };
    }
  },

  // Update an existing entry
  async updateEntry(id: string, updates: Partial<NotebookEntry>): Promise<{ data: NotebookEntry | null; error: string | null }> {
    try {
      const dbUpdates = transformEntryToDbRow(updates as NotebookEntry);
      
      const { data, error } = await supabase
        .from('learning_notebook')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating notebook entry:', error);
        return { data: null, error: error.message };
      }

      return { data: transformDbRowToEntry(data), error: null };
    } catch (err) {
      console.error('Unexpected error updating notebook entry:', err);
      return { data: null, error: 'An unexpected error occurred' };
    }
  },

  // Update entry status
  async updateStatus(videoId: string, segmentIndex: number, status: NotebookEntry['status']): Promise<{ success: boolean; error: string | null }> {
    try {
      // First get the current practice count
      const { data: currentEntry } = await supabase
        .from('learning_notebook')
        .select('practice_count')
        .eq('video_id', videoId)
        .eq('segment_index', segmentIndex)
        .single();

      const { error } = await supabase
        .from('learning_notebook')
        .update({ 
          status,
          updated_at: new Date().toISOString(),
          last_practiced: status !== 'unfamiliar' ? new Date().toISOString() : undefined,
          practice_count: (currentEntry?.practice_count || 0) + 1
        })
        .eq('video_id', videoId)
        .eq('segment_index', segmentIndex);

      if (error) {
        console.error('Error updating entry status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Unexpected error updating entry status:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  // Delete an entry
  async deleteEntry(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('learning_notebook')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notebook entry:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Unexpected error deleting notebook entry:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  // Get learning statistics
  async getLearningStats(): Promise<{ data: LearningStats | null; error: string | null }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .rpc('get_learning_stats', { user_uuid: user.user.id });

      if (error) {
        console.error('Error fetching learning stats:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        // Return default stats if no data
        return { 
          data: {
            totalPhrases: 0,
            memorizedPhrases: 0,
            needsWorkPhrases: 0,
            unfamiliarPhrases: 0,
            averageMasteryScore: 0,
            totalPracticeSessions: 0,
            currentStreak: 0,
            masteryPercentage: 0,
          }, 
          error: null 
        };
      }

      const stats = data[0];
      return { 
        data: {
          totalPhrases: stats.total_phrases,
          memorizedPhrases: stats.memorized_phrases,
          needsWorkPhrases: stats.needs_work_phrases,
          unfamiliarPhrases: stats.unfamiliar_phrases,
          averageMasteryScore: stats.average_mastery_score,
          totalPracticeSessions: stats.total_practice_sessions,
          currentStreak: stats.current_streak,
          masteryPercentage: stats.mastery_percentage,
        }, 
        error: null 
      };
    } catch (err) {
      console.error('Unexpected error fetching learning stats:', err);
      return { data: null, error: 'An unexpected error occurred' };
    }
  },

  // Check if a segment exists in the notebook
  async isSegmentInNotebook(videoId: string, segmentIndex: number): Promise<{ exists: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('learning_notebook')
        .select('id')
        .eq('video_id', videoId)
        .eq('segment_index', segmentIndex)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking segment in notebook:', error);
        return { exists: false, error: error.message };
      }

      return { exists: !!data, error: null };
    } catch (err) {
      console.error('Unexpected error checking segment in notebook:', err);
      return { exists: false, error: 'An unexpected error occurred' };
    }
  },
}; 