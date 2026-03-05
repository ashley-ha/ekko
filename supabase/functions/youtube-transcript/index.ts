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

// a helper to create a consistent json response
function createJsonResponse(body, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'content-type': 'application/json',
    },
  });
}
// Get basic video info from YouTube
async function getVideoInfo(videoId: string) {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/);
      const title = titleMatch
        ? titleMatch[1].replace(' - YouTube', '').trim()
        : `Video ${videoId}`;
      const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/);
      const channel = channelMatch ? channelMatch[1] : 'Unknown Channel';

      return { title, channel };
    }
    return null;
  } catch (error) {
    console.error('Failed to get video info:', error);
    return null;
  }
}
// Check if transcript exists in database
async function getTranscriptFromDatabase(supabase: any, videoId: string) {
  try {
    const { data, error } = await supabase
      .from('video_transcripts')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned, transcript doesn't exist
        return null;
      }
      throw error;
    }

    console.log(`Found cached transcript for video ${videoId}`);
    return data;
  } catch (error) {
    console.error('Error checking database for transcript:', error);
    return null;
  }
}
// Save transcript to database
async function saveTranscriptToDatabase(
  supabase: any,
  videoId: string,
  transcriptData: any,
  videoInfo: any,
  languageCode: string = 'ko'
) {
  try {
    const { data, error } = await supabase
      .from('video_transcripts')
      .upsert({
        video_id: videoId,
        title: videoInfo?.title || `Video ${videoId}`,
        channel: videoInfo?.channel || 'Unknown Channel',
        language_code: languageCode,
        transcript_data: transcriptData,
        api_source: 'poix',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving transcript to database:', error);
      return false;
    }

    console.log(
      `Successfully saved transcript for video ${videoId} to database`
    );
    return true;
  } catch (error) {
    console.error('Error in saveTranscriptToDatabase:', error);
    return false;
  }
}
// this function is specifically for the api.poix.io service
async function getTranscriptFromPoixApi(
  videoId,
  preferredLanguages = ['ko', 'en']
) {
  // 1. get the secret token for the poix api
  const apiToken = Deno.env.get('POIX_API_TOKEN');
  if (!apiToken) {
    throw new Error('poix api token is not set in supabase secrets.');
  }
  // === step 1: get the list of available caption files ===
  const listFilesUrl = `https://api.poix.io/files/captions/${videoId}`;
  console.log(`step 1: fetching available files from ${listFilesUrl}`);
  const listResponse = await fetch(listFilesUrl, {
    headers: {
      // this api uses a bearer token for authorization
      authorization: `Bearer ${apiToken}`,
    },
  });
  if (!listResponse.ok) {
    throw new Error(
      `poix api (step 1) failed with status ${listResponse.status}`
    );
  }
  const availableFiles = await listResponse.json();
  if (!availableFiles || availableFiles.length === 0) {
    throw new Error(
      'video is valid, but no caption files were found by the api.'
    );
  }
  // === step 2: find the best file and fetch its content ===
  console.log('step 2: searching for the best caption file from the list...');
  let targetFile = null;
  // look for the preferred languages, and make sure we get the 'json' format
  for (const lang of preferredLanguages) {
    targetFile = availableFiles.find(
      (file) => file.languageCode === lang && file.format === 'json'
    );
    if (targetFile) {
      console.log(`found preferred language: ${lang} in json format.`);
      break;
    }
  }
  if (!targetFile) {
    throw new Error(
      `could not find a transcript in the preferred languages (${preferredLanguages.join(
        ', '
      )}) in json format.`
    );
  }
  const transcriptUrl = targetFile.staticUrl;
  console.log(`fetching the actual transcript from: ${transcriptUrl}`);
  // now we fetch the actual content from the static url
  const transcriptResponse = await fetch(transcriptUrl, {
    headers: {
      // it's good practice to include the token here too, just in case
      authorization: `Bearer ${apiToken}`,
    },
  });
  if (!transcriptResponse.ok) {
    throw new Error(
      `poix api (step 2) failed with status ${transcriptResponse.status} when fetching the transcript content.`
    );
  }
  // the api should return the final json transcript data
  const rawTranscript = await transcriptResponse.json();

  // Transform the data to match the expected format
  console.log('Raw transcript from Poix:', rawTranscript);
  console.log('Sample raw transcript item:', rawTranscript[0]);

  let transcript;
  if (Array.isArray(rawTranscript)) {
    // Transform each item to the expected format
    transcript = rawTranscript
      .map((item: any) => {
        const start = parseFloat(
          item.offset || item.start || item.startTime || 0
        );
        const duration = parseFloat(item.duration || 5);
        const end = start + duration;

        return {
          text: item.text || item.content || '',
          start: start,
          end: end,
        };
      })
      .filter((item) => item.text && item.text.trim().length > 0);
  } else if (rawTranscript.transcript) {
    // Handle nested structure
    transcript = rawTranscript.transcript
      .map((item: any) => {
        const start = parseFloat(
          item.offset || item.start || item.startTime || 0
        );
        const duration = parseFloat(item.duration || 5);
        const end = start + duration;

        return {
          text: item.text || item.content || '',
          start: start,
          end: end,
        };
      })
      .filter((item) => item.text && item.text.trim().length > 0);
  } else {
    throw new Error('Unexpected transcript format from Poix API');
  }

  console.log('Transformed transcript:', transcript.slice(0, 3));
  return { transcript, languageCode: targetFile.languageCode };
}
// this is the main entry point for the edge function
serve(async (req) => {
  // Get the origin from the request and generate appropriate CORS headers
  const origin = req.headers.get('Origin') || '';
  const corsHeaders = getCorsHeaders(origin);
  
  console.log(`Request from origin: ${origin}`);
  console.log(`CORS headers:`, corsHeaders);

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
          error: 'missing videoId parameter in request body',
        },
        400,
        corsHeaders
      );
    }
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Check if transcript already exists in database
    console.log(
      `Checking database for existing transcript for video ${videoId}`
    );
    const existingTranscript = await getTranscriptFromDatabase(
      supabase,
      videoId
    );

    if (existingTranscript) {
      console.log(`Using cached transcript for video ${videoId}`);
      return createJsonResponse({
        transcript: existingTranscript.transcript_data,
        videoInfo: {
          title: existingTranscript.title,
          channel: existingTranscript.channel,
          videoId: videoId,
        },
        success: true,
        cached: true,
        languageCode: existingTranscript.language_code,
      }, 200, corsHeaders);
    }

    // Step 2: Get video info for metadata
    console.log(`Getting video info for ${videoId}`);
    const videoInfo = await getVideoInfo(videoId);

    // Step 3: Fetch new transcript from API
    console.log(`Fetching new transcript from API for video ${videoId}`);
    const { transcript, languageCode } = await getTranscriptFromPoixApi(
      videoId
    );

    const segmentCount = Array.isArray(transcript) ? transcript.length : 0;
    console.log(`API returned ${segmentCount} segments`);

    // Step 4: Save transcript to database for future use
    if (transcript && segmentCount > 0) {
      console.log(`Saving transcript to database for video ${videoId}`);
      await saveTranscriptToDatabase(
        supabase,
        videoId,
        transcript,
        videoInfo,
        languageCode
      );
    }

    console.log(`Process complete. Returning ${segmentCount} segments.`);
    return createJsonResponse({
      transcript,
      videoInfo: {
        title: videoInfo?.title || `Video ${videoId}`,
        channel: videoInfo?.channel || 'Unknown Channel',
        videoId: videoId,
      },
      success: true,
      cached: false,
      languageCode: languageCode,
      segmentCount: segmentCount,
    }, 200, corsHeaders);
  } catch (error) {
    console.error('An error occurred in the main handler:', error);
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
