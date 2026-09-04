import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: (newTheme: 'light' | 'dark') => void;
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onToggle,
  className = '',
  showLabel = false
}) => {
  const isDark = theme === 'dark';

  const handleToggle = () => {
    onToggle(isDark ? 'light' : 'dark');
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}

      {/* Modern Flaticon-style animated dark mode toggle switch */}
      <button
        type="button"
        id="dark-mode-toggle-switch"
        role="switch"
        aria-checked={isDark}
        aria-label={`Toggle theme, current is ${theme}`}
        onClick={handleToggle}
        title={`Click to switch to ${isDark ? 'Light' : 'Dark'} mode`}
        className={`relative w-14 h-7 rounded-full p-0.5 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40 border shadow-inner ${
          isDark
            ? 'bg-slate-900 border-indigo-500/40 shadow-slate-950/60'
            : 'bg-sky-100 hover:bg-sky-200 border-sky-300/80 shadow-sky-200/50'
        }`}
      >
        {/* Track icons */}
        <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
          {/* Sun icon on left (light background) */}
          <Sun className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-20 text-slate-500' : 'opacity-80 text-amber-500'}`} />
          
          {/* Moon icon on right (dark background) */}
          <Moon className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-90 text-indigo-300' : 'opacity-20 text-slate-400'}`} />
        </div>

        {/* Sliding Thumb Knob with Sun / Moon icons */}
        <motion.div
          animate={{
            x: isDark ? 28 : 0,
            rotate: isDark ? 360 : 0
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
          className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-colors ${
            isDark
              ? 'bg-indigo-600 text-white shadow-indigo-900/50'
              : 'bg-white text-amber-500 shadow-slate-300'
          }`}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-white fill-white/30" />
          ) : (
            <Sun className="w-3 h-3 text-amber-500 fill-amber-400/20" />
          )}
        </motion.div>
      </button>
    </div>
  );
};
