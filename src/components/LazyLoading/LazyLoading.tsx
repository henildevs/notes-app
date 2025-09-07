import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Theme-aware loading component
const LoadingSpinner: React.FC = () => {
  // Initialize theme state immediately to prevent flash
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
      isDark ? 'bg-dark-bg' : 'bg-gray-50'
    }`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4">
          <motion.div
            className="w-full h-full border-4 border-primary-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className={`transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>Loading...</p>
      </motion.div>
    </div>
  );
};

// Lazy load main components
export const LazyHomePage = lazy(() => import('../../pages/HomePage'));
export const LazyEditorPage = lazy(() => import('../../pages/EditorPage'));

// Lazy load feature components
export const LazyTranslationPanel = lazy(() => import('../Translation/TranslationPanel'));
export const LazyVersionHistory = lazy(() => import('../VersionHistory/VersionHistory'));

// Higher-order component for lazy loading with suspense
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return (props: P) => (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Lazy loading wrapper for routes
export const LazyRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

export default LoadingSpinner;
