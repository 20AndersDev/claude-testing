import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ posts, onFilterChange, onCreatePost, isOpen, onClose, sortBy, onSortChange }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

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

    // Add filler data if not enough real destinations
    const fillerDestinations = [
      { location: 'Paris, France', likes: 234 },
      { location: 'Tokyo, Japan', likes: 198 },
      { location: 'Bali, Indonesia', likes: 187 }
    ];

    if (locations.length < 3) {
      return [...locations, ...fillerDestinations.slice(0, 3 - locations.length)];
    }

    return locations;
  };

  const getHotTrips = () => {
    const trips = posts
      .filter(post => post.likes > 25 || (post.activities && post.activities.length > 3))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 2);

    // Add filler data if not enough real trips
    const fillerTrips = [
      { id: 'filler-1', tripTitle: 'Weekend in Rome', location: 'Rome, Italy', likes: 156 },
      { id: 'filler-2', tripTitle: 'Island Hopping Adventure', location: 'Greek Islands', likes: 143 }
    ];

    if (trips.length < 2) {
      return [...trips, ...fillerTrips.slice(0, 2 - trips.length)];
    }

    return trips;
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
  const hotTrips = getHotTrips();
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
          + New Trip
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