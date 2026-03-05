#!/usr/bin/env node

// Script to fetch your ElevenLabs voices
// Usage: node scripts/get-voices.js

const https = require('https');

function getVoices() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.error('❌ ELEVENLABS_API_KEY not found in environment variables');
    console.log('💡 Make sure to set your API key:');
    console.log('   export ELEVENLABS_API_KEY=your_api_key_here');
    console.log('   or add it to your .env file');
    process.exit(1);
  }

  const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/voices',
    method: 'GET',
    headers: {
      'xi-api-key': apiKey,
    },
  };

  console.log('🎤 Fetching your ElevenLabs voices...\n');

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);

        if (response.voices) {
          console.log(
            `✅ Found ${response.voices.length} voices in your account:\n`
          );

          response.voices.forEach((voice, index) => {
            console.log(`${index + 1}. ${voice.name}`);
            console.log(`   ID: ${voice.voice_id}`);
            console.log(`   Category: ${voice.category || 'Unknown'}`);
            if (voice.description) {
              console.log(`   Description: ${voice.description}`);
            }
            if (voice.labels && Object.keys(voice.labels).length > 0) {
              console.log(`   Labels: ${JSON.stringify(voice.labels)}`);
            }
            console.log('');
          });

          console.log('📝 To use these voices in your app:');
          console.log('1. Copy the voice IDs you want to use');
          console.log(
            '2. Add them to src/lib/elevenlabsVoices.ts in the VOICE_CONFIGS object'
          );
          console.log(
            '3. Update the Supabase function voice-speak/index.ts with the new voice ID'
          );
          console.log('\n🔧 Example configuration:');
          console.log(`'my-voice': {
  voice_id: 'YOUR_VOICE_ID_HERE',
  name: 'My Custom Voice',
  settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true
  }
},`);
        } else {
          console.error('❌ No voices found or invalid response:', response);
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error fetching voices:', error.message);
  });

  req.end();
}

getVoices();
