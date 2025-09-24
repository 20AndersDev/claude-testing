import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, you'd clear authentication tokens here
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/feed" className="navbar-logo">
            📘 SocialApp
          </Link>
          <div className="navbar-search">
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="navbar-center">
          <Link to="/feed" className="nav-item active">
            🏠 Home
          </Link>
          <div className="nav-item">
            👥 Friends
          </div>
          <div className="nav-item">
            📺 Watch
          </div>
          <div className="nav-item">
            🛒 Marketplace
          </div>
        </div>

        <div className="navbar-right">
          <div className="nav-icon">
            ➕
          </div>
          <div className="nav-icon">
            💬
          </div>
          <div className="nav-icon">
            🔔
          </div>
          <div className="user-menu">
            <div className="user-avatar">👤</div>
            <div className="dropdown">
              <button onClick={handleLogout} className="logout-option">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;