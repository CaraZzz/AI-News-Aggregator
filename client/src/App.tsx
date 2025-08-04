import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Pages
import HomePage from './pages/HomePage';
import TrendingPage from './pages/TrendingPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import ArticlePage from './pages/ArticlePage';
import SourcesPage from './pages/SourcesPage';
import SettingsPage from './pages/SettingsPage';

// Components
import Layout from './components/Layout';
import ChatWidget from './components/ChatWidget';

// Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { PreferencesProvider } from './contexts/PreferencesContext';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <PreferencesProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {!isOnline && (
                  <div className="bg-yellow-500 text-white text-center py-2 text-sm">
                    You're offline. Some features may be limited.
                  </div>
                )}
                
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/trending" element={<TrendingPage />} />
                    <Route path="/categories" element={<CategoriesPage />} />
                    <Route path="/category/:category" element={<CategoryPage />} />
                    <Route path="/article/:id" element={<ArticlePage />} />
                    <Route path="/sources" element={<SourcesPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>

                <ChatWidget />
                
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#333',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '16px',
                    },
                  }}
                />
              </div>
            </Router>
          </PreferencesProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;