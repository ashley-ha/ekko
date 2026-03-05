import React from 'react';
import { motion } from 'framer-motion';
import { Headphones, BarChart3, Target, Globe, Clock, Zap } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Headphones,
      title: "Listen & Shadow Mode",
      description: "Hear native speech and repeat immediately. Train your ear and mouth simultaneously for perfect pronunciation.",
      gradient: "from-primary-400 to-primary-600",
      bgGradient: "from-primary-50 to-primary-100"
    },
    {
      icon: BarChart3,
      title: "Mirror Training",
      description: "See your waveform match the native speaker's. Visual feedback makes pronunciation training incredibly effective.",
      gradient: "from-success-400 to-success-600",
      bgGradient: "from-success-50 to-success-100"
    },
    {
      icon: Target,
      title: "Confidence Meter",
      description: "Track your speaking confidence over time. Watch yourself grow from hesitant to fluent with detailed progress analytics.",
      gradient: "from-accent-400 to-accent-600",
      bgGradient: "from-accent-50 to-accent-100"
    },
    {
      icon: Clock,
      title: "Daily 5-Minute Challenges",
      description: "Bite-sized practice sessions that fit your schedule. Consistency beats intensity for language learning.",
      gradient: "from-info-400 to-info-600",
      bgGradient: "from-info-50 to-info-100"
    },
    {
      icon: Globe,
      title: "Native Content Library",
      description: "Real phrases from movies, podcasts, and YouTube. Learn language as it's actually spoken by native speakers.",
      gradient: "from-warning-400 to-warning-600",
      bgGradient: "from-warning-50 to-warning-100"
    },
    {
      icon: Zap,
      title: "AI Speaking Coach",
      description: "Personalized feedback and adaptive learning paths. Your AI coach knows exactly what you need to practice next.",
      gradient: "from-purple-400 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
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
            Features That{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              Accelerate
            </span>{' '}
            Your Learning
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every feature is designed around the science of how your brain learns languages naturally
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`bg-gradient-to-br ${feature.bgGradient} rounded-3xl p-8 hover:shadow-lg transition-shadow group`}
            >
              {/* Icon */}
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Feature Spotlight */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-12"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6">
                The Magic of Mirror Training
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Watch your speech pattern transform in real-time. Our proprietary waveform matching 
                technology shows you exactly how close you are to native pronunciation.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                  <span className="text-gray-300">Real-time pronunciation feedback</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                  <span className="text-gray-300">Visual waveform matching</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                  <span className="text-gray-300">Progress tracking and analytics</span>
                </div>
              </div>
            </div>

            {/* Mock Waveform Display */}
            <div className="bg-gray-800/50 rounded-2xl p-8">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm mb-2">Your pronunciation</p>
                <div className="flex items-center justify-center space-x-1 mb-4">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-accent-400 rounded-full"
                      style={{
                        width: '3px',
                        height: `${Math.random() * 30 + 10}px`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-gray-400 text-sm mb-4">Native speaker</p>
                <div className="flex items-center justify-center space-x-1">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-success-400 rounded-full"
                      style={{
                        width: '3px',
                        height: `${Math.random() * 30 + 10}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 bg-success-500/20 text-success-400 px-4 py-2 rounded-full text-sm">
                  <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                  <span>87% Match - Excellent!</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;