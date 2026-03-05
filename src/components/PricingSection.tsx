import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Gift, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDevelopmentMode } from '../hooks/useDevelopmentMode';
import { createCheckoutSession, redirectToCheckout } from '../lib/stripe';
import AuthModal from './AuthModal';
import WaitlistModal from './WaitlistModal';

const PricingSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const { user } = useAuth();
  const { isDevelopment, showAuthModal, showWaitlist } = useDevelopmentMode();

  const handleSubscribe = async () => {
    if (!user) {
      if (showAuthModal) {
        setAuthModalOpen(true);
      } else {
        setWaitlistModalOpen(true);
      }
      return;
    }

    setLoading(true);
    try {
      // This would be your Stripe price ID for the monthly subscription
      const priceId = 'price_1234567890'; // Replace with actual Stripe price ID
      const session = await createCheckoutSession(priceId, user.id);
      await redirectToCheckout(session.id);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section
        id="pricing"
        className="py-20 bg-gradient-to-br from-gray-50 to-primary-50/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {showWaitlist ? (
                <>
                  Be the First to Experience{' '}
                  <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                    Revolutionary
                  </span>{' '}
                  Korean Learning
                </>
              ) : (
                <>
                  Start Speaking for{' '}
                  <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                    Less Than
                  </span>{' '}
                  a Coffee
                </>
              )}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {showWaitlist
                ? 'Join our exclusive waitlist and get notified when Ekko launches'
                : '$9.99/month • Less than a single tutoring session • Cancel anytime'}
            </p>
          </motion.div>

          {/* Pricing Card */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto"
          >
            <div className="relative bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>{showWaitlist ? 'Coming Soon' : 'Most Popular'}</span>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-8 pt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ekko Premium
                </h3>
                {showWaitlist ? (
                  <div className="mb-4">
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                      Early Access
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <span className="text-5xl font-bold text-gray-900">
                      $9.99
                    </span>
                    <div className="text-gray-600">
                      <div className="text-sm">/month</div>
                    </div>
                  </div>
                )}
                <p className="text-gray-600">
                  {showWaitlist
                    ? 'Be first to experience the future of Korean learning'
                    : 'Everything you need to become fluent'}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {[
                  'AI-powered pronunciation coaching',
                  'Real-time feedback & correction',
                  'Korean shadowing technology',
                  'High-frequency phrase extraction',
                  'Spaced repetition system',
                  'YouTube content integration',
                  'Progress tracking & analytics',
                  'Priority support from the founder of Ekko',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-success-400 to-success-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white py-4 rounded-full text-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="flex items-center justify-center">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Gift className="w-5 h-5 mr-2" />
                      {user
                        ? 'Upgrade to Premium'
                        : showWaitlist
                        ? 'Join Waitlist'
                        : 'Start 7-Day Free Trial'}
                    </>
                  )}
                </span>
              </button>

              <p className="text-center text-sm text-gray-500">
                {user
                  ? 'Secure payment with Stripe'
                  : showWaitlist
                  ? 'Get notified when we launch • Exclusive early access'
                  : 'No credit card required • Cancel anytime'}
              </p>
            </div>
          </motion.div>

          {/* Value Propositions */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {showWaitlist
                  ? 'Early Access Benefits'
                  : '30-Day Money-Back Guarantee'}
              </h3>
              <p className="text-gray-600">
                {showWaitlist
                  ? 'Join the waitlist for exclusive early access and special launch pricing.'
                  : 'Not satisfied? Get a full refund, no questions asked.'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-success-400 to-success-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {showWaitlist ? 'No Spam Promise' : 'No Long-Term Commitment'}
              </h3>
              <p className="text-gray-600">
                {showWaitlist
                  ? "We'll only email you when Ekko launches. Unsubscribe anytime."
                  : 'Cancel anytime with just one click. No cancellation fees.'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-accent-400 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {showWaitlist ? 'VIP Treatment' : 'Premium Support'}
              </h3>
              <p className="text-gray-600">
                {showWaitlist
                  ? 'Waitlist members get priority access and exclusive benefits.'
                  : 'Get help from our language learning experts whenever you need it.'}
              </p>
            </div>
          </motion.div>

          {/* Social Proof Footer */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="text-gray-600 mb-4">
              {showWaitlist
                ? 'Join thousands of excited learners waiting for Ekko'
                : 'Join thousands of learners who are already speaking confidently'}
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                <span>99.9% Uptime</span>
              </div>
            </div>
          </motion.div>
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

export default PricingSection;
