import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Star } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const LanguageSelection: React.FC = () => {
  const { setSelectedLanguage, setCurrentStep } = useAppStore();

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setCurrentStep('user-preferences');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-accent-50/20 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              Language Journey
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with Korean and unlock the power of natural conversation
          </p>
        </motion.div>

        {/* Korean Language Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div
            className="relative bg-white rounded-3xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
            onClick={() => handleLanguageSelect('korean')}
          >
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Most Popular</span>
              </div>
            </div>

            <div className="pt-4">
              {/* Korean Flag and Title */}
              <div className="text-center mb-8">
                <div className="text-8xl mb-4">🇰🇷</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Korean (한국어)
                </h2>
                <p className="text-gray-600">
                  Master the language of K-pop, K-dramas, and Korean culture
                </p>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                    <span className="text-gray-700">
                      Native pronunciation training
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                    <span className="text-gray-700">
                      Cultural context learning
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                    <span className="text-gray-700">
                      K-drama conversation practice
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                    <span className="text-gray-700">
                      Hangul reading & writing
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                    <span className="text-gray-700">
                      Business Korean modules
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                    <span className="text-gray-700">
                      AI conversation partner
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white py-4 rounded-2xl text-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform group-hover:-translate-y-1 flex items-center justify-center">
                <span>Start Your Korean Journey</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Coming Soon Languages */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            More Languages Coming Soon
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { flag: '🇰🇷', name: 'Korean', status: 'Coming Soon' },
              { flag: '🇺🇸', name: 'English', status: 'Coming Soon' },
              { flag: '🇰🇷', name: 'French', status: 'Coming Soon' },
              { flag: '🇰🇷', name: 'Japanese', status: 'Coming Soon' },
            ].map((lang, index) => (
              <div
                key={index}
                className="bg-white/50 rounded-2xl p-4 border border-gray-100"
              >
                <div className="text-4xl mb-2">{lang.flag}</div>
                <div className="text-sm font-semibold text-gray-900">
                  {lang.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">{lang.status}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center space-x-2 text-gray-600">
            <Globe className="w-5 h-5" />
            <span>Want to vote for the next language? Join our community!</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LanguageSelection;
