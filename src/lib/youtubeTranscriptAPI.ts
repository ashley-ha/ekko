// src/lib/youtubeTranscriptAPI.ts
//
// this file is your frontend's dedicated "api client" for youtube features.
// it now calls your reliable supabase function instead of the unstable external proxy.

import { supabase } from './supabase';

export interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
}

// utility to extract the video id from various youtube url formats.
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
    /youtube\.com\/shorts\/([^&?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Transform the transcript data to match expected format
const transformTranscript = (rawTranscript: any[]): TranscriptSegment[] => {
  return rawTranscript.map((item: any) => ({
    text: item.text,
    start: typeof item.offset === 'number' ? item.offset : item.start || 0,
    end:
      typeof item.offset === 'number' && typeof item.duration === 'number'
        ? item.offset + item.duration
        : item.end || (item.start || 0) + 5,
  }));
};

// fetches the transcript by calling your own supabase edge function.
export async function fetchYouTubeTranscript(videoId: string): Promise<{
  transcript: TranscriptSegment[];
  error?: string;
  cached?: boolean;
  videoInfo?: {
    title: string;
    channel: string;
    videoId: string;
  };
  languageCode?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'youtube-transcript',
      {
        body: { videoId },
      }
    );

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(
        error.message || 'failed to fetch transcript from the server.'
      );
    }

    if (!data) {
      throw new Error('No data received from the server.');
    }

    // Handle the case where no transcript was found but the function succeeded
    if (!data.success && data.method === 'failed') {
      return {
        transcript: [],
        error:
          data.error ||
          'No transcript available for this video. Please try a video with captions or use a different video.',
      };
    }

    if (!data.success) {
      throw new Error(
        data?.error || 'failed to fetch transcript from the server.'
      );
    }

    // Transform transcript data to expected format
    const rawTranscript = data.transcript || [];
    const transformedTranscript = transformTranscript(rawTranscript);

    console.log('Raw transcript sample:', rawTranscript.slice(0, 2));
    console.log(
      'Transformed transcript sample:',
      transformedTranscript.slice(0, 2)
    );

    return {
      transcript: transformedTranscript,
      cached: data.cached || false,
      videoInfo: data.videoInfo,
      languageCode: data.languageCode,
    };
  } catch (error) {
    console.error('error in fetchyoutubetranscript:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'an unknown error occurred.';
    return {
      transcript: [],
      error: errorMessage,
    };
  }
}

// combines individual transcript lines into more manageable sentence-based segments.
export function processTranscriptIntoSentences(
  transcript: TranscriptSegment[],
  sentencesPerSegment: number = 1,
  minSegmentDuration: number = 5.0 // Minimum 5 seconds per segment
): TranscriptSegment[] {
  if (!transcript || transcript.length === 0) return [];

  console.log('Processing transcript with', transcript.length, 'segments');
  console.log('Raw transcript sample:', transcript.slice(0, 2));
  console.log(`Min segment duration: ${minSegmentDuration}s, Sentences per segment: ${sentencesPerSegment}`);

  // First, filter out invalid segments
  const validSegments = transcript.filter(
    (segment) =>
      typeof segment.start === 'number' &&
      typeof segment.end === 'number' &&
      segment.text?.trim()
  );

  if (validSegments.length === 0) return [];

  const processedSegments: TranscriptSegment[] = [];
  let currentGroup: TranscriptSegment[] = [];
  let currentGroupStart: number | null = null;
  let currentGroupEnd: number | null = null;
  let currentGroupText: string[] = [];

  for (let i = 0; i < validSegments.length; i++) {
    const segment = validSegments[i];
    
    // Initialize the first group
    if (currentGroupStart === null) {
      currentGroupStart = segment.start;
      currentGroupEnd = segment.end;
      currentGroup = [segment];
      currentGroupText = [segment.text.trim()];
      continue;
    }

    // Calculate current group duration
    const currentDuration = currentGroupEnd! - currentGroupStart!;
    
    // Check if we should add this segment to the current group
    const shouldAddToGroup = 
      currentDuration < minSegmentDuration || // Group is too short
      currentGroup.length < sentencesPerSegment || // Haven't reached target sentences
      (!segment.text.match(/[.!?]$/) && currentDuration < minSegmentDuration * 1.5); // Incomplete sentence and not too long

    if (shouldAddToGroup) {
      // Add to current group
      currentGroup.push(segment);
      currentGroupEnd = segment.end;
      currentGroupText.push(segment.text.trim());
    } else {
      // Finalize current group and start a new one
      const combinedText = currentGroupText.join(' ').trim();
      
      // Only create segment if it has meaningful content
      if (combinedText.length > 0) {
        processedSegments.push({
          text: combinedText,
          start: currentGroupStart!,
          end: currentGroupEnd!,
        });
      }

      // Start new group
      currentGroupStart = segment.start;
      currentGroupEnd = segment.end;
      currentGroup = [segment];
      currentGroupText = [segment.text.trim()];
    }
  }

  // Don't forget the last group
  if (currentGroupStart !== null && currentGroupText.length > 0) {
    const combinedText = currentGroupText.join(' ').trim();
    if (combinedText.length > 0) {
      processedSegments.push({
        text: combinedText,
        start: currentGroupStart,
        end: currentGroupEnd!,
      });
    }
  }

  // Post-process: merge very short segments with adjacent ones
  const finalSegments: TranscriptSegment[] = [];
  
  for (let i = 0; i < processedSegments.length; i++) {
    const segment = processedSegments[i];
    const duration = segment.end - segment.start;
    
    // If segment is still too short and we can merge with the next one
    if (duration < minSegmentDuration && i < processedSegments.length - 1) {
      const nextSegment = processedSegments[i + 1];
      const mergedSegment = {
        text: `${segment.text} ${nextSegment.text}`.trim(),
        start: segment.start,
        end: nextSegment.end,
      };
      
      // Skip the next segment since we're merging it
      i++;
      finalSegments.push(mergedSegment);
    } else {
      finalSegments.push(segment);
    }
  }

  console.log(`Created ${finalSegments.length} optimized segments`);
  console.log('Sample processed segment:', finalSegments[0]);
  
  // Log duration statistics
  const durations = finalSegments.map(s => s.end - s.start);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  
  console.log(`Segment duration stats - Min: ${minDuration.toFixed(1)}s, Avg: ${avgDuration.toFixed(1)}s, Max: ${maxDuration.toFixed(1)}s`);

  return finalSegments;
}

// translate text using OpenAI (more reliable than free translation APIs)
export async function translateText(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string> {
  try {
    // Use Supabase edge function for translation using OpenAI
    const { supabase } = await import('./supabase');
    
    const targetLanguage = toLang === 'en' ? 'English' : toLang === 'ko' ? 'Korean' : toLang;
    const sourceLanguage = fromLang === 'en' ? 'English' : fromLang === 'ko' ? 'Korean' : fromLang;
    
    const { data, error } = await supabase.functions.invoke('translate-text', {
      body: {
        text,
        fromLang: sourceLanguage,
        toLang: targetLanguage,
      },
    });

    if (error || !data.success) {
      throw new Error(data?.error || error?.message || 'Translation failed');
    }

    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback: Simple language mapping for common phrases
    if (text.length < 100) {
      const simpleTranslations: { [key: string]: string } = {
        // Korean to English common phrases
        '안녕하세요': 'Hello',
        '감사합니다': 'Thank you',
        '죄송합니다': 'Sorry',
        '네': 'Yes',
        '아니요': 'No',
        // Add more as needed
      };
      
      if (fromLang === 'ko' && toLang === 'en' && simpleTranslations[text.trim()]) {
        return simpleTranslations[text.trim()];
      }
    }
    
    // Ultimate fallback: return original text with a note
    return `[Translation unavailable] ${text}`;
  }
}
