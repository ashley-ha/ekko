// background.js - Service worker for the extension
importScripts('../config.js');
console.log('Ekko Extension: Background service worker started');

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background: Received message', request);
  
  if (request.type === 'PING') {
    console.log('Background: Responding to ping');
    sendResponse({pong: true, timestamp: Date.now()});
    return false;
  }
  
  if (request.type === 'OPEN_PLAYER') {
    // Open the player page in a new tab
    chrome.tabs.create({
      url: request.url,
      active: true
    });
    sendResponse({success: true});
    return false;
  } else if (request.type === 'FETCH_YOUTUBE_TRANSCRIPT') {
    // Handle transcript fetching
    const fetchAndRespond = async () => {
      try {
        const videoId = request.videoId;
        console.log('Background: Starting transcript fetch for video ID:', videoId);
        console.log('Background: Video ID type:', typeof videoId, 'Length:', videoId ? videoId.length : 'N/A');
        
        if (!videoId) {
          throw new Error('No video ID provided');
        }
        
        // Check if we received a full URL instead of a video ID
        if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
          console.error('Background: Received full URL instead of video ID:', videoId);
          throw new Error(`Invalid video ID format: received full URL "${videoId}". Expected just the video ID.`);
        }
        
        // Validate video ID format
        if (typeof videoId !== 'string' || videoId.length < 10 || videoId.length > 20) {
          throw new Error(`Invalid video ID format: "${videoId}". Expected 10-20 character string.`);
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(videoId)) {
          throw new Error(`Invalid video ID characters: "${videoId}". Expected alphanumeric, underscore, and dash only.`);
        }
        
        // Supabase config (loaded from config.js via importScripts)
        const SUPABASE_URL = EKKO_CONFIG.SUPABASE_URL;
        const SUPABASE_ANON_KEY = EKKO_CONFIG.SUPABASE_ANON_KEY;

        console.log('Background: Making API call to:', `${SUPABASE_URL}/functions/v1/youtube-transcript`);
        
        // First, test if we can make any external request at all
        console.log('Background: Testing basic external request capability...');
        try {
          const testResponse = await fetch('https://httpbin.org/get');
          console.log('Background: Basic external request test:', testResponse.status);
        } catch (testError) {
          console.error('Background: Basic external request failed:', testError);
          throw new Error(`Background script cannot make external requests: ${testError.message}`);
        }

        console.log('Background: Attempting Supabase request...');
        const requestDetails = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'x-client-info': 'chrome-extension',
            'Accept': 'application/json',
            'Origin': chrome.runtime.getURL('')
          },
          body: JSON.stringify({ videoId: videoId }),
          mode: 'cors',
          credentials: 'omit'
        };
        
        console.log('Background: Request details:', {
          url: `${SUPABASE_URL}/functions/v1/youtube-transcript`,
          method: requestDetails.method,
          headers: requestDetails.headers,
          bodyLength: requestDetails.body.length
        });
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/youtube-transcript`, requestDetails);

        console.log('Background: Response status:', response.status);
        console.log('Background: Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Background: Response error text:', errorText);
          throw new Error(`Supabase function failed with status: ${response.status}. Error: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Background: Received data:', data);
        
        if (data.success === false) {
          console.error('Background: API returned failure:', data.error);
          throw new Error(data.error || 'Failed to fetch transcript from the server');
        }
        
        console.log('Background: Successfully fetched transcript, sending response');
        // Return the transcript data in the same format as the web app
        sendResponse({ 
          transcript: data.transcript, 
          videoInfo: data.videoInfo,
          cached: data.cached,
          languageCode: data.languageCode
        });
      } catch (error) {
        console.error('Background: Error in fetchAndRespond:', error);
        sendResponse({ error: error.message || 'Unknown error occurred' });
      }
    };

    fetchAndRespond().catch(error => {
      console.error('Background: Unhandled error in fetchAndRespond:', error);
      sendResponse({ error: 'Unhandled error: ' + error.message });
    });
    return true; // Indicates you will send a response asynchronously
  } else if (request.type === 'GENERATE_QUESTIONS') {
    // Handle AI practice question generation
    const generateQuestions = async () => {
      try {
        const videoId = request.videoId;
        console.log('Background: Generating questions for video ID:', videoId);
        
        if (!videoId) {
          throw new Error('No video ID provided');
        }
        
        // Supabase config (loaded from config.js via importScripts)
        const SUPABASE_URL = EKKO_CONFIG.SUPABASE_URL;
        const SUPABASE_ANON_KEY = EKKO_CONFIG.SUPABASE_ANON_KEY;

        console.log('Background: Calling generate-questions function...');
        const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'x-client-info': 'chrome-extension',
            'Accept': 'application/json',
            'Origin': chrome.runtime.getURL('')
          },
          body: JSON.stringify({ videoId: videoId }),
          mode: 'cors',
          credentials: 'omit'
        });

        console.log('Background: Generate questions response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Background: Generate questions error:', errorText);
          throw new Error(`Failed to generate questions: ${response.status}. ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Background: Generated questions:', data);
        
        if (data.success === false) {
          throw new Error(data.error || 'Failed to generate questions');
        }
        
        sendResponse({
          questions: data.questions,
          videoInfo: data.videoInfo,
          success: true
        });
      } catch (error) {
        console.error('Background: Error generating questions:', error);
        sendResponse({ 
          error: error.message || 'Unknown error occurred',
          success: false 
        });
      }
    };

    generateQuestions().catch(error => {
      console.error('Background: Unhandled error in generateQuestions:', error);
      sendResponse({ error: 'Unhandled error: ' + error.message, success: false });
    });
    return true;
  } else if (request.type === 'EVALUATE_ANSWER') {
    // Handle AI answer evaluation
    const evaluateAnswer = async () => {
      try {
        const { question, userAnswer, videoId, expectedAnswer } = request;
        console.log('Background: Evaluating answer for video ID:', videoId);
        
        if (!question || !userAnswer || !videoId) {
          throw new Error('Missing required parameters: question, userAnswer, and videoId');
        }
        
        // Supabase config (loaded from config.js via importScripts)
        const SUPABASE_URL = EKKO_CONFIG.SUPABASE_URL;
        const SUPABASE_ANON_KEY = EKKO_CONFIG.SUPABASE_ANON_KEY;

        console.log('Background: Calling evaluate_answer function...');
        const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate_answer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
            'x-client-info': 'chrome-extension',
            'Accept': 'application/json',
            'Origin': chrome.runtime.getURL('')
          },
          body: JSON.stringify({ 
            question,
            userAnswer,
            videoId,
            expectedAnswer
          }),
          mode: 'cors',
          credentials: 'omit'
        });

        console.log('Background: Evaluate answer response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Background: Evaluate answer error:', errorText);
          throw new Error(`Failed to evaluate answer: ${response.status}. ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Background: Answer evaluation result:', data);
        
        if (data.success === false) {
          throw new Error(data.error || 'Failed to evaluate answer');
        }
        
        sendResponse({
          is_correct: data.is_correct,
          feedback: data.feedback,
          score: data.score,
          success: true
        });
      } catch (error) {
        console.error('Background: Error evaluating answer:', error);
        sendResponse({ 
          error: error.message || 'Unknown error occurred',
          success: false,
          is_correct: false,
          feedback: 'Sorry, there was an error evaluating your answer. Please try again.',
          score: 0
        });
      }
    };

    evaluateAnswer().catch(error => {
      console.error('Background: Unhandled error in evaluateAnswer:', error);
      sendResponse({ 
        error: 'Unhandled error: ' + error.message, 
        success: false,
        is_correct: false,
        feedback: 'Sorry, there was an error evaluating your answer. Please try again.',
        score: 0
      });
    });
    return true;
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Ekko Extension: Installed');
  
  // Set default storage values
  chrome.storage.local.set({
    learningDirection: 'en-ko', // Default: English speaker learning Korean
    playbackSpeed: 1.0,
    autoRepeat: true,
    showTranslation: true
  });
});

// Handle tab updates to check if we're on YouTube
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isYouTube = tab.url.includes('youtube.com') || tab.url.includes('youtu.be');
    
    if (isYouTube) {
      // Inject content script if not already injected
      chrome.tabs.sendMessage(tabId, { type: 'CHECK_VIDEO_PAGE' }, () => {
        if (chrome.runtime.lastError) {
          // Content script not injected, inject it
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['src/content/content.js']
          }).catch(error => {
            console.error('Background: Failed to inject content script:', error);
          });
          
          chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: ['src/content/content.css']
          }).catch(error => {
            console.error('Background: Failed to inject CSS:', error);
          });
        }
      });
    }
  }
});

// Handle extension icon click (optional popup)
chrome.action.onClicked.addListener(() => {
  console.log('Extension icon clicked');
  // For now, we'll rely on the injected button
  // Later we can add a popup for settings
});
