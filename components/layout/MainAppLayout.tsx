import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Theme } from '../../types';

const MainAppLayout: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Default open on desktop

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);
  
  // Adjust sidebar state on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false); // Close on mobile
      } else {
        setIsSidebarOpen(true); // Open on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div className={`flex h-screen bg-background text-foreground dark:text-dark-foreground font-sans antialiased`}>
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentTheme={theme} 
          toggleTheme={toggleTheme} 
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-secondary dark:bg-dark-secondary p-4 sm:p-6">
          {/* Outlet renders the matched child route's component */}
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default MainAppLayout;