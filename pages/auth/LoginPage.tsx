// src/pages/auth/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { APP_NAME } from '../../constants';
import { Mail, KeyRound } from 'lucide-react';
import ThemeToggle from '../../components/ui/ThemeToggle'; 
import { Theme } from '../../types'; 

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { success, errorMsg } = await login(email, password);
    setIsLoading(false);

    if (success) {
      navigate(from, { replace: true });
    } else {
      setError(errorMsg || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary dark:bg-dark-background p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
      <Card className="w-full max-w-md shadow-2xl bg-secondary dark:bg-dark-background">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <img 
              src="/logo.jpg" 
              alt={`${APP_NAME} Logo`} 
              className="mx-auto h-24 w-24 mb-4 object-contain" 
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground dark:text-dark-foreground">Welcome Back!</h1>
            <p className="text-sm text-foreground/70 dark:text-dark-foreground/70 mt-1">Sign in to access the {APP_NAME}.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={<Mail />}
              placeholder="you@example.com"
              disabled={isLoading}
            />
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={<KeyRound />}
              placeholder="••••••••"
              disabled={isLoading}
            />

            {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-foreground/60 dark:text-dark-foreground/60">
              &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
