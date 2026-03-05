// player.js - Theater mode player functionality

// Configuration (loaded from config.js via script tag)
const YOUTUBE_API_BASE = 'https://www.youtube.com/watch?v=';
const SUPABASE_URL = EKKO_CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = EKKO_CONFIG.SUPABASE_ANON_KEY;

// State
let player = null;
let videoId = null;
let segments = [];
let currentSegmentIndex = 0;
let isPlaying = false;
let autoRepeat = true;
let showTranslation = true;
let learningDirection = 'en-ko'; // Default: English speaker learning Korean
let segmentTimer = null;

// Load YouTube IFrame API dynamically
function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    // Set up the callback
    window.onYouTubeIframeAPIReady = resolve;

    // Create and append script tag
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => reject(new Error('Failed to load YouTube API'));
    
    // Add to head
    document.head.appendChild(script);
  });
}

// Get video ID from URL parameters
function getVideoIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('videoId');
}

// Initialize the player
async function init() {
  console.log('Initializing Ekko player...');
  
  // Get video ID
  videoId = getVideoIdFromUrl();
  if (!videoId) {
    showError('No video ID provided');
    return;
  }
  
  // Load user preferences
  await loadUserPreferences();
  
  // Set up event listeners
  setupEventListeners();
  
  // Show loading spinner
  showLoading(true);
  
  try {
    // Load YouTube API dynamically
    console.log('Loading YouTube API...');
    await loadYouTubeAPI();
    console.log('YouTube API loaded successfully');
    
    // Initialize player
    initializeYouTubePlayer();
    
    // Fetch transcript
    await fetchTranscript();
  } catch (error) {
    console.error('Failed to load YouTube API:', error);
    showError('Failed to load video player. Please try refreshing the page.');
  }
}

// Initialize YouTube player
function initializeYouTubePlayer() {
  player = new YT.Player('youtube-player', {
    height: '100%',
    width: '100%',
    videoId: videoId,
    playerVars: {
      'autoplay': 0,
      'controls': 0,
      'disablekb': 1,
      'fs': 0,
      'modestbranding': 1,
      'rel': 0,
      'showinfo': 0,
      'iv_load_policy': 3,
      'cc_load_policy': 0,
      'cc_lang_pref': learningDirection === 'en-ko' ? 'ko' : 'en',
      'hl': learningDirection === 'en-ko' ? 'ko' : 'en'
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}

// Player ready callback
function onPlayerReady(event) {
  console.log('YouTube player ready');
  showLoading(false);
  
  // Set initial playback speed
  const speedSelect = document.getElementById('speed-select');
  player.setPlaybackRate(parseFloat(speedSelect.value));
}

// Player state change callback
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    isPlaying = false;
  }
}

// Player error callback
function onPlayerError(event) {
  console.error('YouTube player error:', event);
  showError('Failed to load video');
}

// Fetch transcript from Supabase API
async function fetchTranscript() {
  try {
    console.log('Fetching transcript for video:', videoId);
    
    // Call Supabase function to get transcript
    const response = await fetch(`${SUPABASE_URL}/functions/v1/youtube-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': chrome.runtime.getURL('')
      },
      body: JSON.stringify({ videoId: videoId })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received transcript data:', data);

    if (!data.success || !data.transcript || data.transcript.length === 0) {
      throw new Error(data.error || 'No transcript available for this video');
    }

    // Process transcript into optimized segments
    const rawTranscript = data.transcript;
    const processedSegments = processTranscriptIntoSentences(rawTranscript, 1, 5.0);
    
    // Validate segments
    const validSegments = processedSegments.filter((seg) => {
      const hasValidTiming =
        typeof seg.start === 'number' && typeof seg.end === 'number';
      return hasValidTiming && seg.text && seg.text.trim().length > 0;
    });

    if (validSegments.length === 0) {
      throw new Error('Unable to extract valid timing information from transcript');
    }

    console.log(`Processed ${validSegments.length} valid segments`);
    segments = validSegments;
    
    // Get translations for each segment
    await translateSegments();
    
    // Render transcript
    renderTranscript();
    
    // Update segment count
    document.getElementById('total-segments').textContent = segments.length;
    
    // Highlight first segment
    setCurrentSegment(0);
    
  } catch (error) {
    console.error('Failed to fetch transcript:', error);
    showError(`Failed to load transcript: ${error.message}`);
  }
}

// Process transcript into sentence-based segments (ported from main app)
function processTranscriptIntoSentences(
  transcript,
  sentencesPerSegment = 1,
  minSegmentDuration = 5.0
) {
  if (!transcript || transcript.length === 0) return [];

  console.log('Processing transcript with', transcript.length, 'segments');
  console.log('Raw transcript sample:', transcript.slice(0, 2));
  console.log(`Min segment duration: ${minSegmentDuration}s, Sentences per segment: ${sentencesPerSegment}`);

  // First, filter out invalid segments
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
    
    // Initialize the first group
    if (currentGroupStart === null) {
      currentGroupStart = segment.start;
      currentGroupEnd = segment.end;
      currentGroup = [segment];
      currentGroupText = [segment.text.trim()];
      continue;
    }

    // Calculate current group duration
    const currentDuration = currentGroupEnd - currentGroupStart;
    
    // Check if we should add this segment to the current group
    const shouldAddToGroup = 
      currentDuration < minSegmentDuration || // Group is too short
      currentGroup.length < sentencesPerSegment || // Haven't reached target sentences
      (!segment.text.match(/[.!?]$/) && currentDuration < minSegmentDuration * 1.5); // Incomplete sentence and not too long

    if (shouldAddToGroup) {
      // Add to current group
      currentGroup.push(segment);
      currentGroupEnd = segment.end;
      currentGroupText.push(segment.text.trim());
    } else {
      // Finalize current group and start a new one
      const combinedText = currentGroupText.join(' ').trim();
      
      // Only create segment if it has meaningful content
      if (combinedText.length > 0) {
        processedSegments.push({
          text: combinedText,
          start: currentGroupStart,
          end: currentGroupEnd,
        });
      }

      // Start new group
      currentGroupStart = segment.start;
      currentGroupEnd = segment.end;
      currentGroup = [segment];
      currentGroupText = [segment.text.trim()];
    }
  }

  // Don't forget the last group
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

  // Post-process: merge very short segments with adjacent ones
  const finalSegments = [];
  
  for (let i = 0; i < processedSegments.length; i++) {
    const segment = processedSegments[i];
    const duration = segment.end - segment.start;
    
    // If segment is still too short and we can merge with the next one
    if (duration < minSegmentDuration && i < processedSegments.length - 1) {
      const nextSegment = processedSegments[i + 1];
      const mergedSegment = {
        text: `${segment.text} ${nextSegment.text}`.trim(),
        start: segment.start,
        end: nextSegment.end,
      };
      
      // Skip the next segment since we're merging it
      i++;
      finalSegments.push(mergedSegment);
    } else {
      finalSegments.push(segment);
    }
  }

  console.log(`Created ${finalSegments.length} optimized segments`);
  console.log('Sample processed segment:', finalSegments[0]);
  
  // Log duration statistics
  const durations = finalSegments.map(s => s.end - s.start);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  
  console.log(`Segment duration stats - Min: ${minDuration.toFixed(1)}s, Avg: ${avgDuration.toFixed(1)}s, Max: ${maxDuration.toFixed(1)}s`);

  return finalSegments;
}

// Render transcript segments
function renderTranscript() {
  const transcriptList = document.getElementById('transcript-list');
  transcriptList.innerHTML = '';
  
  segments.forEach((segment, index) => {
    const segmentEl = createSegmentElement(segment, index);
    transcriptList.appendChild(segmentEl);
  });
}

// Create segment element
function createSegmentElement(segment, index) {
  const div = document.createElement('div');
  div.className = 'transcript-segment';
  div.dataset.index = index;
  
  // Use the actual transcript text - translation will be added later if needed
  const primaryText = segment.text;
  const secondaryText = segment.translation || '[Translation pending...]';
  
  div.innerHTML = `
    <div class="segment-number">Segment ${index + 1}</div>
    <div class="segment-text primary">${primaryText}</div>
    ${showTranslation ? `<div class="segment-translation">${secondaryText}</div>` : ''}
  `;
  
  // Click handler
  div.addEventListener('click', () => {
    setCurrentSegment(index);
    playCurrentSegment();
  });
  
  return div;
}

// Set current segment
function setCurrentSegment(index) {
  if (index < 0 || index >= segments.length) return;
  
  currentSegmentIndex = index;
  
  // Update UI
  document.getElementById('current-segment').textContent = index + 1;
  
  // Update segment highlighting
  document.querySelectorAll('.transcript-segment').forEach((el, i) => {
    el.classList.toggle('active', i === index);
    el.classList.remove('playing');
  });
  
  // Scroll to segment
  const activeSegment = document.querySelector(`.transcript-segment[data-index="${index}"]`);
  if (activeSegment) {
    activeSegment.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Play current segment
function playCurrentSegment() {
  if (!player || !segments[currentSegmentIndex]) return;
  
  const segment = segments[currentSegmentIndex];
  
  // Clear any existing timer
  if (segmentTimer) {
    clearTimeout(segmentTimer);
  }
  
  // Seek to start
  player.seekTo(segment.start, true);
  player.playVideo();
  
  // Highlight playing segment
  const segmentEl = document.querySelector(`.transcript-segment[data-index="${currentSegmentIndex}"]`);
  if (segmentEl) {
    segmentEl.classList.add('playing');
  }
  
  // Set timer to pause at segment end
  const duration = (segment.end - segment.start) * 1000;
  segmentTimer = setTimeout(() => {
    player.pauseVideo();
    
    // Remove playing highlight
    if (segmentEl) {
      segmentEl.classList.remove('playing');
    }
    
    // Auto-advance if enabled and not at the last segment
    if (autoRepeat && currentSegmentIndex < segments.length - 1) {
      setTimeout(() => {
        navigateSegment('next');
        // The new segment will be ready after navigation, play it
        setTimeout(() => {
          playCurrentSegment();
        }, 200);
      }, 1000);
    }
  }, duration);
}

// Navigation functions
function previousSegment() {
  navigateSegment('prev');
}

function nextSegment() {
  navigateSegment('next');
}

// Enhanced navigation function similar to YouTubeShadowing.tsx
function navigateSegment(direction) {
  // Clear any existing segment timer
  if (segmentTimer) {
    clearTimeout(segmentTimer);
    segmentTimer = null;
  }
  
  // Stop current playback
  if (player && isPlaying) {
    player.pauseVideo();
  }
  
  // Remove playing highlight from current segment
  const currentSegmentEl = document.querySelector(`.transcript-segment[data-index="${currentSegmentIndex}"]`);
  if (currentSegmentEl) {
    currentSegmentEl.classList.remove('playing');
  }
  
  let newIndex = currentSegmentIndex;
  if (direction === 'next' && currentSegmentIndex < segments.length - 1) {
    newIndex = currentSegmentIndex + 1;
  } else if (direction === 'prev' && currentSegmentIndex > 0) {
    newIndex = currentSegmentIndex - 1;
  }
  
  // Only navigate if the index actually changes
  if (newIndex !== currentSegmentIndex) {
    setCurrentSegment(newIndex);
    
    // Seek to the new segment's start time
    if (player && segments[newIndex]) {
      const segment = segments[newIndex];
      try {
        player.seekTo(segment.start, true);
      } catch (error) {
        console.error('Error seeking to new segment:', error);
      }
    }
  }
}

// Load user preferences
async function loadUserPreferences() {
  try {
    const result = await chrome.storage.local.get([
      'learningDirection',
      'playbackSpeed',
      'autoRepeat',
      'showTranslation'
    ]);
    
    if (result.learningDirection) {
      learningDirection = result.learningDirection;
      document.getElementById('language-direction').value = learningDirection;
    }
    
    if (result.playbackSpeed) {
      document.getElementById('speed-select').value = result.playbackSpeed;
    }
    
    if (typeof result.autoRepeat !== 'undefined') {
      autoRepeat = result.autoRepeat;
      document.getElementById('auto-repeat').classList.toggle('active', autoRepeat);
    }
    
    if (typeof result.showTranslation !== 'undefined') {
      showTranslation = result.showTranslation;
      document.getElementById('toggle-translation').classList.toggle('active', showTranslation);
    }
  } catch (error) {
    console.error('Failed to load preferences:', error);
  }
}

// Save user preferences
async function saveUserPreferences() {
  try {
    await chrome.storage.local.set({
      learningDirection: learningDirection,
      playbackSpeed: document.getElementById('speed-select').value,
      autoRepeat: autoRepeat,
      showTranslation: showTranslation
    });
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Close button
  document.getElementById('close-btn').addEventListener('click', () => {
    window.close();
  });
  
  // Navigation buttons
  document.getElementById('prev-segment').addEventListener('click', previousSegment);
  document.getElementById('replay-segment').addEventListener('click', playCurrentSegment);
  document.getElementById('next-segment').addEventListener('click', nextSegment);
  
  // Speed control
  document.getElementById('speed-select').addEventListener('change', (e) => {
    if (player) {
      player.setPlaybackRate(parseFloat(e.target.value));
    }
    saveUserPreferences();
  });
  
  // Auto-repeat toggle
  document.getElementById('auto-repeat').addEventListener('click', () => {
    autoRepeat = !autoRepeat;
    document.getElementById('auto-repeat').classList.toggle('active', autoRepeat);
    saveUserPreferences();
  });
  
  // Translation toggle
  document.getElementById('toggle-translation').addEventListener('click', () => {
    showTranslation = !showTranslation;
    document.getElementById('toggle-translation').classList.toggle('active', showTranslation);
    document.getElementById('toggle-translation').textContent = showTranslation ? 'Show Translation' : 'Hide Translation';
    renderTranscript();
    saveUserPreferences();
  });
  
  // Language direction change
  document.getElementById('language-direction').addEventListener('change', (e) => {
    learningDirection = e.target.value;
    renderTranscript();
    saveUserPreferences();
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    switch(e.key) {
      case ' ':
        e.preventDefault();
        playCurrentSegment();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        navigateSegment('prev');
        break;
      case 'ArrowRight':
        e.preventDefault();
        navigateSegment('next');
        break;
    }
  });
}

// Add translation functionality
async function translateSegments() {
  console.log('Adding translations to segments...');
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    try {
      if (learningDirection === 'en-ko') {
        // Korean text needs English translation
        segment.translation = await translateText(segment.text, 'ko', 'en');
      } else {
        // English text needs Korean translation
        segment.translation = await translateText(segment.text, 'en', 'ko');
      }
    } catch (error) {
      console.error(`Failed to translate segment ${i}:`, error);
      segment.translation = `[Translation unavailable] ${segment.text}`;
    }
    
    // Add a small delay to avoid rate limiting
    if (i < segments.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('Translation complete');
}

// Translate text using MyMemory API (free translation service)
async function translateText(text, sourceLang, targetLang) {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${sourceLang}|${targetLang}`
    );

    if (!response.ok) {
      throw new Error('Translation service unavailable');
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    } else {
      throw new Error('Translation failed');
    }
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback: return original text with a note
    return `[Translation unavailable] ${text}`;
  }
}

// Utility functions
function showLoading(show) {
  const spinner = document.getElementById('loading-spinner');
  spinner.classList.toggle('active', show);
}

function showError(message) {
  console.error(message);
  // TODO: Implement proper error UI
  alert(message);
}

// =====================================
// AI PRACTICE FUNCTIONALITY
// =====================================

// AI Practice state
let practiceData = {
  questions: [],
  currentQuestionIndex: 0,
  isActive: false,
  videoInfo: null
};

// Initialize AI Practice event listeners
function initAIPractice() {
  // Mode toggle buttons
  const practiceBtn = document.getElementById('practice-mode-btn');
  const transcriptBtn = document.getElementById('transcript-mode-btn');
  
  practiceBtn?.addEventListener('click', () => switchToAIPractice());
  transcriptBtn?.addEventListener('click', () => switchToTranscript());
  
  // AI Practice buttons
  const startPracticeBtn = document.getElementById('start-practice-btn');
  const submitAnswerBtn = document.getElementById('submit-answer-btn');
  const nextQuestionBtn = document.getElementById('next-question-btn');
  const restartPracticeBtn = document.getElementById('restart-practice-btn');
  const retryPracticeBtn = document.getElementById('retry-practice-btn');
  
  startPracticeBtn?.addEventListener('click', () => startAIPractice());
  submitAnswerBtn?.addEventListener('click', () => submitAnswer());
  nextQuestionBtn?.addEventListener('click', () => nextQuestion());
  restartPracticeBtn?.addEventListener('click', () => restartPractice());
  retryPracticeBtn?.addEventListener('click', () => restartPractice());
}

// Switch to AI Practice mode
function switchToAIPractice() {
  const practiceBtn = document.getElementById('practice-mode-btn');
  const transcriptBtn = document.getElementById('transcript-mode-btn');
  const transcriptContainer = document.getElementById('transcript-container');
  const practiceContainer = document.getElementById('ai-practice-container');
  
  // Update button states
  practiceBtn?.classList.add('active');
  transcriptBtn?.classList.remove('active');
  
  // Toggle containers
  transcriptContainer?.classList.add('hidden');
  practiceContainer?.classList.remove('hidden');
  
  practiceData.isActive = true;
}

// Switch to Transcript mode
function switchToTranscript() {
  const practiceBtn = document.getElementById('practice-mode-btn');
  const transcriptBtn = document.getElementById('transcript-mode-btn');
  const transcriptContainer = document.getElementById('transcript-container');
  const practiceContainer = document.getElementById('ai-practice-container');
  
  // Update button states
  practiceBtn?.classList.remove('active');
  transcriptBtn?.classList.add('active');
  
  // Toggle containers
  transcriptContainer?.classList.remove('hidden');
  practiceContainer?.classList.add('hidden');
  
  practiceData.isActive = false;
}

// Start AI Practice session
async function startAIPractice() {
  if (!videoId) {
    showPracticeError('No video loaded. Please load a video first.');
    return;
  }
  
  showPracticeState('loading');
  
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
    practiceData.questions = response.questions;
    practiceData.currentQuestionIndex = 0;
    practiceData.videoInfo = response.videoInfo;
    
    // Show first question
    showQuestion();
    
  } catch (error) {
    console.error('Error starting AI practice:', error);
    showPracticeError(error.message || 'Failed to start practice session');
  }
}

// Show current question
function showQuestion() {
  const question = practiceData.questions[practiceData.currentQuestionIndex];
  if (!question) return;
  
  // Update question display
  const questionText = document.getElementById('question-text');
  const difficultyBadge = document.getElementById('question-difficulty');
  const questionNumber = document.getElementById('question-number');
  const userAnswer = document.getElementById('user-answer');
  
  if (questionText) questionText.textContent = question.question;
  if (difficultyBadge) {
    difficultyBadge.textContent = question.difficulty;
    difficultyBadge.className = `difficulty-badge ${question.difficulty}`;
  }
  if (questionNumber) {
    questionNumber.textContent = `Question ${practiceData.currentQuestionIndex + 1} of ${practiceData.questions.length}`;
  }
  if (userAnswer) userAnswer.value = '';
  
  // Update progress
  updateProgress();
  
  // Show question state
  showPracticeState('question');
}

// Submit answer for evaluation
async function submitAnswer() {
  const userAnswerEl = document.getElementById('user-answer');
  const userAnswer = userAnswerEl?.value?.trim();
  
  if (!userAnswer) {
    alert('Please enter an answer before submitting.');
    return;
  }
  
  const question = practiceData.questions[practiceData.currentQuestionIndex];
  const submitBtn = document.getElementById('submit-answer-btn');
  
  // Disable submit button and show loading
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div class="spinner" style="width: 16px; height: 16px; margin-right: 8px;"></div>
      Evaluating...
    `;
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
    showFeedback(userAnswer, response);
    
  } catch (error) {
    console.error('Error evaluating answer:', error);
    
    // Show error feedback
    showFeedback(userAnswer, {
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
function showFeedback(userAnswer, feedback) {
  // Update feedback display
  const feedbackResult = document.getElementById('feedback-result');
  const feedbackScore = document.getElementById('feedback-score');
  const displayUserAnswer = document.getElementById('display-user-answer');
  const feedbackMessage = document.getElementById('feedback-message');
  const nextQuestionBtn = document.getElementById('next-question-btn');
  
  if (feedbackResult) {
    feedbackResult.textContent = feedback.is_correct ? '✓ Correct!' : '✗ Not quite right';
    feedbackResult.className = `feedback-result ${feedback.is_correct ? 'correct' : 'incorrect'}`;
  }
  
  if (feedbackScore) {
    feedbackScore.textContent = `${feedback.score}/100`;
    let scoreClass = 'low';
    if (feedback.score >= 80) scoreClass = 'high';
    else if (feedback.score >= 60) scoreClass = 'medium';
    feedbackScore.className = `feedback-score ${scoreClass}`;
  }
  
  if (displayUserAnswer) displayUserAnswer.textContent = userAnswer;
  if (feedbackMessage) feedbackMessage.textContent = feedback.feedback;
  
  // Update next button text
  if (nextQuestionBtn) {
    const isLastQuestion = practiceData.currentQuestionIndex >= practiceData.questions.length - 1;
    nextQuestionBtn.textContent = isLastQuestion ? 'Complete Practice' : 'Next Question';
  }
  
  showPracticeState('feedback');
}

// Move to next question or complete practice
function nextQuestion() {
  practiceData.currentQuestionIndex++;
  
  if (practiceData.currentQuestionIndex >= practiceData.questions.length) {
    // Practice complete
    showPracticeState('complete');
  } else {
    // Show next question
    showQuestion();
  }
}

// Restart practice session
function restartPractice() {
  practiceData.questions = [];
  practiceData.currentQuestionIndex = 0;
  showPracticeState('setup');
}

// Update progress bar and text
function updateProgress() {
  const progressText = document.getElementById('practice-progress-text');
  const progressFill = document.getElementById('practice-progress-fill');
  
  if (practiceData.questions.length === 0) {
    if (progressText) progressText.textContent = 'Ready to start';
    if (progressFill) progressFill.style.width = '0%';
    return;
  }
  
  const progress = Math.round((practiceData.currentQuestionIndex / practiceData.questions.length) * 100);
  
  if (progressText) {
    progressText.textContent = `Question ${practiceData.currentQuestionIndex + 1} of ${practiceData.questions.length}`;
  }
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
}

// Show specific practice state
function showPracticeState(state) {
  const states = ['setup', 'loading', 'question', 'feedback', 'complete', 'error'];
  
  states.forEach(s => {
    const element = document.getElementById(`practice-${s}`);
    if (element) {
      if (s === state) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    }
  });
  
  // Update progress for specific states
  if (state === 'complete') {
    const progressText = document.getElementById('practice-progress-text');
    const progressFill = document.getElementById('practice-progress-fill');
    if (progressText) progressText.textContent = 'Practice complete!';
    if (progressFill) progressFill.style.width = '100%';
  }
}

// Show practice error
function showPracticeError(message) {
  const errorMessage = document.getElementById('practice-error-message');
  if (errorMessage) errorMessage.textContent = message;
  showPracticeState('error');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initAIPractice();
  });
} else {
  init();
  initAIPractice();
}
