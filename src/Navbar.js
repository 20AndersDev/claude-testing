import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import './Navbar.css';

function Navbar({ onSearchChange, onSidebarToggle }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleLogout = () => {
    // In a real app, you'd clear authentication tokens here
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowMobileMenu(false);
  };

  const handleHamburgerClick = () => {
    // Check if we're on mobile (window width <= 768px)
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // On mobile, always show mobile menu
      setShowMobileMenu(!showMobileMenu);
    } else if (onSidebarToggle) {
      // On desktop, use sidebar if available
      onSidebarToggle();
    } else {
      // Fallback to mobile menu
      setShowMobileMenu(!showMobileMenu);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="hamburger-btn" onClick={handleHamburgerClick}>
            <span className="hamburger-icon">☰</span>
          </button>
          <Link to="/feed" className="navbar-logo">
            <span className="logo-icon">🗺️</span>
            <span className="logo-text">TripLogger</span>
          </Link>
        </div>

        <div className="navbar-center">
          <div className="navbar-search">
            <input
              type="text"
              placeholder="Search trips, destinations, activities..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="navbar-search-input"
            />
            <span className="navbar-search-icon">🔍</span>
          </div>
        </div>

        <div className="navbar-right">
          <button className="nav-action-btn theme-toggle" onClick={toggleTheme}>
            <span className="action-icon">{isDark ? '☀️' : '🌙'}</span>
          </button>
          <div className="user-menu">
            <div className="user-avatar" onClick={handleProfileClick}>👤</div>
            <div className="dropdown">
              <Link to="/profile" className="profile-option">
                👤 Profile
              </Link>
              <button onClick={handleLogout} className="logout-option">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <button className="mobile-menu-close" onClick={() => setShowMobileMenu(false)}>✕</button>

            <Link to="/feed" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              🏠 Home
            </Link>
            <Link to="/profile" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              👤 Profile
            </Link>
            <button className="mobile-menu-item" onClick={toggleTheme}>
              {isDark ? '☀️' : '🌙'} {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="mobile-menu-item logout" onClick={() => { handleLogout(); setShowMobileMenu(false); }}>
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;