import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

// Translate text using OpenAI
async function translateWithOpenAI(text: string, fromLang: string, toLang: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  const prompt = `Translate the following text from ${fromLang} to ${toLang}. Provide only the translation without any additional text or explanations.

Text to translate: ${text}

Translation:`;

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
            content: `You are a professional translator. Translate text accurately and naturally between ${fromLang} and ${toLang}. Provide only the translated text, no explanations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0]?.message?.content?.trim();
    
    if (!translatedText) {
      throw new Error('No translation received from OpenAI');
    }

    return translatedText;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

// Main handler
serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const corsHeaders = getCorsHeaders(origin);
  
  console.log(`Translation request from origin: ${origin}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }
  
  try {
    const { text, fromLang, toLang } = await req.json();
    
    if (!text || !fromLang || !toLang) {
      return createJsonResponse(
        {
          error: 'Missing required parameters: text, fromLang, and toLang are required',
          success: false,
        },
        400,
        corsHeaders
      );
    }

    console.log(`Translating from ${fromLang} to ${toLang}: ${text.substring(0, 50)}...`);
    
    const translatedText = await translateWithOpenAI(text, fromLang, toLang);

    console.log(`Translation completed: ${translatedText.substring(0, 50)}...`);
    
    return createJsonResponse(
      {
        translatedText,
        originalText: text,
        fromLang,
        toLang,
        success: true,
      },
      200,
      corsHeaders
    );

  } catch (error) {
    console.error('Error in translate-text function:', error);
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