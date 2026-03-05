import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Hook to determine if the app is running in development mode
 * This checks for multiple factors in order of priority:
 * 1. URL parameter override (?mode=dev or ?mode=waitlist)
 * 2. localStorage override (for persistent testing)
 * 3. Custom VITE_DEV_MODE flag
 * 4. User invitation status (invited users get full access)
 * 5. Domain-based detection (production domains = waitlist mode)
 * 6. Automatic detection (localhost + dev environment)
 */
export const useDevelopmentMode = () => {
  const { user } = useAuth();
  const [isInvited, setIsInvited] = useState<boolean | null>(null);

  // Check if user is invited when they sign in
  useEffect(() => {
    const checkInvitationStatus = async () => {
      if (!user?.email) {
        setIsInvited(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('waitlist')
          .select('status')
          .eq('email', user.email)
          .single();

        if (error) {
          console.log(
            '🔍 User not on waitlist or error checking status:',
            error.message
          );
          setIsInvited(null);
          return;
        }

        const invited =
          data.status === 'invited' || data.status === 'registered';
        setIsInvited(invited);
        console.log(
          '✉️ User invitation status:',
          invited ? 'INVITED' : 'PENDING'
        );
      } catch (err) {
        console.log('🔍 Error checking invitation status:', err);
        setIsInvited(null);
      }
    };

    checkInvitationStatus();
  }, [user?.email]);

  const isDevelopment = useMemo(() => {
    const hostname = window.location.hostname.toLowerCase();
    const isDevEnv = !import.meta.env.PROD;

    // Debug logging
    console.log('🔍 Mode Detection Debug:', {
      hostname,
      fullUrl: window.location.href,
      isDevEnv,
      userEmail: user?.email,
      isInvited,
      VITE_DEV_MODE: import.meta.env.VITE_DEV_MODE,
    });

    // 1. Check URL parameters for override (highest priority)
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam === 'dev') {
      console.log('🎛️ URL override: DEV mode activated');
      localStorage.setItem('ekko_dev_mode_override', 'true');
      return true;
    }
    if (modeParam === 'waitlist') {
      console.log('🎛️ URL override: WAITLIST mode activated');
      localStorage.setItem('ekko_dev_mode_override', 'false');
      return false;
    }

    // 2. Check localStorage override (persistent across sessions)
    const storedOverride = localStorage.getItem('ekko_dev_mode_override');
    if (storedOverride !== null) {
      const isDev = storedOverride === 'true';
      console.log('💾 localStorage override:', isDev ? 'DEV' : 'WAITLIST');
      return isDev;
    }

    // 3. Check if explicitly set via environment variable
    const devMode = import.meta.env.VITE_DEV_MODE;
    if (devMode !== undefined) {
      const isDev = devMode === 'true';
      console.log('🌍 Environment override:', isDev ? 'DEV' : 'WAITLIST');
      return isDev;
    }

    // 4. Check if user is invited (allows access even on production)
    if (user && isInvited === true) {
      console.log('✉️ User is invited → FULL ACCESS granted');
      return true;
    }

    // 5. Domain-based detection (production domains = waitlist mode)
    const productionDomains = [
      'learnwithekko.com',
      'www.learnwithekko.com',
      'ekko.app',
      'www.ekko.app',
    ];

    const isProductionDomain = productionDomains.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );

    if (isProductionDomain) {
      console.log('🌐 Production domain detected → WAITLIST mode');
      return false; // Force waitlist mode on production domains (unless invited)
    }

    // 6. Fallback to automatic detection (localhost + dev environment)
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.includes('.local') ||
      hostname.includes('localhost');

    const autoDetectedDev = isDevEnv && isLocalhost;
    console.log('🤖 Auto-detection:', {
      isLocalhost,
      isDevEnv,
      result: autoDetectedDev ? 'DEV' : 'WAITLIST',
    });

    return autoDetectedDev;
  }, [user, isInvited]);

  // Add utility functions for managing the override
  const enableDevMode = () => {
    console.log('🎛️ Manually enabling DEV mode');
    localStorage.setItem('ekko_dev_mode_override', 'true');
    window.location.reload();
  };

  const enableWaitlistMode = () => {
    console.log('🎛️ Manually enabling WAITLIST mode');
    localStorage.setItem('ekko_dev_mode_override', 'false');
    window.location.reload();
  };

  const clearModeOverride = () => {
    console.log('🎛️ Clearing mode override');
    localStorage.removeItem('ekko_dev_mode_override');
    window.location.reload();
  };

  // Final result logging
  console.log(
    '✅ Final mode decision:',
    isDevelopment ? 'DEV MODE' : 'WAITLIST MODE'
  );

  return {
    isDevelopment,
    showAuthModal: isDevelopment, // Only show auth modal in dev mode
    showWaitlist: !isDevelopment, // Show waitlist in production
    isInvited, // Expose invitation status
    // Utility functions for manual control
    enableDevMode,
    enableWaitlistMode,
    clearModeOverride,
    // Current override status
    hasOverride: localStorage.getItem('ekko_dev_mode_override') !== null,
  };
};
