import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

import Header from './components/Header';
import MobileNav from './components/MobileNav';
import AIChatbot from './components/AIChatbot';
import NewsFeed from './pages/NewsFeed';
import Categories from './pages/Categories';
import CustomSources from './pages/CustomSources';
import Search from './pages/Search';
import Trending from './pages/Trending';

import { NewsProvider } from './contexts/NewsContext';
import { ChatProvider } from './contexts/ChatContext';

const App: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <NewsProvider>
      <ChatProvider>
        <div className="min-h-screen bg-gray-50">
          <Helmet>
            <title>News Aggregator - AI-Powered News</title>
            <meta name="description" content="Stay informed with AI-powered news aggregation, personalized feeds, and intelligent insights." />
            <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
          </Helmet>

          <Header onChatToggle={toggleChat} isMobile={isMobile} />
          
          <main className={`${isMobile ? 'pb-20' : 'pb-8'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Routes>
                  <Route path="/" element={<NewsFeed />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/categories/:category" element={<NewsFeed />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/custom-sources" element={<CustomSources />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>

          {isMobile && <MobileNav />}

          {/* AI Chatbot Sidebar */}
          <AIChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
      </ChatProvider>
    </NewsProvider>
  );
};

export default App;