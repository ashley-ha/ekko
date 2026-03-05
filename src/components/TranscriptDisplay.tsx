import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, PlayCircle, Clock, CheckCircle2 } from 'lucide-react';

interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  hasAudio?: boolean;
}

interface TranscriptDisplayProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSegmentClick: (segment: TranscriptSegment, index: number) => void;
  currentSegmentIndex: number;
  showConfidence?: boolean;
  autoScroll?: boolean;
  className?: string;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  segments,
  currentTime,
  onSegmentClick,
  currentSegmentIndex,
  showConfidence = false,
  autoScroll = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active segment
  useEffect(() => {
    if (autoScroll && activeSegmentRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeElement = activeSegmentRef.current;

      const containerRect = container.getBoundingClientRect();
      const elementRect = activeElement.getBoundingClientRect();

      // Check if element is outside viewport
      if (
        elementRect.top < containerRect.top ||
        elementRect.bottom > containerRect.bottom
      ) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentSegmentIndex, autoScroll]);

  // Find current active segment based on time
  const getActiveSegmentIndex = (time: number): number => {
    return segments.findIndex(
      (segment) => time >= segment.start && time <= segment.end
    );
  };

  const activeIndex = getActiveSegmentIndex(currentTime);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSegmentStatus = (index: number, time: number) => {
    const segment = segments[index];
    if (time > segment.end) return 'completed';
    if (time >= segment.start && time <= segment.end) return 'active';
    return 'upcoming';
  };

  if (segments.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-xl p-8 text-center ${className}`}>
        <div className="text-gray-400 mb-4">
          <Volume2 className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600">No transcript available</p>
        <p className="text-sm text-gray-500 mt-2">
          Transcript will appear here when the video is processed
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Volume2 className="w-5 h-5 mr-2 text-primary-600" />
            Transcript
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{segments.length} segments</span>
            {currentTime > 0 && <span>Current: {formatTime(currentTime)}</span>}
          </div>
        </div>
      </div>

      {/* Transcript Segments */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-4 space-y-2">
          <AnimatePresence>
            {segments.map((segment, index) => {
              const status = getSegmentStatus(index, currentTime);
              const isActive = activeIndex === index;
              const isCurrentSegment = currentSegmentIndex === index;

              return (
                <motion.div
                  key={index}
                  ref={isActive ? activeSegmentRef : null}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group relative rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-primary-400 bg-primary-50 shadow-md scale-[1.02]'
                      : isCurrentSegment
                      ? 'border-accent-300 bg-accent-50'
                      : status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => onSegmentClick(segment, index)}
                >
                  {/* Progress Bar for Active Segment */}
                  {isActive && (
                    <motion.div
                      className="absolute top-0 left-0 h-1 bg-primary-400 rounded-t-lg"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          ((currentTime - segment.start) /
                            (segment.end - segment.start)) *
                          100
                        }%`,
                      }}
                      transition={{ duration: 0.1 }}
                    />
                  )}

                  <div className="p-4">
                    {/* Segment Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {/* Status Icon */}
                        {status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : isActive ? (
                          <PlayCircle className="w-4 h-4 text-primary-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}

                        {/* Segment Number */}
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            isActive
                              ? 'bg-primary-200 text-primary-800'
                              : isCurrentSegment
                              ? 'bg-accent-200 text-accent-800'
                              : status === 'completed'
                              ? 'bg-green-200 text-green-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          #{index + 1}
                        </span>

                        {/* Timing */}
                        <span className="text-xs text-gray-500">
                          {formatTime(segment.start)} -{' '}
                          {formatTime(segment.end)}
                        </span>

                        {/* Duration */}
                        <span className="text-xs text-gray-400">
                          ({Math.round(segment.end - segment.start)}s)
                        </span>
                      </div>

                      {/* Confidence Score */}
                      {showConfidence && segment.confidence && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">
                            {Math.round(segment.confidence * 100)}%
                          </span>
                          <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                segment.confidence > 0.8
                                  ? 'bg-green-400'
                                  : segment.confidence > 0.6
                                  ? 'bg-yellow-400'
                                  : 'bg-red-400'
                              }`}
                              style={{ width: `${segment.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Segment Text */}
                    <p
                      className={`text-sm leading-relaxed transition-all duration-200 ${
                        isActive
                          ? 'text-primary-900 font-medium text-base'
                          : isCurrentSegment
                          ? 'text-accent-800 font-medium'
                          : status === 'completed'
                          ? 'text-green-800'
                          : 'text-gray-700'
                      }`}
                    >
                      {segment.text}
                    </p>

                    {/* Active Segment Indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 right-2"
                      >
                        <div className="w-3 h-3 bg-primary-400 rounded-full animate-pulse" />
                      </motion.div>
                    )}
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-5 bg-primary-600 transition-opacity duration-200 pointer-events-none" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {activeIndex >= 0
              ? `Active: Segment ${activeIndex + 1}`
              : 'Click any segment to jump to that time'}
          </span>
          <span>
            {
              segments.filter(
                (_, i) => getSegmentStatus(i, currentTime) === 'completed'
              ).length
            }{' '}
            / {segments.length} completed
          </span>
        </div>
      </div>
    </div>
  );
};
