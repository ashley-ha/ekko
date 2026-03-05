import React, { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { useAppStore } from './store/useAppStore';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import SocialProofSection from './components/SocialProofSection';
import ScienceSection from './components/ScienceSection';
import FeaturesSection from './components/FeaturesSection';
import PricingSection from './components/PricingSection';
import Footer from './components/Footer';
import LanguageSelection from './components/LanguageSelection';

import AssessmentResults from './components/AssessmentResults';
import LearningDashboard from './components/LearningDashboard';
import LearningNotebook from './components/LearningNotebook';
import SettingsPage from './components/SettingsPage';

import YouTubeShadowing from './components/YouTubeShadowing';
import NameSelectionModal from './components/NameSelectionModal';
import UserPreferencesForm from './components/UserPreferencesForm';
import YouTubeShadowingDebug from './components/YouTubeShadowingDebug';
import { supabase } from './lib/supabase';

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNameSelection, setShowNameSelection] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    currentStep,
    setCurrentStep,
    userProgress,
    setOnlineStatus,
    setInstallPrompt,
    updateStreak,
    settings,
    loadNotebookFromDatabase,
  } = useAppStore();
  const { user, loading } = useAuth();

  // Apply dark mode class to document
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  useEffect(() => {
    // Handle online/offline status
    const handleConnectionChange = (event: any) => {
      setOnlineStatus(event.detail.online);
    };

    // Handle install prompt
    const handleInstallPrompt = (event: any) => {
      setInstallPrompt(event.detail);
    };

    // Update streak on app load
    updateStreak();

    window.addEventListener('connectionChange', handleConnectionChange);
    window.addEventListener('installPromptAvailable', handleInstallPrompt);

    // Set initial online status
    setOnlineStatus(navigator.onLine);

    return () => {
      window.removeEventListener('connectionChange', handleConnectionChange);
      window.removeEventListener('installPromptAvailable', handleInstallPrompt);
    };
  }, [setOnlineStatus, setInstallPrompt, updateStreak]);

  useEffect(() => {
    // Handle auth callback from email confirmation
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data?.session?.user) {
        // Check if user has a display name set
        const hasDisplayName = data.session.user.user_metadata?.display_name;

        if (!hasDisplayName) {
          // Show name selection modal for new users who just confirmed email
          setShowNameSelection(true);
        } else {
          // User already has a name, redirect to appropriate step
          if (userProgress.assessmentCompleted) {
            setCurrentStep('learning');
          } else if (userProgress.selectedLanguage) {
            setCurrentStep('introduction');
          } else {
            setCurrentStep('language-selection');
          }
        }

        // Clean up URL by removing auth tokens
        const url = new URL(window.location.href);
        url.searchParams.delete('access_token');
        url.searchParams.delete('refresh_token');
        url.searchParams.delete('expires_in');
        url.searchParams.delete('token_type');
        url.searchParams.delete('type');
        url.searchParams.delete('expires_at');

        // Also clean up hash parameters
        if (url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1));
          hashParams.delete('access_token');
          hashParams.delete('refresh_token');
          hashParams.delete('expires_in');
          hashParams.delete('token_type');
          hashParams.delete('type');
          hashParams.delete('expires_at');

          // Rebuild hash or remove it if empty
          const cleanHash = hashParams.toString();
          url.hash = cleanHash ? `#${cleanHash}` : '';
        }

        window.history.replaceState({}, document.title, url.toString());
      }
    };

    // Check if this is an auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    if (
      urlParams.get('access_token') ||
      urlParams.get('refresh_token') ||
      hashParams.get('access_token') ||
      hashParams.get('refresh_token')
    ) {
      handleAuthCallback();
    }
  }, [userProgress, setCurrentStep]);

  // Auto-route authenticated users who land on homepage
  // But don't redirect if they're in the process of signing out
  useEffect(() => {
    if (!loading && user && currentStep === 'homepage' && !isSigningOut) {
      // Check if user has completed name selection
      const hasDisplayName = user.user_metadata?.display_name;

      if (!hasDisplayName) {
        // Show name selection modal if they haven't set a name yet
        setShowNameSelection(true);
      } else {
        // Route based on user's progress
        if (userProgress.assessmentCompleted) {
          setCurrentStep('learning');
        } else if (userProgress.fluencyTestTaken) {
          setCurrentStep('learning');
        } else if (userProgress.selectedLanguage) {
          // After language selection, go to user preferences first
          setCurrentStep('user-preferences');
        } else {
          setCurrentStep('language-selection');
        }
      }
    }
  }, [user, loading, currentStep, userProgress, setCurrentStep, isSigningOut]);

  // Load notebook from database when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      loadNotebookFromDatabase();
    }
  }, [user, loading, loadNotebookFromDatabase]);

  // Reset signing out flag when user becomes null (sign out completed)
  useEffect(() => {
    if (!user && isSigningOut) {
      setIsSigningOut(false);
    }
  }, [user, isSigningOut]);

  const handleNameSelectionComplete = () => {
    setShowNameSelection(false);
    // After name selection, proceed to language selection
    setCurrentStep('language-selection');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'language-selection':
        return <LanguageSelection />;
      case 'user-preferences':
        return <UserPreferencesForm />;
      case 'results':
        return <AssessmentResults />;
      case 'learning':
        return <LearningDashboard />;
      case 'notebook':
        return <LearningNotebook />;
      case 'settings':
        return <SettingsPage />;
      case 'shadowing':
        return <YouTubeShadowing />;
      case 'debug':
        return <YouTubeShadowingDebug />;
      case 'homepage':
      default:
        return (
          <>
            <HeroSection />
            <SocialProofSection />
            <ScienceSection />
            <FeaturesSection />
            <PricingSection />
            <Footer />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Header
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsSigningOut={setIsSigningOut}
      />
      {renderCurrentStep()}

      {/* Name Selection Modal */}
      <NameSelectionModal
        isOpen={showNameSelection}
        onClose={handleNameSelectionComplete}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
