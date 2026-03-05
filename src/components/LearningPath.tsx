import React from 'react';
import { motion } from 'framer-motion';
import { Star, Lock, CheckCircle } from 'lucide-react';

interface LearningPathProps {
  currentLevel: string | null;
  completedLessons: number;
  totalLessons: number;
}

const LearningPath: React.FC<LearningPathProps> = ({ currentLevel, completedLessons, totalLessons }) => {
  const levels = [
    { 
      id: 'first-steps', 
      name: 'First Steps', 
      icon: '🌱', 
      lessons: 20,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50'
    },
    { 
      id: 'finding-voice', 
      name: 'Finding Voice', 
      icon: '🗣️', 
      lessons: 30,
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50'
    },
    { 
      id: 'conversation-ready', 
      name: 'Conversation Ready', 
      icon: '💬', 
      lessons: 40,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50'
    },
    { 
      id: 'polishing-fluency', 
      name: 'Polishing Fluency', 
      icon: '✨', 
      lessons: 50,
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50'
    }
  ];

  const currentLevelIndex = levels.findIndex(l => l.id === currentLevel);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Your Learning Journey</h2>
      
      <div className="relative">
        {/* Path Line */}
        <div className="absolute left-12 top-0 bottom-0 w-1 bg-gray-200" />
        
        {/* Levels */}
        <div className="space-y-12">
          {levels.map((level, index) => {
            const isCompleted = index < currentLevelIndex;
            const isCurrent = index === currentLevelIndex;
            const isLocked = index > currentLevelIndex;
            
            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-center"
              >
                {/* Level Node */}
                <motion.div
                  whileHover={!isLocked ? { scale: 1.1 } : {}}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center ${
                    isCompleted ? `bg-gradient-to-br ${level.color} shadow-lg` :
                    isCurrent ? `bg-white border-4 border-current ${level.bgColor}` :
                    'bg-gray-100 border-2 border-gray-300'
                  }`}
                >
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <CheckCircle className="w-8 h-8 text-white" />
                    </motion.div>
                  )}
                  {isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-4xl"
                    >
                      {level.icon}
                    </motion.div>
                  )}
                  {isLocked && <Lock className="w-6 h-6 text-gray-400" />}
                </motion.div>
                
                {/* Level Info */}
                <div className={`ml-8 ${isLocked ? 'opacity-50' : ''}`}>
                  <h3 className="text-xl font-bold text-gray-900">{level.name}</h3>
                  
                  {isCurrent && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{completedLessons} / {level.lessons} lessons</span>
                      </div>
                      <div className="mt-2 w-48">
                        <div className="bg-gray-200 rounded-full h-2">
                          <motion.div
                            className={`bg-gradient-to-r ${level.color} h-2 rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(completedLessons / level.lessons) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!isCurrent && (
                    <p className="text-sm text-gray-600 mt-1">
                      {isCompleted ? `${level.lessons} lessons completed` : `${level.lessons} lessons`}
                    </p>
                  )}
                </div>
                
                {/* Stars for completed levels */}
                {isCompleted && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="absolute left-0 -top-2"
                  >
                    <div className="flex space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-gray-600">
            {currentLevelIndex === -1 && "Ready to start your journey? Let's begin!"}
            {currentLevelIndex === 0 && "You're making great progress! Keep going!"}
            {currentLevelIndex === 1 && "Your voice is getting stronger every day!"}
            {currentLevelIndex === 2 && "Almost fluent! You're doing amazing!"}
            {currentLevelIndex === 3 && "You're mastering the language beautifully!"}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LearningPath;
