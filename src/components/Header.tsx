import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, User, LogOut, Home, Settings, Moon, Sun, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { useDevelopmentMode } from '../hooks/useDevelopmentMode';
import AuthModal from './AuthModal';
import WaitlistModal from './WaitlistModal';

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  setIsSigningOut: (isSigningOut: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  isMenuOpen,
  setIsMenuOpen,
  setIsSigningOut,
}) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const { user, signOut, loading } = useAuth();
  const { currentStep, setCurrentStep, settings, updateSettings } = useAppStore();
  const {
    isDevelopment,
    showAuthModal,
    showWaitlist,
    enableDevMode,
    enableWaitlistMode,
    clearModeOverride,
    hasOverride,
  } = useDevelopmentMode();
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 50) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY.current) {
        setShowHeader(false); // scrolling down
      } else {
        setShowHeader(true); // scrolling up
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true); // Set flag to prevent auto-routing
    await signOut();
    setCurrentStep('homepage'); // Reset to homepage
  };

  const openAuthModal = (mode: 'signin' | 'signup') => {
    if (showAuthModal) {
      setAuthMode(mode);
      setAuthModalOpen(true);
    } else {
      setWaitlistModalOpen(true);
    }
  };

  const handleLogoClick = () => {
    if (user && currentStep === 'learning') {
      setCurrentStep('learning'); // Stay on dashboard if already there
    } else {
      setCurrentStep('homepage'); // Go to homepage
    }
  };

  const isOnHomepage = currentStep === 'homepage';

  return (
    <>
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 transition-all duration-300 ${
          showHeader ? '' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-16 h-16 flex items-center justify-center">
                <img
                  src="/ekko-logo-small.png"
                  alt="Ekko Logo"
                  className="w-16 h-16 object-contain"
                />
              </div>
              {/* Development mode indicator */}
              {isDevelopment && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                  DEV MODE
                </span>
              )}
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {isOnHomepage ? (
                <>
                  <a
                    href="#science"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                  >
                    How It Works
                  </a>
                  <a
                    href="#features"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                  >
                    Features
                  </a>
                  <a
                    href="#pricing"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                  >
                    Pricing
                  </a>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setCurrentStep('homepage')}
                    className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                  >
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </button>
                  {user && (
                    <>
                      <button
                        onClick={() => setCurrentStep('learning')}
                        className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => setCurrentStep('notebook')}
                        className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Notebook</span>
                      </button>
                      <button
                        onClick={() => setCurrentStep('shadowing')}
                        className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                      >
                        Practice
                      </button>
                      <button
                        onClick={() => setCurrentStep('debug')}
                        className="text-gray-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium text-sm"
                      >
                        🐛 Debug
                      </button>
                      <button
                        onClick={() => setCurrentStep('settings')}
                        className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                title={settings.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {settings.darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Developer Mode Toggle (only show when override is active) */}
              {hasOverride && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 rounded-full border border-yellow-300">
                  <span className="text-xs font-medium text-yellow-800">
                    Mode: {isDevelopment ? 'Dev' : 'Waitlist'}
                  </span>
                  <button
                    onClick={isDevelopment ? enableWaitlistMode : enableDevMode}
                    className="text-xs bg-yellow-200 hover:bg-yellow-300 px-2 py-1 rounded transition-colors"
                  >
                    Switch
                  </button>
                  <button
                    onClick={clearModeOverride}
                    className="text-xs text-yellow-600 hover:text-yellow-700"
                    title="Clear override"
                  >
                    ×
                  </button>
                </div>
              )}

              {!loading &&
                (user ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                      <User className="w-5 h-5" />
                      <span className="font-medium">
                        {user.user_metadata?.display_name ||
                          user.email?.split('@')[0] ||
                          'User'}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {showAuthModal && (
                      <button
                        onClick={() => openAuthModal('signin')}
                        className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                      >
                        Sign In
                      </button>
                    )}
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="bg-primary-200 text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-primary-300 transition-all duration-200 shadow-sm"
                    >
                      {showWaitlist ? 'Join Waitlist' : 'Start Free Trial'}
                    </button>
                  </>
                ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-gray-100"
            >
              <nav className="flex flex-col space-y-4">
                {isOnHomepage ? (
                  <>
                    <a
                      href="#science"
                      className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                    >
                      How It Works
                    </a>
                    <a
                      href="#features"
                      className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                    >
                      Features
                    </a>
                    <a
                      href="#pricing"
                      className="text-gray-700 hover:text-primary-600 transition-colors font-medium"
                    >
                      Pricing
                    </a>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentStep('homepage')}
                      className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium text-left"
                    >
                      <Home className="w-4 h-4" />
                      <span>Home</span>
                    </button>
                    {user && (
                      <>
                        <button
                          onClick={() => setCurrentStep('learning')}
                          className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium text-left"
                        >
                          Dashboard
                        </button>
                        <button
                          onClick={() => setCurrentStep('notebook')}
                          className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium text-left"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Notebook</span>
                        </button>
                        <button
                          onClick={() => setCurrentStep('shadowing')}
                          className="text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium text-left"
                        >
                          Practice
                        </button>
                        <button
                          onClick={() => setCurrentStep('debug')}
                          className="text-gray-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors font-medium text-sm text-left"
                        >
                          🐛 Debug
                        </button>
                        <button
                          onClick={() => setCurrentStep('settings')}
                          className="flex items-center space-x-2 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium text-left"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                      </>
                    )}
                  </>
                )}

                {!loading &&
                  (user ? (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <User className="w-5 h-5" />
                        <span className="font-medium">
                          {user.user_metadata?.display_name ||
                            user.email?.split('@')[0] ||
                            'User'}
                        </span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {showAuthModal && (
                        <button
                          onClick={() => openAuthModal('signin')}
                          className="text-gray-700 hover:text-primary-600 transition-colors font-medium text-left"
                        >
                          Sign In
                        </button>
                      )}
                      <button
                        onClick={() => openAuthModal('signup')}
                        className="bg-gradient-to-r from-primary-200 to-accent-200 text-gray-900 px-6 py-3 rounded-full font-semibold hover:from-primary-300 hover:to-accent-300 transition-all duration-200 shadow-sm text-center"
                      >
                        {showWaitlist ? 'Join Waitlist' : 'Start Free Trial'}
                      </button>
                    </>
                  ))}
              </nav>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Auth Modal (Development only) */}
      {showAuthModal && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
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

export default Header;
