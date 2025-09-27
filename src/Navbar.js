import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    // In a real app, you'd clear authentication tokens here
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/feed" className="navbar-logo">
            <span className="logo-icon">🗺️</span>
            <span className="logo-text">TripLogger</span>
          </Link>
        </div>

        <div className="navbar-center">
          <Link to="/feed" className="nav-item active">
            <span className="nav-icon">🏠</span>
          </Link>
          <div className="nav-item">
            <span className="nav-icon">🗺️</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">📍</span>
          </div>
          <div className="nav-item">
            <span className="nav-icon">🌟</span>
          </div>
        </div>

        <div className="navbar-right">
          <button className="nav-action-btn">
            <span className="action-icon">💬</span>
          </button>
          <button className="nav-action-btn">
            <span className="action-icon">🔔</span>
          </button>
          <button className="nav-action-btn theme-toggle" onClick={toggleTheme}>
            <span className="action-icon">{isDark ? '☀️' : '🌙'}</span>
          </button>
          <div className="user-menu">
            <div className="user-avatar">👤</div>
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