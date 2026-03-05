// Enhanced Theater Mode - Simple time-based video control for language learning
(() => {
  'use strict';

  console.log('Loading Enhanced Theater Mode');

  class EkkoTheaterMode {
    constructor() {
      this.isActive = false;
      this.player = null;
      this.videoId = null;
      this.currentTime = 0;
      this.repetitionCount = 0;
      this.isPlaying = false;
      this.skipSeconds = 10; // Default skip amount
      this.repeatStartTime = 0;
      this.isRepeating = false;
      
      // UI elements
      this.theaterContainer = null;
      this.playerContainer = null;
      
      // Bind methods
      this.handleKeyPress = this.handleKeyPress.bind(this);
      this.handlePlayerReady = this.handlePlayerReady.bind(this);
      this.handlePlayerStateChange = this.handlePlayerStateChange.bind(this);
    }

    async activate(videoId) {
      if (this.isActive) {
        await this.deactivate();
      }

      this.videoId = videoId;
      this.isActive = true;

      try {
        // Create theater mode UI
        this.createTheaterUI();
        
        // Load YouTube API and initialize player
        await this.loadYouTubeAPI();
        this.initializePlayer();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('Ekko Theater Mode activated successfully');
      } catch (error) {
        console.error('Failed to activate theater mode:', error);
        this.showError('Failed to initialize theater mode');
        await this.deactivate();
      }
    }

    async deactivate() {
      if (!this.isActive) return;

      // Cleanup
      this.removeEventListeners();
      
      if (this.player) {
        try {
          this.player.destroy();
        } catch (error) {
          console.warn('Error destroying player:', error);
        }
        this.player = null;
      }

      if (this.theaterContainer) {
        this.theaterContainer.remove();
        this.theaterContainer = null;
      }

      // Reset state
      this.isActive = false;
      this.currentTime = 0;
      this.repetitionCount = 0;
      this.isRepeating = false;
      
      console.log('Ekko Theater Mode deactivated');
    }

    createTheaterUI() {
      // Remove existing theater container if any
      const existing = document.getElementById('ekko-theater-container');
      if (existing) {
        existing.remove();
      }

      // Create main theater container
      this.theaterContainer = document.createElement('div');
      this.theaterContainer.id = 'ekko-theater-container';
      this.theaterContainer.className = 'ekko-theater-mode';
      
      this.theaterContainer.innerHTML = `
        <div class="ekko-theater-header">
          <h2>Ekko Language Learning</h2>
          <button id="ekko-close-theater" class="ekko-close-btn">×</button>
        </div>
        
        <div class="ekko-theater-content">
          <!-- Video Player Section -->
          <div class="ekko-video-section">
            <div id="ekko-player-container" class="ekko-player-wrapper">
              <div id="ekko-youtube-player"></div>
            </div>
            
            <!-- Video Controls -->
            <div class="ekko-video-controls">
              <button id="ekko-play-pause" class="ekko-control-btn">▶️</button>
              <button id="ekko-repeat-segment" class="ekko-control-btn" title="Repeat last ${this.skipSeconds}s">🔄</button>
              <button id="ekko-prev-segment" class="ekko-control-btn" title="Back ${this.skipSeconds}s">⏮️</button>
              <button id="ekko-next-segment" class="ekko-control-btn" title="Forward ${this.skipSeconds}s">⏭️</button>
              <div class="ekko-skip-controls">
                <label>Skip: </label>
                <select id="ekko-skip-amount">
                  <option value="5">5s</option>
                  <option value="10" selected>10s</option>
                  <option value="15">15s</option>
                  <option value="30">30s</option>
                </select>
              </div>
              <span class="ekko-info">
                Repeats: <span id="ekko-repetition-count">0</span>
                | Time: <span id="ekko-current-time">0:00</span>
              </span>
            </div>
          </div>
          
          <!-- Learning Panel -->
          <div class="ekko-learning-panel">
            <div class="ekko-instructions">
              <h3>Controls</h3>
              <ul>
                <li><strong>Spacebar:</strong> Repeat last segment</li>
                <li><strong>Left Arrow:</strong> Go back ${this.skipSeconds}s</li>
                <li><strong>Right Arrow:</strong> Go forward ${this.skipSeconds}s</li>
                <li><strong>P:</strong> Play/Pause</li>
                <li><strong>Esc:</strong> Exit theater mode</li>
              </ul>
              
              <div class="ekko-tips">
                <h4>Learning Tips:</h4>
                <p>Use spacebar to repeat difficult sections. The repeat function will replay the last ${this.skipSeconds} seconds, perfect for shadowing practice!</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Error States -->
        <div id="ekko-error" class="ekko-error" style="display: none;">
          <p id="ekko-error-message"></p>
          <button id="ekko-retry">Retry</button>
        </div>
      `;

      // Add to page
      document.body.appendChild(this.theaterContainer);
      
      // Store references to key elements
      this.playerContainer = document.getElementById('ekko-player-container');
    }

    async loadYouTubeAPI() {
      return new Promise((resolve, reject) => {
        if (window.YT && window.YT.Player) {
          resolve();
          return;
        }

        window.onYouTubeIframeAPIReady = resolve;

        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.onerror = () => reject(new Error('Failed to load YouTube API'));
        document.head.appendChild(script);
      });
    }

    initializePlayer() {
      this.player = new YT.Player('ekko-youtube-player', {
        height: '100%',
        width: '100%',
        videoId: this.videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,    // Keep YouTube controls for fallback
          disablekb: 0,   // Allow keyboard shortcuts
          fs: 1,          // Allow fullscreen
          modestbranding: 1,
          rel: 0
        },
        events: {
          'onReady': this.handlePlayerReady,
          'onStateChange': this.handlePlayerStateChange
        }
      });
    }

    handlePlayerReady(event) {
      console.log('Ekko: Player ready');
      this.player = event.target;
      this.updateTimeDisplay();
    }

    handlePlayerStateChange(event) {
      this.isPlaying = (event.data === YT.PlayerState.PLAYING);
      this.updatePlayPauseButton();
      
      if (this.isPlaying) {
        this.startTimeUpdater();
      }
    }

    startTimeUpdater() {
      if (this.timeUpdater) {
        clearInterval(this.timeUpdater);
      }
      
      this.timeUpdater = setInterval(() => {
        if (this.player && this.isPlaying) {
          this.currentTime = this.player.getCurrentTime();
          this.updateTimeDisplay();
        }
      }, 1000);
    }

    updateTimeDisplay() {
      const timeEl = document.getElementById('ekko-current-time');
      if (timeEl && this.player) {
        const currentTime = this.player.getCurrentTime() || 0;
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60).toString().padStart(2, '0');
        timeEl.textContent = `${minutes}:${seconds}`;
      }
    }

    playPause() {
      if (!this.player) return;
      
      try {
        if (this.isPlaying) {
          this.player.pauseVideo();
        } else {
          this.player.playVideo();
        }
      } catch (error) {
        console.error('Play/pause error:', error);
      }
    }

    repeatSegment() {
      if (!this.player) return;
      
      try {
        const currentTime = this.player.getCurrentTime();
        const startTime = Math.max(0, currentTime - this.skipSeconds);
        
        console.log(`🔄 Repeating segment: ${startTime}s to ${currentTime}s`);
        
        this.player.seekTo(startTime, true);
        this.player.playVideo();
        
        this.repetitionCount++;
        this.updateRepetitionCount();
        
        // Store the repeat start time for reference
        this.repeatStartTime = startTime;
        this.isRepeating = true;
        
      } catch (error) {
        console.error('Repeat segment error:', error);
      }
    }

    previousSegment() {
      if (!this.player) return;
      
      try {
        const currentTime = this.player.getCurrentTime();
        const newTime = Math.max(0, currentTime - this.skipSeconds);
        
        console.log(`⏮️ Going back ${this.skipSeconds}s: ${currentTime}s → ${newTime}s`);
        
        this.player.seekTo(newTime, true);
        
      } catch (error) {
        console.error('Previous segment error:', error);
      }
    }

    nextSegment() {
      if (!this.player) return;
      
      try {
        const currentTime = this.player.getCurrentTime();
        const duration = this.player.getDuration();
        const newTime = Math.min(duration, currentTime + this.skipSeconds);
        
        console.log(`⏭️ Going forward ${this.skipSeconds}s: ${currentTime}s → ${newTime}s`);
        
        this.player.seekTo(newTime, true);
        
      } catch (error) {
        console.error('Next segment error:', error);
      }
    }

    updateSkipAmount() {
      const select = document.getElementById('ekko-skip-amount');
      if (select) {
        this.skipSeconds = parseInt(select.value);
        console.log(`Skip amount updated to ${this.skipSeconds}s`);
        
        // Update button titles
        const repeatBtn = document.getElementById('ekko-repeat-segment');
        const prevBtn = document.getElementById('ekko-prev-segment');
        const nextBtn = document.getElementById('ekko-next-segment');
        
        if (repeatBtn) repeatBtn.title = `Repeat last ${this.skipSeconds}s`;
        if (prevBtn) prevBtn.title = `Back ${this.skipSeconds}s`;
        if (nextBtn) nextBtn.title = `Forward ${this.skipSeconds}s`;
      }
    }

    updateRepetitionCount() {
      const countEl = document.getElementById('ekko-repetition-count');
      if (countEl) {
        countEl.textContent = this.repetitionCount;
      }
    }

    updatePlayPauseButton() {
      const btn = document.getElementById('ekko-play-pause');
      if (btn) {
        btn.textContent = this.isPlaying ? '⏸️' : '▶️';
      }
    }

    setupEventListeners() {
      // Control button listeners
      document.getElementById('ekko-close-theater')?.addEventListener('click', () => {
        if (typeof window.ekkoCloseTheaterMode === 'function') {
          window.ekkoCloseTheaterMode();
        } else {
          this.deactivate();
        }
      });
      
      document.getElementById('ekko-play-pause')?.addEventListener('click', () => {
        this.playPause();
      });
      
      document.getElementById('ekko-repeat-segment')?.addEventListener('click', () => {
        this.repeatSegment();
      });
      
      document.getElementById('ekko-prev-segment')?.addEventListener('click', () => {
        this.previousSegment();
      });
      
      document.getElementById('ekko-next-segment')?.addEventListener('click', () => {
        this.nextSegment();
      });
      
      document.getElementById('ekko-skip-amount')?.addEventListener('change', () => {
        this.updateSkipAmount();
      });
      
      // Keyboard shortcuts
      document.addEventListener('keydown', this.handleKeyPress);
    }

    removeEventListeners() {
      document.removeEventListener('keydown', this.handleKeyPress);
      
      if (this.timeUpdater) {
        clearInterval(this.timeUpdater);
        this.timeUpdater = null;
      }
    }

    handleKeyPress(event) {
      if (!this.isActive || !this.theaterContainer) return;
      
      // Don't handle if user is typing in an input
      const target = event.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
        return;
      }
      
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          this.repeatSegment();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          this.previousSegment();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.nextSegment();
          break;
        case 'KeyP':
          event.preventDefault();
          this.playPause();
          break;
        case 'Escape':
          event.preventDefault();
          this.deactivate();
          break;
      }
    }

    showError(message) {
      const errorEl = document.getElementById('ekko-error');
      const messageEl = document.getElementById('ekko-error-message');
      
      if (errorEl && messageEl) {
        messageEl.textContent = message;
        errorEl.style.display = 'flex';
      }
    }
  }

  // Global instance
  window.ekkoTheaterMode = new EkkoTheaterMode();

  // Expose activation function
  window.ekkoActivateTheaterMode = (videoId) => {
    return window.ekkoTheaterMode.activate(videoId);
  };

  // Expose deactivation function
  window.ekkoCloseTheaterMode = () => {
    return window.ekkoTheaterMode.deactivate();
  };

})(); 