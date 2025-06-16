
import React from 'react';
import { Link } from 'react-router-dom';
// Button import removed as styles are applied directly to Link
import { AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  // Combined base, variant, and size styles for the Link acting as a button
  const buttonClasses = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-dark-primary dark:text-dark-primary-foreground dark:hover:bg-dark-primary/90 focus:ring-primary dark:focus:ring-dark-primary px-6 py-3 text-base";

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <AlertTriangle size={64} className="text-yellow-500 mb-6" />
      <h1 className="text-4xl font-bold text-foreground dark:text-dark-foreground mb-2">404 - Page Not Found</h1>
      <p className="text-lg text-foreground/80 dark:text-dark-foreground/80 mb-8">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className={buttonClasses}>
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
