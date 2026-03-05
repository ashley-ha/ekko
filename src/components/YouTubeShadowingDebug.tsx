// src/components/YouTubeShadowingDebug.tsx
// A debug component to test YouTube player functionality

import React, { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubeShadowingDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [playerState, setPlayerState] = useState<string>('Not initialized');
  const playerRef = useRef<any>(null);
  const [videoId] = useState('M7lc1UVf-VE'); // Test video

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (isInput) {
        addLog(`Key ignored - input field focused: ${e.code}`);
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        addLog('✅ SPACE captured successfully!');
        testPlaySegment();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        addLog('✅ LEFT ARROW captured successfully!');
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        addLog('✅ RIGHT ARROW captured successfully!');
      } else {
        addLog(`Other key pressed: ${e.code}`);
      }
    };

    // Multiple event listeners for redundancy
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    
    addLog('Keyboard handlers installed');

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    const initPlayer = () => {
      playerRef.current = new window.YT.Player('debug-youtube-player', {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          controls: 1,
          disablekb: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          autoplay: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            addLog('Player ready!');
            setPlayerState('Ready');
          },
          onStateChange: (event: any) => {
            const states: { [key: number]: string } = {
              '-1': 'unstarted',
              '0': 'ended',
              '1': 'playing',
              '2': 'paused',
              '3': 'buffering',
              '5': 'video cued'
            };
            const state = states[event.data] || 'unknown';
            addLog(`Player state changed: ${state}`);
            setPlayerState(state);
          },
          onError: (event: any) => {
            addLog(`Player error: ${event.data}`);
            setPlayerState('Error');
          },
        },
      });
    };

    if (!window.YT) {
      addLog('Loading YouTube API...');
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onload = () => addLog('YouTube API script loaded');
      tag.onerror = () => addLog('Failed to load YouTube API');
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        addLog('YouTube API ready');
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const testPlaySegment = () => {
    if (!playerRef.current) {
      addLog('❌ Player not initialized');
      return;
    }

    try {
      addLog('Testing play segment...');
      
      // Seek to start
      playerRef.current.seekTo(10, true);
      addLog('Seeked to 10s');
      
      // Play
      setTimeout(() => {
        playerRef.current.playVideo();
        addLog('Started playing');
        
        // Stop after 3 seconds
        setTimeout(() => {
          playerRef.current.pauseVideo();
          addLog('Paused after 3s');
        }, 3000);
      }, 100);
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const testGetTime = () => {
    if (!playerRef.current?.getCurrentTime) {
      addLog('❌ getCurrentTime not available');
      return;
    }
    const time = playerRef.current.getCurrentTime();
    addLog(`Current time: ${time}s`);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">YouTube Shadowing Debug Tool</h1>
      
      <div className="bg-yellow-100 p-4 rounded-lg mb-4">
        <p className="font-semibold">Test Instructions:</p>
        <ul className="list-disc ml-5 mt-2">
          <li>Press <kbd className="px-2 py-1 bg-gray-200 rounded">Space</kbd> to test play segment</li>
          <li>Press <kbd className="px-2 py-1 bg-gray-200 rounded">←</kbd> and <kbd className="px-2 py-1 bg-gray-200 rounded">→</kbd> to test navigation capture</li>
          <li>Check the logs below for feedback</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">YouTube Player</h2>
          <div className="aspect-video bg-black rounded overflow-hidden">
            <div id="debug-youtube-player"></div>
          </div>
          <p className="mt-2 text-sm text-gray-600">Player State: <span className="font-semibold">{playerState}</span></p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Debug Controls</h2>
          <div className="space-y-2">
            <button
              onClick={testPlaySegment}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Play Segment (3s)
            </button>
            <button
              onClick={testGetTime}
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Get Current Time
            </button>
            <button
              onClick={() => playerRef.current?.seekTo(0, true)}
              className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Seek to Start
            </button>
            <button
              onClick={() => playerRef.current?.pauseVideo()}
              className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Pause Video
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Event Logs</h2>
          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-gray-300 text-sm rounded hover:bg-gray-400"
          >
            Clear Logs
          </button>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Try pressing some keys!</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={log.includes('✅') ? 'text-green-600' : log.includes('❌') ? 'text-red-600' : ''}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeShadowingDebug;