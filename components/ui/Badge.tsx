
import React from 'react';

type BadgeColor = 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, color = 'gray', className = '' }) => {
  const colorStyles: Record<BadgeColor, string> = {
    green: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100',
    red: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorStyles[color]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
    