// test/youtube-shadowing.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YouTubeShadowing from '../src/components/YouTubeShadowing';
import * as youtubeAPI from '../src/lib/youtubeTranscriptAPI';

// Mock the dependencies
vi.mock('../src/lib/youtubeTranscriptAPI', () => ({
  extractVideoId: vi.fn(),
  fetchYouTubeTranscript: vi.fn(),
  processTranscriptIntoSentences: vi.fn(),
  translateText: vi.fn(),
}));

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('../src/store/useAppStore', () => ({
  useAppStore: () => ({
    addToNotebook: vi.fn(),
    isSegmentInNotebook: vi.fn().mockReturnValue(false),
    notebook: [],
  }),
}));

// Mock YouTube IFrame API
const mockPlayer = {
  seekTo: vi.fn(),
  playVideo: vi.fn(),
  pauseVideo: vi.fn(),
  getCurrentTime: vi.fn().mockReturnValue(0),
  getPlayerState: vi.fn().mockReturnValue(2), // Paused
  destroy: vi.fn(),
};

global.YT = {
  Player: vi.fn().mockImplementation((elementId, options) => {
    setTimeout(() => {
      options.events.onReady({ target: mockPlayer });
    }, 100);
    return mockPlayer;
  }),
};

describe('YouTubeShadowing Component', () => {
  const mockTranscript = [
    { text: 'First sentence.', start: 0, end: 3 },
    { text: 'Second sentence.', start: 3, end: 6 },
    { text: 'Third sentence.', start: 6, end: 9 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    youtubeAPI.extractVideoId.mockReturnValue('test-video-id');
    youtubeAPI.fetchYouTubeTranscript.mockResolvedValue({
      transcript: mockTranscript,
      error: null,
      cached: false,
    });
    youtubeAPI.processTranscriptIntoSentences.mockReturnValue(mockTranscript);
    youtubeAPI.translateText.mockResolvedValue('Translated text');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should load video and display segments', async () => {
      render(<YouTubeShadowing />);

      const urlInput = screen.getByPlaceholderText('Enter YouTube video URL');
      const loadButton = screen.getByText('Load Video');

      await userEvent.type(urlInput, 'https://youtube.com/watch?v=test-video-id');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('First sentence.')).toBeInTheDocument();
      });

      expect(youtubeAPI.extractVideoId).toHaveBeenCalledWith('https://youtube.com/watch?v=test-video-id');
      expect(youtubeAPI.fetchYouTubeTranscript).toHaveBeenCalledWith('test-video-id');
    });

    it('should show error for invalid URL', async () => {
      youtubeAPI.extractVideoId.mockReturnValue(null);
      
      render(<YouTubeShadowing />);

      const urlInput = screen.getByPlaceholderText('Enter YouTube video URL');
      const loadButton = screen.getByText('Load Video');

      await userEvent.type(urlInput, 'invalid-url');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid YouTube URL.')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Controls', () => {
    beforeEach(async () => {
      render(<YouTubeShadowing />);

      const urlInput = screen.getByPlaceholderText('Enter YouTube video URL');
      const loadButton = screen.getByText('Load Video');

      await userEvent.type(urlInput, 'https://youtube.com/watch?v=test-video-id');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('First sentence.')).toBeInTheDocument();
      });
    });

    it('should play segment when spacebar is pressed', async () => {
      // Wait for player to be ready
      await waitFor(() => {
        expect(mockPlayer.seekTo).toHaveBeenCalled();
      });

      vi.clearAllMocks();

      // Press spacebar
      fireEvent.keyDown(document, { code: 'Space', key: ' ' });

      await waitFor(() => {
        expect(mockPlayer.seekTo).toHaveBeenCalledWith(0, true);
        expect(mockPlayer.playVideo).toHaveBeenCalled();
      });
    });

    it('should navigate to next segment with right arrow', async () => {
      // Press right arrow
      fireEvent.keyDown(document, { code: 'ArrowRight', key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Second sentence.')).toBeInTheDocument();
        expect(mockPlayer.seekTo).toHaveBeenCalledWith(3, true);
      });
    });

    it('should navigate to previous segment with left arrow', async () => {
      // First go to second segment
      fireEvent.keyDown(document, { code: 'ArrowRight', key: 'ArrowRight' });
      
      await waitFor(() => {
        expect(screen.getByText('Second sentence.')).toBeInTheDocument();
      });

      // Then go back
      fireEvent.keyDown(document, { code: 'ArrowLeft', key: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.getByText('First sentence.')).toBeInTheDocument();
        expect(mockPlayer.seekTo).toHaveBeenCalledWith(0, true);
      });
    });
  });

  describe('Repetition Tracking', () => {
    it('should track repetitions when playing segments', async () => {
      render(<YouTubeShadowing />);

      const urlInput = screen.getByPlaceholderText('Enter YouTube video URL');
      const loadButton = screen.getByText('Load Video');

      await userEvent.type(urlInput, 'https://youtube.com/watch?v=test-video-id');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('First sentence.')).toBeInTheDocument();
      });

      // Initially should show 0 reps
      expect(screen.getByText('0 / 75 reps')).toBeInTheDocument();

      // Click repeat button
      const repeatButton = screen.getByTitle('Repeat (Spacebar)');
      await userEvent.click(repeatButton);

      await waitFor(() => {
        expect(screen.getByText('1 / 75 reps')).toBeInTheDocument();
      });

      // Play again
      await userEvent.click(repeatButton);

      await waitFor(() => {
        expect(screen.getByText('2 / 75 reps')).toBeInTheDocument();
      });
    });

    it('should persist repetitions when navigating between segments', async () => {
      render(<YouTubeShadowing />);

      const urlInput = screen.getByPlaceholderText('Enter YouTube video URL');
      const loadButton = screen.getByText('Load Video');

      await userEvent.type(urlInput, 'https://youtube.com/watch?v=test-video-id');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('First sentence.')).toBeInTheDocument();
      });

      // Play segment twice
      const repeatButton = screen.getByTitle('Repeat (Spacebar)');
      await userEvent.click(repeatButton);
      await userEvent.click(repeatButton);

      await waitFor(() => {
        expect(screen.getByText('2 / 75 reps')).toBeInTheDocument();
      });

      // Navigate to next segment
      fireEvent.keyDown(document, { code: 'ArrowRight', key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Second sentence.')).toBeInTheDocument();
        expect(screen.getByText('0 / 75 reps')).toBeInTheDocument();
      });

      // Navigate back
      fireEvent.keyDown(document, { code: 'ArrowLeft', key: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.getByText('First sentence.')).toBeInTheDocument();
        expect(screen.getByText('2 / 75 reps')).toBeInTheDocument();
      });
    });
  });

  describe('Video Synchronization', () => {
    it('should sync video position when changing segments', async () => {
      render(<YouTubeShadowing />);

      const urlInput = screen.getByPlaceholderText('Enter YouTube video URL');
      const loadButton = screen.getByText('Load Video');

      await userEvent.type(urlInput, 'https://youtube.com/watch?v=test-video-id');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('First sentence.')).toBeInTheDocument();
      });

      vi.clearAllMocks();

      // Click next button
      const nextButton = screen.getByTitle('Next (→)');
      await userEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Second sentence.')).toBeInTheDocument();
        expect(mockPlayer.pauseVideo).toHaveBeenCalled();
        expect(mockPlayer.seekTo).toHaveBeenCalledWith(3, true);
      });
    });

    it('should stop playback when navigating during segment play', async () => {
      render(<YouTubeShadowing />);

      const urlInput = screen.getByPlaceholderText('Enter YouTube video URL');
      const loadButton = screen.getByText('Load Video');

      await userEvent.type(urlInput, 'https://youtube.com/watch?v=test-video-id');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('First sentence.')).toBeInTheDocument();
      });

      // Start playing
      const repeatButton = screen.getByTitle('Repeat (Spacebar)');
      await userEvent.click(repeatButton);

      // Navigate while playing
      fireEvent.keyDown(document, { code: 'ArrowRight', key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Second sentence.')).toBeInTheDocument();
        expect(mockPlayer.pauseVideo).toHaveBeenCalled();
      });
    });
  });

  describe('Translation Feature', () => {
    it('should toggle translation display', async () => {
      render(<YouTubeShadowing />);

      const urlInput = screen.getByPlaceholderText('Enter YouTube video URL');
      const loadButton = screen.getByText('Load Video');

      await userEvent.type(urlInput, 'https://youtube.com/watch?v=test-video-id');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('First sentence.')).toBeInTheDocument();
      });

      // Click translation button
      const translationButton = screen.getByText('Translation');
      await userEvent.click(translationButton);

      await waitFor(() => {
        expect(screen.getByText('Click to translate')).toBeInTheDocument();
      });

      // Click to translate
      const translateLink = screen.getByText('Click to translate');
      await userEvent.click(translateLink);

      await waitFor(() => {
        expect(screen.getByText('Translated text')).toBeInTheDocument();
      });
    });
  });

  describe('Settings', () => {
    it('should allow changing sentences per segment', async () => {
      render(<YouTubeShadowing />);

      // Open settings
      const settingsButton = screen.getByText('Settings');
      await userEvent.click(settingsButton);

      // Change sentences per segment
      const sentencesInput = screen.getByLabelText('Sentences per segment:');
      await userEvent.clear(sentencesInput);
      await userEvent.type(sentencesInput, '2');

      // Load video
      const urlInput = screen.getByPlaceholderText('Enter YouTube video URL');
      const loadButton = screen.getByText('Load Video');

      await userEvent.type(urlInput, 'https://youtube.com/watch?v=test-video-id');
      await userEvent.click(loadButton);

      await waitFor(() => {
        expect(youtubeAPI.processTranscriptIntoSentences).toHaveBeenCalledWith(
          mockTranscript,
          2
        );
      });
    });
  });
});
