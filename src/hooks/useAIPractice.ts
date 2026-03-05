import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types for the AI Practice feature
export interface Question {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedAnswer: string;
}

export interface Feedback {
  is_correct: boolean;
  feedback: string;
  score: number;
}

export interface VideoInfo {
  title: string;
  channel: string;
  videoId: string;
}

interface UseAIPracticeState {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswer: string;
  feedback: Feedback | null;
  isLoading: boolean;
  error: string | null;
  videoInfo: VideoInfo | null;
  isComplete: boolean;
}

interface UseAIPracticeActions {
  startPractice: (videoId: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  nextQuestion: () => void;
  resetPractice: () => void;
  setUserAnswer: (answer: string) => void;
}

interface UseAIPracticeComputed {
  currentQuestion: Question | null;
  progress: number;
  totalQuestions: number;
}

export type UseAIPracticeReturn = UseAIPracticeState & UseAIPracticeActions & UseAIPracticeComputed;

export const useAIPractice = (): UseAIPracticeReturn => {
  const [state, setState] = useState<UseAIPracticeState>({
    questions: [],
    currentQuestionIndex: 0,
    userAnswer: '',
    feedback: null,
    isLoading: false,
    error: null,
    videoInfo: null,
    isComplete: false,
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<UseAIPracticeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Start practice session by generating questions
  const startPractice = useCallback(async (videoId: string) => {
    updateState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: { videoId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate questions');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      updateState({
        questions: data.questions,
        videoInfo: data.videoInfo,
        currentQuestionIndex: 0,
        userAnswer: '',
        feedback: null,
        isComplete: false,
        isLoading: false,
        error: null,
      });

    } catch (err) {
      console.error('Error starting practice:', err);
      updateState({
        isLoading: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  }, [updateState]);

  // Submit answer for evaluation
  const submitAnswer = useCallback(async (answer: string) => {
    if (!state.videoInfo || !state.questions[state.currentQuestionIndex]) {
      updateState({ error: 'No active practice session' });
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      const currentQuestion = state.questions[state.currentQuestionIndex];
      
      const { data, error } = await supabase.functions.invoke('evaluate-answer', {
        body: {
          question: currentQuestion.question,
          userAnswer: answer,
          videoId: state.videoInfo.videoId,
          expectedAnswer: currentQuestion.expectedAnswer,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to evaluate answer');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to evaluate answer');
      }

      updateState({
        feedback: {
          is_correct: data.is_correct,
          feedback: data.feedback,
          score: data.score,
        },
        isLoading: false,
        error: null,
      });

    } catch (err) {
      console.error('Error submitting answer:', err);
      updateState({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to evaluate answer',
        feedback: {
          is_correct: false,
          feedback: 'Sorry, there was an error evaluating your answer. Please try again.',
          score: 0,
        },
      });
    }
  }, [state.videoInfo, state.questions, state.currentQuestionIndex, updateState]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    const nextIndex = state.currentQuestionIndex + 1;
    
    if (nextIndex >= state.questions.length) {
      // Practice complete
      updateState({
        isComplete: true,
        currentQuestionIndex: nextIndex,
      });
    } else {
      // Move to next question
      updateState({
        currentQuestionIndex: nextIndex,
        userAnswer: '',
        feedback: null,
      });
    }
  }, [state.currentQuestionIndex, state.questions.length, updateState]);

  // Reset practice session
  const resetPractice = useCallback(() => {
    setState({
      questions: [],
      currentQuestionIndex: 0,
      userAnswer: '',
      feedback: null,
      isLoading: false,
      error: null,
      videoInfo: null,
      isComplete: false,
    });
  }, []);

  // Update user answer
  const setUserAnswer = useCallback((answer: string) => {
    updateState({ userAnswer: answer });
  }, [updateState]);

  // Computed properties
  const currentQuestion = state.questions[state.currentQuestionIndex] || null;
  const progress = state.questions.length > 0 
    ? Math.round(((state.currentQuestionIndex) / state.questions.length) * 100)
    : 0;

  return {
    // State
    ...state,
    
    // Computed properties
    currentQuestion,
    progress,
    totalQuestions: state.questions.length,
    
    // Actions
    startPractice,
    submitAnswer,
    nextQuestion,
    resetPractice,
    setUserAnswer,
  };
};