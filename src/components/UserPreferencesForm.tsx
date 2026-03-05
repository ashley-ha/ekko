// src/components/UserPreferencesForm.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Luggage,
  Briefcase,
  Heart,
  Users,
  GraduationCap,
  Sparkles,
  Clock,
  Zap,
  Target,
  Waves,
  Tv,
  Music,
  Newspaper,
  MessageCircle,
  ChefHat,
  SkipForward,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserPreferences {
  learning_goal: string;
  motivation: string;
  time_commitment: string;
  preferred_content: string[];
  current_korean_exposure: string;
  specific_interests: string;
}

const UserPreferencesForm: React.FC = () => {
  const { setCurrentStep } = useAppStore();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    learning_goal: '',
    motivation: '',
    time_commitment: '',
    preferred_content: [],
    current_korean_exposure: '',
    specific_interests: '',
  });
  const [loading, setLoading] = useState(false);

  const questions = [
    {
      id: 'learning_goal',
      title: "What's driving your Korean learning journey?",
      subtitle: 'Help us understand your main motivation',
      type: 'single-choice',
      options: [
        {
          value: 'travel',
          label: 'Travel & Living in Korea',
          description: 'Explore Korea with confidence',
          icon: Luggage,
          color: 'from-blue-400 to-blue-600',
        },
        {
          value: 'business',
          label: 'Career & Business',
          description: 'Professional Korean skills',
          icon: Briefcase,
          color: 'from-purple-400 to-purple-600',
        },
        {
          value: 'culture',
          label: 'K-Culture (Dramas, Music)',
          description: 'Understand without subtitles',
          icon: Heart,
          color: 'from-pink-400 to-pink-600',
        },
        {
          value: 'family',
          label: 'Family & Friends',
          description: 'Connect with loved ones',
          icon: Users,
          color: 'from-green-400 to-green-600',
        },
        {
          value: 'academic',
          label: 'Academic Requirements',
          description: 'Study or research in Korean',
          icon: GraduationCap,
          color: 'from-indigo-400 to-indigo-600',
        },
        {
          value: 'personal',
          label: 'Personal Growth',
          description: 'Challenge yourself',
          icon: Sparkles,
          color: 'from-yellow-400 to-yellow-600',
        },
      ],
    },
    {
      id: 'time_commitment',
      title: 'How much time can you commit daily?',
      subtitle: 'Be realistic - consistency beats intensity!',
      type: 'single-choice',
      options: [
        {
          value: '15min',
          label: '15 minutes',
          description: 'Perfect for busy schedules',
          icon: Zap,
          color: 'from-red-400 to-red-600',
        },
        {
          value: '30min',
          label: '30 minutes',
          description: 'Focused learning sessions',
          icon: Target,
          color: 'from-orange-400 to-orange-600',
        },
        {
          value: '1hour',
          label: '1+ hour',
          description: 'Intensive study mode',
          icon: Clock,
          color: 'from-blue-400 to-blue-600',
        },
        {
          value: 'flexible',
          label: 'Flexible',
          description: 'Varies by day',
          icon: Waves,
          color: 'from-teal-400 to-teal-600',
        },
      ],
    },
    {
      id: 'preferred_content',
      title: 'What Korean content interests you most?',
      subtitle: "Select all that apply - we'll personalize your lessons!",
      type: 'multi-choice',
      options: [
        {
          value: 'k-drama',
          label: 'K-Dramas & Movies',
          description: 'Learn through entertainment',
          icon: Tv,
          color: 'from-purple-400 to-purple-600',
        },
        {
          value: 'k-pop',
          label: 'K-Pop & Music',
          description: 'Sing along with confidence',
          icon: Music,
          color: 'from-pink-400 to-pink-600',
        },
        {
          value: 'news',
          label: 'News & Current Events',
          description: 'Stay informed in Korean',
          icon: Newspaper,
          color: 'from-blue-400 to-blue-600',
        },
        {
          value: 'business',
          label: 'Business & Professional',
          description: 'Workplace communication',
          icon: Briefcase,
          color: 'from-gray-400 to-gray-600',
        },
        {
          value: 'casual',
          label: 'Everyday Conversations',
          description: 'Daily life interactions',
          icon: MessageCircle,
          color: 'from-green-400 to-green-600',
        },
        {
          value: 'food',
          label: 'Food & Cooking',
          description: 'Order and cook Korean food',
          icon: ChefHat,
          color: 'from-orange-400 to-orange-600',
        },
      ],
    },
    {
      id: 'current_korean_exposure',
      title: 'How much Korean do you currently encounter?',
      subtitle: 'This helps us calibrate your starting experience',
      type: 'single-choice',
      options: [
        {
          value: 'none',
          label: 'None at all',
          description: 'Complete beginner',
          icon: Target,
          color: 'from-gray-400 to-gray-600',
        },
        {
          value: 'some',
          label: 'Some exposure',
          description: 'Through media or friends',
          icon: Target,
          color: 'from-yellow-400 to-yellow-600',
        },
        {
          value: 'regular',
          label: 'Regular exposure',
          description: 'Daily through work/study/family',
          icon: Target,
          color: 'from-green-400 to-green-600',
        },
      ],
    },
  ];

  const currentQ = questions[currentQuestion];

  const handleOptionSelect = (value: string) => {
    if (currentQ.type === 'single-choice') {
      setPreferences((prev) => ({
        ...prev,
        [currentQ.id]: value,
      }));
    } else if (currentQ.type === 'multi-choice') {
      setPreferences((prev) => ({
        ...prev,
        [currentQ.id]: prev.preferred_content.includes(value)
          ? prev.preferred_content.filter((item) => item !== value)
          : [...prev.preferred_content, value],
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Show interests input
      setCurrentQuestion(questions.length);
    }
  };

  const handleSkip = () => {
    setCurrentStep('fluency-test');
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        ...preferences,
      });

      if (error) throw error;

      // Proceed to fluency test
      setCurrentStep('fluency-test');
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Still proceed even if save fails
      setCurrentStep('fluency-test');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (currentQ.type === 'single-choice') {
      return preferences[currentQ.id as keyof UserPreferences] !== '';
    } else if (currentQ.type === 'multi-choice') {
      return preferences.preferred_content.length > 0;
    }
    return true;
  };

  // Interests input screen
  if (currentQuestion === questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-accent-50/20 pt-16 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Any specific goals or situations?
            </h1>
            <p className="text-gray-600">
              Optional: Tell us about specific scenarios you want to prepare for
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 mb-8"
          >
            <textarea
              value={preferences.specific_interests}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  specific_interests: e.target.value,
                }))
              }
              placeholder="e.g., 'I want to order food confidently', 'Understand my favorite K-drama without subtitles', 'Have business meetings in Korean'..."
              className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </motion.div>

          <div className="flex space-x-4">
            <button
              onClick={handleSkip}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Skip This
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white py-4 rounded-2xl font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-accent-50/20 pt-16 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white rounded-full p-2 shadow-sm">
            <div className="bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {questions.length}
            </p>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center"
            >
              <SkipForward className="w-4 h-4 mr-1" />
              Skip to Fluency Test
            </button>
          </div>
        </motion.div>

        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {currentQ.title}
          </h1>
          <p className="text-xl text-gray-600">{currentQ.subtitle}</p>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          {currentQ.options.map((option, index) => {
            const isSelected =
              currentQ.type === 'single-choice'
                ? preferences[currentQ.id as keyof UserPreferences] ===
                  option.value
                : preferences.preferred_content.includes(option.value);

            return (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleOptionSelect(option.value)}
                className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${option.color}`}
                  >
                    <option.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {option.label}
                    </h3>
                    {option.description && (
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-center">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center ${
              canProceed()
                ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 transform hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentQ.type === 'multi-choice' &&
              preferences.preferred_content.length > 0 && (
                <span className="mr-2">
                  ({preferences.preferred_content.length} selected)
                </span>
              )}
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPreferencesForm;
