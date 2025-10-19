import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import './TripPlanDetails.css';

function TripPlanDetails() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [tripPlan, setTripPlan] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const messagesEndRef = React.useRef(null);

  // Itinerary states
  const [travels, setTravels] = useState([]);
  const [stays, setStays] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [showStayModal, setShowStayModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('attractions'); // 'attractions', 'travel', 'stays', 'activities'

  // Form states
  const [travelForm, setTravelForm] = useState({
    travel_type: 'flight',
    from_location: '',
    to_location: '',
    departure_date: '',
    arrival_date: '',
    confirmation_number: '',
    notes: ''
  });

  const [stayForm, setStayForm] = useState({
    stay_type: 'hotel',
    name: '',
    location: '',
    check_in_date: '',
    check_out_date: '',
    confirmation_number: '',
    notes: ''
  });

  const [activityForm, setActivityForm] = useState({
    activity_type: 'tour',
    name: '',
    location: '',
    scheduled_date: '',
    duration_minutes: '',
    confirmation_number: '',
    notes: ''
  });

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user && planId) {
      fetchTripPlanDetails();
      fetchMessages();
      fetchTravels();
      fetchStays();
      fetchActivities();

      // Set up real-time subscription
      const channel = supabase
        .channel(`trip_plan_messages:${planId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'trip_plan_messages',
            filter: `trip_plan_id=eq.${planId}`
          },
          async (payload) => {
            console.log('New message received:', payload);
            // Fetch the user profile for the new message
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            const messageWithProfile = {
              ...payload.new,
              profiles: profileData
            };

            setMessages((prevMessages) => [...prevMessages, messageWithProfile]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'trip_plan_messages',
            filter: `trip_plan_id=eq.${planId}`
          },
          (payload) => {
            console.log('Message deleted:', payload);
            // Remove the deleted message from state
            setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== payload.old.id));
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [planId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchTripPlanDetails = async () => {
    try {
      setLoading(true);

      // Fetch trip plan
      const { data: planData, error: planError } = await supabase
        .from('trip_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) throw planError;
      setTripPlan(planData);

      // Fetch attractions
      const { data: attractionsData, error: attractionsError } = await supabase
        .from('planned_attractions')
        .select('*')
        .eq('trip_plan_id', planId)
        .order('created_at', { ascending: false });

      if (attractionsError) throw attractionsError;
      setAttractions(attractionsData || []);

      // Fetch collaborators with profile data
      const { data: collabData, error: collabError } = await supabase
        .from('trip_collaborators')
        .select(`
          id,
          role,
          user_id
        `)
        .eq('trip_plan_id', planId);

      if (collabError) throw collabError;

      // Fetch profile data for each collaborator
      const collabsWithProfiles = await Promise.all(
        (collabData || []).map(async (collab) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', collab.user_id)
            .single();

          return {
            ...collab,
            profiles: profileData
          };
        })
      );

      // Sort collaborators so owner appears first
      const sortedCollaborators = collabsWithProfiles.sort((a, b) => {
        if (a.role === 'owner') return -1;
        if (b.role === 'owner') return 1;
        return 0;
      });

      setCollaborators(sortedCollaborators);

    } catch (error) {
      console.error('Error fetching trip plan details:', error);
      navigate('/planner');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDurationText = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', user.id)
        .limit(10);

      if (error) throw error;
      setUserSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUserSearchResults([]);
    }
  };

  const handleUsernameChange = (value) => {
    setInviteUsername(value);
    setSelectedUser(null);
    searchUsers(value);
  };

  const selectUserFromSearch = (selectedUser) => {
    setSelectedUser(selectedUser);
    setInviteUsername(selectedUser.username);
    setUserSearchResults([]);
  };

  const openInviteModal = () => {
    setShowInviteModal(true);
    setInviteUsername('');
    setSelectedUser(null);
    setUserSearchResults([]);
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      alert('Please select a user from the search results');
      return;
    }

    // Check if trying to add yourself
    if (selectedUser.id === user.id) {
      alert('You cannot add yourself as a collaborator. You are already the owner!');
      return;
    }

    try {
      // Check if user is already a collaborator by querying the database
      const { data: existingCollab, error: checkError } = await supabase
        .from('trip_collaborators')
        .select('id')
        .eq('trip_plan_id', planId)
        .eq('user_id', selectedUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking collaborator:', checkError);
      }

      if (existingCollab) {
        alert(`${selectedUser.username} is already a member of this trip plan!`);
        return;
      }
      // Add directly to collaborators with default 'editor' role
      const { error: collabError } = await supabase
        .from('trip_collaborators')
        .insert([{
          trip_plan_id: planId,
          user_id: selectedUser.id,
          role: 'editor',
          invited_by: user.id
        }]);

      if (collabError) throw collabError;

      // Get current user's profile for the notification
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

      // Send notification to the added user
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: selectedUser.id,
          type: 'trip_added',
          title: 'Added to Trip Plan',
          message: `${currentUserProfile?.username || 'Someone'} added you to "${tripPlan.name}"`,
          link: `/planner/${planId}`,
          read: false
        }]);

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        // Don't fail the whole operation if notification fails
      }

      alert(`${selectedUser.username} has been added to the trip plan!`);
      setShowInviteModal(false);
      setInviteUsername('');
      setSelectedUser(null);
      setUserSearchResults([]);

      // Refresh trip plan details to show new collaborator
      await fetchTripPlanDetails();
    } catch (error) {
      console.error('Error adding collaborator:', error);
      if (error.code === '23505') {
        alert(`${selectedUser.username} is already a member of this trip plan!`);
      } else {
        alert('Failed to add collaborator. Please try again.');
      }
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trip_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      alert('Collaborator removed successfully');
      // Refresh collaborators
      await fetchTripPlanDetails();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Failed to remove collaborator');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const { data: messagesData, error } = await supabase
        .from('trip_plan_messages')
        .select('*')
        .eq('trip_plan_id', planId)
        .order('created_at', { ascending: true });

      if (error) {
        // If table doesn't exist yet or schema cache issue, silently fail
        if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === 'PGRST200') {
          console.warn('Chat table not yet properly configured in database. Please run the SQL migration and reload the schema cache.');
          setMessages([]);
          return;
        }
        throw error;
      }

      // Fetch profile data for each message
      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', msg.user_id)
            .single();

          return {
            ...msg,
            profiles: profileData
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('trip_plan_messages')
        .insert([{
          trip_plan_id: planId,
          user_id: user.id,
          message: newMessage.trim()
        }]);

      if (error) {
        // If table doesn't exist yet, show helpful message
        if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === 'PGRST200') {
          alert('Chat feature not yet enabled. Please run the database migration in Supabase and reload the schema cache.');
          return;
        }
        throw error;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trip_plan_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // Remove message from local state
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  // Fetch functions for itinerary items
  const fetchTravels = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_travels')
        .select('*')
        .eq('trip_plan_id', planId)
        .order('departure_date', { ascending: true });

      if (error) throw error;
      setTravels(data || []);
    } catch (error) {
      console.error('Error fetching travels:', error);
    }
  };

  const fetchStays = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_stays')
        .select('*')
        .eq('trip_plan_id', planId)
        .order('check_in_date', { ascending: true });

      if (error) throw error;
      setStays(data || []);
    } catch (error) {
      console.error('Error fetching stays:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_activities')
        .select('*')
        .eq('trip_plan_id', planId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  // Travel CRUD functions
  const handleSaveTravel = async () => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('trip_travels')
          .update({ ...travelForm, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trip_travels')
          .insert([{
            ...travelForm,
            trip_plan_id: planId,
            user_id: user.id
          }]);

        if (error) throw error;
      }

      setShowTravelModal(false);
      setEditingItem(null);
      setTravelForm({
        travel_type: 'flight',
        from_location: '',
        to_location: '',
        departure_date: '',
        arrival_date: '',
        confirmation_number: '',
        notes: ''
      });
      fetchTravels();
    } catch (error) {
      console.error('Error saving travel:', error);
      alert('Failed to save travel entry');
    }
  };

  const handleDeleteTravel = async (id) => {
    if (!window.confirm('Are you sure you want to delete this travel entry?')) return;

    try {
      const { error } = await supabase
        .from('trip_travels')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTravels();
    } catch (error) {
      console.error('Error deleting travel:', error);
      alert('Failed to delete travel entry');
    }
  };

  // Stay CRUD functions
  const handleSaveStay = async () => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('trip_stays')
          .update({ ...stayForm, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trip_stays')
          .insert([{
            ...stayForm,
            trip_plan_id: planId,
            user_id: user.id
          }]);

        if (error) throw error;
      }

      setShowStayModal(false);
      setEditingItem(null);
      setStayForm({
        stay_type: 'hotel',
        name: '',
        location: '',
        check_in_date: '',
        check_out_date: '',
        confirmation_number: '',
        notes: ''
      });
      fetchStays();
    } catch (error) {
      console.error('Error saving stay:', error);
      alert('Failed to save stay entry');
    }
  };

  const handleDeleteStay = async (id) => {
    if (!window.confirm('Are you sure you want to delete this stay entry?')) return;

    try {
      const { error } = await supabase
        .from('trip_stays')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchStays();
    } catch (error) {
      console.error('Error deleting stay:', error);
      alert('Failed to delete stay entry');
    }
  };

  // Activity CRUD functions
  const handleSaveActivity = async () => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('trip_activities')
          .update({ ...activityForm, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error} = await supabase
          .from('trip_activities')
          .insert([{
            ...activityForm,
            trip_plan_id: planId,
            user_id: user.id
          }]);

        if (error) throw error;
      }

      setShowActivityModal(false);
      setEditingItem(null);
      setActivityForm({
        activity_type: 'tour',
        name: '',
        location: '',
        scheduled_date: '',
        duration_minutes: '',
        confirmation_number: '',
        notes: ''
      });
      fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity entry');
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity entry?')) return;

    try {
      const { error } = await supabase
        .from('trip_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity entry');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="trip-plan-details-loading">
          <div className="loading-spinner">🗺️</div>
          <p>Loading trip plan...</p>
        </div>
      </>
    );
  }

  if (!tripPlan) {
    return (
      <>
        <Navbar />
        <div className="trip-plan-details-error">
          <p>Trip plan not found</p>
        </div>
      </>
    );
  }

  const isOwner = tripPlan.user_id === user?.id;

  return (
    <>
      <Navbar />
      <div className="trip-plan-details">
        <button
          className="back-btn"
          onClick={() => navigate('/planner')}
          title="Back to Planner"
        >
          ←
        </button>

        <button
          className="toggle-chat-btn"
          onClick={() => setShowChat(!showChat)}
          title={showChat ? "Hide chat" : "Show chat"}
        >
          {showChat ? '💬 Hide Chat' : '💬 Show Chat'}
        </button>

        <div className="trip-plan-details-wrapper">
          <div className="trip-plan-details-container">
          {/* Hero Section */}
          <div className="trip-plan-hero">
            <div className="trip-plan-hero-content">
              <h1 className="trip-plan-hero-title">🗺️ {tripPlan.name}</h1>
              <div className="trip-plan-hero-info">
                {tripPlan.destination && (
                  <div className="trip-plan-hero-location">📍 {tripPlan.destination}</div>
                )}
                {(tripPlan.start_date || tripPlan.end_date) && (
                  <div className="trip-plan-hero-dates">
                    📅 {formatDate(tripPlan.start_date)}
                    {tripPlan.start_date && tripPlan.end_date && ' - '}
                    {formatDate(tripPlan.end_date)}
                    {getDurationText(tripPlan.start_date, tripPlan.end_date) &&
                      ` (${getDurationText(tripPlan.start_date, tripPlan.end_date)})`
                    }
                  </div>
                )}
              </div>
              {isOwner ? (
                <button className="invite-btn-hero" onClick={openInviteModal}>
                  👥 Invite Collaborators
                </button>
              ) : (
                <div className="shared-indicator">
                  👥 Shared trip plan
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          {tripPlan.description && (
            <div className="trip-plan-section">
              <h2>📝 Description</h2>
              <div className="trip-plan-description-box">
                <p>{tripPlan.description}</p>
              </div>
            </div>
          )}

          {/* Attractions Section */}
          <div className="trip-plan-section">
            <h2>📍 Planned Attractions ({attractions.length})</h2>
            {attractions.length === 0 ? (
              <div className="empty-state">
                <p>No attractions added yet. Go back to the planner to add some!</p>
              </div>
            ) : (
              <div className="attractions-grid">
                {attractions.map((attraction) => (
                  <div key={attraction.id} className="attraction-card">
                    {attraction.place_photo_url && (
                      <div className="attraction-image">
                        <img src={attraction.place_photo_url} alt={attraction.name} />
                      </div>
                    )}
                    <div className="attraction-content">
                      <h3 className="attraction-name">{attraction.name}</h3>
                      {attraction.place_address && (
                        <p className="attraction-address">📍 {attraction.place_address}</p>
                      )}
                      {attraction.notes && (
                        <p className="attraction-notes">{attraction.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members Section */}
          <div className="trip-plan-section">
            <h2>👥 Members ({collaborators.length})</h2>
            <div className="collaborators-grid">
              {collaborators.map((collab) => (
                <div key={collab.id} className="collaborator-card">
                  <div className="collaborator-avatar">
                    {collab.profiles?.avatar_url ? (
                      <img src={collab.profiles.avatar_url} alt={collab.profiles.username} />
                    ) : (
                      <div className="avatar-placeholder">👤</div>
                    )}
                  </div>
                  <div className="collaborator-details">
                    <div className="collaborator-username">
                      @{collab.profiles?.username || 'User'}
                      {collab.user_id === user?.id && ' (You)'}
                    </div>
                    {collab.profiles?.full_name && (
                      <div className="collaborator-fullname">{collab.profiles.full_name}</div>
                    )}
                    <div className="collaborator-badge">
                      {collab.role === 'owner' ? '👑 Owner' : '✏️ Collaborator'}
                    </div>
                  </div>
                  {isOwner && collab.role !== 'owner' && (
                    <button
                      className="remove-collab-btn"
                      onClick={() => handleRemoveCollaborator(collab.id)}
                      title="Remove collaborator"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="trip-plan-stats">
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div className="stat-info">
                <div className="stat-number">{attractions.length}</div>
                <div className="stat-label">Attractions</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <div className="stat-number">{collaborators.length}</div>
                <div className="stat-label">Members</div>
              </div>
            </div>
            {tripPlan.start_date && tripPlan.end_date && (
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <div className="stat-number">
                    {getDurationText(tripPlan.start_date, tripPlan.end_date).split(' ')[0]}
                  </div>
                  <div className="stat-label">Days</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
        <div className="chat-panel">
          <div className="chat-header">
            <h3>Team Chat</h3>
            <div className="chat-members-count">
              {collaborators.length} member{collaborators.length !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="chat-messages">
            {loadingMessages ? (
              <div className="chat-loading">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.user_id === user?.id ? 'own-message' : 'other-message'}`}
                >
                  <div className="message-avatar">
                    {msg.profiles?.avatar_url ? (
                      <img src={msg.profiles.avatar_url} alt={msg.profiles.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {msg.profiles?.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-username">
                        {msg.user_id === user?.id ? 'You' : `@${msg.profiles?.username || 'User'}`}
                      </span>
                      <span className="message-time">{formatMessageTime(msg.created_at)}</span>
                      {msg.user_id === user?.id && (
                        <button
                          className="delete-message-btn"
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Delete message"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="message-text">{msg.message}</div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
              maxLength={500}
            />
            <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
              Send
            </button>
          </form>
        </div>
        )}
      </div>

        {/* Invite Collaborators Modal */}
        {showInviteModal && (
          <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>👥 Invite Collaborators</h2>
                <button className="modal-close" onClick={() => setShowInviteModal(false)}>✕</button>
              </div>

              <form onSubmit={handleSendInvite} className="invite-form">
                <div className="form-group">
                  <label>Search User by Username *</label>
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="Search by username or name..."
                    autoComplete="off"
                  />
                  {userSearchResults.length > 0 && (
                    <div className="user-search-results">
                      {userSearchResults.map((searchUser) => (
                        <div
                          key={searchUser.id}
                          className="user-search-item"
                          onClick={() => selectUserFromSearch(searchUser)}
                        >
                          <div className="user-search-avatar">
                            {searchUser.avatar_url ? (
                              <img src={searchUser.avatar_url} alt={searchUser.username} />
                            ) : (
                              <div className="avatar-placeholder">👤</div>
                            )}
                          </div>
                          <div className="user-search-info">
                            <div className="user-search-username">@{searchUser.username}</div>
                            {searchUser.full_name && (
                              <div className="user-search-fullname">{searchUser.full_name}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <div className="selected-user-badge">
                      ✓ Selected: @{selectedUser.username}
                    </div>
                  )}
                </div>

                <div className="invite-info-text">
                  ℹ️ Collaborators can view and edit this trip plan. They cannot invite others or delete the plan.
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn" disabled={!selectedUser}>
                    Add Collaborator
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default TripPlanDetails;
