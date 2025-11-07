import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const ProgressBar = ({
  percentage = 0,
  size = 120,
  strokeWidth = 8,
  showText = true,
  color = '#3b82f6',
  trailColor = '#e5e7eb',
  label = '',
  className = '',
}) => {
  const value = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`progress-bar-container ${className}`}>
      <div style={{ width: size, height: size }}>
        <CircularProgressbar
          value={value}
          text={showText ? `${Math.round(value)}%` : ''}
          styles={buildStyles({
            pathColor: color,
            textColor: color,
            trailColor: trailColor,
            strokeLinecap: 'round',
            pathTransitionDuration: 0.5,
            pathTransition: 'stroke-dashoffset 0.5s ease 0s',
            textSize: '16px',
            fontWeight: '600',
          })}
          strokeWidth={strokeWidth}
        />
      </div>
      {label && (
        <div className="progress-label mt-2 text-center text-sm font-medium text-gray-700">
          {label}
        </div>
      )}
    </div>
  );
};

// Linear progress bar variant
export const LinearProgressBar = ({
  percentage = 0,
  height = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  label = '',
  showText = true,
  className = '',
}) => {
  const value = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`linear-progress-container ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showText && (
            <span className="text-sm font-medium text-gray-900">
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full bg-gray-200 rounded-full overflow-hidden"
        style={{ height: `${height}px`, backgroundColor }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${value}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
