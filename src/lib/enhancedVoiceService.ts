// src/lib/enhancedVoiceService.ts

// enhanced voice service with improved permission handling and elevenlabs integration.
// this service should be the single source of truth for speech synthesis and recognition.
import { speechSynthesisService } from './speechSynthesis';

export interface VoiceConfig {
  language: 'ko-KR' | 'en-US';
  speed: number;
  quality: 'standard' | 'premium';
  voice?: string; // voice name or id
  voiceId?: string; // elevenlabs voice id
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

// defines the possible states of microphone permission.
export type MicrophonePermissionState =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unknown';

export class EnhancedVoiceService {
  private isSupported: boolean;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private audioCache = new Map<string, Blob>();
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private recordingChunks: Blob[] = [];

  constructor() {
    // check if the browser supports the web speech api.
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.isSupported = !!SpeechRecognitionAPI;
    if (this.isSupported) {
      this.recognition = new SpeechRecognitionAPI();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
    }
  }

  // speaks text using elevenlabs for premium korean, otherwise falls back to the browser's tts.
  async speak(
    text: string,
    config: VoiceConfig = { language: 'ko-KR', speed: 1, quality: 'premium' }
  ): Promise<void> {
    try {
      if (config.quality === 'premium' && config.language === 'ko-KR') {
        // use elevenlabs for premium korean voice.
        return await this.speakWithElevenLabs(text, config);
      } else {
        // fallback to browser speech synthesis.
        return await this.speakWithBrowserAPI(text, config);
      }
    } catch (error) {
      console.warn('premium voice failed, falling back to standard:', error);
      return await this.speakWithBrowserAPI(text, config);
    }
  }

  private async speakWithElevenLabs(
    text: string,
    config: VoiceConfig
  ): Promise<void> {
    try {
      const cacheKey = `${text}-${config.voice || 'default'}`;
      let audioBlob = this.audioCache.get(cacheKey);

      if (!audioBlob) {
        console.log(
          'requesting elevenlabs speech generation for:',
          text.substring(0, 50) + '...'
        );

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('missing supabase environment variables');
        }

        const functionUrl = `${supabaseUrl}/functions/v1/voice-speak`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            text,
            language: config.language,
            voiceId: config.voice || 'Anna Kim',
          }),
        });

        if (!response.ok) {
          // try to parse the error for better logging.
          let errorDetails = await response.text();
          try {
            errorDetails = JSON.stringify(await response.json());
          } catch (e) {
            // ignore if response is not json
          }
          throw new Error(
            `elevenlabs request failed with status ${response.status}: ${errorDetails}`
          );
        }

        const contentType = response.headers.get('content-type');
        if (contentType?.includes('audio/')) {
          audioBlob = new Blob([await response.arrayBuffer()], {
            type: contentType,
          });
          this.audioCache.set(cacheKey, audioBlob);
        } else {
          const errorData = await response.json();
          throw new Error(
            `unexpected content type: ${contentType}. error: ${errorData.error}`
          );
        }
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (e) => {
          URL.revokeObjectURL(audioUrl);
          console.error('audio playback error:', e);
          reject(new Error('failed to play generated audio.'));
        };
        audio.playbackRate = config.speed;
        audio.play().catch((err) => {
          URL.revokeObjectURL(audioUrl);
          reject(err);
        });
      });
    } catch (error) {
      console.error('speakWithElevenLabs failed:', error);
      throw error; // re-throw to be caught by the calling function.
    }
  }

  private async speakWithBrowserAPI(
    text: string,
    config: VoiceConfig
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      speechSynthesisService.speak(
        text,
        {
          language: config.language,
          rate: config.speed,
          pitch: 1.1,
          volume: 1.0,
        },
        undefined,
        () => resolve(),
        (error) => reject(new Error(error))
      );
    });
  }

  // new: explicitly checks the current microphone permission status.
  async checkMicrophonePermission(): Promise<MicrophonePermissionState> {
    if (!navigator.permissions) {
      console.warn(
        "navigator.permissions api not supported, can't check status."
      );
      return 'unknown';
    }
    try {
      const permission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      return permission.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      console.error('microphone permission query failed:', error);
      return 'unknown';
    }
  }

  // new: explicitly requests microphone access from the user.
  async requestMicrophonePermission(): Promise<{
    granted: boolean;
    error?: string;
  }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        granted: false,
        error: 'getUserMedia not supported on this browser.',
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Successfully got permission, stop the track immediately.
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true };
    } catch (error) {
      console.error('Microphone permission request failed:', error);
      return {
        granted: false,
        error: error instanceof Error ? error.message : 'Permission denied',
      };
    }
  }

  // Main listen method now uses Whisper by default for better Korean recognition
  async listen(
    language: 'ko-KR' | 'en-US' = 'ko-KR',
    timeout: number = 10000
  ): Promise<SpeechRecognitionResult> {
    // Use Whisper for much better Korean recognition and reliability
    return this.listenWithWhisper(language, timeout);
  }

  // Keep the old Web Speech API method as a fallback (renamed)
  async listenWithWebSpeechAPI(
    language: 'ko-KR' | 'en-US' = 'ko-KR',
    timeout: number = 10000
  ): Promise<SpeechRecognitionResult> {
    if (!this.isSupported || !this.recognition) {
      return Promise.reject(
        new Error('speech recognition is not supported by this browser.')
      );
    }
    if (this.isListening) {
      return Promise.reject(new Error('speech recognition is already active.'));
    }

    // new: check permission state before trying to listen.
    const permissionState = await this.checkMicrophonePermission();
    if (permissionState !== 'granted') {
      return Promise.reject(
        new Error(
          `cannot start listening, microphone permission is ${permissionState}.`
        )
      );
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.recognition) {
          this.recognition.stop();
        }
        reject(new Error('speech recognition timed out. no speech detected.'));
      }, timeout);

      this.recognition!.lang = language;
      this.isListening = true;

      this.recognition!.onresult = (event) => {
        clearTimeout(timeoutId);
        const result = event.results[0][0];
        resolve({
          transcript: result.transcript,
          confidence: result.confidence,
        });
      };

      this.recognition!.onerror = (event) => {
        clearTimeout(timeoutId);
        this.isListening = false;

        // provide more specific error messages.
        let errorMessage = `speech recognition error: ${event.error}.`;
        switch (event.error) {
          case 'not-allowed':
            errorMessage =
              'microphone access was denied. please enable it in your browser settings.';
            break;
          case 'network':
            errorMessage =
              'a network error occurred. please check your internet connection or try again later.';
            break;
          case 'no-speech':
            errorMessage = 'no speech was detected. please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage =
              'no microphone was found. please ensure your microphone is connected and working.';
            break;
          case 'service-not-allowed':
            errorMessage =
              'speech recognition service is not allowed. this may be due to browser policies or settings.';
            break;
        }
        reject(new Error(errorMessage));
      };

      this.recognition!.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition!.start();
      } catch (error) {
        clearTimeout(timeoutId);
        this.isListening = false;
        reject(new Error('failed to start speech recognition.'));
      }
    });
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Manual recording methods for better user control
  async startRecording(): Promise<void> {
    // Check microphone permission
    const permissionState = await this.checkMicrophonePermission();
    if (permissionState !== 'granted') {
      throw new Error(`Microphone permission is ${permissionState}`);
    }

    if (this.isListening) {
      throw new Error('Recording is already in progress');
    }

    try {
      // Get audio stream
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      this.mediaRecorder = new MediaRecorder(this.audioStream);
      this.recordingChunks = [];

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.stopRecording();
        throw new Error('Recording failed');
      };

      // Start recording
      this.mediaRecorder.start();
      this.isListening = true;
      console.log('Recording started');
    } catch (error) {
      this.cleanup();
      throw new Error(
        `Failed to start recording: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async stopRecording(): Promise<SpeechRecognitionResult> {
    if (!this.isListening || !this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = async () => {
        try {
          // Create audio blob from recorded chunks
          const audioBlob = new Blob(this.recordingChunks, {
            type: 'audio/webm',
          });
          console.log('Recording stopped, audio blob size:', audioBlob.size);

          // Clean up recording resources
          this.cleanup();

          // Process with Whisper
          const result = await this.processWithWhisper(audioBlob);
          resolve(result);
        } catch (error) {
          this.cleanup();
          reject(error);
        }
      };

      // Stop the recording
      this.mediaRecorder!.stop();
      this.isListening = false;
    });
  }

  private cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    this.mediaRecorder = null;
    this.recordingChunks = [];
    this.isListening = false;
  }

  private async processWithWhisper(
    audioBlob: Blob
  ): Promise<SpeechRecognitionResult> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch(
      `${supabaseUrl}/functions/v1/speech-recognize`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 500 && errorText.includes('OPENAI_API_KEY')) {
        throw new Error(
          'Speech recognition service is not configured. Please contact support.'
        );
      }
      throw new Error(`Speech recognition failed: ${errorText}`);
    }

    const result = await response.json();

    // 🎯 LOG WHISPER RESPONSE FOR DEBUGGING
    console.log('=== WHISPER TRANSCRIPTION RESULT ===');
    console.log('Raw Whisper Response:', result);
    console.log('Transcript:', result.transcript);
    console.log('Confidence:', result.confidence);
    console.log('===================================');

    return {
      transcript: result.transcript,
      confidence: result.confidence,
    };
  }

  async testVoiceConnection(): Promise<{
    premium: boolean;
    standard: boolean;
    microphone: boolean;
    whisper: boolean;
  }> {
    const result = {
      premium: false,
      standard: false,
      microphone: false,
      whisper: false,
    };

    // Test standard browser speech synthesis
    try {
      if ('speechSynthesis' in window) {
        result.standard = true;
      }
    } catch (error) {
      console.warn('Standard speech synthesis test failed:', error);
    }

    // Test premium ElevenLabs
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        // Just check if we can reach the function, don't actually generate audio
        const functionUrl = `${supabaseUrl}/functions/v1/voice-speak`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            text: 'test',
            language: 'ko-KR',
            voiceId: 'Anna Kim',
          }),
        });

        if (response.ok || response.status === 400) {
          // 400 might be expected for test
          result.premium = true;
        }
      }
    } catch (error) {
      console.warn('Premium voice test failed:', error);
    }

    // Test microphone access
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        result.microphone = true;
      }
    } catch (error) {
      console.warn('Microphone test failed:', error);
    }

    // Test Whisper speech recognition - just check if we have the required config
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey && result.microphone) {
        // Don't actually call the function to avoid CORS issues during testing
        // Just check if we have the required configuration
        result.whisper = true;
      }
    } catch (error) {
      console.warn('Whisper test failed:', error);
    }

    return result;
  }

  isRecognitionSupported(): boolean {
    // Now we support recognition via Whisper even if Web Speech API isn't available
    return true;
  }

  // Whisper-based recognition method
  async listenWithWhisper(
    language: 'ko-KR' | 'en-US' = 'ko-KR',
    timeout: number = 10000
  ): Promise<SpeechRecognitionResult> {
    // Check microphone permission
    const permissionState = await this.checkMicrophonePermission();
    if (permissionState !== 'granted') {
      throw new Error(`Microphone permission is ${permissionState}`);
    }

    this.isListening = true;

    try {
      // Record audio
      const audioBlob = await this.recordAudio(timeout);

      // Send to Supabase function for Whisper processing
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase configuration');
      }

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(
        `${supabaseUrl}/functions/v1/speech-recognize`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 500 && errorText.includes('OPENAI_API_KEY')) {
          throw new Error(
            'Speech recognition service is not configured. Please contact support.'
          );
        }
        throw new Error(`Speech recognition failed: ${errorText}`);
      }

      const result = await response.json();
      return {
        transcript: result.transcript,
        confidence: result.confidence,
      };
    } finally {
      this.isListening = false;
    }
  }

  private async recordAudio(timeout: number): Promise<Blob> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        resolve(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        stream.getTracks().forEach((track) => track.stop());
        reject(new Error('Recording failed'));
      };

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, timeout);

      mediaRecorder.start();
    });
  }
}

// global enhanced voice service instance
export const enhancedVoiceService = new EnhancedVoiceService();
