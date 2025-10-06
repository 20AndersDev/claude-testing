import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useLoadScript } from '@react-google-maps/api';
import Navbar from './Navbar';
import './UserSearch.css';

const libraries = ['places'];

function UserSearch() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(location.state?.query || '');
  const [searchResults, setSearchResults] = useState([]);
  const [placeResults, setPlaceResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
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
  }, []);

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
      const request = {
        input: query,
        includedPrimaryTypes: ['establishment', 'geocode'],
        language: 'en',
      };

      const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      if (suggestions && suggestions.length > 0) {
        const formattedResults = suggestions.slice(0, 10).map(suggestion => {
          const placePrediction = suggestion.placePrediction;
          return {
            place_id: placePrediction?.placeId || Math.random().toString(),
            description: placePrediction?.text?.text || '',
            structured_formatting: {
              main_text: placePrediction?.structuredFormat?.mainText?.text || placePrediction?.text?.text || '',
              secondary_text: placePrediction?.structuredFormat?.secondaryText?.text || ''
            }
          };
        });
        setPlaceResults(formattedResults);
      } else {
        setPlaceResults([]);
      }
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      // Fallback to old AutocompleteService if new API fails
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              setPlaceResults(predictions.slice(0, 10));
            } else {
              setPlaceResults([]);
            }
          }
        );
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setPlaceResults([]);
      }
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
      <div className="user-search-page">
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
                      <div className="avatar-placeholder place-icon">
                        📍
                      </div>
                    </div>
                    <div className="user-result-info">
                      <div className="user-result-name">
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
