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
  const [followRequests, setFollowRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState(new Set());

  useEffect(() => {
    if (user && !loading) {
      fetchFollowRequests();

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
        supabase.removeChannel(requestsSubscription);
      };
    }
  }, [user, loading]);

  const fetchFollowRequests = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
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
              <h2>Sign in to view follow requests</h2>
              <p>You need to be signed in to manage follow requests.</p>
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
          <h1 className="page-title">Follow Requests</h1>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner">⏳</div>
              <p>Loading requests...</p>
            </div>
          ) : followRequests.length > 0 ? (
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
      </div>
    </>
  );
}

export default FollowRequests;
