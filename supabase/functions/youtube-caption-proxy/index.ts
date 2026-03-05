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
    const { videoId } = await req.json();

    // Method 1: Try YouTube's timedtext API directly
    const languages = ['ko', 'ko-KR', 'en', 'en-US'];

    for (const lang of languages) {
      try {
        // YouTube's caption API endpoint
        const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=json3`;

        const response = await fetch(captionUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();

          if (data.events && data.events.length > 0) {
            const segments = data.events
              .filter((event: any) => event.segs && event.segs.length > 0)
              .map((event: any) => {
                const text = event.segs
                  .map((seg: any) => seg.utf8 || '')
                  .join('');
                return {
                  text: text.trim(),
                  start: (event.tStartMs || 0) / 1000,
                  end:
                    ((event.tStartMs || 0) + (event.dDurationMs || 2000)) /
                    1000,
                  confidence: 0.95,
                  hasAudio: true,
                };
              })
              .filter((seg: any) => seg.text.length > 0);

            if (segments.length > 0) {
              return new Response(
                JSON.stringify({
                  success: true,
                  segments,
                  language: lang,
                  method: 'youtube_timedtext',
                }),
                {
                  headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                  },
                }
              );
            }
          }
        }
      } catch (error) {
        console.error(`Failed to get captions for language ${lang}:`, error);
      }
    }

    // Method 2: Try parsing from video page
    try {
      const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const pageResponse = await fetch(videoPageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (pageResponse.ok) {
        const html = await pageResponse.text();

        // Look for caption tracks in the page data
        const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
        if (captionMatch) {
          const captionTracks = JSON.parse(captionMatch[1]);

          // Find Korean or any available caption track
          const track =
            captionTracks.find(
              (t: any) => t.languageCode === 'ko' || t.languageCode === 'ko-KR'
            ) || captionTracks[0];

          if (track?.baseUrl) {
            const captionResponse = await fetch(track.baseUrl);
            if (captionResponse.ok) {
              const captionXml = await captionResponse.text();

              // Parse XML captions
              const segments = parseXmlCaptions(captionXml);

              if (segments.length > 0) {
                return new Response(
                  JSON.stringify({
                    success: true,
                    segments,
                    language: track.languageCode,
                    method: 'youtube_page_parse',
                  }),
                  {
                    headers: {
                      ...corsHeaders,
                      'Content-Type': 'application/json',
                    },
                  }
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse video page:', error);
    }

    // If all methods fail
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No captions found for this video',
        suggestions: [
          'Try a video with manually added captions',
          'Use videos from educational channels (TTMIK, Korean Unnie)',
          'Check if the video has CC button enabled',
        ],
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseXmlCaptions(xml: string) {
  const segments = [];
  const textRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>(.*?)<\/text>/g;

  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    const text = match[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, ''); // Remove any XML tags

    if (text.trim()) {
      segments.push({
        text: text.trim(),
        start: start,
        end: start + duration,
        confidence: 0.95,
        hasAudio: true,
      });
    }
  }

  return segments;
}
