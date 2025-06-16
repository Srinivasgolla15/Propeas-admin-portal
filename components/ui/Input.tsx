
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactElement<{ size?: number }>;
}

const Input: React.FC<InputProps> = ({ label, name, error, icon, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-foreground/90 dark:text-dark-foreground/90 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground/50 dark:text-dark-foreground/50">
            {React.cloneElement(icon, { size: 18 })}
          </div>
        )}
        <input
          id={name}
          name={name}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm 
                     text-sm placeholder-gray-400 dark:placeholder-gray-500
                     bg-background dark:bg-dark-card 
                     border-gray-300 dark:border-gray-600 
                     text-foreground dark:text-dark-foreground
                     focus:outline-none focus:ring-primary dark:focus:ring-dark-primary focus:border-primary dark:focus:border-dark-primary
                     ${icon ? 'pl-10' : ''}
                     ${error ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400 focus:border-red-500 dark:focus:border-red-400' : ''}
                     ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

export default Input;