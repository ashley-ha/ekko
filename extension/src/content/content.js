(() => {
  if (window.ekkoInjected) {
    return;
  }
  window.ekkoInjected = true;

  console.log('Ekko Extension: Script Injected');

  // Configuration
  const EKKO_BUTTON_ID = 'ekko-language-learning-button';
  const YOUTUBE_PLAYER_CONTROLS_SELECTOR = '.ytp-right-controls';
  const THEATER_WRAPPER_ID = 'ekko-theater-wrapper';
  const FULLSCREEN_BUTTON_SELECTOR = '.ytp-fullscreen-button';

  // State
  let isTheaterMode = false;
  let originalPlayerParent = null;
  let showTranslation = false;
  
  // Extension state variables
  let segments = [];
  let currentSegmentIndex = -1;
  let syncInterval = null;
  let repeatCount = 0;
  let autoPauseEnabled = true;
  let replayMode = 'sentence';
  
  // Segment timing control (similar to YouTubeShadowing.tsx)
  window.ekkoSegmentTimeout = null;

  function init() {
    // Run self-test to verify regex patterns
    testVideoIdExtraction();
    
    console.log('Ekko: Initializing extension');
    
    // Use a MutationObserver to reliably inject the button when the player is ready
    const observer = new MutationObserver((mutations) => {
      // Check if controls exist and button needs to be injected
      const controls = document.querySelector(YOUTUBE_PLAYER_CONTROLS_SELECTOR);
      const buttonExists = document.getElementById(EKKO_BUTTON_ID);
      
      if (controls && !buttonExists) {
        console.log('Ekko: MutationObserver detected controls without button, injecting');
        injectEkkoButton();
      }
      
      // Re-inject if button was removed (YouTube sometimes rebuilds the controls)
      if (controls && buttonExists && !controls.contains(buttonExists)) {
        console.log('Ekko: Button was removed from controls, re-injecting');
        buttonExists.remove();
        injectEkkoButton();
      }
      
      // Also check for any mutations that might have hidden our button
      if (buttonExists && controls && controls.contains(buttonExists)) {
        const buttonStyles = window.getComputedStyle(buttonExists);
        if (buttonStyles.display === 'none' || buttonStyles.visibility === 'hidden' || buttonStyles.opacity === '0') {
          console.log('Ekko: Button was hidden, restoring visibility');
          Object.assign(buttonExists.style, {
            display: 'inline-flex',
            visibility: 'visible',
            opacity: '1'
          });
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Try to inject immediately if player already exists
    console.log('Ekko: Immediate injection attempt');
    injectEkkoButton();
    
    // Try again after a short delay for YouTube to load
    setTimeout(() => {
      console.log('Ekko: Delayed injection attempt (500ms)');
      injectEkkoButton();
    }, 500);
    
    // Try again after YouTube is more likely to be ready
    setTimeout(() => {
      console.log('Ekko: Secondary delayed injection attempt (2s)');
      injectEkkoButton();
    }, 2000);
    
    // Final attempt after everything should be loaded
    setTimeout(() => {
      console.log('Ekko: Final injection attempt (5s)');
      injectEkkoButton();
    }, 5000);
    
    // Also try to inject periodically as a fallback for when YouTube rebuilds controls
    setInterval(() => {
      const controls = document.querySelector(YOUTUBE_PLAYER_CONTROLS_SELECTOR);
      const buttonExists = document.getElementById(EKKO_BUTTON_ID);
      
      if (controls && !buttonExists) {
        console.log('Ekko: Periodic check found missing button, injecting');
        injectEkkoButton();
      }
    }, 3000); // Check every 3 seconds
    
    // Listen for YouTube navigation events (when user clicks on new videos)
    let lastUrl = window.location.href;
    setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        console.log('Ekko: URL changed from', lastUrl, 'to', currentUrl);
        lastUrl = currentUrl;
        
        // Wait a bit for YouTube to rebuild the player, then inject button
        setTimeout(() => {
          console.log('Ekko: Re-injecting button after navigation');
          injectEkkoButton();
        }, 1000);
      }
    }, 1000); // Check for URL changes every second
  }

  function createEkkoButton() {
    const button = document.createElement('button');
    button.id = EKKO_BUTTON_ID;
    button.className = 'ytp-button';
    button.title = 'Learn with Ekko';
    button.setAttribute('aria-label', 'Learn with Ekko');
    
    // Create a more visible icon
    button.innerHTML = `
      <svg height="100%" width="100%" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet">
        <g fill="none" fill-rule="evenodd">
          <circle cx="18" cy="18" r="16" stroke="currentColor" stroke-width="2"/>
          <text x="18" y="18" font-family="Roboto, Arial, sans-serif" font-size="16" font-weight="bold" 
                text-anchor="middle" dominant-baseline="middle" fill="currentColor">E</text>
        </g>
      </svg>
    `;
    
    button.addEventListener('click', toggleTheaterMode);
    return button;
  }
  
  function injectEkkoButton() {
    console.log('=== Ekko: Starting button injection ===');
    
    // Try multiple selectors for the controls
    const controlSelectors = [
      '.ytp-right-controls',
      '.ytp-chrome-controls .ytp-right-controls',
      '#movie_player .ytp-right-controls',
      '.html5-video-player .ytp-right-controls'
    ];
    
    let controls = null;
    for (const selector of controlSelectors) {
      controls = document.querySelector(selector);
      if (controls) {
        console.log('Ekko: Found controls with selector:', selector);
        break;
      }
    }
    
    if (!controls) {
      console.log('Ekko: Cannot inject button - controls not found with any selector');
      console.log('Available elements:', document.querySelectorAll('[class*="ytp"]'));
      return false;
    }
    
    // Check if button already exists
    const existingButton = document.getElementById(EKKO_BUTTON_ID);
    if (existingButton) {
      if (controls.contains(existingButton)) {
        console.log('Ekko: Button already exists and is properly placed, ensuring visibility');
        const forcedStyles = {
          display: 'inline-flex !important',
          visibility: 'visible !important',
          opacity: '1 !important',
          position: 'relative !important',
          zIndex: '60 !important'
        };
        Object.assign(existingButton.style, forcedStyles);
        return true;
      } else {
        console.log('Ekko: Button exists but not in controls, removing and re-creating');
        existingButton.remove();
      }
    }
    
    console.log('Ekko: Creating new button');
    const ekkoButton = createEkkoButton();
    
    // Log current controls structure
    console.log('Controls children:', Array.from(controls.children).map(c => ({
      tag: c.tagName,
      class: c.className,
      title: c.title || c.getAttribute('aria-label')
    })));
    
    // Try multiple insertion strategies
    let inserted = false;
    
    // Strategy 1: Insert before fullscreen button (most reliable position)
    const fullscreenButton = controls.querySelector('.ytp-fullscreen-button');
    if (fullscreenButton) {
      console.log('Ekko: Found fullscreen button, inserting before it');
      controls.insertBefore(ekkoButton, fullscreenButton);
      inserted = true;
    }
    
    // Strategy 2: Insert before settings button
    if (!inserted) {
      const settingsButton = controls.querySelector('.ytp-settings-button');
      if (settingsButton) {
        console.log('Ekko: Found settings button, inserting before it');
        controls.insertBefore(ekkoButton, settingsButton);
        inserted = true;
      }
    }
    
    // Strategy 3: Insert before any overflow menu
    if (!inserted) {
      const overflowButton = controls.querySelector('.ytp-overflow-button');
      if (overflowButton) {
        console.log('Ekko: Found overflow button, inserting before it');
        controls.insertBefore(ekkoButton, overflowButton);
        inserted = true;
      }
    }
    
    // Strategy 4: Insert at the end
    if (!inserted) {
      console.log('Ekko: Using fallback insertion at end of controls');
      controls.appendChild(ekkoButton);
      inserted = true;
    }
    
    if (inserted) {
      // Apply aggressive inline styles to ensure visibility
      const forcedStyles = {
        display: 'inline-flex !important',
        visibility: 'visible !important',
        opacity: '1 !important',
        position: 'relative !important',
        zIndex: '60 !important',
        width: '48px !important',
        height: '48px !important',
        minWidth: '48px !important',
        margin: '0 !important',
        padding: '0 !important',
        border: 'none !important',
        background: 'transparent !important',
        cursor: 'pointer !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        flexShrink: '0 !important',
        color: 'rgba(255, 255, 255, 0.9) !important'
      };
      
      // Apply styles using cssText for maximum force
      const cssText = Object.entries(forcedStyles)
        .map(([prop, value]) => `${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');
      ekkoButton.style.cssText = cssText;
      
      console.log('Ekko Extension: Button successfully injected with forced styles');
      console.log('Button final location:', ekkoButton.parentElement?.className);
      
      // Set up a periodic visibility check for this button
      const visibilityChecker = setInterval(() => {
        if (!document.body.contains(ekkoButton)) {
          clearInterval(visibilityChecker);
          return;
        }
        
        const computed = window.getComputedStyle(ekkoButton);
        if (computed.display === 'none' || computed.visibility === 'hidden' || parseFloat(computed.opacity) < 0.5) {
          console.log('Ekko: Button became invisible, forcing visibility');
          ekkoButton.style.cssText = cssText;
        }
      }, 2000);
      
      // Verify button is actually visible after a short delay
      setTimeout(() => {
        const rect = ekkoButton.getBoundingClientRect();
        const computed = window.getComputedStyle(ekkoButton);
        console.log('Button verification - Rect:', {
          width: rect.width,
          height: rect.height,
          visible: rect.width > 0 && rect.height > 0
        });
        console.log('Button verification - Styles:', {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          position: computed.position,
          zIndex: computed.zIndex
        });
      }, 200);
      
      return true;
    } else {
      console.error('Ekko: Failed to inject button after all strategies');
      return false;
    }
  }

  // Theater mode state
  // Uses global functions: window.ekkoActivateTheaterMode, window.ekkoCloseTheaterMode

  function toggleTheaterMode() {
    console.log('🎬 Ekko: toggleTheaterMode called, current state:', isTheaterMode);
    if (isTheaterMode) {
      closeTheaterMode();
    } else {
      console.log('🚀 Ekko: Attempting to open enhanced theater mode...');
      openEnhancedTheaterMode();
    }
  }

  async function openEnhancedTheaterMode() {
    console.log('🎬 Ekko: Opening enhanced theater mode...');
    
    // Get current video ID
    const videoId = getVideoId();
    console.log('🆔 Ekko: Video ID:', videoId);
    if (!videoId) {
      console.error('❌ Ekko: No video ID found');
      return;
    }
    
    // Load enhanced theater mode if not already loaded
    console.log('🔍 Ekko: Checking if theater mode functions are available:', !!window.ekkoActivateTheaterMode);
    if (!window.ekkoActivateTheaterMode) {
      console.log('📥 Ekko: Loading enhanced theater mode...');
      await loadEnhancedTheaterMode();
      console.log('✅ Ekko: Load complete, functions available:', !!window.ekkoActivateTheaterMode);
    }
    
    // Activate enhanced theater mode using the global function
    if (window.ekkoActivateTheaterMode) {
      console.log('🚀 Ekko: Activating enhanced theater mode...');
      await window.ekkoActivateTheaterMode(videoId);
      isTheaterMode = true;
      console.log('✅ Ekko: Enhanced theater mode activated successfully!');
    } else {
      console.error('❌ Ekko: Failed to load enhanced theater mode, falling back to old mode');
      // Fallback to old theater mode
      openTheaterMode();
    }
  }

  async function loadEnhancedTheaterMode() {
    return new Promise((resolve) => {
      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = chrome.runtime.getURL('src/content/enhanced-theater-mode.css');
      document.head.appendChild(cssLink);
      
      // Load JavaScript
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('src/content/enhanced-theater-mode.js');
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
  }

  function openTheaterMode() {
    console.log('Ekko: Opening theater mode...');
    
    // Target the entire player component for stability
    const player = document.querySelector('ytd-player');
    if (!player) {
      console.error('Ekko: ytd-player not found!');
      return;
    }

    console.log('Ekko: Found YouTube player element');
    originalPlayerParent = player.parentNode;
    
    // Store reference to original player and video
    window.ekkoOriginalPlayer = player;
    
    // Get the main video element and validate it
    const video = getMainVideoElement();
    if (video) {
      console.log('Ekko: Found main video element:', video);
      console.log('Ekko: Video duration:', video.duration, 'seconds');
      console.log('Ekko: Video dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      // Pause the video and reset to beginning
      pauseVideo();
      seekToTime(0);
    } else {
      console.warn('Ekko: Could not find main video element');
    }
    
    const wrapper = document.createElement('div');
    wrapper.id = THEATER_WRAPPER_ID;
    
    // Layout: video on top, transcript panel on bottom (stacked layout)
    wrapper.innerHTML = `
      <div id="ekko-video-container"></div>
      <div id="ekko-transcript-panel">
        <div id="ekko-controls-bar">
          <div style="display: flex; gap: 8px; align-items: center;">
            <button id="ekko-prev-btn" title="Previous segment (←)">⏮</button>
            <button id="ekko-repeat-btn" title="Repeat segment (Space)" class="ekko-primary-btn">↻ Repeat</button>
            <button id="ekko-next-btn" title="Next segment (→)">⏭</button>
            <span id="ekko-repeat-counter" class="ekko-repeat-counter">0</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button id="ekko-auto-pause-btn" title="Toggle auto-pause" class="${autoPauseEnabled ? 'active' : ''}">Auto</button>
            <button id="ekko-translation-toggle-btn" title="Toggle subtitle/translation" class="${showTranslation ? 'active' : ''}">CC</button>
            <button id="ekko-ai-practice-toggle-btn" title="Toggle AI Practice">🎯</button>
            <button id="ekko-save-sentence-btn" title="Save current sentence">📝</button>
            <select id="ekko-speed-control" title="Playback speed">
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1" selected>1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
            </select>
            <select id="ekko-replay-mode" title="Replay mode">
              <option value="sentence" selected>Sentence</option>
              <option value="2s">-2s</option>
              <option value="5s">-5s</option>
              <option value="10s">-10s</option>
            </select>
            <select id="ekko-layout-mode" title="Layout mode">
              <option value="stack" selected>Stack</option>
              <option value="sidebyside">Side by Side</option>
            </select>
            <button id="ekko-close-btn" title="Close">✕</button>
          </div>
        </div>
        <div id="ekko-current-caption">
          <div id="ekko-segment-progress">
            <span id="ekko-segment-number">1 / 1</span>
            <div id="ekko-progress-bar">
              <div id="ekko-progress-fill"></div>
            </div>
          </div>
          <div id="ekko-caption-text">Loading captions...</div>
          <div id="ekko-caption-translation" style="display: none;"></div>
        </div>
        
        <!-- AI Practice Panel -->
        <div id="ekko-ai-practice-panel" style="display: none;">
          <div id="ekko-practice-header">
            <h3>AI Practice</h3>
            <div id="ekko-practice-progress">
              <span id="ekko-practice-progress-text">Ready to start</span>
              <div id="ekko-practice-progress-bar">
                <div id="ekko-practice-progress-fill"></div>
              </div>
            </div>
          </div>
          
          <!-- Practice States -->
          <div id="ekko-practice-setup" class="ekko-practice-state">
            <div class="ekko-practice-info">
              <p>Test your comprehension with AI-generated questions based on this video's content.</p>
              <button id="ekko-start-practice-btn" class="ekko-primary-btn">Start Practice</button>
            </div>
          </div>

          <div id="ekko-practice-loading" class="ekko-practice-state" style="display: none;">
            <div class="ekko-loading-state">
              <div class="ekko-spinner"></div>
              <p>Generating questions...</p>
            </div>
          </div>

          <div id="ekko-practice-question" class="ekko-practice-state" style="display: none;">
            <div class="ekko-question-card">
              <div class="ekko-question-header">
                <span id="ekko-question-difficulty" class="ekko-difficulty-badge">medium</span>
                <span id="ekko-question-number">Question 1 of 5</span>
              </div>
              <div class="ekko-question-text" id="ekko-question-text">
                <!-- Question will be inserted here -->
              </div>
              <div class="ekko-answer-section">
                <textarea 
                  id="ekko-user-answer" 
                  placeholder="Type your answer here..."
                  rows="3"
                ></textarea>
                <button id="ekko-submit-answer-btn" class="ekko-primary-btn">
                  Submit Answer
                </button>
              </div>
            </div>
          </div>

          <div id="ekko-practice-feedback" class="ekko-practice-state" style="display: none;">
            <div class="ekko-feedback-card">
              <div class="ekko-feedback-header">
                <div id="ekko-feedback-result" class="ekko-feedback-result">
                  <!-- Correct/Incorrect indicator -->
                </div>
                <div id="ekko-feedback-score" class="ekko-feedback-score">
                  <!-- Score display -->
                </div>
              </div>
              <div class="ekko-user-answer-display">
                <strong>Your Answer:</strong>
                <p id="ekko-display-user-answer"></p>
              </div>
              <div class="ekko-feedback-text">
                <strong>Feedback:</strong>
                <p id="ekko-feedback-message"></p>
              </div>
              <button id="ekko-next-question-btn" class="ekko-primary-btn">
                Next Question
              </button>
            </div>
          </div>

          <div id="ekko-practice-complete" class="ekko-practice-state" style="display: none;">
            <div class="ekko-completion-card">
              <div class="ekko-completion-header">
                <span class="ekko-success-icon">🎉</span>
                <h4>Practice Complete!</h4>
              </div>
              <p>Great job completing all the questions for this video.</p>
              <button id="ekko-restart-practice-btn" class="ekko-primary-btn">
                Practice Again
              </button>
            </div>
          </div>

          <div id="ekko-practice-error" class="ekko-practice-state" style="display: none;">
            <div class="ekko-error-card">
              <span class="ekko-error-icon">⚠️</span>
              <h4>Error</h4>
              <p id="ekko-practice-error-message">Something went wrong. Please try again.</p>
              <button id="ekko-retry-practice-btn" class="ekko-primary-btn">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add our wrapper to the page and lock scroll
    document.documentElement.classList.add('ekko-theater-active');
    document.body.appendChild(wrapper);

    // MOVE the player into our container
    const videoContainer = document.getElementById('ekko-video-container');
    videoContainer.appendChild(player);

    // Add a class to the player so our CSS can force its size
    player.classList.add('ekko-player-hijacked');
    
    isTheaterMode = true;
    console.log('Ekko: Theater Mode Opened');
    initializeLearningUI(player);
  }

  function closeTheaterMode() {
    if (!isTheaterMode) return;
    
    console.log('Ekko: Closing theater mode');
    
    // Check if we're using enhanced theater mode with the new global function
    if (window.ekkoCloseTheaterMode && window.ekkoTheaterMode && window.ekkoTheaterMode.isActive) {
      window.ekkoCloseTheaterMode();
      isTheaterMode = false;
      return;
    }
    
    // Legacy theater mode cleanup
    // Clear any running intervals and timeouts
    stopVideoSync();
    if (window.ekkoSegmentTimeout) {
      clearTimeout(window.ekkoSegmentTimeout);
      window.ekkoSegmentTimeout = null;
    }
    
    const wrapper = document.getElementById(THEATER_WRAPPER_ID);
    const player = document.querySelector('.ekko-player-hijacked');

    if (player && originalPlayerParent) {
      // MOVE the player back to its original spot
      originalPlayerParent.appendChild(player);
      player.classList.remove('ekko-player-hijacked');
    }

    if (wrapper) {
      wrapper.remove();
    }

    document.documentElement.classList.remove('ekko-theater-active');
    isTheaterMode = false;
    console.log('Ekko: Theater Mode Closed');
  }

  // Removed toggleCaptionDisplay as it's not used

  // Learning UI Functions
  async function initializeLearningUI(player) {
    console.log('Ekko: Initializing Learning UI');
    
    try {
      // Store reference to original player
      window.ekkoOriginalPlayer = player;
      
      // Validate player and video element
      const video = getMainVideoElement();
      if (!video) {
        throw new Error('No valid video element found');
      }
      
      console.log('Ekko: Video validation successful');
      console.log('Ekko: Video duration:', video.duration);
      console.log('Ekko: Video ready state:', video.readyState);
      
      // Get video ID from URL
      const videoId = getVideoId();
      if (!videoId) {
        throw new Error('No video ID found in URL');
      }

      console.log('✅ Video ID extracted:', videoId);

      // Set up control event handlers first
      setupControlHandlers();
      
      // Fetch transcript data
      await fetchTranscript(videoId);
      
      console.log('Ekko: Learning UI initialization complete');
      
    } catch (error) {
      console.error('Ekko: Failed to initialize learning UI:', error);
      
      // Display error message to user
      const captionText = document.getElementById('ekko-caption-text');
      if (captionText) {
        captionText.innerHTML = `
          <div style="color: #ff6b6b; text-align: center; padding: 20px;">
            <strong>Ekko Error:</strong><br>
            ${error.message}<br><br>
            <small>Try refreshing the page or restarting the extension.</small>
          </div>
        `;
      }
    }
  }

  // Function to get current time from original player
  function getCurrentVideoTime() {
    // Try multiple methods to get the current time
    
    // Method 1: Try YouTube's internal player API first (most reliable)
    if (window.movie_player && typeof window.movie_player.getCurrentTime === 'function') {
      try {
        const time = window.movie_player.getCurrentTime();
        if (typeof time === 'number' && !isNaN(time)) {
          return time;
        }
      } catch (e) {
        console.log('Ekko: Failed to get time from movie_player:', e);
      }
    }
    
    // Method 2: Check if we have the original player stored
    const originalPlayer = window.ekkoOriginalPlayer;
    if (originalPlayer) {
      const video = originalPlayer.querySelector('video');
      if (video && typeof video.currentTime === 'number' && !isNaN(video.currentTime)) {
        return video.currentTime;
      }
    }
    
    // Method 3: Try to find the main video element directly
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      // Check if this is the main YouTube video (has proper duration and isn't an ad)
      if (video.duration > 30 && // Must be longer than 30 seconds
          typeof video.currentTime === 'number' && 
          !isNaN(video.currentTime) &&
          video.videoWidth > 0 && video.videoHeight > 0) { // Must have video dimensions
        return video.currentTime;
      }
    }
    
    // Method 4: Try YT player global object
    if (window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.videoDetails) {
      // This doesn't give us current time, but we can validate we're on the right video
      console.log('Ekko: Found YT initial player response, but no current time available');
    }
    
    console.warn('Ekko: Could not get current video time from any method');
    return -1; // Indicate failure
  }

  // Enhanced video control functions
  function getMainVideoElement() {
    // Try to find the main video element with validation
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      // Check if this is likely the main YouTube video
      if (video.duration > 30 && 
          video.videoWidth > 0 && 
          video.videoHeight > 0 &&
          !video.src.includes('googleads')) {
        return video;
      }
    }
    return null;
  }
  
  function isVideoPlaying() {
    // Method 1: Use YouTube's internal API
    if (window.movie_player && typeof window.movie_player.getPlayerState === 'function') {
      try {
        const state = window.movie_player.getPlayerState();
        // YouTube player states: 1 = playing, 2 = paused
        return state === 1;
      } catch (e) {
        console.log('Ekko: Failed to get player state via movie_player:', e);
      }
    }
    
    // Method 2: Use the video element directly
    const video = getMainVideoElement();
    if (video) {
      return !video.paused;
    }
    
    return false;
  }

  function seekToTime(timeInSeconds) {
    // Method 1: Use YouTube's internal API
    if (window.movie_player && typeof window.movie_player.seekTo === 'function') {
      try {
        window.movie_player.seekTo(timeInSeconds, true);
        return true;
      } catch (e) {
        console.warn('Seek via movie_player failed:', e);
      }
    }
    
    // Method 2: Use the video element directly
    const video = getMainVideoElement();
    if (video) {
      try {
        video.currentTime = timeInSeconds;
        return true;
      } catch (e) {
        console.warn('Seek via video element failed:', e);
      }
    }
    
    console.error('❌ All seek methods failed');
    return false;
  }

  function playVideo() {
    // Method 1: Use YouTube's internal API
    if (window.movie_player && typeof window.movie_player.playVideo === 'function') {
      try {
        window.movie_player.playVideo();
        return true;
      } catch (e) {
        console.warn('Play via movie_player failed:', e);
      }
    }
    
    // Method 2: Use the video element directly
    const video = getMainVideoElement();
    if (video) {
      try {
        video.play();
        return true;
      } catch (e) {
        console.warn('Play via video element failed:', e);
      }
    }
    
    console.error('❌ All play methods failed');
    return false;
  }

  function pauseVideo() {
    // Method 1: Use YouTube's internal API
    if (window.movie_player && typeof window.movie_player.pauseVideo === 'function') {
      try {
        window.movie_player.pauseVideo();
        return true;
      } catch (e) {
        console.warn('Pause via movie_player failed:', e);
      }
    }
    
    // Method 2: Use the video element directly
    const video = getMainVideoElement();
    if (video) {
      try {
        video.pause();
        return true;
      } catch (e) {
        console.warn('Pause via video element failed:', e);
      }
    }
    
    console.error('Ekko: All pause methods failed');
    return false;
  }


  function setupControlHandlers() {
    // Previous segment button
    document.getElementById('ekko-prev-btn')?.addEventListener('click', () => {
      navigateToSegment('prev');
    });

    // Next segment button
    document.getElementById('ekko-next-btn')?.addEventListener('click', () => {
      navigateToSegment('next');
    });

    // Repeat button
    document.getElementById('ekko-repeat-btn')?.addEventListener('click', () => {
      console.log('Ekko: Repeat button clicked');
      repeatSegment();
    });

    // Auto-pause toggle
    document.getElementById('ekko-auto-pause-btn')?.addEventListener('click', (e) => {
      autoPauseEnabled = !autoPauseEnabled;
      e.target.classList.toggle('active', autoPauseEnabled);
      console.log('Ekko: Auto-pause', autoPauseEnabled ? 'enabled' : 'disabled');
    });

    // Speed control
    document.getElementById('ekko-speed-control')?.addEventListener('change', (e) => {
      const speed = parseFloat(e.target.value);
      console.log('Ekko: Attempting to set playback speed to', speed);
      
      // Method 1: Try YouTube's internal API
      if (window.movie_player && typeof window.movie_player.setPlaybackRate === 'function') {
        try {
          window.movie_player.setPlaybackRate(speed);
          console.log('Ekko: Speed set successfully via movie_player');
          return;
        } catch (e) {
          console.log('Ekko: Speed control failed via movie_player:', e);
        }
      }
      
      // Method 2: Use video element directly
      const video = getMainVideoElement();
      if (video) {
        try {
          video.playbackRate = speed;
          console.log('Ekko: Speed set successfully via video element');
        } catch (e) {
          console.log('Ekko: Speed control failed via video element:', e);
        }
      }
    });

    // Translation toggle button
    document.getElementById('ekko-translation-toggle-btn')?.addEventListener('click', (e) => {
      showTranslation = !showTranslation;
      e.target.classList.toggle('active', showTranslation);
      console.log('Ekko: Translation', showTranslation ? 'enabled' : 'disabled');
      
      // If translation is enabled and current segment doesn't have translation, translate it
      if (showTranslation && segments.length > 0 && currentSegmentIndex >= 0 && currentSegmentIndex < segments.length) {
        const currentSegment = segments[currentSegmentIndex];
        if (!currentSegment.translation) {
          translateCurrentSegment();
        }
      }
      
      // Update current caption display
      if (segments.length > 0 && currentSegmentIndex >= 0) {
        updateCurrentCaption(currentSegmentIndex);
      }
    });

    // Save sentence button
    document.getElementById('ekko-save-sentence-btn')?.addEventListener('click', () => {
      if (currentSegmentIndex >= 0 && segments[currentSegmentIndex]) {
        console.log('Ekko: Saving sentence:', segments[currentSegmentIndex].text);
        // TODO: Implement save functionality
      }
    });

    // Replay mode selector
    document.getElementById('ekko-replay-mode')?.addEventListener('change', (e) => {
      replayMode = e.target.value;
      console.log('Ekko: Replay mode set to', replayMode);
    });

    // Layout mode selector
    document.getElementById('ekko-layout-mode')?.addEventListener('change', (e) => {
      const wrapper = document.getElementById(THEATER_WRAPPER_ID);
      if (wrapper) {
        if (e.target.value === 'sidebyside') {
          wrapper.classList.add('ekko-sidebyside');
        } else {
          wrapper.classList.remove('ekko-sidebyside');
        }
      }
    });

    // Close button
    document.getElementById('ekko-close-btn')?.addEventListener('click', () => {
      closeTheaterMode();
    });

    // AI Practice toggle button
    document.getElementById('ekko-ai-practice-toggle-btn')?.addEventListener('click', () => {
      toggleAIPracticePanel();
    });

    // AI Practice event listeners
    setupAIPracticeEventListeners();
  }

  // New function to translate only the current segment
  async function translateCurrentSegment() {
    if (currentSegmentIndex < 0 || currentSegmentIndex >= segments.length) return;
    
    const currentSegment = segments[currentSegmentIndex];
    if (!currentSegment || currentSegment.translation) return;
    
    console.log('Ekko: Translating current segment:', currentSegment.text);
    
    try {
      const translation = await translateText(currentSegment.text, 'ko', 'en');
      const romanization = await romanizeText(currentSegment.text);
      
      // Update only the current segment
      segments[currentSegmentIndex] = {
        ...currentSegment,
        translation: translation,
        romanization: romanization
      };
      
      // Update display if translation is still enabled
      if (showTranslation) {
        updateCurrentCaption(currentSegmentIndex);
      }
      
      console.log('Ekko: Translation completed for segment:', currentSegmentIndex);
    } catch (error) {
      console.error('Ekko: Translation failed:', error);
      // Set error message as translation
      segments[currentSegmentIndex] = {
        ...currentSegment,
        translation: '[Translation unavailable]',
        romanization: '[Romanization unavailable]'
      };
      
      if (showTranslation) {
        updateCurrentCaption(currentSegmentIndex);
      }
    }
  }

  // Self-test function to verify regex patterns work correctly
  function testVideoIdExtraction() {
    const testUrls = [
      'https://www.youtube.com/watch?v=lG5YXImCkX4&t=603s',
      'https://www.youtube.com/watch?v=lG5YXImCkX4',
      'https://youtu.be/lG5YXImCkX4',
      'https://www.youtube.com/embed/lG5YXImCkX4',
      'https://www.youtube.com/shorts/lG5YXImCkX4'
    ];
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
      /youtube\.com\/shorts\/([^&?#]+)/,
    ];
    
    console.log('Ekko: Running video ID extraction self-test...');
    
    testUrls.forEach((testUrl, index) => {
      console.log(`Test ${index + 1}: ${testUrl}`);
      
      for (const pattern of patterns) {
        const match = testUrl.match(pattern);
        if (match && match[1]) {
          console.log(`  → Pattern ${pattern} matched: "${match[1]}"`);
          break;
        }
      }
    });
    
    console.log('Ekko: Self-test completed');
  }

  function getVideoId() {
    // Extract video ID from URL using the same logic as the main app
    // Expected format: 11-character alphanumeric string (e.g., "lG5YXImCkX4")
    // Should NOT return full URLs like "https://www.youtube.com/watch?v=lG5YXImCkX4&t=603s"
    const url = window.location.href;
    console.log('Ekko: Extracting video ID from URL:', url);
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/,
      /youtube\.com\/shorts\/([^&?#]+)/,
    ];

    for (const pattern of patterns) {
      console.log('Ekko: Testing pattern:', pattern);
      const match = url.match(pattern);
      console.log('Ekko: Pattern match result:', match);
      if (match && match[1]) {
        const videoId = match[1].trim();
        console.log('Ekko: Extracted video ID:', videoId, 'Length:', videoId.length);
        
        // Validate that the video ID looks reasonable (11 characters is typical for YouTube)
        if (videoId.length >= 10 && videoId.length <= 12 && /^[a-zA-Z0-9_-]+$/.test(videoId)) {
          return videoId;
        } else {
          console.warn('Ekko: Video ID appears invalid:', videoId);
        }
      }
    }
    
    // Fallback to URL params
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    console.log('Ekko: Fallback video ID from params:', videoId);
    
    if (videoId) {
      const cleanVideoId = videoId.trim();
      console.log('Ekko: Clean fallback video ID:', cleanVideoId, 'Length:', cleanVideoId.length);
      return cleanVideoId;
    }
    
    console.error('Ekko: No video ID found in URL:', url);
    return null;
  }

  async function fetchTranscript(videoId) {
    console.log('Ekko: Asking background script to fetch transcript for', videoId);
    
    // Validate video ID before proceeding
    if (!videoId) {
      throw new Error('No video ID provided');
    }
    
    if (typeof videoId !== 'string') {
      throw new Error(`Invalid video ID type: ${typeof videoId}. Expected string.`);
    }
    
    if (videoId.length < 10 || videoId.length > 20) {
      throw new Error(`Invalid video ID length: "${videoId}". Expected 10-20 characters.`);
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(videoId)) {
      throw new Error(`Invalid video ID format: "${videoId}". Contains invalid characters.`);
    }
    
    console.log('Ekko: Video ID validation passed:', videoId);
    
    // First, test if background script is responsive
    try {
      console.log('Ekko: Testing background script connectivity...');
      const pingResponse = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: 'PING'}, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Ping failed: ${chrome.runtime.lastError.message}`));
            return;
          }
          resolve(response);
        });
      });
      console.log('Ekko: Background script ping successful:', pingResponse);
    } catch (pingError) {
      console.error('Ekko: Background script is not responsive:', pingError);
      throw new Error(`Background script not accessible: ${pingError.message}`);
    }
    
    try {
      console.log('Ekko: Sending transcript request to background script...');
      
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Transcript request timeout after 30 seconds'));
        }, 30000);
        
        const message = {
          type: 'FETCH_YOUTUBE_TRANSCRIPT',
          videoId: videoId
        };
        console.log('Ekko: Sending message to background script:', message);
        
        chrome.runtime.sendMessage(message, (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            console.error('Ekko: Chrome runtime error:', chrome.runtime.lastError);
            reject(new Error(`Chrome runtime error: ${chrome.runtime.lastError.message}`));
            return;
          }
          
          console.log('Ekko: Raw response from background:', response);
          resolve(response);
        });
      });
      
      console.log('Ekko: Response from background script:', response);
      
      if (!response) {
        throw new Error('No response received from background script');
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Transform transcript data to expected format
      const rawTranscript = response.transcript || [];
      if (rawTranscript.length === 0) {
        throw new Error('No transcript available for this video');
      }

      console.log('Ekko: Raw transcript received:', rawTranscript.slice(0, 2));
      console.log('Ekko: Video info:', response.videoInfo);

      // The transcript is already in the correct format from the edge function
      // Each item should have: { text, start, end }
      const transformedTranscript = rawTranscript.map((item) => ({
        text: item.text || '',
        start: typeof item.start === 'number' ? item.start : 0,
        end: typeof item.end === 'number' ? item.end : (item.start || 0) + 5,
      })).filter(item => item.text.trim().length > 0);

      console.log('Ekko: Transformed transcript sample:', transformedTranscript.slice(0, 2));
      console.log('Ekko: Total segments received:', transformedTranscript.length);
      
      if (transformedTranscript.length === 0) {
        throw new Error('No valid transcript segments found');
      }
      
      // Process the real transcript segments
      await processTranscriptSegments(transformedTranscript);
      
    } catch (error) {
      console.error('Ekko: Failed to get transcript from background script:', error);
      
      // Show error to user
      const captionText = document.getElementById('ekko-caption-text');
      if (captionText) {
        if (error.message.includes('Invalid video ID format') || error.message.includes('received full URL')) {
          captionText.innerHTML = `❌ Error: Invalid video ID<br/>Please check console for details`;
        } else {
          captionText.innerHTML = `❌ Failed to load transcript<br/>${error.message}`;
        }
      }
      
      // Fall back to mock data for testing
      console.log('Ekko: Using mock transcript data for development');
      await processTranscriptSegments(generateMockTranscript());
    }
  }

  // Process transcript into sentences (simplified version of YouTubeShadowing.tsx logic)
  function processTranscriptIntoSentences(transcript, sentencesPerSegment = 1, minSegmentDuration = 5.0) {
    if (!transcript || transcript.length === 0) return [];

    const validSegments = transcript.filter(
      (segment) =>
        typeof segment.start === 'number' &&
        typeof segment.end === 'number' &&
        segment.text?.trim()
    );

    if (validSegments.length === 0) return [];

    const processedSegments = [];
    let currentGroup = [];
    let currentGroupStart = null;
    let currentGroupEnd = null;
    let currentGroupText = [];

    for (let i = 0; i < validSegments.length; i++) {
      const segment = validSegments[i];
      
      if (currentGroupStart === null) {
        currentGroupStart = segment.start;
        currentGroupEnd = segment.end;
        currentGroup = [segment];
        currentGroupText = [segment.text.trim()];
        continue;
      }

      const currentDuration = currentGroupEnd - currentGroupStart;
      
      const shouldAddToGroup = 
        currentDuration < minSegmentDuration ||
        currentGroup.length < sentencesPerSegment ||
        (!segment.text.match(/[.!?]$/) && currentDuration < minSegmentDuration * 1.5);

      if (shouldAddToGroup) {
        currentGroup.push(segment);
        currentGroupEnd = segment.end;
        currentGroupText.push(segment.text.trim());
      } else {
        const combinedText = currentGroupText.join(' ').trim();
        
        if (combinedText.length > 0) {
          processedSegments.push({
            text: combinedText,
            start: currentGroupStart,
            end: currentGroupEnd,
          });
        }

        currentGroupStart = segment.start;
        currentGroupEnd = segment.end;
        currentGroup = [segment];
        currentGroupText = [segment.text.trim()];
      }
    }

    // Add the last group
    if (currentGroupStart !== null && currentGroupText.length > 0) {
      const combinedText = currentGroupText.join(' ').trim();
      if (combinedText.length > 0) {
        processedSegments.push({
          text: combinedText,
          start: currentGroupStart,
          end: currentGroupEnd,
        });
      }
    }

    console.log(`Ekko: Created ${processedSegments.length} processed segments`);
    return processedSegments;
  }

  async function processTranscriptSegments(rawSegments) {
    console.log('Ekko: Processing segments:', rawSegments.length);
    
    // Reset segments array
    segments = [];
    
    // Use the same processing logic as YouTubeShadowing.tsx
    const processedSegments = processTranscriptIntoSentences(rawSegments, 1, 5.0);
    
    // Filter valid segments (same validation as YouTubeShadowing.tsx)
    const validSegments = processedSegments.filter((seg) => {
      const hasValidTiming = typeof seg.start === 'number' && typeof seg.end === 'number';
      return hasValidTiming && seg.text && seg.text.trim().length > 0;
    });
    
    console.log('Ekko: Valid segments after processing:', validSegments.length);
    
    if (validSegments.length === 0) {
      console.error('Ekko: No valid segments found');
      // Use mock data as fallback
      const mockSegments = generateMockTranscript();
      await processTranscriptSegments(mockSegments);
      return;
    }
    
    // Store processed segments
    segments = validSegments.map(segment => ({
      text: segment.text,
      translation: null,
      romanization: null,
      start: segment.start,
      end: segment.end
    }));
    
    console.log('Ekko: Total segments ready for sync:', segments.length);
    if (segments.length > 0) {
      console.log('Ekko: First segment:', segments[0]);
      console.log('Ekko: Last segment:', segments[segments.length - 1]);
      console.log('Ekko: Timing range:', segments[0].start, 'to', segments[segments.length - 1].end);
      
      // Debug: Show timing for first few segments
      console.log('Ekko: Segment timing debug:');
      for (let i = 0; i < Math.min(5, segments.length); i++) {
        console.log(`  Segment ${i}: "${segments[i].text.substring(0, 30)}..." (${segments[i].start}s - ${segments[i].end}s)`);
      }
    }
    
    // Initialize caption display
    initializeCaptionDisplay();
  }

  // Removed createWordSegments as we're using simple text display

  async function translateText(text, fromLang = 'ko', toLang = 'en') {
    try {
      // Use free translation API
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
          return data.responseData.translatedText;
        }
      }
    } catch (error) {
      console.error('Ekko: Translation failed:', error);
    }
    
    // Fallback: simple placeholder
    return `[Translation: ${text}]`;
  }

  async function romanizeText(text) {
    // For now, use a simple romanization placeholder
    // TODO: Implement actual Korean romanization service
    try {
      // You could integrate with a Korean romanization API here
      // For now, return a placeholder that indicates it's Korean
      return text.replace(/[가-힣]/g, (char) => {
        // Very basic romanization placeholder
        return '[' + char + ']';
      });
    } catch (error) {
      console.error('Ekko: Romanization failed:', error);
    }
    
    return `[Romanization: ${text}]`;
  }

  function generateMockTranscript() {
    return [
      {
        text: "세웠지 너네, 날개 있는 것에 대해서 감사해.",
        start: 0,
        end: 4
      },
      {
        text: "근데 이런 것도 있네요.",
        start: 4,
        end: 7
      },
      {
        text: "그렇지만 뭔가 이런게 있어요.",
        start: 7,
        end: 11
      },
      {
        text: "이런 것도 있네요.",
        start: 11,
        end: 14
      },
      {
        text: "정말 좋은 경험이었어요.",
        start: 14,
        end: 17
      }
    ];
  }

  function initializeCaptionDisplay() {
    console.log('Ekko: Caption display initialized with', segments.length, 'segments');
    
    // Initialize current segment to -1 so first update will trigger
    currentSegmentIndex = -1;
    
    // Reset repeat counter
    repeatCount = 0;
    updateRepeatCounter();
    
    // Show first segment if available
    if (segments.length > 0) {
      setCurrentSegment(0);
      updateCurrentCaption(0);
      updateSegmentProgress();
    }
    
    // DON'T start auto-sync - let manual navigation be independent like YouTubeShadowing.tsx
    // startVideoSync();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
  }

  // Removed word click handlers as we're using simple text display

  function updateCurrentCaption(segmentIndex) {
    const captionText = document.getElementById('ekko-caption-text');
    const captionTranslation = document.getElementById('ekko-caption-translation');
    
    if (!captionText) {
      console.error('Ekko: Caption text element not found');
      return;
    }
    
    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      console.log('Ekko: Invalid segment index:', segmentIndex);
      return;
    }
    
    const currentSegment = segments[segmentIndex];
    console.log('Ekko: Updating caption to:', currentSegment.text);
    
    // Create word-level spans for interaction
    captionText.innerHTML = createSegmentElement(currentSegment);
    
    // Add active class for highlighting
    captionText.classList.add('ekko-transcript-segment', 'active');
    
    // Update translation if available and translation is enabled
    if (captionTranslation) {
      if (showTranslation) {
        if (currentSegment.translation) {
          // Translation is available, show it
          captionTranslation.innerHTML = `
            <div class="ekko-romanization">${currentSegment.romanization || ''}</div>
            <div class="ekko-translation">${currentSegment.translation}</div>
          `;
          captionTranslation.style.display = 'block';
        } else {
          // Translation not available but requested, show loading and translate
          captionTranslation.innerHTML = `
            <div class="ekko-translation">Loading translation...</div>
          `;
          captionTranslation.style.display = 'block';
          
          // Trigger translation for this segment
          translateCurrentSegment();
        }
      } else {
        captionTranslation.style.display = 'none';
      }
    }
  }

  function createSegmentElement(segment) {
    // Simple text display without word highlighting
    return segment.text;
  }

  // Removed auto-sync - using manual navigation only like YouTubeShadowing.tsx
  
  // Find which segment corresponds to the current video time
  function findSegmentForTime(currentTime) {
    if (!segments.length) return -1;
    
    // Add a small tolerance for timing detection
    const tolerance = 0.5; // 500ms tolerance
    
    // First, try to find exact match with tolerance, preferring the current segment if it matches
    const currentSegment = segments[currentSegmentIndex];
    if (currentSegment && 
        currentTime >= (currentSegment.start - tolerance) && 
        currentTime <= (currentSegment.end + tolerance)) {
      return currentSegmentIndex; // Stay with current segment if time still matches
    }
    
    // Then try to find other exact matches
    for (let i = 0; i < segments.length; i++) {
      if (i === currentSegmentIndex) continue; // Already checked above
      const segment = segments[i];
      if (currentTime >= (segment.start - tolerance) && currentTime <= (segment.end + tolerance)) {
        return i;
      }
    }
    
    // If no exact match, find the closest segment
    let closestIndex = -1;
    let minDistance = Infinity;
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const startDistance = Math.abs(currentTime - segment.start);
      const endDistance = Math.abs(currentTime - segment.end);
      const minSegmentDistance = Math.min(startDistance, endDistance);
      
      if (minSegmentDistance < minDistance) {
        minDistance = minSegmentDistance;
        closestIndex = i;
      }
    }
    
    // Only return the closest segment if it's reasonably close (within 10 seconds)
    if (minDistance <= 10) {
      return closestIndex;
    }
    
    return -1; // No suitable segment found
  }

  // Removed highlighting functions as we're using simple text display

  function stopVideoSync() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  }

  function setCurrentSegment(index) {
    if (index < 0 || index >= segments.length) return;
    currentSegmentIndex = index;
  }

  // Navigate between segments (enhanced with video controller)
  async function navigateToSegment(direction) {
    if (!segments.length) return;
    
    console.log(`🧭 ${direction} → segment ${currentSegmentIndex + (direction === 'next' ? 1 : -1)}`);
    
    // Clear any existing timeout and stop current playback
    if (window.ekkoSegmentTimeout) {
      clearTimeout(window.ekkoSegmentTimeout);
      window.ekkoSegmentTimeout = null;
    }
    
    // Stop any ongoing segment playback
    if (window.ekkoVideoController) {
      window.ekkoVideoController.stopSegmentPlayback();
    }
    
    let newIndex = currentSegmentIndex;
    if (direction === 'next' && currentSegmentIndex < segments.length - 1) {
      newIndex = currentSegmentIndex + 1;
    } else if (direction === 'prev' && currentSegmentIndex > 0) {
      newIndex = currentSegmentIndex - 1;
    }

    if (newIndex !== currentSegmentIndex) {
      // Reset repeat count for new segment
      repeatCount = 0;
      updateRepeatCounter();
      
      // Update current segment
      setCurrentSegment(newIndex);
      updateCurrentCaption(newIndex);
      updateSegmentProgress();
      
      // Seek video to new segment using enhanced controller
      if (segments[newIndex]) {
        const segment = segments[newIndex];
        const start = typeof segment.start === 'number' ? segment.start : 0;
        
        try {
          // Use enhanced video controller for reliable seeking
          if (window.ekkoVideoController) {
            const seekSuccess = await window.ekkoVideoController.seekToTime(start);
            if (!seekSuccess) {
              // Fallback to old method
              pauseVideo();
              setTimeout(() => {
                seekToTime(start);
              }, 100);
            }
          } else {
            // Fallback to old method
            pauseVideo();
            setTimeout(() => {
              seekToTime(start);
            }, 100);
          }
        } catch (error) {
          console.error('❌ Error navigating to segment:', error);
        }
      }
    }
  }
  
  // Repeat current segment (enhanced with video controller)
  async function repeatSegment() {
    console.log('🔄 Repeat segment');
    
    if (!segments[currentSegmentIndex]) return;

    const segment = segments[currentSegmentIndex];
    const start = typeof segment.start === 'number' ? segment.start : 0;
    const end = typeof segment.end === 'number' ? segment.end : start + 5;
    
    // Clear any existing timeout
    if (window.ekkoSegmentTimeout) {
      clearTimeout(window.ekkoSegmentTimeout);
      window.ekkoSegmentTimeout = null;
    }
    
    try {
      // Use enhanced video controller for more reliable segment playback
      if (window.ekkoVideoController) {
        const success = await window.ekkoVideoController.playSegment(start, end);
        if (success) {
          // Increment repeat count
          repeatCount++;
          updateRepeatCounter();
        } else {
          // Fallback to old method
          await fallbackRepeatSegment(start, end);
        }
      } else {
        await fallbackRepeatSegment(start, end);
      }
      
    } catch (error) {
      console.error('❌ Error playing segment:', error);
      await fallbackRepeatSegment(start, end);
    }
  }
  
  // Fallback repeat segment method (original implementation)
  async function fallbackRepeatSegment(start, end) {
    try {
      // Seek to start
      seekToTime(start);
      
      // Play after a delay
      setTimeout(() => {
        if (playVideo()) {
          // Increment repeat count
          repeatCount++;
          updateRepeatCounter();
          
          // Set timer to auto-pause at segment end
          const duration = Math.max((end - start) * 1000, 1000);
          
          window.ekkoSegmentTimeout = setTimeout(() => {
            pauseVideo();
            window.ekkoSegmentTimeout = null;
          }, duration);
        }
      }, 100);
    } catch (error) {
      console.error('❌ Fallback repeat segment failed:', error);
    }
  }
  
  function updateRepeatCounter() {
    const counter = document.getElementById('ekko-repeat-counter');
    if (counter) {
      counter.textContent = repeatCount;
    }
  }
  
  function updateSegmentProgress() {
    const segmentNumber = document.getElementById('ekko-segment-number');
    const progressFill = document.getElementById('ekko-progress-fill');
    
    if (segmentNumber && segments.length > 0) {
      segmentNumber.textContent = `${currentSegmentIndex + 1} / ${segments.length}`;
    }
    
    if (progressFill && segments.length > 0) {
      const progress = ((currentSegmentIndex + 1) / segments.length) * 100;
      progressFill.style.width = `${progress}%`;
    }
  }

  // =====================================
  // AI PRACTICE FUNCTIONALITY
  // =====================================

  // AI Practice state
  let aiPracticeData = {
    questions: [],
    currentQuestionIndex: 0,
    isActive: false,
    videoInfo: null
  };

  // Toggle AI Practice panel visibility
  function toggleAIPracticePanel() {
    const captionPanel = document.getElementById('ekko-current-caption');
    const practicePanel = document.getElementById('ekko-ai-practice-panel');
    const toggleBtn = document.getElementById('ekko-ai-practice-toggle-btn');
    
    if (!captionPanel || !practicePanel || !toggleBtn) return;
    
    if (practicePanel.style.display === 'none') {
      // Show AI Practice, hide captions
      captionPanel.style.display = 'none';
      practicePanel.style.display = 'block';
      toggleBtn.classList.add('active');
      aiPracticeData.isActive = true;
    } else {
      // Show captions, hide AI Practice
      captionPanel.style.display = 'block';
      practicePanel.style.display = 'none';
      toggleBtn.classList.remove('active');
      aiPracticeData.isActive = false;
    }
  }

  // Setup AI Practice event listeners
  function setupAIPracticeEventListeners() {
    // Start practice button
    document.getElementById('ekko-start-practice-btn')?.addEventListener('click', () => {
      startAIPractice();
    });

    // Submit answer button
    document.getElementById('ekko-submit-answer-btn')?.addEventListener('click', () => {
      submitAIAnswer();
    });

    // Next question button
    document.getElementById('ekko-next-question-btn')?.addEventListener('click', () => {
      nextAIQuestion();
    });

    // Restart practice button
    document.getElementById('ekko-restart-practice-btn')?.addEventListener('click', () => {
      restartAIPractice();
    });

    // Retry practice button
    document.getElementById('ekko-retry-practice-btn')?.addEventListener('click', () => {
      restartAIPractice();
    });
  }

  // Start AI Practice session
  async function startAIPractice() {
    const videoId = getVideoId();
    if (!videoId) {
      showAIPracticeError('No video found. Please make sure you\'re on a YouTube video page.');
      return;
    }
    
    showAIPracticeState('loading');
    
    try {
      // Call background script to generate questions
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'GENERATE_QUESTIONS', videoId: videoId },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (!response.success || !response.questions) {
        throw new Error('Failed to generate questions');
      }
      
      // Store practice data
      aiPracticeData.questions = response.questions;
      aiPracticeData.currentQuestionIndex = 0;
      aiPracticeData.videoInfo = response.videoInfo;
      
      // Show first question
      showAIQuestion();
      
    } catch (error) {
      console.error('Error starting AI practice:', error);
      showAIPracticeError(error.message || 'Failed to start practice session');
    }
  }

  // Show current AI question
  function showAIQuestion() {
    const question = aiPracticeData.questions[aiPracticeData.currentQuestionIndex];
    if (!question) return;
    
    // Update question display
    const questionText = document.getElementById('ekko-question-text');
    const difficultyBadge = document.getElementById('ekko-question-difficulty');
    const questionNumber = document.getElementById('ekko-question-number');
    const userAnswer = document.getElementById('ekko-user-answer');
    
    if (questionText) questionText.textContent = question.question;
    if (difficultyBadge) {
      difficultyBadge.textContent = question.difficulty;
      difficultyBadge.className = `ekko-difficulty-badge ${question.difficulty}`;
    }
    if (questionNumber) {
      questionNumber.textContent = `Question ${aiPracticeData.currentQuestionIndex + 1} of ${aiPracticeData.questions.length}`;
    }
    if (userAnswer) userAnswer.value = '';
    
    // Update progress
    updateAIPracticeProgress();
    
    // Show question state
    showAIPracticeState('question');
  }

  // Submit answer for evaluation
  async function submitAIAnswer() {
    const userAnswerEl = document.getElementById('ekko-user-answer');
    const userAnswer = userAnswerEl?.value?.trim();
    
    if (!userAnswer) {
      alert('Please enter an answer before submitting.');
      return;
    }
    
    const question = aiPracticeData.questions[aiPracticeData.currentQuestionIndex];
    const submitBtn = document.getElementById('ekko-submit-answer-btn');
    const videoId = getVideoId();
    
    // Disable submit button and show loading
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Evaluating...';
    }
    
    try {
      // Call background script to evaluate answer
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'EVALUATE_ANSWER',
          question: question.question,
          userAnswer: userAnswer,
          videoId: videoId,
          expectedAnswer: question.expectedAnswer
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Show feedback
      showAIFeedback(userAnswer, response);
      
    } catch (error) {
      console.error('Error evaluating answer:', error);
      
      // Show error feedback
      showAIFeedback(userAnswer, {
        is_correct: false,
        feedback: 'Sorry, there was an error evaluating your answer. Please try again.',
        score: 0
      });
    } finally {
      // Reset submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Answer';
      }
    }
  }

  // Show feedback for the answer
  function showAIFeedback(userAnswer, feedback) {
    // Update feedback display
    const feedbackResult = document.getElementById('ekko-feedback-result');
    const feedbackScore = document.getElementById('ekko-feedback-score');
    const displayUserAnswer = document.getElementById('ekko-display-user-answer');
    const feedbackMessage = document.getElementById('ekko-feedback-message');
    const nextQuestionBtn = document.getElementById('ekko-next-question-btn');
    
    if (feedbackResult) {
      feedbackResult.textContent = feedback.is_correct ? '✓ Correct!' : '✗ Not quite right';
      feedbackResult.className = `ekko-feedback-result ${feedback.is_correct ? 'correct' : 'incorrect'}`;
    }
    
    if (feedbackScore) {
      feedbackScore.textContent = `${feedback.score}/100`;
      let scoreClass = 'low';
      if (feedback.score >= 80) scoreClass = 'high';
      else if (feedback.score >= 60) scoreClass = 'medium';
      feedbackScore.className = `ekko-feedback-score ${scoreClass}`;
    }
    
    if (displayUserAnswer) displayUserAnswer.textContent = userAnswer;
    if (feedbackMessage) feedbackMessage.textContent = feedback.feedback;
    
    // Update next button text
    if (nextQuestionBtn) {
      const isLastQuestion = aiPracticeData.currentQuestionIndex >= aiPracticeData.questions.length - 1;
      nextQuestionBtn.textContent = isLastQuestion ? 'Complete Practice' : 'Next Question';
    }
    
    showAIPracticeState('feedback');
  }

  // Move to next question or complete practice
  function nextAIQuestion() {
    aiPracticeData.currentQuestionIndex++;
    
    if (aiPracticeData.currentQuestionIndex >= aiPracticeData.questions.length) {
      // Practice complete
      showAIPracticeState('complete');
    } else {
      // Show next question
      showAIQuestion();
    }
  }

  // Restart practice session
  function restartAIPractice() {
    aiPracticeData.questions = [];
    aiPracticeData.currentQuestionIndex = 0;
    showAIPracticeState('setup');
  }

  // Update progress bar and text
  function updateAIPracticeProgress() {
    const progressText = document.getElementById('ekko-practice-progress-text');
    const progressFill = document.getElementById('ekko-practice-progress-fill');
    
    if (aiPracticeData.questions.length === 0) {
      if (progressText) progressText.textContent = 'Ready to start';
      if (progressFill) progressFill.style.width = '0%';
      return;
    }
    
    const progress = Math.round((aiPracticeData.currentQuestionIndex / aiPracticeData.questions.length) * 100);
    
    if (progressText) {
      progressText.textContent = `Question ${aiPracticeData.currentQuestionIndex + 1} of ${aiPracticeData.questions.length}`;
    }
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
  }

  // Show specific practice state
  function showAIPracticeState(state) {
    const states = ['setup', 'loading', 'question', 'feedback', 'complete', 'error'];
    
    states.forEach(s => {
      const element = document.getElementById(`ekko-practice-${s}`);
      if (element) {
        if (s === state) {
          element.style.display = 'block';
        } else {
          element.style.display = 'none';
        }
      }
    });
    
    // Update progress for specific states
    if (state === 'complete') {
      const progressText = document.getElementById('ekko-practice-progress-text');
      const progressFill = document.getElementById('ekko-practice-progress-fill');
      if (progressText) progressText.textContent = 'Practice complete!';
      if (progressFill) progressFill.style.width = '100%';
    }
  }

  // Show practice error
  function showAIPracticeError(message) {
    const errorMessage = document.getElementById('ekko-practice-error-message');
    if (errorMessage) errorMessage.textContent = message;
    showAIPracticeState('error');
  }

  // =====================================
  // END AI PRACTICE FUNCTIONALITY
  // =====================================


  // Keyboard shortcut handling
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      // Only handle shortcuts when theater mode is active
      if (!isTheaterMode) return;
      
      switch(e.key) {
        case ' ':
        case 'Space':
          e.preventDefault();
          console.log('Ekko: Space key pressed - calling repeatSegment');
          repeatSegment();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          console.log('Ekko: Arrow left pressed - navigating to previous segment');
          navigateToSegment('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          console.log('Ekko: Arrow right pressed - navigating to next segment');
          navigateToSegment('next');
          break;
        case 'Escape':
          e.preventDefault();
          console.log('Ekko: Escape pressed - closing theater mode');
          closeTheaterMode();
          break;
      }
    });
  }

  // Add consolidated debug functions to window for manual testing
  window.ekkoDebug = {
    // Video control functions
    getCurrentTime: getCurrentVideoTime,
    seekTo: seekToTime,
    seekToTime: (time) => seekToTime(time),
    play: playVideo,
    playVideo: () => playVideo(),
    pause: pauseVideo,
    pauseVideo: () => pauseVideo(),
    isPlaying: isVideoPlaying,
    getVideo: getMainVideoElement,
    
    // Segment functions
    getSegments: () => segments,
    getCurrentSegment: () => currentSegmentIndex,
    repeatSegment: () => repeatSegment(),
    navigate: navigateToSegment,
    navigateNext: () => navigateToSegment('next'),
    navigatePrev: () => navigateToSegment('prev'),
    
    // Debug and testing functions
    testVideoAccess: () => {
      console.log('=== Ekko Debug: Video Access Test ===');
      console.log('Theater mode active:', isTheaterMode);
      console.log('Current segment index:', currentSegmentIndex);
      console.log('Total segments:', segments.length);
      console.log('Video ID:', getVideoId());
      
      const video = getMainVideoElement();
      console.log('Main video element:', video);
      if (video) {
        console.log('Video current time:', video.currentTime);
        console.log('Video duration:', video.duration);
        console.log('Video paused:', video.paused);
        console.log('Video ready state:', video.readyState);
        console.log('Video dimensions:', video.videoWidth + 'x' + video.videoHeight);
      }
      
      console.log('Movie player API available:', !!window.movie_player);
      if (window.movie_player) {
        try {
          console.log('Movie player state:', window.movie_player.getPlayerState());
          console.log('Movie player current time:', window.movie_player.getCurrentTime());
        } catch (e) {
          console.log('Movie player error:', e);
        }
      }
      
      if (segments.length > 0 && currentSegmentIndex >= 0) {
        console.log('Current segment:', segments[currentSegmentIndex]);
      }
      console.log('=== End Test ===');
    },
    
    debugButton: () => {
      console.log('=== Ekko Debug: Button Status ===');
      const controls = document.querySelector(YOUTUBE_PLAYER_CONTROLS_SELECTOR);
      console.log('Controls found:', !!controls);
      if (controls) {
        console.log('Controls element:', controls);
        console.log('Controls children:', Array.from(controls.children).map(c => c.className));
      }
      
      const button = document.getElementById(EKKO_BUTTON_ID);
      console.log('Button exists:', !!button);
      if (button) {
        console.log('Button element:', button);
        console.log('Button parent:', button.parentElement);
        console.log('Button styles:', {
          display: window.getComputedStyle(button).display,
          visibility: window.getComputedStyle(button).visibility,
          opacity: window.getComputedStyle(button).opacity,
          position: window.getComputedStyle(button).position,
          zIndex: window.getComputedStyle(button).zIndex
        });
        console.log('Button bounding rect:', button.getBoundingClientRect());
      }
      
      const fullscreenBtn = document.querySelector(FULLSCREEN_BUTTON_SELECTOR);
      console.log('Fullscreen button found:', !!fullscreenBtn);
      
      const settingsBtn = document.querySelector('.ytp-settings-button');
      console.log('Settings button found:', !!settingsBtn);
      
      console.log('=== End Button Debug ===');
    },
    
    forceInject: () => {
      console.log('=== Ekko Debug: Force Injecting Button ===');
      // Remove any existing button first
      const existing = document.getElementById(EKKO_BUTTON_ID);
      if (existing) {
        existing.remove();
        console.log('Removed existing button');
      }
      injectEkkoButton();
      console.log('=== Force Inject Complete ===');
    }
  };

  // Expose close function to enhanced theater mode
  window.ekkoCloseTheaterMode = closeTheaterMode;
  
  init();

})();