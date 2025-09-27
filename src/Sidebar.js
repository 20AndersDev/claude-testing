import React, { useState } from 'react';
import './Sidebar.css';

function Sidebar({ posts, onFilterChange, onSearchChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  const getUniqueLocations = () => {
    const locations = posts
      .filter(post => post.location)
      .map(post => post.location)
      .reduce((acc, location) => {
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const getPopularActivities = () => {
    const activities = posts
      .flatMap(post => post.activities || [])
      .reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(activities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  };

  const getActivityIcon = (type) => {
    const icons = {
      restaurant: '🍽️',
      bar: '🍺',
      monument: '🏛️',
      attraction: '🎢',
      hotel: '🏨',
      museum: '🏛️',
      park: '🌳',
      beach: '🏖️'
    };
    return icons[type] || '📍';
  };

  const uniqueLocations = getUniqueLocations();
  const popularActivities = getPopularActivities();

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">🔍 Search Trips</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search destinations, activities..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">📊 Filter by</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterClick('all')}
          >
            🌍 All Trips
          </button>
          <button
            className={`filter-btn ${activeFilter === 'popular' ? 'active' : ''}`}
            onClick={() => handleFilterClick('popular')}
          >
            🔥 Most Popular
          </button>
          <button
            className={`filter-btn ${activeFilter === 'recent' ? 'active' : ''}`}
            onClick={() => handleFilterClick('recent')}
          >
            🆕 Most Recent
          </button>
          <button
            className={`filter-btn ${activeFilter === 'weekend' ? 'active' : ''}`}
            onClick={() => handleFilterClick('weekend')}
          >
            📅 Weekend Trips
          </button>
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">📍 Popular Destinations</h3>
        <div className="destination-list">
          {uniqueLocations.map(([location, count]) => (
            <div key={location} className="destination-item">
              <span className="destination-name">{location}</span>
              <span className="destination-count">{count} trip{count > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">⭐ Popular Activities</h3>
        <div className="activity-list">
          {popularActivities.map(([type, count]) => (
            <div key={type} className="activity-item">
              <span className="activity-icon">{getActivityIcon(type)}</span>
              <span className="activity-name">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
              <span className="activity-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">🎯 Quick Actions</h3>
        <div className="quick-actions">
          <button className="action-btn create-trip">
            ➕ Share New Trip
          </button>
          <button className="action-btn explore">
            🗺️ Explore Map
          </button>
          <button className="action-btn saved">
            💾 Saved Trips
          </button>
        </div>
      </div>

      <div className="sidebar-section stats-section">
        <h3 className="sidebar-title">📈 Community Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{posts.length}</div>
            <div className="stat-label">Total Trips</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {posts.reduce((sum, post) => sum + (post.activities?.length || 0), 0)}
            </div>
            <div className="stat-label">Places Visited</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {uniqueLocations.length}
            </div>
            <div className="stat-label">Countries</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;