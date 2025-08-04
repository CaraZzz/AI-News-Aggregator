import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MessageCircle, 
  Menu, 
  X, 
  Newspaper,
  ArrowLeft
} from 'lucide-react';
import { useNews } from '../contexts/NewsContext';

interface HeaderProps {
  onChatToggle: () => void;
  isMobile: boolean;
}

const Header: React.FC<HeaderProps> = ({ onChatToggle, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { searchNews } = useNews();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      // Focus search input after animation
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="header">
      <div className="header-content">
        <AnimatePresence mode="wait">
          {isSearchOpen && isMobile ? (
            // Mobile Search Mode
            <motion.div
              key="mobile-search"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center w-full"
            >
              <button
                onClick={closeSearch}
                className="touch-target mr-3 p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Close search"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600" />
              </button>
              
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search news..."
                    className="search-field w-full pr-4"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </form>
            </motion.div>
          ) : (
            // Normal Header Mode
            <motion.div
              key="normal-header"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between w-full"
            >
              {/* Logo */}
              <Link to="/" className="logo">
                <Newspaper className="logo-icon" />
                <span className="hidden sm:block">News Aggregator</span>
                <span className="sm:hidden">News</span>
              </Link>

              {/* Desktop Search */}
              {!isMobile && (
                <div className="flex-1 max-w-md mx-8">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search news..."
                        className="search-field w-full pr-4"
                        autoComplete="off"
                      />
                    </div>
                  </form>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {/* Mobile Search Toggle */}
                {isMobile && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleSearch}
                    className="touch-target p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
                    aria-label="Search"
                  >
                    <Search className="w-6 h-6 text-gray-600" />
                  </motion.button>
                )}

                {/* Chat Toggle */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onChatToggle}
                  className="touch-target p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors relative"
                  aria-label="Toggle AI Chat"
                >
                  <MessageCircle className="w-6 h-6 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Search Overlay */}
      {!isMobile && isSearchOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg"
        >
          <div className="container-safe py-4">
            <form onSubmit={handleSearch}>
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for news, topics, or sources..."
                  className="w-full pl-14 pr-12 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;