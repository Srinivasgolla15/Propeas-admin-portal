
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  titleClassName?: string;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, titleClassName = '', footer }) => {
  return (
    <div className={`bg-card dark:bg-dark-card shadow-lg rounded-xl ${className}`}>
      {title && (
        <div className={`p-4 sm:p-5 border-b border-secondary dark:border-dark-secondary/50 ${titleClassName}`}>
          <h3 className="text-md sm:text-lg font-semibold text-foreground dark:text-dark-foreground">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-5">
        {children}
      </div>
      {footer && (
        <div className="p-4 sm:p-5 border-t border-secondary dark:border-dark-secondary/50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
    