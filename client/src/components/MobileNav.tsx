import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  TrendingUp, 
  Grid3X3, 
  Plus,
  Search
} from 'lucide-react';

const MobileNav: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Trending', path: '/trending', icon: TrendingUp },
    { name: 'Categories', path: '/categories', icon: Grid3X3 },
    { name: 'Custom', path: '/custom-sources', icon: Plus },
    { name: 'Search', path: '/search', icon: Search },
  ];

  return (
    <nav className="mobile-nav">
      <div className="flex justify-around items-center px-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/categories' && location.pathname.startsWith('/categories/'));
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className="mobile-nav-item touch-target"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={`flex flex-col items-center justify-center space-y-1 ${
                  isActive ? 'mobile-nav-active' : ''
                }`}
              >
                <div className="relative">
                  <Icon 
                    className={`mobile-nav-icon ${
                      isActive ? 'mobile-nav-active' : 'mobile-nav-text'
                    }`}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="mobile-nav-indicator"
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                    />
                  )}
                </div>
                <span 
                  className={`text-xs font-medium ${
                    isActive ? 'mobile-nav-active' : 'mobile-nav-text'
                  }`}
                >
                  {item.name}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;