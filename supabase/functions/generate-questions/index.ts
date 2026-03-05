import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Dynamic CORS headers based on request origin
function getCorsHeaders(origin: string) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://www.learnwithekko.com',
    'https://learnwithekko.com',
    'https://youtube.com*',
    'https://youtu.be*',
  ];

  const corsHeaders = {
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods': 'post, options',
  };

  // Allow requests from our web app domains and ALL chrome extensions
  if (allowedOrigins.includes(origin) || origin.startsWith('chrome-extension://')) {
    corsHeaders['access-control-allow-origin'] = origin;
  } else {
    // Fallback for other origins
    corsHeaders['access-control-allow-origin'] = '*';
  }

  return corsHeaders;
}

// Helper to create a consistent json response
function createJsonResponse(body: any, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
    },
  });
}

// Get transcript from database
async function getTranscriptFromDatabase(supabase: any, videoId: string) {
  try {
    const { data, error } = await supabase
      .from('video_transcripts')
      .select('transcript_data, title, channel')
      .eq('video_id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, transcript doesn't exist
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting transcript from database:', error);
    return null;
  }
}

// Generate questions using OpenAI
async function generateQuestionsWithOpenAI(transcript: any[], videoTitle: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  // Convert transcript to text
  const transcriptText = transcript
    .map(segment => segment.text)
    .join(' ')
    .trim();

  // Truncate transcript if it's too long (max ~8000 characters to stay within token limits)
  const maxTranscriptLength = 8000;
  const truncatedTranscript = transcriptText.length > maxTranscriptLength 
    ? transcriptText.substring(0, maxTranscriptLength) + '...'
    : transcriptText;

  console.log(`Transcript length: ${transcriptText.length}, truncated: ${truncatedTranscript.length}`);

  const prompt = `Based on the following YouTube video transcript and title, generate 5 engaging comprehension questions IN KOREAN that test understanding of the content. This is for Korean language learners who want to practice speaking Korean.

Video Title: ${videoTitle}

Transcript: ${truncatedTranscript}

Requirements:
- Generate ALL questions in Korean (한국어)
- Questions should be varied in difficulty (2 easy, 2 medium, 1 hard)
- Focus on key concepts, main ideas, and important details from the video
- Avoid questions that require external knowledge not in the transcript
- Make questions conversational and natural for speaking practice
- Use polite Korean speech level (존댓말)
- Each question should encourage the user to speak in Korean
- Expected answers should also be in Korean

Return your response as a JSON array where each question is an object with:
- "question": the question text in Korean
- "difficulty": "easy", "medium", or "hard"
- "expectedAnswer": a brief sample answer in Korean based on the transcript

Example format:
[
  {
    "question": "이 비디오의 주요 주제는 무엇인가요?",
    "difficulty": "easy",
    "expectedAnswer": "비디오의 주요 주제는..."
  }
]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert language learning assistant that creates comprehension questions based on video transcripts. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response - handle markdown code blocks
    try {
      let jsonContent = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```\s*$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
      }
      
      const questions = JSON.parse(jsonContent);
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      return questions;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      console.error('Parse error:', parseError);
      throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}. Content: ${content.substring(0, 200)}...`);
    }

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// Main handler
serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const corsHeaders = getCorsHeaders(origin);
  
  console.log(`Request from origin: ${origin}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }
  
  try {
    const { videoId } = await req.json();
    
    if (!videoId) {
      return createJsonResponse(
        {
          error: 'Missing videoId parameter in request body',
          success: false,
        },
        400,
        corsHeaders
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get transcript from database
    console.log(`Getting transcript for video ${videoId}`);
    const transcriptData = await getTranscriptFromDatabase(supabase, videoId);

    if (!transcriptData) {
      return createJsonResponse(
        {
          error: 'Transcript not found for this video. Please generate transcript first.',
          success: false,
        },
        404,
        corsHeaders
      );
    }

    // Generate questions using the transcript
    console.log('Generating questions with OpenAI');
    const questions = await generateQuestionsWithOpenAI(
      transcriptData.transcript_data,
      transcriptData.title || 'Video Content'
    );

    console.log(`Generated ${questions.length} questions`);
    
    return createJsonResponse(
      {
        questions,
        videoInfo: {
          title: transcriptData.title,
          channel: transcriptData.channel,
          videoId: videoId,
        },
        success: true,
      },
      200,
      corsHeaders
    );

  } catch (error) {
    console.error('Error in generate-questions function:', error);
    return createJsonResponse(
      {
        error: error.message || 'An internal server error occurred',
        success: false,
      },
      500,
      corsHeaders
    );
  }
});