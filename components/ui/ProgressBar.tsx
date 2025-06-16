
import React from 'react';

interface ProgressBarProps {
  value: number; // Percentage (0-100)
  color?: 'primary' | 'green' | 'blue' | 'yellow';
  className?: string;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color = 'primary', className = '', showLabel = false }) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  const colorClasses = {
    primary: 'bg-primary dark:bg-dark-primary',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className={`w-full bg-secondary dark:bg-dark-secondary/50 rounded-full h-2.5 ${className}`}>
      <div
        className={`h-2.5 rounded-full ${colorClasses[color]} transition-all duration-500 ease-out`}
        style={{ width: `${clampedValue}%` }}
      ></div>
      {showLabel && (
         <span className="text-xs text-foreground dark:text-dark-foreground mt-1 block text-center">{`${clampedValue.toFixed(0)}%`}</span>
      )}
    </div>
  );
};

export default ProgressBar;
    