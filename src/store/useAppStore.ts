import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { learningNotebookService } from '../lib/learningNotebook';

export type LanguageLevel =
  | 'first-steps'
  | 'finding-voice'
  | 'conversation-ready'
  | 'polishing-fluency';

export type FluencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'fluent';

export interface UserProgress {
  selectedLanguage: string | null;
  currentLevel: LanguageLevel | null;
  fluencyLevel: FluencyLevel | null;
  fluencyTestTaken: boolean;
  assessmentCompleted: boolean;
  assessmentScore: number;
  conversationHistory: ConversationMessage[];
  weakPoints: string[];
  strengths: string[];
  streakDays: number;
  totalWordsLearned: number;
  lastActiveDate: string | null;
}

export interface ConversationMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  confidence?: number;
}

export interface AppSettings {
  voiceEnabled: boolean;
  microphonePermission: boolean;
  notificationsEnabled: boolean;
  offlineMode: boolean;
  darkMode: boolean;
}

interface AppState {
  // User Progress
  userProgress: UserProgress;
  setSelectedLanguage: (language: string) => void;
  setCurrentLevel: (level: LanguageLevel) => void;
  setFluencyLevel: (level: FluencyLevel) => void;
  setFluencyTestTaken: (taken: boolean) => void;
  setAssessmentCompleted: (completed: boolean) => void;
  setAssessmentScore: (score: number) => void;
  addConversationMessage: (message: ConversationMessage) => void;
  clearConversationHistory: () => void;
  setWeakPoints: (points: string[]) => void;
  setStrengths: (strengths: string[]) => void;
  updateStreak: () => void;
  addWordsLearned: (count: number) => void;

  // App Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Learning Notebook
  notebook: NotebookEntry[];
  addToNotebook: (entry: Omit<NotebookEntry, 'status'>) => void;
  updateNotebookEntryStatus: (
    videoId: string,
    segmentIndex: number,
    status: 'unfamiliar' | 'needs_work' | 'memorized'
  ) => void;
  isSegmentInNotebook: (videoId: string, segmentIndex: number) => boolean;
  loadNotebookFromDatabase: () => Promise<void>;
  syncNotebookWithDatabase: () => Promise<void>;

  // UI State
  isAssessmentActive: boolean;
  setAssessmentActive: (active: boolean) => void;
  currentStep:
    | 'homepage'
    | 'language-selection'
    | 'user-preferences'
    | 'introduction'
    | 'fluency-test'
    | 'assessment'
    | 'results'
    | 'learning'
    | 'notebook'
    | 'settings'
    | 'conversation'
    | 'shadowing'
    | 'debug';
  setCurrentStep: (step: AppState['currentStep']) => void;

  // Mobile specific
  isOnline: boolean;
  setOnlineStatus: (status: boolean) => void;
  installPrompt: any;
  setInstallPrompt: (prompt: any) => void;
}

export interface NotebookEntry {
  id?: string;
  videoId: string;
  videoTitle?: string;
  videoChannel?: string;
  segmentIndex: number;
  text: string;
  start: number;
  end: number;
  status: 'unfamiliar' | 'needs_work' | 'memorized';
  difficultyRating?: number;
  personalNotes?: string;
  practiceCount?: number;
  lastPracticed?: Date;
  masteryScore?: number;
  streakDays?: number;
  timesReviewed?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const initialUserProgress: UserProgress = {
  selectedLanguage: null,
  currentLevel: null,
  fluencyLevel: null,
  fluencyTestTaken: false,
  assessmentCompleted: false,
  assessmentScore: 0,
  conversationHistory: [],
  weakPoints: [],
  strengths: [],
  streakDays: 0,
  totalWordsLearned: 0,
  lastActiveDate: null,
};

const initialSettings: AppSettings = {
  voiceEnabled: true,
  microphonePermission: false,
  notificationsEnabled: false,
  offlineMode: false,
  darkMode: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User Progress
      userProgress: initialUserProgress,
      setSelectedLanguage: (language) =>
        set((state) => ({
          userProgress: { ...state.userProgress, selectedLanguage: language },
        })),
      setCurrentLevel: (level) =>
        set((state) => ({
          userProgress: { ...state.userProgress, currentLevel: level },
        })),
      setFluencyLevel: (level) =>
        set((state) => ({
          userProgress: { ...state.userProgress, fluencyLevel: level },
        })),
      setFluencyTestTaken: (taken) =>
        set((state) => ({
          userProgress: { ...state.userProgress, fluencyTestTaken: taken },
        })),
      setAssessmentCompleted: (completed) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            assessmentCompleted: completed,
          },
        })),
      setAssessmentScore: (score) =>
        set((state) => ({
          userProgress: { ...state.userProgress, assessmentScore: score },
        })),
      addConversationMessage: (message) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            conversationHistory: [
              ...state.userProgress.conversationHistory,
              message,
            ],
          },
        })),
      clearConversationHistory: () =>
        set((state) => ({
          userProgress: { ...state.userProgress, conversationHistory: [] },
        })),
      setWeakPoints: (points) =>
        set((state) => ({
          userProgress: { ...state.userProgress, weakPoints: points },
        })),
      setStrengths: (strengths) =>
        set((state) => ({
          userProgress: { ...state.userProgress, strengths },
        })),
      updateStreak: () =>
        set((state) => {
          const today = new Date().toDateString();
          const lastActive = state.userProgress.lastActiveDate;
          const yesterday = new Date(Date.now() - 86400000).toDateString();

          let newStreak = state.userProgress.streakDays;

          if (lastActive === yesterday) {
            newStreak += 1;
          } else if (lastActive !== today) {
            newStreak = 1;
          }

          return {
            userProgress: {
              ...state.userProgress,
              streakDays: newStreak,
              lastActiveDate: today,
            },
          };
        }),
      addWordsLearned: (count) =>
        set((state) => ({
          userProgress: {
            ...state.userProgress,
            totalWordsLearned: state.userProgress.totalWordsLearned + count,
          },
        })),

      // App Settings
      settings: initialSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Learning Notebook
      notebook: [],
      addToNotebook: (entry) => {
        if (!get().isSegmentInNotebook(entry.videoId, entry.segmentIndex)) {
          set((state) => ({
            notebook: [...state.notebook, { ...entry, status: 'unfamiliar' as const }],
          }));
        }
      },
      updateNotebookEntryStatus: (videoId, segmentIndex, status) =>
        set((state) => ({
          notebook: state.notebook.map((entry) =>
            entry.videoId === videoId && entry.segmentIndex === segmentIndex
              ? { ...entry, status }
              : entry
          ),
        })),
      isSegmentInNotebook: (videoId, segmentIndex) =>
        get().notebook.some(
          (entry) =>
            entry.videoId === videoId && entry.segmentIndex === segmentIndex
        ),
      loadNotebookFromDatabase: async () => {
        try {
          const result = await learningNotebookService.getAllEntries();
          if (result.data) {
            set({ notebook: result.data });
          }
        } catch (error) {
          console.error('Failed to load notebook from database:', error);
        }
      },
      syncNotebookWithDatabase: async () => {
        const { loadNotebookFromDatabase } = get();
        await loadNotebookFromDatabase();
      },

      // UI State
      isAssessmentActive: false,
      setAssessmentActive: (active) => set({ isAssessmentActive: active }),
      currentStep: 'homepage',
      setCurrentStep: (step) => set({ currentStep: step }),

      // Mobile specific
      isOnline: navigator.onLine,
      setOnlineStatus: (status) => set({ isOnline: status }),
      installPrompt: null,
      setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
    }),
    {
      name: 'ekko-app-store',
      partialize: (state) => ({
        userProgress: state.userProgress,
        settings: state.settings,
        currentStep: state.currentStep,
        notebook: state.notebook,
      }),
    }
  )
);
