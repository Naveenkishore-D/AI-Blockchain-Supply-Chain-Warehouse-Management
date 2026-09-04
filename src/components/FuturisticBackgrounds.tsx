import React from 'react';
import { motion } from 'motion/react';

export const BlockchainBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-20 dark:opacity-40">
      <svg width="100%" height="100%" className="w-full h-full">
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-[var(--accent-primary)] opacity-10" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Animated Nodes */}
        {[...Array(15)].map((_, i) => (
          <motion.circle
            key={i}
            cx={`${Math.random() * 100}%`}
            cy={`${Math.random() * 100}%`}
            r={Math.random() * 2 + 1}
            fill="currentColor"
            className="text-[var(--accent-primary)]"
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-tr from-[var(--bg-primary)] via-transparent to-transparent" />
    </div>
  );
};

export const IoTConnections: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-10">
      <svg width="100%" height="100%">
        {[...Array(8)].map((_, i) => (
          <motion.path
            key={i}
            d={`M ${Math.random() * 100} ${Math.random() * 100} Q ${Math.random() * 100} ${Math.random() * 100} ${Math.random() * 100} ${Math.random() * 100}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="5,5"
            className="text-[var(--accent-secondary)]"
            animate={{
              strokeDashoffset: [0, -100],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </svg>
    </div>
  );
};
