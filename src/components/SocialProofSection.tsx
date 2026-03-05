import React from 'react';
import { motion } from 'framer-motion';
import { Play, Star, TrendingUp, Clock } from 'lucide-react';

const SocialProofSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Sarah Chen',
      language: 'Korean',
      days: '28 days',
      improvement: 'Beginner → Conversational',
      quote:
        "I'm actually having conversations with native speakers now. The confidence boost is incredible!",
      avatar:
        'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      rating: 5,
    },
    {
      name: 'Marcus Johnson',
      language: 'Korean',
      days: '21 days',
      improvement: 'Zero → Basic Conversations',
      quote:
        'No boring grammar rules. Just pure speaking practice. I love how natural it feels.',
      avatar:
        'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      rating: 5,
    },
    {
      name: 'Elena Rodriguez',
      language: 'English',
      days: '35 days',
      improvement: 'Intermediate → Fluent',
      quote:
        'The science-based approach actually works. I can feel my brain adapting to the language patterns naturally.',
      avatar:
        'https://images.pexels.com/photos/1484794/pexels-photo-1484794.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
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
            Join{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              Thousands
            </span>{' '}
            of Learners Speaking Fluently
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Real people, real progress, real conversations
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-shadow"
            >
              {/* Rating */}
              <div className="flex items-center mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-warning-400 fill-current"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* User Info */}
              <div className="flex items-center space-x-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Learning {testimonial.language}
                  </p>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{testimonial.days}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-success-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">
                      {testimonial.improvement}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <div>
            <p className="text-3xl font-bold text-primary-600 mb-2">10,000+</p>
            <p className="text-gray-600">Active Learners</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-success-600 mb-2">85%</p>
            <p className="text-gray-600">Progress Rate</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-accent-600 mb-2">95%</p>
            <p className="text-gray-600">Success Rate</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-info-600 mb-2">4.9/5</p>
            <p className="text-gray-600">User Rating</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialProofSection;
