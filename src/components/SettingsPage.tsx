import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Save,
  Loader2,
  Bell,
  Volume2,
  Mic,
  Globe,
  Shield,
  Moon,
  Smartphone,
  AlertCircle,
  Check,
  ArrowLeft,
  Edit3,
  Target,
  Clock,
  Heart,
  Luggage,
  Briefcase,
  Users,
  GraduationCap,
  Sparkles,
  Zap,
  Waves,
  Tv,
  Music,
  Newspaper,
  MessageCircle,
  ChefHat,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

interface UserPreferences {
  learning_goal: string;
  motivation: string;
  time_commitment: string;
  preferred_content: string[];
  current_korean_exposure: string;
  specific_interests: string;
}

const SettingsPage: React.FC = () => {
  const { user, updateDisplayName } = useAuth();
  const { settings, updateSettings, setCurrentStep } = useAppStore();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Learning preferences state
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    learning_goal: '',
    motivation: '',
    time_commitment: '',
    preferred_content: [],
    current_korean_exposure: '',
    specific_interests: '',
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');
  const [preferencesSuccess, setPreferencesSuccess] = useState('');
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }

    // Load user preferences
    loadUserPreferences();
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setUserPreferences({
          learning_goal: data.learning_goal || '',
          motivation: data.motivation || '',
          time_commitment: data.time_commitment || '',
          preferred_content: data.preferred_content || [],
          current_korean_exposure: data.current_korean_exposure || '',
          specific_interests: data.specific_interests || '',
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleDisplayNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await updateDisplayName(displayName);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Display name updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setPreferencesLoading(true);
    setPreferencesError('');
    setPreferencesSuccess('');

    try {
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user.id,
        ...userPreferences,
      });

      if (error) throw error;

      setPreferencesSuccess('Learning preferences updated successfully!');
      setShowPreferencesForm(false);
      setTimeout(() => setPreferencesSuccess(''), 3000);
    } catch (error: any) {
      setPreferencesError(error.message || 'Failed to update preferences');
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    updateSettings({ [setting]: value });
  };

  const handlePreferenceChange = (
    key: keyof UserPreferences,
    value: string | string[]
  ) => {
    setUserPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleContentToggle = (content: string) => {
    setUserPreferences((prev) => ({
      ...prev,
      preferred_content: prev.preferred_content.includes(content)
        ? prev.preferred_content.filter((item) => item !== content)
        : [...prev.preferred_content, content],
    }));
  };

  // Learning goal options
  const learningGoalOptions = [
    {
      value: 'travel',
      label: 'Travel & Living in Korea',
      icon: Luggage,
      color: 'from-blue-400 to-blue-600',
    },
    {
      value: 'business',
      label: 'Career & Business',
      icon: Briefcase,
      color: 'from-purple-400 to-purple-600',
    },
    {
      value: 'culture',
      label: 'K-Culture (Dramas, Music)',
      icon: Heart,
      color: 'from-pink-400 to-pink-600',
    },
    {
      value: 'family',
      label: 'Family & Friends',
      icon: Users,
      color: 'from-green-400 to-green-600',
    },
    {
      value: 'academic',
      label: 'Academic Requirements',
      icon: GraduationCap,
      color: 'from-indigo-400 to-indigo-600',
    },
    {
      value: 'personal',
      label: 'Personal Growth',
      icon: Sparkles,
      color: 'from-yellow-400 to-yellow-600',
    },
  ];

  // Time commitment options
  const timeCommitmentOptions = [
    {
      value: '15min',
      label: '15 minutes',
      icon: Zap,
      color: 'from-red-400 to-red-600',
    },
    {
      value: '30min',
      label: '30 minutes',
      icon: Target,
      color: 'from-orange-400 to-orange-600',
    },
    {
      value: '1hour',
      label: '1+ hour',
      icon: Clock,
      color: 'from-blue-400 to-blue-600',
    },
    {
      value: 'flexible',
      label: 'Flexible',
      icon: Waves,
      color: 'from-teal-400 to-teal-600',
    },
  ];

  // Content preferences options
  const contentOptions = [
    {
      value: 'k-drama',
      label: 'K-Dramas & Movies',
      icon: Tv,
      color: 'from-purple-400 to-purple-600',
    },
    {
      value: 'k-pop',
      label: 'K-Pop & Music',
      icon: Music,
      color: 'from-pink-400 to-pink-600',
    },
    {
      value: 'news',
      label: 'News & Current Events',
      icon: Newspaper,
      color: 'from-blue-400 to-blue-600',
    },
    {
      value: 'business',
      label: 'Business & Professional',
      icon: Briefcase,
      color: 'from-gray-400 to-gray-600',
    },
    {
      value: 'casual',
      label: 'Everyday Conversations',
      icon: MessageCircle,
      color: 'from-green-400 to-green-600',
    },
    {
      value: 'food',
      label: 'Food & Cooking',
      icon: ChefHat,
      color: 'from-orange-400 to-orange-600',
    },
  ];

  // Korean exposure options
  const exposureOptions = [
    { value: 'none', label: 'None at all', description: 'Complete beginner' },
    {
      value: 'some',
      label: 'Some exposure',
      description: 'Through media or friends',
    },
    {
      value: 'regular',
      label: 'Regular exposure',
      description: 'Daily through work/study/family',
    },
  ];

  const settingsGroups = [
    {
      title: 'App Preferences',
      icon: Globe,
      settings: [
        {
          key: 'voiceEnabled',
          label: 'Voice Feedback',
          description: 'Enable voice responses from your AI coach',
          icon: Volume2,
          value: settings.voiceEnabled,
        },
        {
          key: 'microphonePermission',
          label: 'Microphone Access',
          description: 'Allow microphone for pronunciation practice',
          icon: Mic,
          value: settings.microphonePermission,
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        {
          key: 'notificationsEnabled',
          label: 'Daily Reminders',
          description: 'Get reminders to practice your language skills',
          icon: Bell,
          value: settings.notificationsEnabled,
        },
      ],
    },
    {
      title: 'Appearance',
      icon: Moon,
      settings: [
        {
          key: 'darkMode',
          label: 'Dark Mode',
          description: 'Switch to dark theme for better night viewing',
          icon: Moon,
          value: settings.darkMode,
        },
      ],
    },
    {
      title: 'Device',
      icon: Smartphone,
      settings: [
        {
          key: 'offlineMode',
          label: 'Offline Mode',
          description: 'Download lessons for offline practice',
          icon: Smartphone,
          value: settings.offlineMode,
        },
      ],
    },
  ];

  const getDisplayNameFromEmail = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getLabelForValue = (options: any[], value: string) => {
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-accent-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20 pb-16 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <button
            onClick={() => setCurrentStep('learning')}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Account Settings
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Customize your Ekko experience
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 transition-colors duration-300"
          >
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Profile Information
              </h2>
            </div>

            <form onSubmit={handleDisplayNameUpdate} className="space-y-6">
              {/* Display Name */}
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    placeholder="Enter your display name"
                    required
                    minLength={2}
                    maxLength={30}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This is the name your AI coach will use during lessons
                </p>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                    disabled
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Email cannot be changed. Contact support if you need to update
                  it.
                </p>
              </div>

              {/* Messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center space-x-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-600 text-sm">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-success-50 border border-success-200 rounded-xl p-3 flex items-center space-x-2"
                >
                  <Check className="w-5 h-5 text-success-500" />
                  <p className="text-success-600 text-sm">{success}</p>
                </motion.div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={loading || !displayName.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          </motion.div>

          {/* Account Summary */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Account Summary
            </h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-bold text-xl p-4">
                  {(displayName || getDisplayNameFromEmail())
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {displayName || getDisplayNameFromEmail()}
                  </p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Account Type</span>
                    <span className="text-sm font-medium text-gray-900">
                      Free Trial
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="text-sm font-medium text-gray-900">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-medium text-success-600">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Learning Preferences Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-8 bg-white rounded-3xl shadow-xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Target className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Learning Preferences
              </h2>
            </div>
            <button
              onClick={() => setShowPreferencesForm(!showPreferencesForm)}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>
                {showPreferencesForm ? 'Cancel' : 'Update Preferences'}
              </span>
            </button>
          </div>

          {!showPreferencesForm ? (
            // Display current preferences
            <div className="space-y-6">
              {userPreferences.learning_goal && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Learning Goal
                  </h4>
                  <p className="text-gray-600">
                    {getLabelForValue(
                      learningGoalOptions,
                      userPreferences.learning_goal
                    )}
                  </p>
                </div>
              )}

              {userPreferences.time_commitment && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Daily Time Commitment
                  </h4>
                  <p className="text-gray-600">
                    {getLabelForValue(
                      timeCommitmentOptions,
                      userPreferences.time_commitment
                    )}
                  </p>
                </div>
              )}

              {userPreferences.preferred_content.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Content Interests
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {userPreferences.preferred_content.map((content) => (
                      <span
                        key={content}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        {getLabelForValue(contentOptions, content)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {userPreferences.current_korean_exposure && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Korean Exposure Level
                  </h4>
                  <p className="text-gray-600">
                    {getLabelForValue(
                      exposureOptions,
                      userPreferences.current_korean_exposure
                    )}
                  </p>
                </div>
              )}

              {userPreferences.specific_interests && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Specific Goals
                  </h4>
                  <p className="text-gray-600">
                    {userPreferences.specific_interests}
                  </p>
                </div>
              )}

              {!userPreferences.learning_goal && (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    No learning preferences set yet
                  </p>
                  <button
                    onClick={() => setShowPreferencesForm(true)}
                    className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-200"
                  >
                    Set Your Preferences
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Preferences update form
            <form onSubmit={handlePreferencesUpdate} className="space-y-8">
              {/* Learning Goal */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  What's your main learning goal?
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {learningGoalOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handlePreferenceChange('learning_goal', option.value)
                      }
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        userPreferences.learning_goal === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${option.color}`}
                        >
                          <option.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Commitment */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  How much time can you commit daily?
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {timeCommitmentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handlePreferenceChange('time_commitment', option.value)
                      }
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                        userPreferences.time_commitment === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${option.color} mx-auto mb-2`}
                      >
                        <option.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900 text-sm">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Preferences */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  What content interests you? (Select all that apply)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleContentToggle(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        userPreferences.preferred_content.includes(option.value)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r ${option.color}`}
                        >
                          <option.icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {option.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Korean Exposure */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  How much Korean do you currently encounter?
                </h4>
                <div className="space-y-3">
                  {exposureOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        handlePreferenceChange(
                          'current_korean_exposure',
                          option.value
                        )
                      }
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        userPreferences.current_korean_exposure === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Interests */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  Any specific goals or situations? (Optional)
                </h4>
                <textarea
                  value={userPreferences.specific_interests}
                  onChange={(e) =>
                    handlePreferenceChange('specific_interests', e.target.value)
                  }
                  placeholder="e.g., 'I want to order food confidently', 'Understand my favorite K-drama without subtitles', 'Have business meetings in Korean'..."
                  className="w-full h-24 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Messages */}
              {preferencesError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center space-x-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-600 text-sm">{preferencesError}</p>
                </motion.div>
              )}

              {preferencesSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-success-50 border border-success-200 rounded-xl p-3 flex items-center space-x-2"
                >
                  <Check className="w-5 h-5 text-success-500" />
                  <p className="text-success-600 text-sm">
                    {preferencesSuccess}
                  </p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowPreferencesForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={preferencesLoading}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-accent-500 text-white py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {preferencesLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>

        {/* App Settings */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-8 space-y-6"
        >
          {settingsGroups.map((group, groupIndex) => (
            <div
              key={group.title}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <group.icon className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {group.title}
                </h2>
              </div>

              <div className="space-y-4">
                {group.settings.map((setting, settingIndex) => (
                  <motion.div
                    key={setting.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.4 + groupIndex * 0.1 + settingIndex * 0.05,
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-primary-200 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <setting.icon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {setting.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {setting.description}
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={setting.value}
                        onChange={(e) =>
                          handleSettingChange(setting.key, e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-accent-500"></div>
                    </label>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 bg-white rounded-3xl shadow-xl p-8 border-l-4 border-red-400"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Account Actions
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50">
              <h3 className="font-semibold text-red-900 mb-2">
                Reset Progress
              </h3>
              <p className="text-sm text-red-700 mb-4">
                This will reset all your learning progress, streak, and
                statistics. This action cannot be undone.
              </p>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                Reset Progress
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-red-200 bg-red-50">
              <h3 className="font-semibold text-red-900 mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
