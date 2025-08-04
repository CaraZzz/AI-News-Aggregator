import React from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Moon, 
  Sun, 
  Smartphone,
  Bell,
  Eye,
  Trash2,
  Download
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePreferences } from '../contexts/PreferencesContext';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { preferences, updatePreferences, resetPreferences } = usePreferences();

  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    toast.success('Cache cleared successfully');
  };

  const handleInstallPWA = () => {
    const event = new Event('beforeinstallprompt');
    window.dispatchEvent(event);
    toast.success('Check your browser for installation prompt');
  };

  return (
    <>
      <Helmet>
        <title>Settings - NewsHub</title>
      </Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Appearance</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isDark ? <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark mode theme</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDark ? 'bg-gray-900' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Compact View</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Show more articles in less space</p>
                </div>
              </div>
              <button
                onClick={() => updatePreferences({ compactView: !preferences.compactView })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.compactView ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-900 transition-transform ${
                    preferences.compactView ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Reading Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Reading Preferences</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Show AI Summaries</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Display AI-generated summaries on news cards</p>
                </div>
              </div>
              <button
                onClick={() => updatePreferences({ showSummaries: !preferences.showSummaries })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.showSummaries ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-900 transition-transform ${
                    preferences.showSummaries ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Default Sort Order
              </label>
              <select
                value={preferences.sortBy}
                onChange={(e) => updatePreferences({ sortBy: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
              >
                <option value="latest">Latest First</option>
                <option value="popular">Most Popular</option>
                <option value="trending">Trending</option>
              </select>
            </div>
          </div>
        </div>

        {/* App Installation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">App Installation</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Install NewsHub</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add to your home screen for quick access</p>
              </div>
            </div>
            <button
              onClick={handleInstallPWA}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Install</span>
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Management</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Clear Cache</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Remove all cached data and preferences</p>
              </div>
              <button
                onClick={handleClearCache}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Reset Preferences</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Restore all settings to default</p>
              </div>
              <button
                onClick={() => {
                  resetPreferences();
                  toast.success('Preferences reset to default');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About</h2>
          
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>NewsHub v1.0.0</p>
            <p>An AI-powered news aggregator with personalized content</p>
            <p>© 2024 NewsHub. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;