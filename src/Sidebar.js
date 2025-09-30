import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ posts, onFilterChange, onCreatePost, isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  const getTrendingDestinations = () => {
    const locations = posts
      .filter(post => post.location && post.likes > 20)
      .map(post => ({ location: post.location, likes: post.likes }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3);
    return locations;
  };

  const getHotTrips = () => {
    return posts
      .filter(post => post.likes > 25 || (post.activities && post.activities.length > 3))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 2);
  };

  const getTrendingHashtags = () => {
    const hashtagCount = {};
    posts.forEach(post => {
      if (post.hashtags) {
        post.hashtags.forEach(tag => {
          hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(hashtagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));
  };

  const trendingDestinations = getTrendingDestinations();
  const hotTrips = getHotTrips();
  const trendingHashtags = getTrendingHashtags();

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-section">
        <h3 className="sidebar-title">✏️ Create</h3>
        <button
          className="create-trip-btn"
          onClick={() => navigate('/create-trip')}
        >
          + New Trip
        </button>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">#️⃣ Trending Hashtags</h3>
        <div className="hashtag-list">
          {trendingHashtags.map((item) => (
            <button
              key={item.tag}
              className="hashtag-item"
              onClick={() => navigate(`/hashtag/${item.tag}`)}
            >
              #{item.tag}
              <span className="hashtag-count">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">🚀 Trending</h3>
        <div className="trending-list">
          {trendingDestinations.map((dest, index) => (
            <div key={dest.location} className="trending-item">
              <span className="trending-rank">#{index + 1}</span>
              <span className="trending-name">{dest.location}</span>
              <span className="trending-likes">❤️ {dest.likes}</span>
            </div>
          ))}
        </div>
      </div>

      {hotTrips.length > 0 && (
        <div className="sidebar-section hot-section">
          <h3 className="sidebar-title">🔥 Hot Right Now</h3>
          <div className="hot-trips">
            {hotTrips.map((trip) => (
              <div key={trip.id} className="hot-trip-item">
                <div className="hot-trip-title">{trip.tripTitle}</div>
                <div className="hot-trip-meta">
                  <span>📍 {trip.location}</span>
                  <span>❤️ {trip.likes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export default Sidebar;