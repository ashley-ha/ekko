import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import NameSelectionModal from './NameSelectionModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNameSelection, setShowNameSelection] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } =
        mode === 'signup'
          ? await signUp(email, password)
          : await signIn(email, password);

      if (error) {
        setError(error.message);
      } else {
        if (mode === 'signup') {
          // Show email confirmation message instead of name selection
          setShowEmailConfirmation(true);
        } else {
          // Handle sign in success
          const { userProgress, setCurrentStep } = useAppStore.getState();
          onClose();
          setEmail('');
          setPassword('');

          if (userProgress.assessmentCompleted) {
            setCurrentStep('learning');
          } else if (userProgress.selectedLanguage) {
            setCurrentStep('learning');
          } else {
            setCurrentStep('language-selection');
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setShowEmailConfirmation(false);
  };

  const handleEmailConfirmationClose = () => {
    setShowEmailConfirmation(false);
    onClose();
    setEmail('');
    setPassword('');
  };

  // Show email confirmation screen
  if (showEmailConfirmation) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleEmailConfirmationClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={handleEmailConfirmationClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Check Your Email
                </h2>
                <p className="text-gray-600">
                  We've sent a confirmation link to{' '}
                  <span className="font-semibold text-gray-900">{email}</span>
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-4 mb-8">
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                  <h3 className="font-semibold text-primary-900 mb-2">
                    Next Steps:
                  </h3>
                  <ol className="text-sm text-primary-800 space-y-1">
                    <li>1. Check your email inbox</li>
                    <li>2. Click the confirmation link</li>
                    <li>3. You'll be redirected back to continue setup</li>
                  </ol>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => {
                        setShowEmailConfirmation(false);
                        setMode('signup');
                      }}
                      className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      try again
                    </button>
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleEmailConfirmationClose}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                I'll check my email
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {mode === 'signup' ? 'Start Your Journey' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600">
                  {mode === 'signup'
                    ? 'Join thousands learning languages faster'
                    : 'Continue your language learning journey'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <User className="w-5 h-5 mr-2" />
                      {mode === 'signup' ? 'Create Account' : 'Sign In'}
                    </>
                  )}
                </button>
              </form>

              {/* Mode Toggle */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  {mode === 'signup'
                    ? 'Already have an account?'
                    : "Don't have an account?"}{' '}
                  <button
                    onClick={toggleMode}
                    className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                  >
                    {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>

              {/* Free Trial Note */}
              {mode === 'signup' && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    7-day free trial • No credit card required
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Name Selection Modal */}
      <NameSelectionModal
        isOpen={showNameSelection}
        onClose={() => {
          setShowNameSelection(false);
          onClose();
        }}
      />
    </>
  );
};

export default AuthModal;
