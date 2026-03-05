// src/components/YouTubeShadowing.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Loader2,
  Save,
  Check,
  Settings,
  ArrowLeft,
  ArrowRight,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  BookOpen,
  MessageCircle,
  CheckCircle,
  Target,
  Award,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';
import {
  fetchYouTubeTranscript,
  processTranscriptIntoSentences,
  extractVideoId,
  translateText,
} from '../lib/youtubeTranscriptAPI';
import { useAppStore } from '../store/useAppStore';
import { learningNotebookService } from '../lib/learningNotebook';
import { supabase } from '../lib/supabase';
import { useAIPractice } from '../hooks/useAIPractice';
import { motion } from 'framer-motion';

interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  translation?: string;
}

interface SegmentProgress {
  repetitions: number;
  isMemorized: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubeShadowing: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [reps, setReps] = useState(0);
  const [sentencesPerSegment, setSentencesPerSegment] = useState(1);
  const [minSegmentDuration, setMinSegmentDuration] = useState(5.0);
  const [segmentProgress, setSegmentProgress] = useState<SegmentProgress[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rawTranscript, setRawTranscript] = useState<TranscriptSegment[]>([]);
  const [videoInfo, setVideoInfo] = useState<{ title?: string; channel?: string } | null>(null);
  const [showAIPractice, setShowAIPractice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null);
  const [isPlayingAiAudio, setIsPlayingAiAudio] = useState(false);

  const { addToNotebook, isSegmentInNotebook } = useAppStore();
  
  // AI Practice hook
  const {
    questions,
    currentQuestionIndex,
    currentQuestion,
    userAnswer,
    feedback,
    isLoading: aiLoading,
    error: aiError,
    videoInfo: aiVideoInfo,
    isComplete: aiComplete,
    progress: aiProgress,
    totalQuestions,
    startPractice,
    submitAnswer,
    nextQuestion,
    resetPractice,
    setUserAnswer,
  } = useAIPractice();

  const playerRef = useRef<any>(null);
  const playerReady = useRef(false);
  const segmentTimeoutRef = useRef<number | null>(null);
  const isPlayingSegment = useRef(false);
  const lastSavedReps = useRef<{ [key: number]: number }>({});
  const TARGET_REPS = 75; // default target repetitions

  // AI Practice helper functions
  const handleStartAIPractice = async () => {
    if (!videoId) {
      alert('Please load a video first');
      return;
    }
    
    setShowAIPractice(true);
    await startPractice(videoId);
  };

  const handleSubmitAIAnswer = async () => {
    if (!userAnswer.trim()) return;
    await submitAnswer(userAnswer);
  };

  const handleVoiceSubmit = async () => {
    if (!audioBlob) return;
    
    try {
      setIsProcessingAudio(true);
      const transcribedText = await transcribeAudio(audioBlob);
      setUserAnswer(transcribedText);
      await submitAnswer(transcribedText);
      setAudioBlob(null);
    } catch (error) {
      console.error('Error processing voice answer:', error);
      alert('Failed to process voice answer. Please try again.');
    }
  };

  const handleResetAIPractice = () => {
    resetPractice();
    setShowAIPractice(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Speech-to-text functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // Whisper prefers 16kHz
          channelCount: 1,   // Mono audio
        }
      });
      
      // Try to use a compatible format
      const options = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(stream, options);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    setIsProcessingAudio(true);
    try {
      // Create FormData for the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      // Call the speech-recognize function with FormData
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/speech-recognize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return data.transcript || '';
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const generateAiSpeech = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('voice-speak', {
        body: { 
          text,
          voice_id: 'korean-voice', // Use your Korean voice ID from ElevenLabs
          language: 'ko'
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate speech');
      }

      if (data.audio_url) {
        setAiAudioUrl(data.audio_url);
        return data.audio_url;
      }
    } catch (error) {
      console.error('Error generating AI speech:', error);
    }
  };

  const playAiAudio = (audioUrl: string) => {
    setIsPlayingAiAudio(true);
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlayingAiAudio(false);
    audio.onerror = () => setIsPlayingAiAudio(false);
    audio.play();
  };

  // create or get existing shadowing session
  const createOrGetSession = useCallback(async (
    videoId: string,
    videoUrl: string,
    segments: TranscriptSegment[]
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: existingSession, error: selectError } = await supabase
        .from('shadowing_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .single();

      if (selectError && selectError.code !== 'pgrst116') {
        console.error('error checking for existing session:', selectError);
        return null;
      }

      if (existingSession) {
        console.log('using existing session:', existingSession.id);
        return existingSession.id;
      }

      const { data: newSession, error } = await supabase
        .from('shadowing_sessions')
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          video_id: videoId,
          transcript: segments,
          total_segments: segments.length,
        })
        .select()
        .single();

      if (error) {
        console.error('error creating session:', error);
        return null;
      }

      console.log('created new session:', newSession.id);
      return newSession.id;
    } catch (error) {
      console.error('error in createorgetsessíon:', error);
      return null;
    }
  }, []);

  // load segment attempts for current session
  const loadSegmentProgress = useCallback(async (sessionId: string) => {
    try {
      const { data: attempts, error } = await supabase
        .from('shadowing_segment_attempts')
        .select('*')
        .eq('session_id', sessionId);

      if (error) {
        console.error('error loading segment progress:', error);
        return;
      }

      const progress = segments.map((_, index) => {
        const attempt = attempts?.find((a) => a.segment_index === index);
        return {
          repetitions: attempt?.attempt_count || 0,
          isMemorized: (attempt?.attempt_count || 0) >= TARGET_REPS,
        };
      });

      setSegmentProgress(progress);
      
      // Update current reps if we're on an existing segment
      if (progress[currentSegment]) {
        setReps(progress[currentSegment].repetitions);
      }
      
      progress.forEach((p, idx) => {
        lastSavedReps.current[idx] = p.repetitions;
      });
    } catch (error) {
      console.error('error in loadsegmentprogress:', error);
    }
  }, [segments, currentSegment]);

  // save segment attempt to database - with debouncing
  const saveSegmentAttempt = useCallback(async (
    segmentIndex: number,
    repetitions: number
  ) => {
    if (!sessionId) return;

    const lastSaved = lastSavedReps.current[segmentIndex] || 0;
    // Save every 3 reps or when reaching target, or when going down (navigation)
    if (repetitions - lastSaved < 3 && repetitions < TARGET_REPS && repetitions > lastSaved) {
      return;
    }

    try {
      const segment = segments[segmentIndex];
      if (!segment) return;

      const { error } = await supabase
        .from('shadowing_segment_attempts')
        .upsert(
          {
            session_id: sessionId,
            segment_index: segmentIndex,
            segment_text: segment.text,
            attempt_count: repetitions,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'session_id,segment_index',
          }
        );

      if (error) {
        console.error('error saving segment attempt:', error);
      } else {
        lastSavedReps.current[segmentIndex] = repetitions;
        console.log(`saved progress: segment ${segmentIndex}, ${repetitions} reps`);
      }
    } catch (error) {
      console.error('error in savesegmentattempt:', error);
    }
  }, [sessionId, segments]);

  // reprocess segments when settings change
  const reprocessSegments = useCallback(() => {
    if (rawTranscript.length === 0) return;
    
    const processedSegments = processTranscriptIntoSentences(
      rawTranscript,
      sentencesPerSegment,
      minSegmentDuration
    );

    const validSegments = processedSegments.filter((seg) => {
      const hasValidTiming =
        typeof seg.start === 'number' && typeof seg.end === 'number';
      return hasValidTiming && seg.text && seg.text.trim().length > 0;
    });

    if (validSegments.length > 0) {
      setSegments(validSegments);
      
      // Don't reset progress here - let the useEffect handle reloading progress
      // when segments change
      
      setCurrentSegment(0);
      setReps(0);
      
      if (playerRef.current && playerReady.current && validSegments[0]) {
        const start = validSegments[0].start || 0;
        playerRef.current.seekTo(start, true);
        playerRef.current.pauseVideo();
      }
    }
  }, [rawTranscript, sentencesPerSegment, minSegmentDuration]);

  useEffect(() => {
    if (rawTranscript.length > 0) {
      reprocessSegments();
    }
  }, [sentencesPerSegment, minSegmentDuration, reprocessSegments]);

  // Load segment progress when sessionId and segments are available
  useEffect(() => {
    if (sessionId && segments.length > 0) {
      loadSegmentProgress(sessionId);
    }
  }, [sessionId, segments.length, loadSegmentProgress]);

  // Initial load of session and progress on component mount (handles page refresh)
  useEffect(() => {
    const initializeExistingSession = async () => {
      if (videoId && segments.length > 0 && !sessionId) {
        const newSessionId = await createOrGetSession(videoId, videoUrl, segments);
        setSessionId(newSessionId);
      }
    };

    initializeExistingSession();
  }, [videoId, segments.length, sessionId, videoUrl, createOrGetSession]);

  // Sync current reps with segment progress when it changes
  useEffect(() => {
    if (segmentProgress[currentSegment]) {
      const expectedReps = segmentProgress[currentSegment].repetitions;
      // Only update if different to avoid unnecessary re-renders
      if (reps !== expectedReps) {
        setReps(expectedReps);
      }
    }
  }, [segmentProgress, currentSegment, reps]);

  // translate current segment
  const handleTranslateSegment = async () => {
    if (!segments[currentSegment] || segments[currentSegment].translation) return;

    setIsTranslating(true);
    try {
      const translation = await translateText(
        segments[currentSegment].text,
        'ko',
        'en'
      );
      setSegments((prev) =>
        prev.map((seg, idx) =>
          idx === currentSegment ? { ...seg, translation } : seg
        )
      );
    } catch (error) {
      console.error('translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  // load and process video
  const handleLoadVideo = async () => {
    setError(null);
    const id = extractVideoId(videoUrl);
    if (!id) {
      setError('please enter a valid youtube url.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setSegments([]);
    setCurrentSegment(0);
    setReps(0);
    playerReady.current = false;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
        playerRef.current = null;
      } catch (error) {
        console.log('error destroying previous player:', error);
      }
    }

    setVideoId(id);

    const {
      transcript: rawTranscript,
      error: fetchError,
      videoInfo: fetchedVideoInfo,
    } = await fetchYouTubeTranscript(id);

    // Store video metadata
    if (fetchedVideoInfo) {
      setVideoInfo({
        title: fetchedVideoInfo.title,
        channel: fetchedVideoInfo.channel,
      });
    }

    if (fetchError || rawTranscript.length === 0) {
      setError(
        fetchError ||
          'unable to fetch transcript. please try a different video with captions.'
      );
      setIsLoading(false);
      setVideoId(null);
      return;
    }

    setRawTranscript(rawTranscript);

    const processedSegments = processTranscriptIntoSentences(
      rawTranscript,
      sentencesPerSegment,
      minSegmentDuration
    );

    const validSegments = processedSegments.filter((seg) => {
      const hasValidTiming =
        typeof seg.start === 'number' && typeof seg.end === 'number';
      return hasValidTiming && seg.text && seg.text.trim().length > 0;
    });

    if (validSegments.length === 0) {
      setError(
        'unable to extract timing information from transcript. please try a different video.'
      );
      setIsLoading(false);
      setVideoId(null);
      return;
    }

    setSegments(validSegments);

    const newSessionId = await createOrGetSession(id, videoUrl, validSegments);
    setSessionId(newSessionId);

    // Initialize progress array - will be populated by useEffect when sessionId changes
    if (!newSessionId) {
      setSegmentProgress(
        validSegments.map(() => ({ repetitions: 0, isMemorized: false }))
      );
    }

    setCurrentSegment(0);
    setReps(0);

    try {
      await initializePlayer(id);
    } catch (error) {
      console.error('error initializing player:', error);
      setError('failed to load video player. please try again.');
    }

    setIsLoading(false);
  };

  // initialize youtube player
  const initializePlayer = async (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const initPlayer = () => {
        createPlayer(id);
        resolve();
      };

      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.onload = () => {
          console.log('youtube api script loaded');
        };
        tag.onerror = () => {
          reject(new Error('failed to load youtube api'));
        };
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = initPlayer;
      } else {
        initPlayer();
      }
    });
  };

  const createPlayer = (id: string) => {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const playerContainer = document.getElementById('youtube-player');
    if (playerContainer) {
      playerContainer.innerHTML = '';
    }

    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: id,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        controls: 0,        // complete control removal
        disablekb: 1,       // disable youtube's keyboard shortcuts
        fs: 0,              // disable fullscreen button
        iv_load_policy: 3,  // do not show video annotations
        loop: 1,            // loop the video
        modestbranding: 1,  // remove youtube logo
        playsinline: 1,     // play inline on ios
        rel: 0,             // do not show related videos
        showinfo: 0,        // hide video title and uploader
        cc_load_policy: 0,  // disable captions
        playlist: id,       // required for loop to work on a single video
        origin: window.location.origin, // fixes the postmessage cors error
        enablejsapi: 1,
      },
      events: {
        onReady: (event: any) => {
          console.log('player ready');
          playerReady.current = true;
          
          if (segments.length > 0 && segments[0]) {
            const start = segments[0].start || 0;
            playerRef.current.seekTo(start, true);
            playerRef.current.pauseVideo();
          }
        },
        onStateChange: (event: any) => {
          // when the video ends (state 0), we immediately seek it
          // back to the current segment start and pause it.
          // this prevents the 'more videos' overlay from ever showing up
          // at the natural end of the video.
          if (event.data === window.YT.PlayerState.ENDED) {
            if(playerRef.current && segments[currentSegment]) {
                const segment = segments[currentSegment];
                playerRef.current.seekTo(segment.start, true);
                playerRef.current.pauseVideo();
            }
          }
        },
        onError: (event: any) => {
          console.error('youtube player error:', event.data);
          setError(`youtube player error: ${event.data}. the video may be private or restricted.`);
        },
      },
    });
  };

  // play current segment
  const playCurrentSegment = useCallback(() => {
    if (!playerRef.current || !playerReady.current || !segments[currentSegment]) {
      return;
    }

    if (segmentTimeoutRef.current) {
      clearTimeout(segmentTimeoutRef.current);
    }

    const segment = segments[currentSegment];
    const start = typeof segment.start === 'number' ? segment.start : 0;
    const end = typeof segment.end === 'number' ? segment.end : start + 5;

    try {
      isPlayingSegment.current = true;
      playerRef.current.seekTo(start, true);
      
      setTimeout(() => {
        if (playerRef.current && isPlayingSegment.current) {
          playerRef.current.playVideo();
        }
      }, 100);

      const duration = Math.max((end - start) * 1000, 1000);
      segmentTimeoutRef.current = window.setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.pauseVideo();
          isPlayingSegment.current = false;
        }
      }, duration);

      const newReps = reps + 1;
      setReps(newReps);

      setSegmentProgress((prev) => {
        const updated = [...prev];
        if (!updated[currentSegment]) {
          updated[currentSegment] = { repetitions: 0, isMemorized: false };
        }
        updated[currentSegment] = {
          repetitions: newReps,
          isMemorized: newReps >= TARGET_REPS,
        };
        return updated;
      });

      saveSegmentAttempt(currentSegment, newReps);
    } catch (error) {
      console.error('error playing segment:', error);
      isPlayingSegment.current = false;
    }
  }, [currentSegment, segments, reps, saveSegmentAttempt]);

  // navigate between segments
  const navigateSegment = useCallback(
    (direction: 'next' | 'prev') => {
      if (segmentTimeoutRef.current) {
        clearTimeout(segmentTimeoutRef.current);
      }
      isPlayingSegment.current = false;

      let newIndex = currentSegment;
      if (direction === 'next' && currentSegment < segments.length - 1) {
        newIndex = currentSegment + 1;
      } else if (direction === 'prev' && currentSegment > 0) {
        newIndex = currentSegment - 1;
      }

      if (newIndex !== currentSegment) {
        // Save current progress before switching
        if (reps > 0) {
          saveSegmentAttempt(currentSegment, reps);
        }
        
        setCurrentSegment(newIndex);
        
        // Load repetitions for the new segment
        const newSegmentProgress = segmentProgress[newIndex];
        setReps(newSegmentProgress?.repetitions || 0);

        if (playerRef.current && playerReady.current && segments[newIndex]) {
          const segment = segments[newIndex];
          const start = typeof segment.start === 'number' ? segment.start : 0;

          try {
            playerRef.current.pauseVideo();
            setTimeout(() => {
              if (playerRef.current) {
                playerRef.current.seekTo(start, true);
              }
            }, 100);
          } catch (error) {
            console.error('error seeking to new segment:', error);
          }
        }
      }
    },
    [currentSegment, segments, reps, saveSegmentAttempt, segmentProgress]
  );

  // save to notebook
  const handleSaveToNotebook = async () => {
    if (videoId && segments[currentSegment]) {
      const segment = segments[currentSegment];
      
      // Save to database
      const result = await learningNotebookService.addEntry({
        videoId,
        videoTitle: videoInfo?.title,
        videoChannel: videoInfo?.channel,
        segmentIndex: currentSegment,
        text: segment.text,
        start: segment.start,
        end: segment.end,
        status: 'unfamiliar', // Default status
      });

      if (result.error) {
        console.error('Failed to save to notebook:', result.error);
        // Still add to local state as fallback
        addToNotebook({
          videoId,
          segmentIndex: currentSegment,
          text: segment.text,
          start: segment.start,
          end: segment.end,
        });
      } else {
        // Also update local state for immediate UI feedback
        addToNotebook({
          videoId,
          videoTitle: videoInfo?.title,
          videoChannel: videoInfo?.channel,
          segmentIndex: currentSegment,
          text: segment.text,
          start: segment.start,
          end: segment.end,
        });
      }
    }
  };

  // keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoId || !segments.length || !playerReady.current) return;

      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputField) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        playCurrentSegment();
      } else if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        navigateSegment('next');
      } else if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        navigateSegment('prev');
      }
    };

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [videoId, segments.length, playCurrentSegment, navigateSegment]);

  // auto-translate when showing translation
  useEffect(() => {
    if (
      showTranslation &&
      segments[currentSegment] &&
      !segments[currentSegment].translation
    ) {
      handleTranslateSegment();
    }
  }, [showTranslation, currentSegment]);

  // sync video position when segment changes
  useEffect(() => {
    if (playerRef.current && playerReady.current && segments[currentSegment]) {
      const segment = segments[currentSegment];
      const start = typeof segment.start === 'number' ? segment.start : 0;

      if (segmentTimeoutRef.current) {
        clearTimeout(segmentTimeoutRef.current);
      }
      isPlayingSegment.current = false;

      try {
        playerRef.current.pauseVideo();
        setTimeout(() => {
          if (playerRef.current && playerReady.current) {
            playerRef.current.seekTo(start, true);
          }
        }, 100);
      } catch (error) {
        console.error('error syncing video position:', error);
      }
    }
  }, [currentSegment]);

  // save progress on unmount and current segment on navigation
  useEffect(() => {
    return () => {
      // Save current segment progress if there are unsaved reps
      if (reps > 0) {
        saveSegmentAttempt(currentSegment, reps);
      }
      
      // Save any other segments with unsaved progress
      Object.entries(lastSavedReps.current).forEach(([idx, savedReps]) => {
        const currentProgress = segmentProgress[parseInt(idx)];
        if (currentProgress && currentProgress.repetitions > savedReps) {
          saveSegmentAttempt(parseInt(idx), currentProgress.repetitions);
        }
      });
    };
  }, [segmentProgress, saveSegmentAttempt, reps, currentSegment]);

  // Save progress on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current segment progress
      if (reps > 0) {
        saveSegmentAttempt(currentSegment, reps);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [reps, currentSegment, saveSegmentAttempt]);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pb-4 md:pb-8 pt-24 font-sans bg-gradient-to-br from-white via-purple-50/30 to-blue-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Shadowing Practice</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        master korean through repetitive practice with native content.
      </p>

      {/* url input */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-6 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="enter youtube video url"
            className="flex-grow p-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          <button
            onClick={handleLoadVideo}
            disabled={isLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold flex items-center justify-center w-full sm:w-40 hover:bg-primary-700 transition-all shadow-md disabled:bg-gray-400"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'load video'}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {videoId && segments.length > 0 && (
        <>
          {/* main content area */}
          <div className={`flex gap-4 transition-all duration-300 ${showAIPractice ? 'flex-col lg:flex-row' : ''}`}>
            {/* video and controls section */}
            <div className={`transition-all duration-300 ${showAIPractice ? 'lg:w-2/3' : 'w-full'}`}>
              {/* video player */}
              <div className="aspect-video mb-4 bg-black rounded-2xl shadow-inner overflow-hidden relative">
                <div id="youtube-player-wrapper" className="w-full h-full">
                  <div id="youtube-player" className="w-full h-full"></div>
                  <div 
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={playCurrentSegment}
                    title="replay segment"
                  ></div>
                </div>
              </div>

          {/* segment display & controls */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg mb-4 transition-colors duration-300">
            {/* current segment text */}
            <div className="text-center mb-3 min-h-[8rem] flex flex-col justify-center">
              <p className="text-lg font-semibold text-gray-800 dark:text-white px-4">
                {segments[currentSegment]?.text || 'loading segment...'}
              </p>

              {/* translation */}
              {showTranslation && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                  {isTranslating ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>translating...</span>
                    </div>
                  ) : segments[currentSegment]?.translation ? (
                    segments[currentSegment].translation
                  ) : (
                    <button
                      onClick={handleTranslateSegment}
                      className="text-primary-600 hover:text-primary-700 underline"
                    >
                      click to translate
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* controls */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => navigateSegment('prev')}
                disabled={currentSegment === 0}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="previous (←)"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex-1 flex flex-col items-center gap-2">
                <button
                  onClick={playCurrentSegment}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary-700 transition-all"
                  title="repeat (spacebar)"
                >
                  <RotateCcw size={16} /> repeat
                </button>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="font-semibold text-primary-600">
                    {reps} / {TARGET_REPS} reps
                  </span>
                  <span>
                    segment {currentSegment + 1} of {segments.length}
                  </span>
                  {segmentProgress[currentSegment]?.isMemorized && (
                    <span className="text-green-600 font-semibold">
                      ✓ memorized
                    </span>
                  )}
                </div>

                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (reps / TARGET_REPS) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => navigateSegment('next')}
                disabled={currentSegment >= segments.length - 1}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="next (→)"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* action buttons */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
              >
                {showTranslation ? <EyeOff size={14} /> : <Eye size={14} />}
                translation
              </button>

              <button
                onClick={handleSaveToNotebook}
                disabled={isSegmentInNotebook(videoId, currentSegment)}
                className="flex-1 py-2 px-3 bg-purple-100 hover:bg-purple-200 disabled:bg-green-100 disabled:text-green-700 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors text-purple-700 font-medium"
              >
                {isSegmentInNotebook(videoId, currentSegment) ? (
                  <>
                    <Check size={14} /> in notebook
                  </>
                ) : (
                  <>
                    <BookOpen size={14} /> add to notebook
                  </>
                )}
              </button>

              <button
                onClick={() => setShowAIPractice(!showAIPractice)}
                className="flex-1 py-2 px-3 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors text-blue-700 font-medium"
              >
                <MessageCircle size={14} />
                AI Practice
              </button>
            </div>
          </div>

          {/* keyboard shortcuts */}
          <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-600 mb-4">
            <span className="font-medium">shortcuts:</span>
            <span className="ml-2">
              <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">
                space
              </kbd>{' '}
              repeat
            </span>
            <span className="ml-2">
              <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">
                ←
              </kbd>{' '}
              previous
            </span>
            <span className="ml-2">
              <kbd className="px-1.5 py-0.5 bg-white rounded border text-xs">
                →
              </kbd>{' '}
              next
            </span>
          </div>

          {/* settings */}
          <details className="bg-white p-4 rounded-xl shadow-lg">
            <summary className="cursor-pointer font-medium text-gray-800 flex items-center gap-2">
              <Settings size={16} /> settings
            </summary>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                sentences per segment:
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={sentencesPerSegment}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val > 0) setSentencesPerSegment(val);
                }}
                className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              
              <label className="block text-sm font-medium text-gray-600 mb-1 mt-3">
                 minimum segment duration (seconds):
              </label>
              <input
                 type="number"
                 step="0.1"
                 min="1"
                 max="10"
                 value={minSegmentDuration}
                 onChange={(e) => {
                   const val = parseFloat(e.target.value);
                   if (val > 0) setMinSegmentDuration(val);
                 }}
                 className="w-full p-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
               />
               <div className="text-xs text-gray-500 mt-1">
                 segments shorter than this will be combined with adjacent ones.
               </div>
              
              <label className="block text-sm font-medium text-gray-600 mb-1 mt-3">
                target repetitions:
              </label>
              <div className="text-sm text-gray-500">
                {TARGET_REPS} repetitions (default)
              </div>
            </div>
          </details>
            </div>

            {/* AI Practice Sidebar */}
            {showAIPractice && (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="lg:w-1/3 w-full"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Practice</h3>
                    </div>
                    <button
                      onClick={() => setShowAIPractice(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <XCircle className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {!questions.length && !aiComplete ? (
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Generate AI questions based on this video's content
                      </p>
                      <button
                        onClick={handleStartAIPractice}
                        disabled={aiLoading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating Questions...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Start AI Practice
                          </>
                        )}
                      </button>
                    </div>
                  ) : aiComplete ? (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Practice Complete!
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        You've answered all {totalQuestions} questions
                      </p>
                      <button
                        onClick={handleResetAIPractice}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Try Again
                      </button>
                    </div>
                  ) : currentQuestion ? (
                    <div>
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Question {currentQuestionIndex + 1} of {totalQuestions}
                          </span>
                          <span className="text-sm text-gray-500">{aiProgress}% complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-blue-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${aiProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>

                      {/* Question */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                            {currentQuestion.difficulty}
                          </span>
                        </div>
                                                 <div className="mb-4">
                           <p className="text-gray-900 dark:text-white font-medium mb-2">
                             {currentQuestion.question}
                           </p>
                           <button
                             onClick={() => generateAiSpeech(currentQuestion.question).then(audioUrl => {
                               if (audioUrl) playAiAudio(audioUrl);
                             })}
                             disabled={isPlayingAiAudio}
                             className="text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1 text-xs"
                           >
                             <Volume2 className="w-3 h-3" />
                             질문 듣기 (Listen to question)
                           </button>
                         </div>

                                                 {!feedback ? (
                           <div>
                             <textarea
                               value={userAnswer}
                               onChange={(e) => setUserAnswer(e.target.value)}
                               placeholder="한국어로 답변해 주세요... (Type or speak your Korean answer)"
                               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] resize-y text-sm"
                             />
                             
                             {/* Voice recording controls */}
                             <div className="flex gap-2 mt-3">
                               {!isRecording ? (
                                 <button
                                   onClick={startRecording}
                                   className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 text-sm"
                                 >
                                   <Mic className="w-4 h-4" />
                                   Record Korean
                                 </button>
                               ) : (
                                 <button
                                   onClick={stopRecording}
                                   className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm animate-pulse"
                                 >
                                   <MicOff className="w-4 h-4" />
                                   Stop Recording
                                 </button>
                               )}
                               
                               {audioBlob && (
                                 <button
                                   onClick={handleVoiceSubmit}
                                   disabled={isProcessingAudio || aiLoading}
                                   className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                                 >
                                   {isProcessingAudio ? (
                                     <>
                                       <Loader2 className="w-4 h-4 animate-spin" />
                                       Processing...
                                     </>
                                   ) : (
                                     'Submit Voice Answer'
                                   )}
                                 </button>
                               )}
                             </div>
                             
                             <button
                               onClick={handleSubmitAIAnswer}
                               disabled={!userAnswer.trim() || aiLoading}
                               className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                             >
                               {aiLoading ? (
                                 <>
                                   <Loader2 className="w-4 h-4 animate-spin" />
                                   Evaluating...
                                 </>
                               ) : (
                                 'Submit Text Answer'
                               )}
                             </button>
                           </div>
                        ) : (
                          <div className="space-y-3">
                            {/* User's answer */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Your Answer:</p>
                              <p className="text-gray-900 dark:text-white text-sm">{userAnswer}</p>
                            </div>

                                                         {/* Feedback */}
                             <div className={`border rounded-lg p-3 ${feedback.is_correct ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
                               <div className="flex items-center gap-2 mb-2">
                                 {feedback.is_correct ? (
                                   <CheckCircle className="w-4 h-4 text-green-600" />
                                 ) : (
                                   <XCircle className="w-4 h-4 text-red-600" />
                                 )}
                                 <span className={`font-medium text-sm ${feedback.is_correct ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                                   {feedback.is_correct ? '맞아요!' : '다시 한번 생각해보세요'}
                                 </span>
                                 <span className={`ml-auto font-semibold text-sm ${getScoreColor(feedback.score)}`}>
                                   {feedback.score}/100
                                 </span>
                               </div>
                               <p className={`text-sm ${feedback.is_correct ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                 {feedback.feedback}
                               </p>
                               
                               {/* AI Voice Feedback */}
                               <button
                                 onClick={() => {
                                   if (aiAudioUrl) {
                                     playAiAudio(aiAudioUrl);
                                   } else {
                                     generateAiSpeech(feedback.feedback).then(audioUrl => {
                                       if (audioUrl) playAiAudio(audioUrl);
                                     });
                                   }
                                 }}
                                 disabled={isPlayingAiAudio}
                                 className="mt-2 w-full bg-purple-500 text-white py-1 px-3 rounded-md hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
                               >
                                 {isPlayingAiAudio ? (
                                   <>
                                     <Loader2 className="w-3 h-3 animate-spin" />
                                     Playing...
                                   </>
                                 ) : (
                                   <>
                                     <Volume2 className="w-3 h-3" />
                                     Listen to Feedback
                                   </>
                                 )}
                               </button>
                             </div>

                            <button
                              onClick={nextQuestion}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm"
                            >
                              {currentQuestionIndex + 1 >= totalQuestions ? 'Complete Practice' : 'Next Question'}
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {aiError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <p className="text-red-700 dark:text-red-400 text-sm">{aiError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default YouTubeShadowing;
