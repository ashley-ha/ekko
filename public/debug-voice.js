// Debug script for testing voice in the browser console
// Run this in the browser console while on the Voice Assessment page

console.log('🔍 Debugging Voice Assessment...\n');

// Test 1: Check if enhancedVoiceService is available
console.log('1. Checking enhancedVoiceService:');
if (window.enhancedVoiceService) {
  console.log('✅ enhancedVoiceService is available');
} else {
  console.log('❌ enhancedVoiceService not found - importing...');
  // Try to import it
  const module = await import('./src/lib/enhancedVoiceService.ts');
  window.enhancedVoiceService = module.enhancedVoiceService;
}

// Test 2: Test voice connection
console.log('\n2. Testing voice connection:');
try {
  const result = await window.enhancedVoiceService.testVoiceConnection();
  console.log('Voice test result:', result);
  if (result.premium) {
    console.log('✅ Premium voice (ElevenLabs) is working');
  } else {
    console.log('❌ Premium voice failed, using fallback');
  }
} catch (error) {
  console.error('❌ Voice test failed:', error);
}

// Test 3: Test direct API call
console.log('\n3. Testing direct Supabase function call:');
try {
  const { supabase } = await import('./src/lib/supabase.ts');
  const { data, error } = await supabase.functions.invoke('voice-speak', {
    body: {
      text: '안녕하세요, 테스트입니다',
      voiceId: 'Anna Kim',
    },
  });
  
  if (error) {
    console.error('❌ Supabase function error:', error);
  } else {
    console.log('✅ Supabase function returned data');
    console.log('Data type:', typeof data);
    console.log('Data:', data);
    
    // Try to play the audio
    if (data) {
      let audioBlob;
      if (data instanceof ArrayBuffer) {
        audioBlob = new Blob([data], { type: 'audio/mpeg' });
      } else if (data instanceof Blob) {
        audioBlob = data;
      } else {
        console.error('Unexpected data type:', typeof data);
      }
      
      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        console.log('🔊 Playing test audio...');
        await audio.play();
      }
    }
  }
} catch (error) {
  console.error('❌ API test failed:', error);
}

// Test 4: Test the speak function directly
console.log('\n4. Testing enhancedVoiceService.speak():');
try {
  await window.enhancedVoiceService.speak('테스트 음성입니다', {
    language: 'ko-KR',
    quality: 'premium',
    voice: 'Anna Kim',
    speed: 1,
  });
  console.log('✅ Speech synthesis completed');
} catch (error) {
  console.error('❌ Speech synthesis failed:', error);
}

// Test 5: Check app settings
console.log('\n5. Checking app settings:');
const { useAppStore } = await import('./src/store/useAppStore.ts');
const store = useAppStore.getState();
console.log('Voice enabled:', store.settings.voiceEnabled);
console.log('Speech rate:', store.settings.speechRate || 'not set');

console.log('\n🎯 Debugging complete! Check the results above.');
