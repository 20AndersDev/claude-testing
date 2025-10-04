import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import './UserSearch.css';

function UserSearch() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(location.state?.query || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

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
        return;
      }

      setIsLoading(true);
      try {
        const query = searchQuery.trim().toLowerCase();
        const isHandleSearch = query.startsWith('@');
        const searchTerm = isHandleSearch ? query.slice(1) : query;

        let queryBuilder = supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url');

        if (isHandleSearch) {
          // Search by username/handle only
          queryBuilder = queryBuilder.ilike('username', `%${searchTerm}%`);
        } else {
          // Search by full name or username
          queryBuilder = queryBuilder.or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
        }

        const { data, error } = await queryBuilder.limit(20);

        if (error) throw error;

        setSearchResults(data || []);
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
  }, [searchQuery]);

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
          <h1>🔍 Search Results</h1>
          <p className="search-subtitle">
            {searchQuery.trim().length >= 2 && !isLoading && (
              `${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'} found`
            )}
            {searchQuery.trim().length < 2 && 'Find people by name or @username'}
          </p>
        </div>

        <div className="search-results">
          {isLoading && (
            <div className="search-loading">Searching...</div>
          )}

          {!isLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div className="no-results-found">
              <div className="no-results-icon">😔</div>
              <p>No users found matching "{searchQuery}"</p>
            </div>
          )}

          {!isLoading && searchResults.length > 0 && (
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
          )}

          {!isLoading && searchQuery.trim().length < 2 && (
            <div className="search-hint">
              <div className="hint-icon">💡</div>
              <p>Type at least 2 characters to search</p>
              <div className="search-examples">
                <div className="example">Try: <strong>John</strong></div>
                <div className="example">Try: <strong>@username</strong></div>
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
