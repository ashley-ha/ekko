#!/usr/bin/env node

// Test script to verify ElevenLabs API and voices
const https = require('https');

// Get API key from environment variable
const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in environment variables');
  console.error('');
  console.error('Please set your API key:');
  console.error('   export ELEVENLABS_API_KEY=your_api_key_here');
  console.error('');
  console.error('Or create a .env file in the project root with:');
  console.error('   ELEVENLABS_API_KEY=your_api_key_here');
  process.exit(1);
}

// Test 1: Get all voices
function testGetVoices() {
  console.log('🔍 Testing: Get all voices from ElevenLabs...\n');

  const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/voices',
    method: 'GET',
    headers: {
      'xi-api-key': API_KEY,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (res.statusCode === 200 && response.voices) {
            console.log(
              `✅ Successfully retrieved ${response.voices.length} voices\n`
            );
            console.log('Korean voices found:');

            const koreanVoices = response.voices.filter(
              (voice) =>
                voice.name.includes('Kim') ||
                voice.name.includes('Hyun') ||
                voice.name.includes('Ku') ||
                voice.name.includes('Korean') ||
                (voice.labels && voice.labels.language === 'Korean')
            );

            koreanVoices.forEach((voice) => {
              console.log(`\n📢 ${voice.name}`);
              console.log(`   ID: ${voice.voice_id}`);
              console.log(`   Category: ${voice.category || 'unknown'}`);
              if (voice.labels) {
                console.log(`   Labels: ${JSON.stringify(voice.labels)}`);
              }
            });

            resolve(response.voices);
          } else {
            console.error(
              `❌ API Error: ${res.statusCode} - ${res.statusMessage}`
            );
            console.error('Response:', data);
            reject(new Error(`API returned ${res.statusCode}`));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.end();
  });
}

// Test 2: Test text-to-speech with each Korean voice
async function testTextToSpeech(voiceId, voiceName) {
  console.log(`\n🎤 Testing TTS with ${voiceName} (${voiceId})...`);

  const text = '안녕하세요. 저는 에코입니다. 한국어 학습을 도와드리겠습니다.';

  const postData = JSON.stringify({
    text: text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    },
  });

  const options = {
    hostname: 'api.elevenlabs.io',
    path: `/v1/text-to-speech/${voiceId}`,
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);

      if (res.statusCode === 200) {
        console.log(
          `   ✅ TTS successful - audio would be ${res.headers['content-length']} bytes`
        );
        resolve(true);
      } else {
        let errorData = '';
        res.on('data', (chunk) => {
          errorData += chunk;
        });
        res.on('end', () => {
          console.error(`   ❌ TTS failed: ${errorData}`);
          resolve(false);
        });
      }

      // Drain the response
      res.on('data', () => {});
    });

    req.on('error', (error) => {
      console.error(`   ❌ Request error: ${error.message}`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Check user subscription/quota
async function testUserInfo() {
  console.log('\n👤 Testing: Get user subscription info...\n');

  const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/user',
    method: 'GET',
    headers: {
      'xi-api-key': API_KEY,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const user = JSON.parse(data);
            console.log('✅ User info retrieved:');
            console.log(
              `   Subscription: ${user.subscription?.tier || 'unknown'}`
            );
            console.log(
              `   Character count: ${user.subscription?.character_count || 0}`
            );
            console.log(
              `   Character limit: ${user.subscription?.character_limit || 0}`
            );
            resolve(user);
          } else {
            console.error(`❌ Failed to get user info: ${res.statusCode}`);
            console.error('Response:', data);
            resolve(null);
          }
        } catch (error) {
          console.error('❌ Error parsing user info:', error);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      resolve(null);
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting ElevenLabs API tests...\n');
  console.log('================================\n');

  try {
    // Test user info first
    await testUserInfo();

    // Test getting voices
    const voices = await testGetVoices();

    // Test TTS with configured Korean voices
    console.log('\n================================');
    console.log('\n🎯 Testing configured voices:\n');

    const configuredVoices = [
      { id: 'uyVNoMrnUku1dZyVEXwD', name: 'Anna Kim' },
      { id: 's07IwTCOrCDCaETjUVjx', name: 'Hyun Bin' },
      { id: '4JJwo477JUAx3HV0T7n7', name: 'Yohan Ku' },
    ];

    for (const voice of configuredVoices) {
      await testTextToSpeech(voice.id, voice.name);
      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('\n================================');
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

runTests();
