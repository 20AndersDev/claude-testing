import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import './Navbar.css';

function Navbar({ onSearchChange, onSidebarToggle }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

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
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="hamburger-btn" onClick={onSidebarToggle}>
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
    </nav>
  );
}

export default Navbar;