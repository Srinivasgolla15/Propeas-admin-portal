import React, { useState, useEffect, useRef, ReactNode, ForwardedRef, forwardRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Utility to combine classNames (similar to clsx or classnames)
 * @example cn('p-4', 'bg-blue-500', false && 'hidden') => 'p-4 bg-blue-500'
 */
function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

interface PopoverProps {
  children: ReactNode;
}

interface PopoverTriggerProps {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Popover: React.FC<PopoverProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === PopoverTrigger) {
            return React.cloneElement(child, { setIsOpen } as any);
          }
          if (child.type === PopoverContent) {
            return React.cloneElement(child, { isOpen, setIsOpen } as any);
          }
        }
        return child;
      })}
    </div>
  );
};

const PopoverTrigger = forwardRef<HTMLElement, PopoverTriggerProps>(
  ({ children, asChild = false, className, setIsOpen }, ref) => {
    const handleClick = () => {
      if (setIsOpen) {
        setIsOpen((prev: boolean) => !prev);
      }
    };

    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<any>;
      return React.cloneElement(childElement, {
        onClick: handleClick,
        ref,
        className: cn(childElement.props.className, className),
      });
    }

    return (
      <button
        type="button"
        ref={ref as ForwardedRef<HTMLButtonElement>}
        className={cn('focus:outline-none', className)}
        onClick={handleClick}
      >
        {children}
      </button>
    );
  }
);
PopoverTrigger.displayName = 'PopoverTrigger';

const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ children, className, align = 'center', sideOffset = 4, isOpen, setIsOpen }, ref) => {
    const triggerRef = useRef<HTMLElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
      if (isOpen && triggerRef.current && contentRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();

        let left = triggerRect.left;
        if (align === 'center') {
          left += (triggerRect.width - contentRect.width) / 2;
        } else if (align === 'end') {
          left += triggerRect.width - contentRect.width;
        }

        const top = triggerRect.bottom + sideOffset + window.scrollY;

        setPosition({ top, left: Math.max(0, left) });
      }
    }, [isOpen, align, sideOffset]);

    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (
          isOpen &&
          contentRef.current &&
          !contentRef.current.contains(e.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          if (setIsOpen) setIsOpen(false);
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (isOpen && e.key === 'Escape') {
          if (setIsOpen) setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen, setIsOpen]);

    if (!isOpen) return null;

    return createPortal(
      <div
        ref={contentRef}
        className={cn(
          'z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-4',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          className
        )}
        style={{ position: 'absolute', top: `${position.top}px`, left: `${position.left}px` }}
      >
        {children}
      </div>,
      document.body
    );
  }
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };