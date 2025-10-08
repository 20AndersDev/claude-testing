import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';
import { useLoadScript } from '@react-google-maps/api';
import './Navbar.css';

const libraries = ['places'];

function Navbar({ onSearchChange, onSidebarToggle }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [quickResults, setQuickResults] = useState([]);
  const [showQuickResults, setShowQuickResults] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [placeResults, setPlaceResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_PLACES_API_KEY,
    libraries,
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Show dropdown when user types
    if (value.trim().length > 0) {
      setShowQuickResults(true);
      if (isLoaded) {
        searchPlaces(value);
      }
    } else {
      setShowQuickResults(false);
      setPlaceResults([]);
    }
  };

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
        const formattedResults = suggestions.slice(0, 3).map(suggestion => {
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
              setPlaceResults(predictions.slice(0, 3));
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

  const handleSearchFocus = () => {
    if (searchTerm.trim().length > 0) {
      setShowQuickResults(true);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate('/search', { state: { query: searchTerm } });
      setShowQuickResults(false);
    }
  };

  const handleQuickResultClick = (userId) => {
    setShowQuickResults(false);
    setSearchTerm('');
    if (userId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  const handleLogout = () => {
    // In a real app, you'd clear authentication tokens here
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setShowMobileMenu(false);
  };

  const handleHamburgerClick = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  useEffect(() => {
    if (user && !loading) {
      fetchUserAvatar();
      fetchCurrentUserId();
    }
  }, [user, loading]);

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();

      // Set up real-time subscription for notifications
      const notificationsSubscription = supabase
        .channel('notifications')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${currentUserId}`
          },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsSubscription);
      };
    }
  }, [currentUserId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications) {
        const notificationsContainer = event.target.closest('.notifications-container');
        if (!notificationsContainer) {
          setShowNotifications(false);
        }
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when notifications are open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showNotifications]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.trim().length < 1) {
        setQuickResults([]);
        return;
      }

      try {
        const query = searchTerm.trim().toLowerCase();
        const isHandleSearch = query.startsWith('@');
        const searchTermClean = isHandleSearch ? query.slice(1) : query;

        let queryBuilder = supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url');

        if (isHandleSearch) {
          queryBuilder = queryBuilder.ilike('username', `%${searchTermClean}%`);
        } else {
          queryBuilder = queryBuilder.or(`full_name.ilike.%${searchTermClean}%,username.ilike.%${searchTermClean}%`);
        }

        const { data, error } = await queryBuilder.limit(3);

        if (error) throw error;
        setQuickResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setQuickResults([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const fetchCurrentUserId = async () => {
    try {
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUserAvatar = async () => {
    try {
      // Check localStorage first for cached profile
      const cachedProfile = localStorage.getItem('userProfile');
      if (cachedProfile) {
        const parsedProfile = JSON.parse(cachedProfile);
        setAvatarUrl(parsedProfile.profilePicture || null);
      }

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .limit(1);

        const profile = profileData && profileData.length > 0 ? profileData[0] : null;
        const avatarUrl = profile?.avatar_url || null;
        setAvatarUrl(avatarUrl);

        // Update the cached profile with latest avatar
        if (cachedProfile) {
          const parsedProfile = JSON.parse(cachedProfile);
          parsedProfile.profilePicture = avatarUrl;
          localStorage.setItem('userProfile', JSON.stringify(parsedProfile));
        }
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notification.id);

        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Navigate based on notification type
      if (notification.post_id) {
        navigate(`/post/${notification.post_id}`);
      } else if (notification.type === 'follow' && notification.actor_id) {
        navigate(`/profile/${notification.actor_id}`);
      }

      setShowNotifications(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUserId)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.actor_name} liked your post`;
      case 'comment':
        return `${notification.actor_name} commented on your post`;
      case 'follow':
        return `${notification.actor_name} started following you`;
      case 'tag':
        return `${notification.actor_name} tagged you in a post`;
      default:
        return 'New notification';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'tag':
        return '🏷️';
      default:
        return '🔔';
    }
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifTime.toLocaleDateString();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <button className="hamburger-btn" onClick={handleHamburgerClick}>
            <span className="hamburger-icon">☰</span>
          </button>
          <Link to="/feed" className="navbar-logo">
            <span className="logo-icon">🗺️</span>
            <span className="logo-text">TripLogger</span>
          </Link>
        </div>

        <div className="navbar-center">
          <div className="navbar-search">
            <button
              className="mobile-search-button"
              onClick={() => navigate('/search')}
              aria-label="Open search"
            >
              🔍
            </button>
            <input
              type="search"
              name="query"
              id="query"
              inputMode="search"
              role="searchbox"
              placeholder="Search users & places"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onKeyDown={handleSearchKeyDown}
              onBlur={() => setTimeout(() => setShowQuickResults(false), 200)}
              className="navbar-search-input"
              autoComplete="off"
            />
            <span className="navbar-search-icon">🔍</span>

            {showQuickResults && (quickResults.length > 0 || placeResults.length > 0) && (
              <div className="quick-results-dropdown">
                {quickResults.length > 0 && (
                  <>
                    <div className="results-group-header">👤 Users</div>
                    {quickResults.map((user) => (
                      <div
                        key={user.id}
                        className="quick-result-item"
                        onClick={() => handleQuickResultClick(user.id)}
                      >
                        <div className="quick-result-avatar">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name || user.username} />
                          ) : (
                            <div className="quick-avatar-placeholder">
                              {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="quick-result-info">
                          <div className="quick-result-name">
                            {user.full_name || user.username || 'User'}
                          </div>
                          {user.username && (
                            <div className="quick-result-username">@{user.username}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {placeResults.length > 0 && (
                  <>
                    {quickResults.length > 0 && <div className="results-divider"></div>}
                    <div className="results-group-header">📍 Places</div>
                    {placeResults.map((place) => (
                      <div
                        key={place.place_id}
                        className="quick-result-item"
                        onClick={() => {
                          setShowQuickResults(false);
                          navigate(`/place/${place.place_id}`);
                        }}
                      >
                        <div className="quick-result-avatar place-icon">
                          📍
                        </div>
                        <div className="quick-result-info">
                          <div className="quick-result-name">
                            {place.structured_formatting.main_text}
                          </div>
                          <div className="quick-result-username">
                            {place.structured_formatting.secondary_text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {(quickResults.length > 0 || placeResults.length > 0) && (
                  <div className="quick-results-footer" onClick={() => {
                    navigate('/search', { state: { query: searchTerm } });
                    setShowQuickResults(false);
                  }}>
                    Show all results →
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-right">
          <button className="nav-action-btn theme-toggle" onClick={toggleTheme}>
            <span className="action-icon">{isDark ? '☀️' : '🌙'}</span>
          </button>

          {!loading && user ? (
            <>
              <div className="notifications-container">
                <button
                  className="nav-action-btn notifications-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <span className="action-icon">🔔</span>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <button className="mark-read-btn" onClick={markAllAsRead}>
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="notifications-list">
                      {notifications.length > 0 ? (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="notification-icon">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="notification-content">
                              <p className="notification-text">
                                {getNotificationText(notification)}
                              </p>
                              <span className="notification-time">
                                {formatNotificationTime(notification.created_at)}
                              </span>
                            </div>
                            {!notification.read && <div className="unread-dot"></div>}
                          </div>
                        ))
                      ) : (
                        <div className="notifications-empty">
                          <span className="empty-icon">🔔</span>
                          <p>No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="user-menu">
                <div className="user-avatar" onClick={handleProfileClick}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="navbar-avatar-image" />
                  ) : (
                    '👤'
                  )}
                </div>
                <div className="dropdown">
                  <Link to="/profile" className="profile-option">
                    👤 Profile
                  </Link>
                  <button onClick={handleLogout} className="logout-option">
                    🚪 Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link to="/login" className="sign-in-btn">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {showMobileMenu && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="mobile-menu-close" onClick={() => setShowMobileMenu(false)}>✕</button>

            <Link to="/bookmarks" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              🔖 Bookmarks
            </Link>
            <Link to="/settings" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
              ⚙️ Settings
            </Link>

            <div className="mobile-menu-divider"></div>

            <button className="mobile-menu-item logout" onClick={() => { handleLogout(); setShowMobileMenu(false); }}>
              🚪 Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;