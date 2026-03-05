// Debug script for enhanced theater mode
console.log('🐛 Enhanced Theater Mode Debug Script Loaded');

// Test function to manually trigger enhanced mode
window.testEnhancedMode = async function() {
  console.log('🧪 Testing Enhanced Mode...');
  
  // Check if files can be loaded
  try {
    const cssUrl = chrome.runtime.getURL('src/content/enhanced-theater-mode.css');
    const jsUrl = chrome.runtime.getURL('src/content/enhanced-theater-mode.js');
    
    console.log('📁 CSS URL:', cssUrl);
    console.log('📁 JS URL:', jsUrl);
    
    // Try to fetch the files
    const cssResponse = await fetch(cssUrl);
    const jsResponse = await fetch(jsUrl);
    
    console.log('📄 CSS status:', cssResponse.status, cssResponse.ok);
    console.log('📄 JS status:', jsResponse.status, jsResponse.ok);
    
    if (cssResponse.ok && jsResponse.ok) {
      console.log('✅ Files are accessible');
      
      // Try loading them
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = cssUrl;
      document.head.appendChild(cssLink);
      
      const script = document.createElement('script');
      script.src = jsUrl;
      script.onload = () => {
        console.log('✅ Enhanced theater mode JS loaded');
        console.log('🎯 EkkoTheaterMode available:', !!window.EkkoTheaterMode);
        
        if (window.EkkoTheaterMode) {
          console.log('🚀 Ready to create enhanced theater mode!');
        }
      };
      script.onerror = (e) => {
        console.error('❌ Failed to load enhanced theater mode JS:', e);
      };
      document.head.appendChild(script);
      
    } else {
      console.error('❌ Files not accessible');
    }
    
  } catch (error) {
    console.error('❌ Error testing enhanced mode:', error);
  }
};

// Test enhanced video controller
window.testVideoController = async function() {
  console.log('🧪 Testing Enhanced Video Controller...');
  
  if (!window.ekkoVideoController) {
    console.error('❌ Enhanced Video Controller not available');
    return;
  }
  
  const currentTime = window.ekkoVideoController.getCurrentTime();
  console.log('📍 Current time:', currentTime);
  
  const isPlaying = window.ekkoVideoController.isPlaying();
  console.log('▶️ Is playing:', isPlaying);
  
  const video = window.ekkoVideoController.getMainVideoElement();
  console.log('📺 Video element:', video);
  
  if (video) {
    console.log('📊 Video info:', {
      duration: video.duration,
      currentTime: video.currentTime,
      paused: video.paused,
      readyState: video.readyState
    });
  }
  
  // Test seek (seek to 30 seconds or current + 5)
  if (currentTime > -1) {
    const testTime = Math.min(30, Math.max(currentTime + 5, 10));
    console.log('🎯 Testing seek to:', testTime);
    const seekResult = await window.ekkoVideoController.seekToTime(testTime);
    console.log('🎯 Seek result:', seekResult);
    
    // Verify seek worked
    setTimeout(() => {
      const newTime = window.ekkoVideoController.getCurrentTime();
      console.log('🔍 Time after seek:', newTime);
      const difference = Math.abs(newTime - testTime);
      if (difference <= 1) {
        console.log('✅ Seek verification successful (diff:', difference.toFixed(2), 'seconds)');
      } else {
        console.warn('⚠️ Seek may not have worked properly (diff:', difference.toFixed(2), 'seconds)');
      }
    }, 500);
  }
};

// Auto-run tests
setTimeout(() => {
  // Test enhanced video controller
  if (window.ekkoVideoController) {
    console.log('✅ Enhanced Video Controller ready');
    console.log('💡 Run window.testVideoController() to test video controls');
  } else {
    console.warn('❌ Enhanced Video Controller not loaded');
  }
}, 1000); 