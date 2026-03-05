// Enhanced Video Control System for YouTube
// Designed to work reliably across different YouTube player states

(() => {
  'use strict';

  class EnhancedVideoController {
    constructor() {
      this.retryCount = 0;
      this.maxRetries = 10;
      this.seekTimeout = null;
      this.lastSeekTime = 0;
      
      // Bind methods
      this.seekToTime = this.seekToTime.bind(this);
      this.playVideo = this.playVideo.bind(this);
      this.pauseVideo = this.pauseVideo.bind(this);
      this.getCurrentTime = this.getCurrentTime.bind(this);
    }

    // Wait for player to be ready with multiple fallback methods
    async waitForPlayer() {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkPlayer = () => {
          attempts++;
          
                     // Method 1: Check for YouTube's movie_player API
           if (window.movie_player && typeof window.movie_player.seekTo === 'function') {
             resolve(window.movie_player);
             return;
           }
           
           // Method 2: Check for video element
           const video = this.getMainVideoElement();
           if (video && video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
             resolve(video);
             return;
           }
           
           // Method 3: Check for YT global player
           if (window.ytInitialPlayerResponse && document.querySelector('video')) {
             resolve(document.querySelector('video'));
             return;
           }
          
          if (attempts >= maxAttempts) {
            reject(new Error('Player not ready after maximum attempts'));
            return;
          }
          
          setTimeout(checkPlayer, 100);
        };
        
        checkPlayer();
      });
    }

    // Get the main video element using multiple detection methods
    getMainVideoElement() {
      // Method 1: Find the primary video element (largest and not an ad)
      const videos = Array.from(document.querySelectorAll('video'));
      
      for (const video of videos) {
        // Skip ads and small videos
        if (video.duration > 30 && 
            video.videoWidth > 0 && 
            video.videoHeight > 0 &&
            !video.src.includes('googleads') &&
            !video.src.includes('doubleclick')) {
          return video;
        }
      }
      
      // Method 2: Try finding the video in YouTube's player container
      const playerContainer = document.querySelector('#movie_player video') || 
                             document.querySelector('.html5-video-player video') ||
                             document.querySelector('ytd-player video');
      
      if (playerContainer) {
        return playerContainer;
      }
      
      // Method 3: Return the first video that seems valid
      return videos.find(v => v.duration > 0) || null;
    }

         // Enhanced seek function that handles YouTube's async nature
     async seekToTime(timeInSeconds, allowRetry = true) {
       console.log(`🎯 Seeking to ${timeInSeconds}s`);
       
       // Clear any pending seek timeout
       if (this.seekTimeout) {
         clearTimeout(this.seekTimeout);
         this.seekTimeout = null;
       }
       
       // Store the seek time for verification
       this.lastSeekTime = timeInSeconds;
       
       try {
         // Ensure player is ready
         await this.waitForPlayer();
         
         let success = false;
         
         // Method 1: YouTube's movie_player API (most reliable)
         if (window.movie_player && typeof window.movie_player.seekTo === 'function') {
           try {
             window.movie_player.seekTo(timeInSeconds, true);
             success = await this.verifySeek(timeInSeconds);
             if (success) return true;
           } catch (e) {
             console.warn('Seek via movie_player failed:', e);
           }
         }
         
         // Method 2: Direct video element manipulation
         const video = this.getMainVideoElement();
         if (video && !success) {
           try {
             // Pause first to ensure clean seek
             video.pause();
             await new Promise(resolve => setTimeout(resolve, 50));
             
             video.currentTime = timeInSeconds;
             success = await this.verifySeek(timeInSeconds);
             if (success) return true;
           } catch (e) {
             console.warn('Seek via video element failed:', e);
           }
         }
         
         // Method 3: Event-based seeking (for stubborn cases)
         if (!success && video) {
           try {
             const seekEvent = new Event('seeking');
             video.currentTime = timeInSeconds;
             video.dispatchEvent(seekEvent);
             success = await this.verifySeek(timeInSeconds);
             if (success) return true;
           } catch (e) {
             console.warn('Event-based seek failed:', e);
           }
         }
         
         // Retry logic for failed seeks
         if (!success && allowRetry && this.retryCount < this.maxRetries) {
           this.retryCount++;
           if (this.retryCount <= 3) { // Only log first few retries
             console.log(`🔄 Retrying seek (${this.retryCount}/${this.maxRetries})`);
           }
           
           // Wait a bit longer before retry
           await new Promise(resolve => setTimeout(resolve, 200));
           return this.seekToTime(timeInSeconds, true);
         }
         
         this.retryCount = 0;
         if (!success) {
           console.error('❌ All seek methods failed');
         }
         return false;
         
       } catch (error) {
         console.error('❌ Seek error:', error);
         this.retryCount = 0;
         return false;
       }
     }

         // Verify that the seek actually worked
     async verifySeek(targetTime, tolerance = 1.0) {
       return new Promise((resolve) => {
         let checks = 0;
         const maxChecks = 20;
         
         const checkTime = () => {
           checks++;
           const currentTime = this.getCurrentTime();
           
           if (currentTime !== -1) {
             const difference = Math.abs(currentTime - targetTime);
             if (difference <= tolerance) {
               resolve(true);
               return;
             }
           }
           
           if (checks >= maxChecks) {
             resolve(false);
             return;
           }
           
           setTimeout(checkTime, 50);
         };
         
         // Start checking after a small delay
         setTimeout(checkTime, 100);
       });
     }

         // Enhanced play function
     async playVideo() {
       try {
         let success = false;
         
         // Method 1: YouTube's movie_player API
         if (window.movie_player && typeof window.movie_player.playVideo === 'function') {
           try {
             window.movie_player.playVideo();
             success = true;
           } catch (e) {
             console.warn('Play via movie_player failed:', e);
           }
         }
         
         // Method 2: Direct video element
         const video = this.getMainVideoElement();
         if (video && !success) {
           try {
             await video.play();
             success = true;
           } catch (e) {
             console.warn('Play via video element failed:', e);
           }
         }
         
         // Method 3: Simulate spacebar press (YouTube's default play control)
         if (!success) {
           try {
             const spaceEvent = new KeyboardEvent('keydown', {
               key: ' ',
               code: 'Space',
               keyCode: 32,
               which: 32,
               bubbles: true
             });
             document.dispatchEvent(spaceEvent);
             success = true;
           } catch (e) {
             console.warn('Spacebar simulation failed:', e);
           }
         }
         
         return success;
         
       } catch (error) {
         console.error('❌ Play error:', error);
         return false;
       }
     }

         // Enhanced pause function
     async pauseVideo() {
       try {
         let success = false;
         
         // Method 1: YouTube's movie_player API
         if (window.movie_player && typeof window.movie_player.pauseVideo === 'function') {
           try {
             window.movie_player.pauseVideo();
             success = true;
           } catch (e) {
             console.warn('Pause via movie_player failed:', e);
           }
         }
         
         // Method 2: Direct video element
         const video = this.getMainVideoElement();
         if (video && !success) {
           try {
             video.pause();
             success = true;
           } catch (e) {
             console.warn('Pause via video element failed:', e);
           }
         }
         
         return success;
         
       } catch (error) {
         console.error('❌ Pause error:', error);
         return false;
       }
     }

    // Enhanced getCurrentTime function
    getCurrentTime() {
      try {
        // Method 1: YouTube's movie_player API
        if (window.movie_player && typeof window.movie_player.getCurrentTime === 'function') {
          const time = window.movie_player.getCurrentTime();
          if (typeof time === 'number' && !isNaN(time)) {
            return time;
          }
        }
        
        // Method 2: Direct video element
        const video = this.getMainVideoElement();
        if (video && typeof video.currentTime === 'number' && !isNaN(video.currentTime)) {
          return video.currentTime;
        }
        
                 return -1;
         
       } catch (error) {
         console.error('❌ getCurrentTime error:', error);
        return -1;
      }
    }

    // Check if video is playing
    isPlaying() {
      try {
        // Method 1: YouTube's movie_player API
        if (window.movie_player && typeof window.movie_player.getPlayerState === 'function') {
          const state = window.movie_player.getPlayerState();
          return state === 1; // YT.PlayerState.PLAYING
        }
        
        // Method 2: Direct video element
        const video = this.getMainVideoElement();
        if (video) {
          return !video.paused && video.readyState > 2;
        }
        
                 return false;
         
       } catch (error) {
         console.error('❌ isPlaying error:', error);
        return false;
      }
    }

         // Play a segment from start to end (like Trancy)
     async playSegment(startTime, endTime) {
       console.log(`🎬 Playing segment ${startTime}s - ${endTime}s`);
       
       try {
         // First, seek to start
         const seekSuccess = await this.seekToTime(startTime);
         if (!seekSuccess) {
           console.error('❌ Failed to seek to segment start');
           return false;
         }
         
         // Wait a moment for seek to complete
         await new Promise(resolve => setTimeout(resolve, 200));
         
         // Then play
         const playSuccess = await this.playVideo();
         if (!playSuccess) {
           console.error('❌ Failed to play segment');
           return false;
         }
         
         // Set timer to pause at end
         const duration = Math.max((endTime - startTime) * 1000, 1000);
         this.seekTimeout = setTimeout(async () => {
           await this.pauseVideo();
         }, duration);
         
         return true;
         
       } catch (error) {
         console.error('❌ playSegment error:', error);
         return false;
       }
     }

    // Stop any ongoing segment playback
    stopSegmentPlayback() {
      if (this.seekTimeout) {
        clearTimeout(this.seekTimeout);
        this.seekTimeout = null;
      }
      this.pauseVideo();
    }

    // Reset retry counter (call when switching videos)
    resetRetryCounter() {
      this.retryCount = 0;
    }
  }

     // Create global instance
   window.ekkoVideoController = new EnhancedVideoController();

})(); 