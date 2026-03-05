import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Volume2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { useDevelopmentMode } from '../hooks/useDevelopmentMode';
import AuthModal from './AuthModal';
import WaitlistModal from './WaitlistModal';

const HeroSection: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const { user } = useAuth();
  const { setCurrentStep } = useAppStore();
  const { isDevelopment, showAuthModal, showWaitlist } = useDevelopmentMode();

  const handleCTAClick = () => {
    if (user) {
      // Check user's progress and route accordingly
      const { userProgress } = useAppStore.getState();
      if (userProgress.assessmentCompleted) {
        setCurrentStep('learning');
      } else if (userProgress.selectedLanguage) {
        setCurrentStep('introduction'); // Resume where they left off
      } else {
        setCurrentStep('language-selection'); // Start fresh
      }
    } else {
      if (showAuthModal) {
        setCurrentStep('language-selection'); // Start the journey for new users in dev mode
      } else {
        setWaitlistModalOpen(true); // Show waitlist in production
      }
    }
  };

  return (
    <>
      <section className="relative bg-gradient-to-br from-white via-primary-50/30 to-accent-50/20 pt-40 pb-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200/20 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-1/2 right-1/3 w-48 h-48 bg-success-200/20 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Development mode banner */}
            {isDevelopment && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-6 bg-yellow-100 border border-yellow-300 rounded-lg p-3 inline-block"
              >
                <p className="text-yellow-800 text-sm font-medium">
                  🚧 Development Mode - Full functionality available for testing
                </p>
              </motion.div>
            )}

            {/* Main Headline */}
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
            >
              Learn Languages <span className="text-primary-500">Faster</span>
              ,<br />
              The Way Your Brain{' '}
              <span className="text-accent-500">Naturally</span> Wants To
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              {showWaitlist
                ? 'Skip the textbooks. Start speaking from day one with science-backed practice. Join the waitlist for early access.'
                : 'Skip the textbooks. Start speaking from day one with science-backed practice.'}
            </motion.p>

            {/* Sound Wave Animation - Fixed positioning */}
            <div className="mb-12 flex justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="relative h-20 flex items-center"
              >
                <div className="flex items-center space-x-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-gradient-to-t from-primary-400 to-accent-400 rounded-full"
                      style={{
                        width: '8px',
                        height: `${Math.random() * 40 + 20}px`,
                      }}
                      animate={{
                        height: [
                          `${Math.random() * 40 + 20}px`,
                          `${Math.random() * 60 + 30}px`,
                          `${Math.random() * 40 + 20}px`,
                        ],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
                {/* Flag Animation */}
                <div className="ml-8">
                  <motion.div
                    className="flex items-center space-x-2 text-2xl"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                  >
                    <span>🇺🇸</span>
                    <motion.span
                      className="text-gray-400"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                    <motion.div
                      className="flex space-x-1"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span>🇰🇷</span>
                      <span>🇩🇪</span>
                      <span>🇪🇸</span>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* CTA Button */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mb-12"
            >
              <button
                onClick={handleCTAClick}
                className="group bg-gradient-to-r from-primary-500 to-accent-400 text-white px-12 py-4 rounded-full text-xl font-semibold hover:from-primary-600 hover:to-accent-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="flex items-center">
                  <Play className="w-6 h-6 mr-3" />
                  {user
                    ? 'Continue Learning'
                    : showWaitlist
                    ? 'Join Waitlist'
                    : 'Become Fluent Today'}
                  <span
                    className="ml-2 text-md font-normal transform -rotate-12 text-accent-100"
                    style={{
                      fontFamily: 'cursive',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    with Ekko
                  </span>
                </span>
              </button>
              <p className="text-sm text-gray-500 mt-3">
                {user
                  ? 'Welcome back!'
                  : showWaitlist
                  ? 'Be first to experience revolutionary Korean learning'
                  : '7-day free trial • No credit card required'}
              </p>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-gray-600"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary-500" />
                <span className="font-semibold">10,000+</span>
                <span>
                  {showWaitlist
                    ? 'excited learners waiting'
                    : 'learners speaking confidently'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5 text-success-500" />
                <span className="font-semibold">Science-backed</span>
                <span>speaking practice</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Auth Modal (Development only) */}
      {showAuthModal && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode="signup"
        />
      )}

      {/* Waitlist Modal (Production) */}
      {showWaitlist && (
        <WaitlistModal
          isOpen={waitlistModalOpen}
          onClose={() => setWaitlistModalOpen(false)}
        />
      )}
    </>
  );
};

export default HeroSection;
