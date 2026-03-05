import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, language = 'ko-KR', voiceId } = await req.json();

    console.log('Voice synthesis request:', {
      text: text?.substring(0, 50),
      language,
      voiceId,
    });

    // Validate input
    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ElevenLabs API integration
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({
          error: 'Voice synthesis service unavailable',
          details: 'API key not configured',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Voice configuration - using the voice IDs from your account
    const VOICE_CONFIGS = {
      'Anna Kim': 'uyVNoMrnUku1dZyVEXwD',
      'Hyun Bin': 's07IwTCOrCDCaETjUVjx',
      'Yohan Ku': '4JJwo477JUAx3HV0T7n7',
      // Add your custom voices here when you get them:
      // 'korean-female-1': 'YOUR_VOICE_ID_HERE',
      // 'korean-male-1': 'YOUR_VOICE_ID_HERE',
    };

    // Get voice ID - use provided voiceId or default
    const selectedVoiceId = voiceId as keyof typeof VOICE_CONFIGS;
    const VOICE_ID =
      VOICE_CONFIGS[selectedVoiceId] || VOICE_CONFIGS['Anna Kim'];

    console.log(`Using voice: ${voiceId || 'Anna Kim'} with ID: ${VOICE_ID}`);

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    const elevenLabsBody = {
      text: text.trim(),
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    };

    console.log('Making request to ElevenLabs API...');

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(elevenLabsBody),
    });

    console.log(`ElevenLabs response status: ${response.status}`);
    console.log(
      `ElevenLabs response headers:`,
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);

      // More specific error handling
      let errorMessage = 'Voice synthesis failed';
      if (response.status === 401) {
        errorMessage = 'Invalid API key';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request parameters';
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: `API returned ${response.status}`,
          message: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the audio data
    const audioData = await response.arrayBuffer();
    console.log(`Received audio data: ${audioData.byteLength} bytes`);

    if (audioData.byteLength === 0) {
      console.error('Received empty audio data');
      return new Response(
        JSON.stringify({
          error: 'Empty audio data received',
          details: 'ElevenLabs returned no audio content',
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Return the audio data directly as ArrayBuffer
    return new Response(audioData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
