import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const location = useLocation();

  // Don't show bottom nav on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const isActive = (path) => {
    if (path === '/profile') {
      return location.pathname === '/profile' || location.pathname.startsWith('/profile/');
    }
    return location.pathname === path;
  };

  return (
    <nav className="bottom-nav">
      <Link
        to="/feed"
        className={`bottom-nav-item ${isActive('/feed') ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">Home</span>
      </Link>

      <Link
        to="/search"
        className={`bottom-nav-item ${isActive('/search') ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">🔍</span>
        <span className="bottom-nav-label">Search</span>
      </Link>

      <Link
        to="/profile"
        className={`bottom-nav-item ${isActive('/profile') ? 'active' : ''}`}
      >
        <span className="bottom-nav-icon">👤</span>
        <span className="bottom-nav-label">Profile</span>
      </Link>
    </nav>
  );
}

export default BottomNav;
