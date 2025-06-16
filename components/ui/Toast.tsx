import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Utility to combine classNames (similar to clsx or classnames)
function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

interface Toast {
  id?: string;
  title: string;
  variant?: 'success' | 'error';
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Internal hook to access toast context
const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('Toast context must be used within a ToastProvider');
  }
  return context;
};

// Global toast function
const toast = (options: Omit<Toast, 'id'>) => {
  // This will be overwritten by ToastProvider
  console.warn('Toast called before ToastProvider is mounted. Please wrap your app with ToastProvider.');
};

// Add success and error methods
toast.success = (message: string, duration?: number) => {
  toast({ title: message, variant: 'success', duration });
};

toast.error = (message: string, duration?: number) => {
  toast({ title: message, variant: 'error', duration });
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (options: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    setToasts((prev) => [...prev, { ...options, id }]);
  };

  // Override global toast function with the provider's addToast
  useEffect(() => {
    Object.assign(toast, { ...toast, addToast });
    return () => {
      // Reset to default to prevent memory leaks
      Object.assign(toast, {
        addToast: () => console.warn('Toast called after ToastProvider unmounted.'),
      });
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-xs w-full">
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onClose={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

interface ToastItemProps extends Toast {
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ id, title, variant = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'flex items-start justify-between p-4 rounded-md shadow-lg transition-all duration-300',
        'animate-in slide-in-from-right fade-in-0',
        variant === 'success' && 'bg-green-100 border-green-500 text-green-800 dark:bg-green-800 dark:text-green-100',
        variant === 'error' && 'bg-red-100 border-red-500 text-red-800 dark:bg-red-800 dark:text-red-100'
      )}
    >
      <span className="flex-1 text-sm">{title}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Close toast"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export { toast };