import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';
import { useLoadScript } from '@react-google-maps/api';
import './Navbar.css';

const libraries = ['places'];

function Navbar({ onSearchChange, onSidebarToggle }) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [quickResults, setQuickResults] = useState([]);
  const [showQuickResults, setShowQuickResults] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [placeResults, setPlaceResults] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [followRequestCount, setFollowRequestCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

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

  useEffect(() => {
    if (user && !loading) {
      fetchUserAvatar();
      fetchCurrentUserId();
    }
  }, [user, loading]);

  useEffect(() => {
    if (currentUserId) {
      fetchNotificationCount();
      fetchFollowRequestCount();
      fetchUnreadMessageCount();

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
            // Don't count follow_request notifications
            if (payload.new.type !== 'follow_request') {
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .subscribe();

      // Set up real-time subscription for follow requests
      const followRequestsSubscription = supabase
        .channel('follow_requests_count')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'follow_requests',
            filter: `requested_id=eq.${currentUserId}`
          },
          () => {
            fetchFollowRequestCount();
          }
        )
        .subscribe();

      // Set up real-time subscription for direct messages
      const messagesSubscription = supabase
        .channel('navbar_direct_messages')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages'
          },
          (payload) => {
            // Only count if message is not from current user
            if (payload.new.sender_id !== currentUserId) {
              fetchUnreadMessageCount();
            }
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'direct_messages'
          },
          () => {
            // Refresh count when messages are marked as read
            fetchUnreadMessageCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsSubscription);
        supabase.removeChannel(followRequestsSubscription);
        supabase.removeChannel(messagesSubscription);
      };
    }
  }, [currentUserId]);

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

  const fetchNotificationCount = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('read', false)
        .neq('type', 'follow_request'); // Exclude follow_request notifications

      if (error) throw error;

      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const fetchFollowRequestCount = async () => {
    try {
      const { data, error } = await supabase
        .from('follow_requests')
        .select('id', { count: 'exact', head: true })
        .eq('requested_id', currentUserId)
        .eq('status', 'pending');

      if (error) throw error;

      setFollowRequestCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching follow request count:', error);
    }
  };

  const fetchUnreadMessageCount = async () => {
    try {
      // First get all conversations for current user
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

      if (convError) {
        if (convError.code === 'PGRST204' || convError.code === 'PGRST116') {
          setUnreadMessageCount(0);
          return;
        }
        throw convError;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setUnreadMessageCount(0);
        return;
      }

      const conversationIds = conversationsData.map(c => c.id);

      // Then count unread messages in those conversations
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', currentUserId)
        .eq('read', false);

      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST116') {
          setUnreadMessageCount(0);
          return;
        }
        throw error;
      }

      console.log('Unread message count:', count);
      setUnreadMessageCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      setUnreadMessageCount(0);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/feed" className="navbar-logo">
            <span className="logo-icon">🗺️</span>
            <span className="logo-text">TripTrail</span>
          </Link>
        </div>

        <div className="navbar-center">
          {!loading && user && (
            <nav className="navbar-menu">
              <Link to="/feed" className="nav-menu-item">
                <span className="nav-icon">🏠</span>
                <span className="nav-text">Home</span>
              </Link>
              <Link to="/search" className="nav-menu-item">
                <span className="nav-icon">🔍</span>
                <span className="nav-text">Search</span>
              </Link>
              <Link to="/planner" className="nav-menu-item">
                <span className="nav-icon">🗓️</span>
                <span className="nav-text">Planner</span>
              </Link>
              <Link to="/profile" className="nav-menu-item nav-profile-item">
                <div className="nav-profile-avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="nav-avatar-image" />
                  ) : (
                    <span className="nav-icon">👤</span>
                  )}
                </div>
                <span className="nav-text">Profile</span>
              </Link>
            </nav>
          )}
        </div>

        <div className="navbar-right">
          {!loading && user ? (
            <>
              <button
                className="nav-action-btn messages-btn"
                onClick={() => navigate('/messages')}
                title="Messages"
              >
                <span className="action-icon">💬</span>
                {unreadMessageCount > 0 && (
                  <span className="notification-badge">{unreadMessageCount > 9 ? '9+' : unreadMessageCount}</span>
                )}
              </button>
              <button
                className="nav-action-btn notifications-btn"
                onClick={() => navigate('/follow-requests')}
                title="Notifications"
              >
                <span className="action-icon">🔔</span>
                {(unreadCount + followRequestCount) > 0 && (
                  <span className="notification-badge">{(unreadCount + followRequestCount) > 9 ? '9+' : (unreadCount + followRequestCount)}</span>
                )}
              </button>
              <button
                className="nav-action-btn settings-btn"
                onClick={() => navigate('/settings')}
                title="Settings"
              >
                <span className="action-icon">⚙️</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="sign-in-btn">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;