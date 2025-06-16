

import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Settings, UserCircle, LogOut, Sun, Moon, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Theme } from '../../types'; 

interface HeaderProps {
  currentTheme: Theme;
  toggleTheme: () => void;
  toggleSidebar: () => void; 
  isSidebarOpen: boolean; 
}

const Header: React.FC<HeaderProps> = ({ currentTheme, toggleTheme, toggleSidebar, isSidebarOpen }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) {
    return null; 
  }
  
  return (
    <header className="h-16 bg-card dark:bg-dark-card shadow-md flex items-center justify-between px-4 sm:px-6 border-b border-secondary dark:border-dark-secondary/50 sticky top-0 z-20 text-foreground dark:text-dark-foreground">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="md:hidden mr-3 text-foreground dark:text-dark-foreground hover:bg-secondary dark:hover:bg-dark-secondary p-2 rounded-full"
          aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <h2 className="text-lg font-semibold hidden sm:block">
          {currentUser.role} Dashboard
        </h2>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-secondary dark:hover:bg-dark-secondary text-foreground dark:text-dark-foreground transition-colors"
          aria-label={currentTheme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button className="relative p-2 rounded-full hover:bg-secondary dark:hover:bg-dark-secondary text-foreground dark:text-dark-foreground transition-colors" aria-label="Notifications">
            <Bell size={20} />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-card dark:ring-dark-card" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none p-1 rounded-full hover:bg-secondary dark:hover:bg-dark-secondary"
            aria-expanded={isProfileDropdownOpen}
            aria-haspopup="true"
          >
            <img
              src={currentUser.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser.name.replace(/\s+/g, '+')}&background=2563eb&color=fff&bold=true&size=128`}
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover border-2 border-primary/50 dark:border-dark-primary/50"
            />
            <span className="hidden sm:inline text-sm font-medium">{currentUser.name}</span>
          </button>
          
          {isProfileDropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-56 bg-card dark:bg-dark-card rounded-md shadow-xl ring-1 ring-secondary dark:ring-dark-secondary/50 focus:outline-none py-1 z-50"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu-button"
            >
              <div className="px-4 py-3 border-b border-secondary dark:border-dark-secondary/50">
                <p className="text-sm font-semibold text-foreground dark:text-dark-foreground" role="none">
                  {currentUser.name}
                </p>
                <p className="text-xs text-foreground/70 dark:text-dark-foreground/70" role="none">
                  {currentUser.email} ({currentUser.role})
                </p>
              </div>
              {/* <button // Removed Profile & Settings link
                onClick={() => { alert('Profile & Settings clicked!'); setIsProfileDropdownOpen(false); }}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-foreground dark:text-dark-foreground hover:bg-secondary dark:hover:bg-dark-secondary"
                role="menuitem"
              >
                <UserCircle size={16} className="mr-2 opacity-70" />
                Profile & Settings
              </button> */}
              <button
                onClick={handleLogout}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-500"
                role="menuitem"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;