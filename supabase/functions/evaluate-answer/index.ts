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
      .select('transcript_data')
      .eq('video_id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data.transcript_data;
  } catch (error) {
    console.error('Error getting transcript from database:', error);
    return null;
  }
}


// Evaluate answer using OpenAI
async function evaluateAnswerWithOpenAI(
  question: string,
  userAnswer: string,
  transcript: any[],
  expectedAnswer?: string
) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  // Convert transcript to text for context
  const transcriptText = transcript
    .map(segment => segment.text)
    .join(' ')
    .trim();

  const prompt = `You are a Korean language tutor evaluating a Korean language learner's spoken answer to a comprehension question. The student is practicing speaking Korean based on a Korean video transcript.

Question (in Korean): ${question}
Student's Answer (in Korean): ${userAnswer}
${expectedAnswer ? `Expected Answer (in Korean): ${expectedAnswer}` : ''}

Video Transcript Context (Korean):
${transcriptText}

Please evaluate the student's Korean answer and provide feedback IN KOREAN. Consider:
- Is the answer factually correct based on the transcript?
- How is their Korean grammar and vocabulary usage?
- Does it demonstrate understanding of the content?
- Is it relevant to the question asked?
- Provide encouraging feedback in Korean (한국어)

Respond with a JSON object containing:
- "is_correct": boolean (true if the answer demonstrates good understanding, even if not perfect)
- "feedback": string (constructive feedback in Korean explaining why the answer is correct/incorrect and what could be improved)
- "score": number (0-100, where 100 is perfect, 80+ is good, 60+ is acceptable, below 60 needs improvement)

Example response:
{
  "is_correct": true,
  "feedback": "잘했어요! 답변이 주요 내용을 정확히 파악하고 있습니다. 문법도 자연스럽고 발음도 좋았습니다. 다음에는 조금 더 자세히 설명해보세요.",
  "score": 85
}`;

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
            content: 'You are an expert language learning tutor that provides constructive feedback on student answers. Always respond with valid JSON only. Be encouraging while providing helpful corrections and suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
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
      
      const evaluation = JSON.parse(jsonContent);
      
      // Validate the response structure
      if (typeof evaluation.is_correct !== 'boolean' || 
          typeof evaluation.feedback !== 'string' ||
          typeof evaluation.score !== 'number') {
        throw new Error('Invalid response structure from OpenAI');
      }
      
      return evaluation;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI');
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
    const { question, userAnswer, videoId, expectedAnswer } = await req.json();
    
    if (!question || !userAnswer || !videoId) {
      return createJsonResponse(
        {
          error: 'Missing required parameters: question, userAnswer, and videoId are required',
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

    // Get transcript from database for context
    console.log(`Getting transcript for video ${videoId}`);
    const transcript = await getTranscriptFromDatabase(supabase, videoId);

    if (!transcript) {
      return createJsonResponse(
        {
          error: 'Transcript not found for this video',
          success: false,
        },
        404,
        corsHeaders
      );
    }

    // Evaluate the answer using the transcript context
    console.log('Evaluating answer with OpenAI');
    const evaluation = await evaluateAnswerWithOpenAI(
      question,
      userAnswer,
      transcript,
      expectedAnswer
    );

    console.log(`Answer evaluation completed - Score: ${evaluation.score}`);
    
    return createJsonResponse(
      {
        ...evaluation,
        success: true,
      },
      200,
      corsHeaders
    );

  } catch (error) {
    console.error('Error in evaluate-answer function:', error);
    return createJsonResponse(
      {
        error: error.message || 'An internal server error occurred',
        success: false,
        is_correct: false,
        feedback: 'Sorry, there was an error evaluating your answer. Please try again.',
        score: 0,
      },
      500,
      corsHeaders
    );
  }
});