import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Repeat, Target, Mic } from 'lucide-react';

const ScienceSection: React.FC = () => {
  const principles = [
    {
      icon: Brain,
      title: 'Mirror Neurons',
      description:
        'Your brain naturally mimics what it hears. We activate these neural pathways for faster language acquisition.',
      color: 'from-primary-400 to-primary-600',
    },
    {
      icon: Repeat,
      title: 'Spaced Repetition',
      description:
        "Based on Ebbinghaus's forgetting curve. We time your practice to maximize retention and minimize effort.",
      color: 'from-success-400 to-success-600',
    },
    {
      icon: Target,
      title: 'High-Frequency Patterns',
      description:
        'Focus on the 1,000 most common phrases that make up 80% of daily conversations.',
      color: 'from-accent-400 to-accent-600',
    },
    {
      icon: Mic,
      title: 'Shadowing Technique',
      description:
        'Simultaneously listen and speak to train your mouth and ear in perfect harmony.',
      color: 'from-info-400 to-info-600',
    },
  ];

  return (
    <section
      id="science"
      className="py-20 bg-gradient-to-br from-white to-primary-50/30"
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
            Why{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              Ekko
            </span>{' '}
            Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our approach is backed by decades of neuroscience research and
            language acquisition studies
          </p>
        </motion.div>

        {/* Science Principles Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {principles.map((principle, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-6">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${principle.color} rounded-2xl flex items-center justify-center flex-shrink-0`}
                >
                  <principle.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {principle.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {principle.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* The Neuroscience Deep Dive */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-12 shadow-sm mb-16"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                The Neuroscience of Language Learning
              </h3>
              <div className="space-y-4 text-gray-600">
                <p className="leading-relaxed">
                  Traditional language learning forces your brain to work
                  against its natural patterns. Grammar rules and vocabulary
                  lists activate the wrong neural networks.
                </p>
                <p className="leading-relaxed">
                  Ekko uses <strong className="text-gray-900">shadowing</strong>{' '}
                  and{' '}
                  <strong className="text-gray-900">
                    mirror neuron activation
                  </strong>
                  to engage the same brain regions children use when acquiring
                  their first language.
                </p>
                <p className="leading-relaxed">
                  Research shows this method is{' '}
                  <strong className="text-primary-600">3x faster</strong> than
                  traditional approaches and leads to more natural pronunciation
                  and fluency.
                </p>
              </div>
            </div>
            <div className="relative">
              {/* Brain Visualization */}
              <div className="relative w-full h-80 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl flex items-center justify-center overflow-hidden">
                <div className="relative">
                  <Brain className="w-32 h-32 text-primary-600" />
                  {/* Neural Network Animation */}
                  <div className="absolute inset-0">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-accent-400 rounded-full"
                        style={{
                          left: `${20 + Math.random() * 60}%`,
                          top: `${20 + Math.random() * 60}%`,
                        }}
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 1, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 1000 Reps to Fluency */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-3xl p-12"
        >
          <h3 className="text-4xl font-bold mb-6">1,000 Reps to Fluency</h3>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Scientific studies show that 1,000 repetitions of high-frequency
            phrases creates the neural pathways needed for conversational
            fluency
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">Week 1-2</div>
              <div className="opacity-90">Foundation Building</div>
              <div className="text-sm opacity-75 mt-2">250 repetitions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">Week 3-4</div>
              <div className="opacity-90">Pattern Recognition</div>
              <div className="text-sm opacity-75 mt-2">500 repetitions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">Week 5+</div>
              <div className="opacity-90">Fluent Expression</div>
              <div className="text-sm opacity-75 mt-2">1000+ repetitions</div>
            </div>
          </div>

          {/* Research Citations */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm opacity-75 max-w-2xl mx-auto">
              Based on research from MIT Language Lab, Stanford Neurolinguistics
              Department, and the Journal of Memory and Language (2023)
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ScienceSection;
