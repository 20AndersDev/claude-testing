import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useLoadScript } from '@react-google-maps/api';
import Navbar from './Navbar';
import useSwipeNavigation from './useSwipeNavigation';
import './UserSearch.css';

const libraries = ['places'];

// Country to flag emoji mapping
const countryFlags = {
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Japan': '🇯🇵',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Germany': '🇩🇪',
  'Australia': '🇦🇺',
  'Thailand': '🇹🇭',
  'Greece': '🇬🇷',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'Canada': '🇨🇦',
  'Portugal': '🇵🇹',
  'Netherlands': '🇳🇱',
  'Switzerland': '🇨🇭',
  'Turkey': '🇹🇷',
  'South Korea': '🇰🇷',
  'Egypt': '🇪🇬',
  'Iceland': '🇮🇸',
  'Ireland': '🇮🇪',
  'Austria': '🇦🇹',
  'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿',
  'Hungary': '🇭🇺',
  'Croatia': '🇭🇷',
  'Norway': '🇳🇴',
  'Sweden': '🇸🇪',
  'Finland': '🇫🇮',
  'Denmark': '🇩🇰',
  'Belgium': '🇧🇪',
  'India': '🇮🇳',
  'China': '🇨🇳',
  'Russia': '🇷🇺',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Peru': '🇵🇪',
  'Colombia': '🇨🇴',
  'Morocco': '🇲🇦',
  'South Africa': '🇿🇦',
  'New Zealand': '🇳🇿',
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
  'Indonesia': '🇮🇩',
  'Philippines': '🇵🇭',
  'Vietnam': '🇻🇳',
  'United Arab Emirates': '🇦🇪',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Israel': '🇮🇱',
};

function UserSearch() {
  const location = useLocation();
  useSwipeNavigation();
  const [searchQuery, setSearchQuery] = useState(location.state?.query || '');
  const [searchResults, setSearchResults] = useState([]);
  const [placeResults, setPlaceResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_PLACES_API_KEY,
    libraries,
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    fetchCurrentUser();
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
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
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));
  };

  const getTrendingDestinations = () => {
    const locations = posts
      .filter(post => post.location && post.likes > 10)
      .map(post => ({ location: post.location, likes: post.likes }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5);
    return locations;
  };

  const getExploreCountries = () => {
    return [
      { name: 'United States', flag: '🇺🇸', code: 'US' },
      { name: 'France', flag: '🇫🇷', code: 'FR' },
      { name: 'Italy', flag: '🇮🇹', code: 'IT' },
      { name: 'Spain', flag: '🇪🇸', code: 'ES' },
      { name: 'Japan', flag: '🇯🇵', code: 'JP' },
      { name: 'United Kingdom', flag: '🇬🇧', code: 'GB' },
      { name: 'Germany', flag: '🇩🇪', code: 'DE' },
      { name: 'Australia', flag: '🇦🇺', code: 'AU' },
      { name: 'Thailand', flag: '🇹🇭', code: 'TH' },
      { name: 'Greece', flag: '🇬🇷', code: 'GR' },
      { name: 'Brazil', flag: '🇧🇷', code: 'BR' },
      { name: 'Mexico', flag: '🇲🇽', code: 'MX' },
      { name: 'Canada', flag: '🇨🇦', code: 'CA' },
      { name: 'Portugal', flag: '🇵🇹', code: 'PT' },
      { name: 'Netherlands', flag: '🇳🇱', code: 'NL' },
      { name: 'Switzerland', flag: '🇨🇭', code: 'CH' },
      { name: 'Turkey', flag: '🇹🇷', code: 'TR' },
      { name: 'South Korea', flag: '🇰🇷', code: 'KR' },
      { name: 'Egypt', flag: '🇪🇬', code: 'EG' },
      { name: 'Iceland', flag: '🇮🇸', code: 'IS' },
    ];
  };

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setPlaceResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const query = searchQuery.trim().toLowerCase();
        const isHandleSearch = query.startsWith('@');
        const searchTerm = isHandleSearch ? query.slice(1) : query;

        // Search users
        let queryBuilder = supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url');

        if (isHandleSearch) {
          queryBuilder = queryBuilder.ilike('username', `%${searchTerm}%`);
        } else {
          queryBuilder = queryBuilder.or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
        }

        const { data, error } = await queryBuilder.limit(20);

        if (error) throw error;

        setSearchResults(data || []);

        // Search places if Google Maps is loaded
        if (isLoaded && !isHandleSearch) {
          searchPlaces(searchQuery);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, isLoaded]);

  const searchPlaces = async (query) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    try {
      // Use the standard AutocompleteService which is more reliable
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions(
        {
          input: query,
        },
        async (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Get place details for each prediction to fetch photos
            const placesWithDetails = await Promise.all(
              predictions.slice(0, 10).map(async (place) => {
                return new Promise((resolve) => {
                  // Create a temporary div for PlacesService
                  const div = document.createElement('div');
                  const placesService = new window.google.maps.places.PlacesService(div);

                  placesService.getDetails(
                    {
                      placeId: place.place_id,
                      fields: ['photos', 'icon', 'types', 'name', 'address_components']
                    },
                    (placeDetails, detailsStatus) => {
                      if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                        // Get the first photo if available
                        const photoUrl = placeDetails.photos && placeDetails.photos.length > 0
                          ? placeDetails.photos[0].getUrl({ maxWidth: 100, maxHeight: 100 })
                          : placeDetails.icon;

                        // Extract country from address components
                        const countryComponent = placeDetails.address_components?.find(
                          component => component.types.includes('country')
                        );
                        const countryName = countryComponent?.long_name;
                        const countryFlag = countryName ? countryFlags[countryName] : null;

                        resolve({
                          ...place,
                          photoUrl: photoUrl,
                          types: placeDetails.types || [],
                          countryFlag: countryFlag,
                          countryName: countryName
                        });
                      } else {
                        // Fallback to just the place without photo
                        resolve({ ...place, photoUrl: null, types: [], countryFlag: null, countryName: null });
                      }
                    }
                  );
                });
              })
            );

            setPlaceResults(placesWithDetails);
          } else {
            setPlaceResults([]);
          }
        }
      );
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      setPlaceResults([]);
    }
  };

  const handleUserClick = (userId) => {
    if (userId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="user-search-page page-transition-container">
      <div className="search-container">
        <div className="search-header">
          <h1>🔍 Search</h1>
          <p className="search-subtitle">
            {searchQuery.trim().length >= 2 && !isLoading && (() => {
              const totalResults = searchResults.length + placeResults.length;
              return `${totalResults} ${totalResults === 1 ? 'result' : 'results'} found`;
            })()}
            {searchQuery.trim().length < 2 && 'Discover people and places'}
          </p>
        </div>

        <div className="search-input-wrapper">
          <input
            type="search"
            className="user-search-input"
            placeholder="Search users & places"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="search-results">
          {isLoading && (
            <div className="search-loading">Searching...</div>
          )}

          {!isLoading && searchQuery.trim().length < 2 && (
            <>
              <div className="trending-section mobile-only-trending">
                <div className="trending-subsection">
                  <h3 className="trending-title">#️⃣ Trending Hashtags</h3>
                  <div className="hashtag-grid">
                    {getTrendingHashtags().map((item) => (
                      <button
                        key={item.tag}
                        className="hashtag-chip"
                        onClick={() => navigate(`/hashtag/${item.tag}`)}
                      >
                        #{item.tag}
                        <span className="hashtag-count-badge">{item.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="trending-subsection">
                  <h3 className="trending-title">🚀 Trending Destinations</h3>
                  <div className="trending-destinations-list">
                    {getTrendingDestinations().map((dest, index) => (
                      <div key={dest.location} className="trending-destination-item">
                        <span className="destination-rank">#{index + 1}</span>
                        <span className="destination-name">{dest.location}</span>
                        <span className="destination-likes">❤️ {dest.likes}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="trending-subsection">
                  <h3 className="trending-title">🌍 Explore Countries</h3>
                  <div className="explore-countries-grid">
                    {getExploreCountries().map((country) => (
                      <button
                        key={country.code}
                        className="country-chip"
                        onClick={() => setSearchQuery(country.name)}
                      >
                        <span className="country-flag">{country.flag}</span>
                        <span className="country-name">{country.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {!isLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && placeResults.length === 0 && (
            <div className="no-results-found">
              <div className="no-results-icon">😔</div>
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}

          {!isLoading && searchResults.length > 0 && (
            <>
              <div className="results-group-header">👤 Users</div>
              <div className="users-results-list">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="user-result-item"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <div className="user-result-avatar">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name || user.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="user-result-info">
                      <div className="user-result-name">
                        {user.full_name || user.username || 'User'}
                        {user.id === currentUserId && <span className="you-badge">You</span>}
                      </div>
                      {user.username && (
                        <div className="user-result-username">@{user.username}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isLoading && placeResults.length > 0 && (
            <>
              {searchResults.length > 0 && <div className="results-divider"></div>}
              <div className="results-group-header">📍 Places</div>
              <div className="users-results-list">
                {placeResults.map((place) => (
                  <div
                    key={place.place_id}
                    className="user-result-item"
                    onClick={() => navigate(`/place/${place.place_id}`)}
                  >
                    <div className="user-result-avatar">
                      {place.photoUrl ? (
                        <img
                          src={place.photoUrl}
                          alt={place.structured_formatting.main_text}
                          className="place-photo"
                        />
                      ) : (
                        <div className="avatar-placeholder place-icon">
                          📍
                        </div>
                      )}
                    </div>
                    <div className="user-result-info">
                      <div className="user-result-name">
                        {place.countryFlag && <span className="place-country-flag">{place.countryFlag}</span>}
                        {place.structured_formatting.main_text}
                      </div>
                      <div className="user-result-username">
                        {place.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isLoading && searchQuery.trim().length < 2 && (
            <div className="search-hint">
              <div className="hint-icon">💡</div>
              <p>Start typing to explore</p>
              <div className="search-examples">
                <div className="example">Search for people or destinations</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default UserSearch;
