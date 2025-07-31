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
    <nav className="mobile-nav safe-area-bottom">
      <div className="flex justify-around items-center">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className="mobile-nav-item"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center space-y-1"
              >
                <Icon 
                  className={`mobile-nav-icon ${
                    isActive ? 'mobile-nav-active' : 'mobile-nav-text'
                  }`}
                />
                <span 
                  className={`mobile-nav-text text-xs ${
                    isActive ? 'mobile-nav-active' : ''
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