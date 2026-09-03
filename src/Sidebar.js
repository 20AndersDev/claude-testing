import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ posts, onFilterChange, isOpen, onClose, sortBy, onSortChange }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  const getTrendingDestinations = () => {
    // Count how many posts exist for each location
    const locationCounts = {};

    posts.forEach(post => {
      if (post.location) {
        const location = post.location.trim();
        if (locationCounts[location]) {
          locationCounts[location].count++;
          locationCounts[location].totalLikes += post.likes || 0;
        } else {
          locationCounts[location] = {
            location: location,
            count: 1,
            totalLikes: post.likes || 0
          };
        }
      }
    });

    // Convert to array and sort by post count (most posted locations)
    const sortedLocations = Object.values(locationCounts)
      .sort((a, b) => {
        // First sort by count (most posts)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // If same count, sort by total likes
        return b.totalLikes - a.totalLikes;
      })
      .slice(0, 5)
      .map(loc => ({
        location: loc.location,
        postCount: loc.count,
        likes: loc.totalLikes
      }));

    return sortedLocations;
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Filter posts that have future start dates (upcoming trips/events)
    const upcomingTrips = posts
      .filter(post => {
        if (!post.startDate) return false;
        const startDate = new Date(post.startDate);
        return startDate > now && startDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 3);

    return upcomingTrips;
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

    const realHashtags = Object.entries(hashtagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));

    // Add filler data if not enough real hashtags
    const fillerHashtags = [
      { tag: 'travel', count: 156 },
      { tag: 'wanderlust', count: 142 },
      { tag: 'adventure', count: 128 },
      { tag: 'beach', count: 115 },
      { tag: 'vacation', count: 103 },
      { tag: 'explore', count: 98 }
    ];

    if (realHashtags.length < 6) {
      return [...realHashtags, ...fillerHashtags.slice(0, 6 - realHashtags.length)];
    }

    return realHashtags;
  };

  const trendingDestinations = getTrendingDestinations();
  const upcomingEvents = getUpcomingEvents();
  const trendingHashtags = getTrendingHashtags();

  const popularCountries = [
    { name: 'France', flag: '🇫🇷' },
    { name: 'Italy', flag: '🇮🇹' },
    { name: 'Japan', flag: '🇯🇵' },
    { name: 'Spain', flag: '🇪🇸' },
    { name: 'United States', flag: '🇺🇸' },
    { name: 'Thailand', flag: '🇹🇭' },
    { name: 'Greece', flag: '🇬🇷' },
    { name: 'Australia', flag: '🇦🇺' },
  ];

  const allCountries = [
    { name: 'Afghanistan', flag: '🇦🇫' },
    { name: 'Albania', flag: '🇦🇱' },
    { name: 'Algeria', flag: '🇩🇿' },
    { name: 'Argentina', flag: '🇦🇷' },
    { name: 'Armenia', flag: '🇦🇲' },
    { name: 'Australia', flag: '🇦🇺' },
    { name: 'Austria', flag: '🇦🇹' },
    { name: 'Azerbaijan', flag: '🇦🇿' },
    { name: 'Bahamas', flag: '🇧🇸' },
    { name: 'Bahrain', flag: '🇧🇭' },
    { name: 'Bangladesh', flag: '🇧🇩' },
    { name: 'Barbados', flag: '🇧🇧' },
    { name: 'Belarus', flag: '🇧🇾' },
    { name: 'Belgium', flag: '🇧🇪' },
    { name: 'Belize', flag: '🇧🇿' },
    { name: 'Bolivia', flag: '🇧🇴' },
    { name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
    { name: 'Brazil', flag: '🇧🇷' },
    { name: 'Brunei', flag: '🇧🇳' },
    { name: 'Bulgaria', flag: '🇧🇬' },
    { name: 'Cambodia', flag: '🇰🇭' },
    { name: 'Cameroon', flag: '🇨🇲' },
    { name: 'Canada', flag: '🇨🇦' },
    { name: 'Chile', flag: '🇨🇱' },
    { name: 'China', flag: '🇨🇳' },
    { name: 'Colombia', flag: '🇨🇴' },
    { name: 'Costa Rica', flag: '🇨🇷' },
    { name: 'Croatia', flag: '🇭🇷' },
    { name: 'Cuba', flag: '🇨🇺' },
    { name: 'Cyprus', flag: '🇨🇾' },
    { name: 'Czech Republic', flag: '🇨🇿' },
    { name: 'Denmark', flag: '🇩🇰' },
    { name: 'Dominican Republic', flag: '🇩🇴' },
    { name: 'Ecuador', flag: '🇪🇨' },
    { name: 'Egypt', flag: '🇪🇬' },
    { name: 'Estonia', flag: '🇪🇪' },
    { name: 'Ethiopia', flag: '🇪🇹' },
    { name: 'Fiji', flag: '🇫🇯' },
    { name: 'Finland', flag: '🇫🇮' },
    { name: 'France', flag: '🇫🇷' },
    { name: 'Georgia', flag: '🇬🇪' },
    { name: 'Germany', flag: '🇩🇪' },
    { name: 'Ghana', flag: '🇬🇭' },
    { name: 'Greece', flag: '🇬🇷' },
    { name: 'Guatemala', flag: '🇬🇹' },
    { name: 'Honduras', flag: '🇭🇳' },
    { name: 'Hong Kong', flag: '🇭🇰' },
    { name: 'Hungary', flag: '🇭🇺' },
    { name: 'Iceland', flag: '🇮🇸' },
    { name: 'India', flag: '🇮🇳' },
    { name: 'Indonesia', flag: '🇮🇩' },
    { name: 'Iran', flag: '🇮🇷' },
    { name: 'Iraq', flag: '🇮🇶' },
    { name: 'Ireland', flag: '🇮🇪' },
    { name: 'Israel', flag: '🇮🇱' },
    { name: 'Italy', flag: '🇮🇹' },
    { name: 'Jamaica', flag: '🇯🇲' },
    { name: 'Japan', flag: '🇯🇵' },
    { name: 'Jordan', flag: '🇯🇴' },
    { name: 'Kazakhstan', flag: '🇰🇿' },
    { name: 'Kenya', flag: '🇰🇪' },
    { name: 'Kuwait', flag: '🇰🇼' },
    { name: 'Laos', flag: '🇱🇦' },
    { name: 'Latvia', flag: '🇱🇻' },
    { name: 'Lebanon', flag: '🇱🇧' },
    { name: 'Libya', flag: '🇱🇾' },
    { name: 'Lithuania', flag: '🇱🇹' },
    { name: 'Luxembourg', flag: '🇱🇺' },
    { name: 'Madagascar', flag: '🇲🇬' },
    { name: 'Malaysia', flag: '🇲🇾' },
    { name: 'Maldives', flag: '🇲🇻' },
    { name: 'Malta', flag: '🇲🇹' },
    { name: 'Mexico', flag: '🇲🇽' },
    { name: 'Monaco', flag: '🇲🇨' },
    { name: 'Mongolia', flag: '🇲🇳' },
    { name: 'Montenegro', flag: '🇲🇪' },
    { name: 'Morocco', flag: '🇲🇦' },
    { name: 'Myanmar', flag: '🇲🇲' },
    { name: 'Nepal', flag: '🇳🇵' },
    { name: 'Netherlands', flag: '🇳🇱' },
    { name: 'New Zealand', flag: '🇳🇿' },
    { name: 'Nicaragua', flag: '🇳🇮' },
    { name: 'Nigeria', flag: '🇳🇬' },
    { name: 'North Korea', flag: '🇰🇵' },
    { name: 'Norway', flag: '🇳🇴' },
    { name: 'Oman', flag: '🇴🇲' },
    { name: 'Pakistan', flag: '🇵🇰' },
    { name: 'Panama', flag: '🇵🇦' },
    { name: 'Paraguay', flag: '🇵🇾' },
    { name: 'Peru', flag: '🇵🇪' },
    { name: 'Philippines', flag: '🇵🇭' },
    { name: 'Poland', flag: '🇵🇱' },
    { name: 'Portugal', flag: '🇵🇹' },
    { name: 'Qatar', flag: '🇶🇦' },
    { name: 'Romania', flag: '🇷🇴' },
    { name: 'Russia', flag: '🇷🇺' },
    { name: 'Saudi Arabia', flag: '🇸🇦' },
    { name: 'Scotland', flag: '🏴󐁧󐁢󐁳󐁣󐁴󐁿' },
    { name: 'Senegal', flag: '🇸🇳' },
    { name: 'Serbia', flag: '🇷🇸' },
    { name: 'Singapore', flag: '🇸🇬' },
    { name: 'Slovakia', flag: '🇸🇰' },
    { name: 'Slovenia', flag: '🇸🇮' },
    { name: 'South Africa', flag: '🇿🇦' },
    { name: 'South Korea', flag: '🇰🇷' },
    { name: 'Spain', flag: '🇪🇸' },
    { name: 'Sri Lanka', flag: '🇱🇰' },
    { name: 'Sweden', flag: '🇸🇪' },
    { name: 'Switzerland', flag: '🇨🇭' },
    { name: 'Syria', flag: '🇸🇾' },
    { name: 'Taiwan', flag: '🇹🇼' },
    { name: 'Tanzania', flag: '🇹🇿' },
    { name: 'Thailand', flag: '🇹🇭' },
    { name: 'Tunisia', flag: '🇹🇳' },
    { name: 'Turkey', flag: '🇹🇷' },
    { name: 'Uganda', flag: '🇺🇬' },
    { name: 'Ukraine', flag: '🇺🇦' },
    { name: 'United Arab Emirates', flag: '🇦🇪' },
    { name: 'United Kingdom', flag: '🇬🇧' },
    { name: 'United States', flag: '🇺🇸' },
    { name: 'Uruguay', flag: '🇺🇾' },
    { name: 'Uzbekistan', flag: '🇺🇿' },
    { name: 'Venezuela', flag: '🇻🇪' },
    { name: 'Vietnam', flag: '🇻🇳' },
    { name: 'Yemen', flag: '🇾🇪' },
    { name: 'Zambia', flag: '🇿🇲' },
    { name: 'Zimbabwe', flag: '🇿🇼' },
  ];

  const filteredCountries = allCountries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleCountryClick = (countryName) => {
    navigate(`/country/${encodeURIComponent(countryName)}`);
    setShowAllCountries(false);
    setCountrySearch('');
  };

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
          ✍️ Create New Post
        </button>
        <button
          className="discover-events-btn"
          onClick={() => navigate('/events')}
        >
          🎟️ Discover Events
        </button>
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">🔄 Sort Posts</h3>
        <select
          className="sidebar-sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
          <option value="comments">Most Discussed</option>
          <option value="oldest">Oldest First</option>
        </select>
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
        <h3 className="sidebar-title">🚀 Trending Locations</h3>
        {trendingDestinations.length > 0 ? (
          <div className="trending-list">
            {trendingDestinations.map((dest, index) => (
              <div
                key={dest.location}
                className="trending-item"
                onClick={() => {
                  navigate(`/location/${encodeURIComponent(dest.location)}`);
                }}
                style={{ cursor: 'pointer' }}
              >
                <span className="trending-rank">#{index + 1}</span>
                <div className="trending-info">
                  <span className="trending-name">{dest.location}</span>
                  <div className="trending-stats">
                    <span className="trending-posts">📍 {dest.postCount} {dest.postCount === 1 ? 'post' : 'posts'}</span>
                    {dest.likes > 0 && (
                      <span className="trending-likes">❤️ {dest.likes}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="trending-empty">
            <p>No locations yet. Be the first to post!</p>
          </div>
        )}
      </div>

      {upcomingEvents.length > 0 && (
        <div className="sidebar-section events-section">
          <h3 className="sidebar-title">📅 Upcoming Events</h3>
          <div className="events-list">
            {upcomingEvents.map((event) => {
              const startDate = new Date(event.startDate);
              const daysUntil = Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={event.id}
                  className="event-item"
                  onClick={() => navigate(`/post/${event.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="event-date-badge">
                    <div className="event-month">{startDate.toLocaleString('default', { month: 'short' })}</div>
                    <div className="event-day">{startDate.getDate()}</div>
                  </div>
                  <div className="event-details">
                    <div className="event-title">{event.tripTitle}</div>
                    <div className="event-location">📍 {event.location}</div>
                    <div className="event-time">
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {upcomingEvents.length === 0 && (
        <div className="sidebar-section">
          <h3 className="sidebar-title">📅 Upcoming Events</h3>
          <div className="events-empty">
            <p>No upcoming events in the next 30 days.</p>
            <button
              className="create-event-btn"
              onClick={() => navigate('/create-trip')}
            >
              Plan a Trip
            </button>
          </div>
        </div>
      )}
      </div>

      {showAllCountries && (
        <div className="countries-modal-overlay" onClick={() => setShowAllCountries(false)}>
          <div className="countries-modal" onClick={(e) => e.stopPropagation()}>
            <div className="countries-modal-header">
              <h2>Explore All Countries</h2>
              <button
                className="countries-modal-close"
                onClick={() => setShowAllCountries(false)}
              >
                ✕
              </button>
            </div>
            <div className="countries-search-container">
              <input
                type="text"
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="countries-search-input"
                autoFocus
              />
              <span className="countries-search-icon">🔍</span>
            </div>
            <div className="countries-modal-list">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.name}
                    className="countries-modal-item"
                    onClick={() => handleCountryClick(country.name)}
                  >
                    <span className="country-flag-large">{country.flag}</span>
                    <span className="country-name-large">{country.name}</span>
                  </button>
                ))
              ) : (
                <div className="no-countries-found">
                  <div className="no-countries-icon">🌍</div>
                  <p>No countries found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;