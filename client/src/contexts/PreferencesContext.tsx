import React, { createContext, useContext, useState, useEffect } from 'react';

interface Preferences {
  categories: string[];
  sources: string[];
  sortBy: 'latest' | 'popular' | 'trending';
  compactView: boolean;
  showSummaries: boolean;
  autoPlayPodcasts: boolean;
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreferences: (updates: Partial<Preferences>) => void;
  resetPreferences: () => void;
}

const defaultPreferences: Preferences = {
  categories: [],
  sources: [],
  sortBy: 'latest',
  compactView: false,
  showSummaries: true,
  autoPlayPodcasts: false,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const saved = localStorage.getItem('preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }, [preferences]);

  const updatePreferences = (updates: Partial<Preferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('preferences');
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, resetPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};