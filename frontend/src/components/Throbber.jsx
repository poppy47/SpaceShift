import React from 'react';

/**
 * Throbber component - A loading spinner matching the app's design theme.
 * Supports different sizes and can be used with or without text.
 * 
 * @param {string} size - Size of the throbber: 'sm' (24px), 'md' (40px), 'lg' (56px)
 * @param {string} text - Optional loading text to display below spinner
 * @param {string} variant - Color variant: 'primary' (default dark), 'accent' (library colors)
 * @param {boolean} fullScreen - If true, displays centered on full screen with backdrop
 */
export default function Throbber({ size = 'md', text, variant = 'primary', fullScreen = false }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const borderClasses = {
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3',
  };

  const colorClasses = {
    primary: 'border-gray-300 border-t-gray-900',
    accent: 'border-blue-100 border-t-library-blue',
  };

  const spinnerContent = (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`
          ${sizeClasses[size]}
          ${borderClasses[size]}
          ${colorClasses[variant]}
          rounded-full
          animate-spin
        `}
        role="status"
        aria-label="Loading"
      />
      {text && <p className="text-xs text-gray-500 font-medium">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return spinnerContent;
}
