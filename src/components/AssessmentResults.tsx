import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  TrendingUp,
  ArrowRight,
  Star,
  Zap,
  Heart,
  Brain,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const AssessmentResults: React.FC = () => {
  const { userProgress, setCurrentStep } = useAppStore();

  const levelInfo = {
    'first-steps': {
      title: 'First Steps',
      subtitle: 'Building Your Foundation',
      description:
        "Perfect! You're at the beginning of an exciting journey. We'll start with essential greetings, basic vocabulary, and pronunciation fundamentals.",
      color: 'from-primary-400 to-primary-600',
      bgColor: 'from-primary-50 to-primary-100',
      icon: '🌱',
      nextSteps: [
        'Master Hangul (Korean alphabet)',
        'Learn essential greetings and polite expressions',
        'Practice basic pronunciation patterns',
        'Build core vocabulary (numbers, colors, family)',
      ],
    },
    'finding-voice': {
      title: 'Finding Your Voice',
      subtitle: 'Gaining Confidence',
      description:
        "Great progress! You have some basics down. Now we'll focus on building your confidence with simple conversations and expanding your vocabulary.",
      color: 'from-success-400 to-success-600',
      bgColor: 'from-success-50 to-success-100',
      icon: '🗣️',
      nextSteps: [
        'Practice daily conversation scenarios',
        'Learn verb conjugations and sentence patterns',
        'Expand vocabulary for common situations',
        'Improve listening comprehension',
      ],
    },
    'conversation-ready': {
      title: 'Conversation Ready',
      subtitle: 'Speaking with Confidence',
      description:
        "Excellent! You can handle basic conversations. Let's work on fluency, natural expressions, and more complex topics.",
      color: 'from-accent-400 to-accent-600',
      bgColor: 'from-accent-50 to-accent-100',
      icon: '💬',
      nextSteps: [
        'Practice natural conversation flow',
        'Learn idiomatic expressions and slang',
        'Discuss complex topics and opinions',
        'Refine pronunciation and intonation',
      ],
    },
    'polishing-fluency': {
      title: 'Polishing Fluency',
      subtitle: 'Mastering Nuances',
      description:
        "Outstanding! You're nearly fluent. We'll focus on perfecting your accent, mastering formal/informal speech, and cultural nuances.",
      color: 'from-info-400 to-info-600',
      bgColor: 'from-info-50 to-info-100',
      icon: '✨',
      nextSteps: [
        'Master formal and informal speech levels',
        'Learn cultural context and etiquette',
        'Practice advanced grammar structures',
        'Achieve native-like pronunciation',
      ],
    },
  };

  const currentLevelInfo =
    levelInfo[userProgress.currentLevel || 'first-steps'];

  const handleStartLearning = () => {
    setCurrentStep('learning');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-accent-50/20 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Celebration Header */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          {/* Confetti Animation */}
          <div className="relative mb-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#E9D5FF', '#FECACA', '#A7F3D0', '#BFDBFE'][
                    i % 4
                  ],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  rotate: [0, 360],
                  opacity: [1, 0.5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-8xl mb-6"
          >
            🎉
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to{' '}
            <span
              className={`bg-gradient-to-r ${currentLevelInfo.color} bg-clip-text text-transparent`}
            >
              {currentLevelInfo.title}!
            </span>
          </h1>
          <p className="text-2xl text-gray-600 mb-2">
            {currentLevelInfo.subtitle}
          </p>
          <p className="text-lg text-gray-500">
            Your Korean learning journey starts here
          </p>
        </motion.div>

        {/* Level Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={`bg-gradient-to-br ${currentLevelInfo.bgColor} rounded-3xl p-8 mb-8 border border-gray-100`}
        >
          <div className="flex items-center justify-center mb-6">
            <div
              className={`w-20 h-20 bg-gradient-to-br ${currentLevelInfo.color} rounded-3xl flex items-center justify-center text-4xl shadow-lg`}
            >
              {currentLevelInfo.icon}
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            {currentLevelInfo.title}
          </h2>
          <p className="text-gray-700 text-center text-lg leading-relaxed mb-8">
            {currentLevelInfo.description}
          </p>

          {/* Assessment Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Trophy className="w-8 h-8 text-warning-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Assessment Score</h3>
              <p className="text-2xl font-bold text-gray-700">
                {userProgress.assessmentScore}/100
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Target className="w-8 h-8 text-success-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Strengths</h3>
              <p className="text-sm text-gray-600">
                {userProgress.strengths.join(', ')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <TrendingUp className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Focus Areas</h3>
              <p className="text-sm text-gray-600">
                {userProgress.weakPoints.join(', ')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Learning Path */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-8"
        >
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Your Personalized Learning Path
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {currentLevelInfo.nextSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl"
              >
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${currentLevelInfo.color} rounded-xl flex items-center justify-center text-white font-bold`}
                >
                  {index + 1}
                </div>
                <p className="text-gray-700 font-medium">{step}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Motivational Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-3xl p-8 mb-8"
        >
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">Your Journey Ahead</h3>
            <p className="text-gray-300 text-lg mb-6">
              Based on your assessment, here's what you can expect as you
              progress:
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Week 1-2</h4>
                <p className="text-gray-300 text-sm">
                  Foundation building and confidence boost
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-success-400 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Week 3-4</h4>
                <p className="text-gray-300 text-sm">
                  Rapid vocabulary expansion and fluency
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">Week 5+</h4>
                <p className="text-gray-300 text-sm">
                  Natural conversations and cultural fluency
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Start Learning Button */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center"
        >
          <button
            onClick={handleStartLearning}
            className={`group bg-gradient-to-r ${currentLevelInfo.color} text-white px-12 py-4 rounded-full text-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center mx-auto`}
          >
            <Star className="w-6 h-6 mr-3" />
            <span>Start Your Korean Adventure!</span>
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-gray-600 mt-4">
            🎯 Personalized lessons • 🎮 Gamified experience • 🏆 Track your
            progress
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AssessmentResults;
