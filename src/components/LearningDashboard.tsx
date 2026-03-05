import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  BookOpen,
  Mic,
  Trophy,
  TrendingUp,
  Star,
  Youtube,
  Target,
  Heart,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../contexts/AuthContext';
import StreakDisplay from './StreakDisplay';
import LearningPath from './LearningPath';

const LearningDashboard: React.FC = () => {
  const { userProgress, setCurrentStep, setFluencyTestTaken } = useAppStore();
  const { user } = useAuth();

  const levelInfo = {
    'first-steps': { color: 'from-primary-400 to-primary-600', icon: '🌱' },
    'finding-voice': { color: 'from-success-400 to-success-600', icon: '🗣️' },
    'conversation-ready': {
      color: 'from-accent-400 to-accent-600',
      icon: '💬',
    },
    'polishing-fluency': { color: 'from-info-400 to-info-600', icon: '✨' },
  };

  const currentLevelInfo =
    levelInfo[userProgress.currentLevel || 'first-steps'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-accent-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-28 pb-16 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Fluency Test Banner - Only show if not taken */}
        {!userProgress.fluencyTestTaken && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-primary-300 to-accent-300 text-black rounded-3xl p-8 mb-8 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Take Your Fluency Test
                </h2>
                <p className="text-gray-500 mb-4">
                  Help us personalize your learning experience by taking a quick
                  fluency assessment. This will help us understand your current
                  level and create a customized learning path.
                </p>
                <div className="flex items-center space-x-4 text-sm text-black-700">
                  <span>⏱️ 5-10 minutes</span>
                  <span>🎤 Voice-based assessment</span>
                  <span>🎯 Personalized results</span>
                </div>
              </div>
              <button
                onClick={() => setCurrentStep('fluency-test')}
                className="bg-white text-purple-600 px-8 py-4 rounded-2xl font-semibold hover:bg-purple-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
              >
                Start Test
              </button>
            </div>
          </motion.div>
        )}

        {/* Welcome Header */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="flex flex-col items-center justify-center mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Welcome back
              {user?.user_metadata?.display_name
                ? `, ${user.user_metadata.display_name}`
                : user?.email
                ? `, ${user.email.split('@')[0]}`
                : ''}
              !
            </h1>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">
              <span
                className={`bg-gradient-to-r ${currentLevelInfo.color} bg-clip-text text-transparent`}
              >
                Ready to learn Korean?
              </span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Your journey to fluency continues {currentLevelInfo.icon}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* YouTube Shadowing - Core Technology */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-gradient-to-br from-accent-50 via-primary-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-3xl shadow-xl p-8 border-2 border-accent-200 dark:border-gray-600 transition-colors duration-300"
            >
              <div className="text-center mb-6">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Shadowing Practice
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Perfect your Korean naturally through immersive shadowing.
                  Train with authentic content using proven learning techniques
                  that mirror how children acquire language, <br />
                  <b>through natural repetition practice.</b>
                </p>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 mb-6 transition-colors duration-300">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-accent-400 to-accent-600 rounded-xl flex items-center justify-center mx-auto">
                      <Youtube className="w-6 h-6 text-white " />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Real Content
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Learn from authentic Korean videos, news, and
                      conversations
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-accent-400 to-accent-600 rounded-xl flex items-center justify-center mx-auto">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">AI Analysis</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get detailed pronunciation feedback and scoring.{' '}
                      <b>Coming soon!</b>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-accent-400 to-accent-600 rounded-xl flex items-center justify-center mx-auto">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Rapid Progress
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Improve pronunciation faster than traditional methods
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setCurrentStep('shadowing')}
                  className="bg-gradient-to-r from-primary-400 to-primary-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 inline-flex items-center"
                >
                  <Youtube className="w-8 h-8 mr-3 text-white" />
                  Start Shadowing Practice
                  <span className="ml-2 text-2xl">→</span>
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                  ✨ No setup required • Works with any Korean YouTube video
                </p>
              </div>
            </motion.div>

            {/* Learning Notebook Feature */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-indigo-900/20 rounded-3xl shadow-xl p-8 border-2 border-purple-200 dark:border-purple-700 transition-colors duration-300"
            >
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Learning Notebook
                  </h2>
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Save difficult phrases, track your mastery, and review your progress. 
                  <br />Your personal collection of Korean expressions to perfect! ✨
                </p>
              </div>

              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 mb-6 transition-colors duration-300">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Track Mastery
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Mark phrases as unfamiliar, needs work, or memorized
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mx-auto">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Smart Review</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get personalized practice recommendations
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center mx-auto">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Progress Stats
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      See your learning journey with beautiful analytics
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setCurrentStep('notebook')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 inline-flex items-center"
                >
                  <BookOpen className="w-8 h-8 mr-3 text-white" />
                  Open Learning Notebook
                  <span className="ml-2 text-2xl">📚</span>
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                  ✨ Save phrases from any video • Track your progress • Review efficiently
                </p>
              </div>
            </motion.div>

            {/* Additional Practice Tools */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 transition-colors duration-300"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Additional Practice Tools
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* AI Conversation */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center">
                      <span className="text-xl">❤︎</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Chat with Mina</h3>
                      <p className="text-gray-300 text-sm">
                        AI conversation practice
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-4">
                    Practice conversations and get instant pronunciation
                    feedback
                  </p>
                  <button
                    onClick={() => setCurrentStep('conversation')}
                    className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center text-sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Chat
                  </button>
                </div>

                {/* Pronunciation Assessment */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        Pronunciation Test
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Quick skill assessment
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Test your current pronunciation level and track improvement
                  </p>
                  <button
                    onClick={() => setCurrentStep('fluency-test')}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex items-center text-sm"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Take Test
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Streak Display */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <StreakDisplay
                streakDays={userProgress.streakDays}
                lastActiveDate={userProgress.lastActiveDate}
              />
            </motion.div>

            {/* Progress Card */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 transition-colors duration-300"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Your Stats
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Level
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {userProgress.currentLevel?.replace('-', ' ') ||
                        'Not Started'}
                    </span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className={`bg-gradient-to-r ${currentLevelInfo.color} h-2 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: '65%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userProgress.totalWordsLearned}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Words Learned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userProgress.assessmentScore}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Fluency Score</div>
                  </div>
                </div>

                {/* Fluency Level Display and Retake Button */}
                {userProgress.fluencyTestTaken && userProgress.fluencyLevel && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fluency Level
                      </span>
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400 capitalize">
                        {userProgress.fluencyLevel}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        // Reset fluency test status to allow retaking
                        setFluencyTestTaken(false);
                        setCurrentStep('fluency-test');
                      }}
                      className="text-accent-500 hover:text-accent-600 text-xs font-medium transition-colors duration-200 underline"
                    >
                      Retake Test
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 transition-colors duration-300"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Recent Achievements
              </h3>

              <div className="space-y-3">
                {userProgress.streakDays >= 7 && (
                  <div className="flex items-center space-x-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-xl">
                    <div className="w-10 h-10 bg-warning-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        First Week!
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Completed 7 days of practice
                      </div>
                    </div>
                  </div>
                )}

                {userProgress.assessmentScore >= 95 && (
                  <div className="flex items-center space-x-3 p-3 bg-success-50 dark:bg-success-900/20 rounded-xl">
                    <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        Pronunciation Pro
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        95% accuracy in speaking
                      </div>
                    </div>
                  </div>
                )}

                {userProgress.totalWordsLearned >= 100 && (
                  <div className="flex items-center space-x-3 p-3 bg-info-50 dark:bg-info-900/20 rounded-xl">
                    <div className="w-10 h-10 bg-info-500 rounded-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">
                        Vocabulary Master
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Learned 100+ words
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Learning Path Visualization */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-12"
        >
          <LearningPath
            currentLevel={userProgress.currentLevel}
            completedLessons={12} // TODO: Track this in userProgress
            totalLessons={20}
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 grid md:grid-cols-3 gap-6"
        >
          <button className="bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
            <Mic className="w-8 h-8 mb-2" />
            <h3 className="font-semibold text-lg">Practice Speaking</h3>
            <p className="text-sm opacity-90 mt-1">Work on pronunciation</p>
          </button>

          <button className="bg-gradient-to-r from-success-500 to-emerald-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
            <BookOpen className="w-8 h-8 mb-2" />
            <h3 className="font-semibold text-lg">Learn Phrases</h3>
            <p className="text-sm opacity-90 mt-1">Expand vocabulary</p>
          </button>

          <button className="bg-gradient-to-r from-info-500 to-purple-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
            <TrendingUp className="w-8 h-8 mb-2" />
            <h3 className="font-semibold text-lg">View Progress</h3>
            <p className="text-sm opacity-90 mt-1">Track improvement</p>
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LearningDashboard;
