import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { createFollowAcceptNotification } from './notificationHelpers';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import './FollowRequests.css';

function FollowRequests() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [followRequests, setFollowRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'requests'

  useEffect(() => {
    if (user && !loading) {
      fetchNotifications();
      fetchFollowRequests();

      // Set up real-time subscription for notifications
      const notificationsSubscription = supabase
        .channel('notifications')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
          }
        )
        .subscribe();

      // Set up real-time subscription for follow requests
      const requestsSubscription = supabase
        .channel('follow_requests')
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'follow_requests',
            filter: `requested_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              fetchFollowRequests();
            } else if (payload.eventType === 'DELETE') {
              setFollowRequests(prev => prev.filter(req => req.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsSubscription);
        supabase.removeChannel(requestsSubscription);
      };
    }
  }, [user, loading]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowRequests = async () => {
    try {
      const { data: requests, error } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('requested_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch requester profiles
      if (requests && requests.length > 0) {
        const requesterIds = requests.map(req => req.requester_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', requesterIds);

        if (profilesError) throw profilesError;

        // Merge profiles with requests
        const requestsWithProfiles = requests.map(req => {
          const profile = profiles.find(p => p.id === req.requester_id);
          return {
            ...req,
            requester_name: profile?.full_name || profile?.username || 'User',
            requester_username: profile?.username,
            requester_avatar: profile?.avatar_url
          };
        });

        setFollowRequests(requestsWithProfiles);
      } else {
        setFollowRequests([]);
      }
    } catch (error) {
      console.error('Error fetching follow requests:', error);
    }
  };

  const handleAccept = async (request) => {
    if (processingRequests.has(request.id)) return;

    setProcessingRequests(prev => new Set(prev).add(request.id));

    try {
      // Create the follow relationship
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: request.requester_id,
          following_id: user.id
        });

      if (followError) throw followError;

      // Update the request status
      const { error: updateError } = await supabase
        .from('follow_requests')
        .update({ status: 'accepted' })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Delete the request (or you can keep it for history)
      const { error: deleteError } = await supabase
        .from('follow_requests')
        .delete()
        .eq('id', request.id);

      if (deleteError) throw deleteError;

      // Get current user profile for notification
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single();

      const accepterName = profileData?.full_name || profileData?.username || 'User';

      // Create notification for the requester
      await createFollowAcceptNotification(request.requester_id, user.id, accepterName);

      // Remove from local state
      setFollowRequests(prev => prev.filter(req => req.id !== request.id));
    } catch (error) {
      console.error('Error accepting follow request:', error);
      alert('Failed to accept follow request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleReject = async (request) => {
    if (processingRequests.has(request.id)) return;

    setProcessingRequests(prev => new Set(prev).add(request.id));

    try {
      // Update the request status to rejected and delete it
      const { error: deleteError } = await supabase
        .from('follow_requests')
        .delete()
        .eq('id', request.id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setFollowRequests(prev => prev.filter(req => req.id !== request.id));
    } catch (error) {
      console.error('Error rejecting follow request:', error);
      alert('Failed to reject follow request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
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
      }

      // Navigate based on notification type
      if (notification.type === 'follow_request') {
        // Switch to requests tab
        setActiveTab('requests');
      } else if (notification.post_id) {
        navigate(`/post/${notification.post_id}`);
      } else if ((notification.type === 'follow' || notification.type === 'follow_accept') && notification.actor_id) {
        navigate(`/profile/${notification.actor_id}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'like':
        return `${notification.actor_name} liked your post`;
      case 'comment':
        return `${notification.actor_name} commented on your post`;
      case 'follow':
        return `${notification.actor_name} started following you`;
      case 'follow_request':
        return `${notification.actor_name} wants to follow you`;
      case 'follow_accept':
        return `${notification.actor_name} accepted your follow request`;
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
      case 'follow_request':
        return '👥';
      case 'follow_accept':
        return '✓';
      case 'tag':
        return '🏷️';
      default:
        return '🔔';
    }
  };

  const formatRequestTime = (timestamp) => {
    const now = new Date();
    const requestTime = new Date(timestamp);
    const diffMs = now - requestTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return requestTime.toLocaleDateString();
  };

  if (!loading && !user) {
    return (
      <>
        <Navbar />
        <div className="follow-requests-page">
          <div className="follow-requests-container">
            <div className="sign-in-prompt">
              <div className="sign-in-icon">🔒</div>
              <h2>Sign in to view notifications</h2>
              <p>You need to be signed in to view your notifications.</p>
              <button
                onClick={() => navigate('/login')}
                className="sign-in-btn"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="follow-requests-page">
        <div className="follow-requests-container">
          <div className="notifications-header">
            <h1 className="page-title">Notifications</h1>
            {activeTab === 'all' && notifications.filter(n => !n.read).length > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Requests
              {followRequests.length > 0 && (
                <span className="tab-badge">{followRequests.length}</span>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <>
              {/* All Notifications Tab */}
              {activeTab === 'all' && (
                <div className="section">
                  {notifications.length > 0 ? (
                    <div className="requests-list">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`request-item notification-item ${!notification.read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="request-user-info">
                            <div className="notification-icon-circle">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="request-details">
                              <div className="request-name">{getNotificationText(notification)}</div>
                              <div className="request-time">{formatRequestTime(notification.created_at)}</div>
                            </div>
                          </div>
                          {!notification.read && <div className="unread-indicator">•</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">🔔</div>
                      <h3>No notifications</h3>
                      <p>When you get notifications, they will appear here.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="section">
                  {followRequests.length > 0 ? (
                    <div className="requests-list">
                      {followRequests.map(request => (
                        <div key={request.id} className="request-item">
                          <div
                            className="request-user-info"
                            onClick={() => handleProfileClick(request.requester_id)}
                          >
                            <div className="request-avatar">
                              {request.requester_avatar ? (
                                <img src={request.requester_avatar} alt={request.requester_name} />
                              ) : (
                                <div className="avatar-placeholder">👤</div>
                              )}
                            </div>
                            <div className="request-details">
                              <div className="request-name">{request.requester_name}</div>
                              {request.requester_username && (
                                <div className="request-username">@{request.requester_username}</div>
                              )}
                              <div className="request-time">{formatRequestTime(request.created_at)}</div>
                            </div>
                          </div>
                          <div className="request-actions">
                            <button
                              className="accept-btn"
                              onClick={() => handleAccept(request)}
                              disabled={processingRequests.has(request.id)}
                            >
                              ✓ Accept
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleReject(request)}
                              disabled={processingRequests.has(request.id)}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <h3>No follow requests</h3>
                      <p>When someone requests to follow you, they will appear here.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default FollowRequests;
