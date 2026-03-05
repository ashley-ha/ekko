import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Star, 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  Flame, 
  Trophy,
  Filter,
  Search,
  Brain
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { learningNotebookService, type LearningStats } from '../lib/learningNotebook';
import type { NotebookEntry } from '../store/useAppStore';

const LearningNotebook: React.FC = () => {
  const { } = useAppStore();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [filter, setFilter] = useState<'all' | 'unfamiliar' | 'needs_work' | 'memorized'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [entriesResult, statsResult] = await Promise.all([
      learningNotebookService.getAllEntries(),
      learningNotebookService.getLearningStats()
    ]);

    if (entriesResult.data) {
      setEntries(entriesResult.data);
    }
    if (statsResult.data) {
      setStats(statsResult.data);
    }
    setLoading(false);
  };

  const handleStatusChange = async (
    videoId: string,
    segmentIndex: number,
    newStatus: NotebookEntry['status']
  ) => {
    // Update local state immediately for better UX
    setEntries(prev => prev.map(entry => 
      entry.videoId === videoId && entry.segmentIndex === segmentIndex
        ? { ...entry, status: newStatus }
        : entry
    ));

    // Update database
    const result = await learningNotebookService.updateStatus(videoId, segmentIndex, newStatus);
    if (result.success) {
      // Reload stats to reflect changes
      const statsResult = await learningNotebookService.getLearningStats();
      if (statsResult.data) setStats(statsResult.data);
    } else {
      // Revert on error
      loadData();
    }
  };

  const getStatusIcon = (status: NotebookEntry['status']) => {
    switch (status) {
      case 'unfamiliar':
        return <Target className="w-4 h-4" />;
      case 'needs_work':
        return <Star className="w-4 h-4" />;
      case 'memorized':
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: NotebookEntry['status']) => {
    switch (status) {
      case 'unfamiliar':
        return 'from-gray-400 to-gray-500';
      case 'needs_work':
        return 'from-yellow-400 to-orange-500';
      case 'memorized':
        return 'from-green-400 to-emerald-500';
    }
  };

  const getStatusBgColor = (status: NotebookEntry['status']) => {
    switch (status) {
      case 'unfamiliar':
        return 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300';
      case 'needs_work':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
      case 'memorized':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200';
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesFilter = filter === 'all' || entry.status === filter;
    const matchesSearch = entry.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.videoTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getMotivationalMessage = () => {
    if (!stats) return "Let's start building your vocabulary! 🌟";
    
    if (stats.totalPhrases === 0) {
      return "Your learning journey starts here! Add your first phrase! 🚀";
    }
    
    if (stats.masteryPercentage >= 80) {
      return "You're a vocabulary master! Keep it up! 🏆";
    } else if (stats.masteryPercentage >= 60) {
      return "Great progress! You're getting there! 💪";
    } else if (stats.masteryPercentage >= 40) {
      return "Keep going! Every phrase counts! ⭐";
    } else {
      return "Just getting started! Consistency is key! 🌱";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pt-24 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your learning notebook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 pt-24 pb-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mt-2 mb-6">
            Learning Notebook
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            {getMotivationalMessage()}
          </p>
        </motion.div>

        {/* Stats Dashboard */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalPhrases}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Phrases</p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.memorizedPhrases}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Memorized</p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{stats.currentStreak}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Day Streak</p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{Math.round(stats.masteryPercentage)}%</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Mastery</p>
            </div>
          </motion.div>
        )}

        {/* Search and Progress Combined */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20 dark:border-gray-700/50 shadow-lg"
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Search Section */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search phrases or videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  {[
                    { key: 'all', label: 'All', icon: Filter },
                    { key: 'unfamiliar', label: 'Unfamiliar', icon: Target },
                    { key: 'needs_work', label: 'Needs Work', icon: Star },
                    { key: 'memorized', label: 'Memorized', icon: CheckCircle2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                        filter === key
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:block">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Learning Progress - Compact Version */}
            {stats && stats.totalPhrases > 0 && (
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Learning Progress</h3>
                </div>
                
                <div className="space-y-2">
                  {/* Compact Progress Items */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">Memorized</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">{stats.memorizedPhrases}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">Needs Work</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{stats.needsWorkPhrases}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-300">Unfamiliar</span>
                    </div>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{stats.unfamiliarPhrases}</span>
                  </div>

                  {/* Single Combined Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(stats.masteryPercentage)}% mastered</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                          style={{ width: `${stats.totalPhrases > 0 ? (stats.memorizedPhrases / stats.totalPhrases) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                          style={{ width: `${stats.totalPhrases > 0 ? (stats.needsWorkPhrases / stats.totalPhrases) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Entries */}
        {filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/50 shadow-lg max-w-md mx-auto">
              <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                {searchTerm || filter !== 'all' ? 'No matches found' : 'No phrases saved yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter'
                  : 'Start adding phrases from your shadowing practice!'}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={`${entry.videoId}-${entry.segmentIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all ${getStatusBgColor(entry.status)}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${getStatusColor(entry.status)}`}>
                          {getStatusIcon(entry.status)}
                        </div>
                        <div className="flex-1">
                          <p className="text-lg font-medium text-gray-800 dark:text-white">{entry.text}</p>
                        </div>
                      </div>


                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(entry.videoId, entry.segmentIndex, 'unfamiliar')}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            entry.status === 'unfamiliar'
                              ? 'bg-gray-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <Target className="w-4 h-4" />
                          Unfamiliar
                        </button>
                        <button
                          onClick={() => handleStatusChange(entry.videoId, entry.segmentIndex, 'needs_work')}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            entry.status === 'needs_work'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                          Needs Work
                        </button>
                        <button
                          onClick={() => handleStatusChange(entry.videoId, entry.segmentIndex, 'memorized')}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            entry.status === 'memorized'
                              ? 'bg-green-500 text-white'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Memorized
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningNotebook;
