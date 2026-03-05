// src/hooks/useYouTubePlayerControl.ts
// Custom hook to manage YouTube player with better control
// IMPORTANT: This hook may or may not be used in the future. If there is a better alternative, we should use it. 

import { useRef, useCallback, useEffect } from 'react';

interface UseYouTubePlayerControlProps {
  onReady?: (player: any) => void;
  onStateChange?: (state: number) => void;
  onError?: (error: any) => void;
}

export const useYouTubePlayerControl = ({
  onReady,
  onStateChange,
  onError,
}: UseYouTubePlayerControlProps = {}) => {
  const playerRef = useRef<any>(null);
  const isReady = useRef(false);
  const playTimeoutRef = useRef<number | null>(null);

  // Initialize player
  const initializePlayer = useCallback((videoId: string, elementId: string) => {
    return new Promise<void>((resolve, reject) => {
      const createPlayer = () => {
        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
          isReady.current = false;
        }

        const playerElement = document.getElementById(elementId);
        if (playerElement) {
          playerElement.innerHTML = '';
        }

        try {
          playerRef.current = new window.YT.Player(elementId, {
            videoId,
            width: '100%',
            height: '100%',
            playerVars: {
              controls: 1,
              modestbranding: 1,
              rel: 0,
              disablekb: 0, // Keep keyboard enabled but we override
              iv_load_policy: 3,
              fs: 0,
              showinfo: 0,
              cc_load_policy: 1,
              hl: 'ko',
              cc_lang_pref: 'ko',
              autoplay: 0,
              loop: 0,
              playsinline: 1,
              enablejsapi: 1,
              origin: window.location.origin,
            },
            events: {
              onReady: (event: any) => {
                isReady.current = true;
                onReady?.(event.target);
                resolve();
              },
              onStateChange: (event: any) => {
                onStateChange?.(event.data);
              },
              onError: (event: any) => {
                onError?.(event);
                reject(new Error(`YouTube player error: ${event.data}`));
              },
            },
          });
        } else {
          reject(new Error('Player element not found'));
        }
      };

      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onerror = () => reject(new Error('Failed to load YouTube API'));
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = createPlayer;
      } else {
        createPlayer();
      }
    });
  }, [onReady, onStateChange, onError]);

  // Play a segment with automatic stopping
  const playSegment = useCallback((startTime: number, endTime: number) => {
    if (!playerRef.current || !isReady.current) {
      console.error('Player not ready');
      return false;
    }

    // Clear any existing timeout
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }

    try {
      // Seek to start time
      playerRef.current.seekTo(startTime, true);
      
      // Small delay to ensure seek completes
      setTimeout(() => {
        if (playerRef.current && isReady.current) {
          playerRef.current.playVideo();
          
          // Set timeout to stop at end time
          const duration = Math.max((endTime - startTime) * 1000, 1000);
          playTimeoutRef.current = window.setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.pauseVideo();
            }
          }, duration);
        }
      }, 100);

      return true;
    } catch (error) {
      console.error('Error playing segment:', error);
      return false;
    }
  }, []);

  // Seek to a specific time
  const seekTo = useCallback((time: number) => {
    if (!playerRef.current || !isReady.current) {
      console.error('Player not ready');
      return false;
    }

    try {
      playerRef.current.pauseVideo();
      
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.seekTo(time, true);
          
          // Verify seek worked
          setTimeout(() => {
            if (playerRef.current) {
              const currentTime = playerRef.current.getCurrentTime();
              if (Math.abs(currentTime - time) > 1) {
                console.log('Re-seeking to correct position');
                playerRef.current.seekTo(time, true);
              }
            }
          }, 300);
        }
      }, 100);

      return true;
    } catch (error) {
      console.error('Error seeking:', error);
      return false;
    }
  }, []);

  // Get current time
  const getCurrentTime = useCallback(() => {
    if (!playerRef.current || !isReady.current) {
      return 0;
    }
    try {
      return playerRef.current.getCurrentTime() || 0;
    } catch {
      return 0;
    }
  }, []);

  // Pause video
  const pause = useCallback(() => {
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    
    if (playerRef.current && isReady.current) {
      try {
        playerRef.current.pauseVideo();
      } catch (error) {
        console.error('Error pausing:', error);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error('Error destroying player:', error);
        }
      }
    };
  }, []);

  return {
    player: playerRef.current,
    isReady: isReady.current,
    initializePlayer,
    playSegment,
    seekTo,
    getCurrentTime,
    pause,
  };
};