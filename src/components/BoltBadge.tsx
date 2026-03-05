import React from 'react';

const BoltBadge: React.FC = () => {
  return (
    <a 
      href="https://bolt.dev" 
      target="_blank" 
      rel="noopener noreferrer"
      className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
    >
      <span>Built with</span>
      <span className="font-bold">Bolt.dev</span>
    </a>
  );
};

export default BoltBadge;