import React from 'react';

export const Logo = ({ size = 'md', showWordmark = true, className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-base',
    lg: 'w-11 h-11 text-xl',
  };

  return (
    <div className={`flex items-center space-x-2.5 ${className}`}>
      <div className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} bg-gradient-to-tr from-teal-800 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-teal-100"
        >
          {/* Stylized smart rupee & compass chart icon */}
          <path d="M6 4h10M6 8h7a3 3 0 0 1 0 6H6" />
          <path d="M12 14l5 6" />
          <path d="M19 5l2 2-2 2" stroke="white" strokeWidth="2" />
        </svg>
      </div>
      {showWordmark && (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 tracking-tight text-lg leading-none">
            Spend<span className="text-teal-700">Sense</span>
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
            Intelligent Finance
          </span>
        </div>
      )}
    </div>
  );
};

