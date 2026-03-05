import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, Trophy } from 'lucide-react';

interface StreakDisplayProps {
  streakDays: number;
  lastActiveDate: string | null;
}

const StreakDisplay: React.FC<StreakDisplayProps> = ({
  streakDays,
  lastActiveDate,
}) => {
  const getStreakMessage = () => {
    if (streakDays === 0) return 'Start your streak today!';
    if (streakDays === 1) return 'Great start! Keep it up!';
    if (streakDays < 7) return `${streakDays} days strong!`;
    if (streakDays < 30) return `Amazing ${streakDays}-day streak!`;
    if (streakDays < 100) return `Incredible ${streakDays} days!`;
    return `Legendary ${streakDays}-day streak!`;
  };

  const getFlameColor = () => {
    if (streakDays === 0) return 'text-gray-400';
    if (streakDays < 7) return 'text-orange-500';
    if (streakDays < 30) return 'text-red-500';
    if (streakDays < 100) return 'text-purple-500';
    return 'text-blue-500';
  };

  const milestones = [7, 30, 100, 365];
  const nextMilestone = milestones.find((m) => m > streakDays) || 365;
  const progressToNextMilestone = (streakDays / nextMilestone) * 100;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-600 transition-colors duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Daily Streak</h3>
        <motion.div
          animate={{ scale: [1, 1.6, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
        >
          <Flame className={`w-6 h-6 ${getFlameColor()}`} />
        </motion.div>
      </div>

      {/* Main Streak Display */}
      <div className="text-center mb-6">
        <motion.div
          key={streakDays}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className="relative inline-block"
        >
          <div className="text-6xl font-bold text-gray-900 dark:text-white">{streakDays}</div>
          {streakDays > 0}
        </motion.div>
        <p className="text-gray-600 dark:text-gray-300 mt-2">{getStreakMessage()}</p>
      </div>

      {/* Progress to Next Milestone */}
      {streakDays > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Next milestone</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {nextMilestone} days
            </span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-primary-500 to-accent-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextMilestone}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Milestone Badges */}
      <div className="mt-6 flex justify-center space-x-3">
        {milestones.slice(0, 3).map((milestone) => (
          <motion.div
            key={milestone}
            whileHover={{ scale: 1.1 }}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              streakDays >= milestone
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
            }`}
          >
            {milestone === 7 && <Calendar className="w-5 h-5" />}
            {milestone === 30 && <Trophy className="w-5 h-5" />}
            {milestone === 100 && <Flame className="w-5 h-5" />}
          </motion.div>
        ))}
      </div>

      {/* Motivational Footer */}
      {streakDays > 0 && streakDays % 7 === 0 && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mt-4 text-center"
        >
          <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
            🎉 Perfect week! You're amazing ❤︎
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StreakDisplay;
