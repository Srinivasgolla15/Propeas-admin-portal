
import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`bg-card dark:bg-dark-card rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col overflow-hidden`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-secondary dark:border-dark-secondary/50">
                <h3 className="text-lg font-semibold text-foreground dark:text-dark-foreground">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-secondary dark:hover:bg-dark-secondary/50 text-foreground/70 dark:text-dark-foreground/70"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="p-4 sm:p-6 flex-grow overflow-y-auto max-h-[70vh]">
              {children}
            </div>
            {footer && (
              <div className="p-4 border-t border-secondary dark:border-dark-secondary/50 bg-secondary/30 dark:bg-dark-secondary/10">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
    