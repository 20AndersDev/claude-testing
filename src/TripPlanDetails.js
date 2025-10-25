import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useLoadScript } from '@react-google-maps/api';
import Navbar from './Navbar';
import { getCountryCode } from './utils/countryHelpers';
import './TripPlanDetails.css';

// Define libraries outside component to prevent reloading
const GOOGLE_MAPS_LIBRARIES = ['places'];

function TripPlanDetails() {
  const { planId } = useParams();
  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_PLACES_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [tripPlan, setTripPlan] = useState(null);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    country: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const messagesEndRef = React.useRef(null);

  const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
    "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
    "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
    "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad",
    "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea",
    "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
    "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
    "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
    "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
    "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia",
    "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova",
    "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands",
    "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan",
    "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
    "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone",
    "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
    "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania",
    "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
    "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];

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
    notes: '',
    url: ''
  });

  const [stayForm, setStayForm] = useState({
    stay_type: 'hotel',
    name: '',
    location: '',
    check_in_date: '',
    check_out_date: '',
    confirmation_number: '',
    notes: '',
    url: ''
  });

  const [activityForm, setActivityForm] = useState({
    activity_type: 'tour',
    name: '',
    location: '',
    scheduled_date: '',
    duration_minutes: '',
    confirmation_number: '',
    notes: '',
    url: ''
  });

  // Place search suggestions
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
  const [searchingPlace, setSearchingPlace] = useState(false);

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

      // Set up real-time subscription for messages and collaborators
      const channel = supabase
        .channel(`trip_plan_${planId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'trip_plan_messages',
            filter: `trip_plan_id=eq.${planId}`
          },
          async (payload) => {
            console.log('🔔 NEW MESSAGE EVENT RECEIVED!', payload);
            console.log('Message details:', {
              id: payload.new.id,
              message: payload.new.message,
              user_id: payload.new.user_id,
              trip_plan_id: payload.new.trip_plan_id
            });

            // Fetch the user profile for the new message
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
            }

            const messageWithProfile = {
              ...payload.new,
              profiles: profileData
            };

            console.log('Adding message to state:', messageWithProfile);
            setMessages((prevMessages) => {
              console.log('Previous messages count:', prevMessages.length);

              // Check if message already exists (to prevent duplicates)
              const messageExists = prevMessages.some(msg => msg.id === messageWithProfile.id);
              if (messageExists) {
                console.log('⚠️ Message already exists in state, skipping duplicate');
                return prevMessages;
              }

              const newMessages = [...prevMessages, messageWithProfile];
              console.log('New messages count:', newMessages.length);
              return newMessages;
            });
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
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'trip_collaborators',
            filter: `trip_plan_id=eq.${planId}`
          },
          async (payload) => {
            console.log('New collaborator added:', payload);
            // Fetch the user profile for the new collaborator
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', payload.new.user_id)
              .single();

            const collaboratorWithProfile = {
              ...payload.new,
              profiles: profileData
            };

            setCollaborators((prevCollaborators) => [...prevCollaborators, collaboratorWithProfile]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'trip_collaborators',
            filter: `trip_plan_id=eq.${planId}`
          },
          (payload) => {
            console.log('Collaborator removed:', payload);
            // Remove the deleted collaborator from state
            setCollaborators((prevCollaborators) =>
              prevCollaborators.filter(collab => collab.id !== payload.old.id)
            );
          }
        )
        .subscribe((status) => {
          console.log('Real-time subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✓ Successfully subscribed to real-time updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('✗ Real-time subscription error');
          } else if (status === 'TIMED_OUT') {
            console.error('✗ Real-time subscription timed out');
          }
        });

      // Cleanup subscription on unmount
      return () => {
        console.log('Cleaning up realtime subscription');
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

      // Fetch the owner's profile first
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', planData.user_id)
        .single();

      // Create owner collaborator object
      const ownerCollab = {
        id: 'owner',
        role: 'owner',
        user_id: planData.user_id,
        profiles: ownerProfile
      };

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

      // Filter out owner from collaborators to prevent duplicates
      const filteredCollabs = collabsWithProfiles.filter(
        collab => collab.user_id !== planData.user_id
      );

      // Combine owner with other collaborators, ensuring owner is first
      const allCollaborators = [ownerCollab, ...filteredCollabs];

      setCollaborators(allCollaborators);

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

    console.log('Attempting to add collaborator:', selectedUser);
    console.log('Trip plan:', tripPlan);
    console.log('Current user:', user);

    try {
      // Check if trying to add the owner
      if (selectedUser.id === tripPlan.user_id) {
        alert(`${selectedUser.username} is the owner of this trip plan and is already a member!`);
        return;
      }

      // Check if trying to add yourself (if you're the owner)
      if (selectedUser.id === user.id) {
        alert('You cannot add yourself as a collaborator!');
        return;
      }

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

      console.log('Existing collaborator check:', existingCollab);

      if (existingCollab) {
        alert(`${selectedUser.username} is already a member of this trip plan!`);
        return;
      }

      console.log('Inserting new collaborator...');

      // Add directly to collaborators with default 'editor' role
      const { data: insertData, error: collabError } = await supabase
        .from('trip_collaborators')
        .insert([{
          trip_plan_id: planId,
          user_id: selectedUser.id,
          role: 'editor',
          invited_by: user.id
        }])
        .select();

      console.log('Insert result:', { data: insertData, error: collabError });

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

    console.log('📤 Sending message:', newMessage.trim());
    console.log('Trip Plan ID:', planId);
    console.log('User ID:', user.id);

    try {
      const { data, error } = await supabase
        .from('trip_plan_messages')
        .insert([{
          trip_plan_id: planId,
          user_id: user.id,
          message: newMessage.trim()
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error inserting message:', error);
        // If table doesn't exist yet, show helpful message
        if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === 'PGRST200') {
          alert('Chat feature not yet enabled. Please run the database migration in Supabase and reload the schema cache.');
          return;
        }
        throw error;
      }

      console.log('✅ Message inserted successfully:', data);

      // Fetch the user profile for the new message
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      // Manually add the message to state (for immediate feedback)
      const messageWithProfile = {
        ...data,
        profiles: profileData
      };

      console.log('Adding own message to UI');
      setMessages((prevMessages) => [...prevMessages, messageWithProfile]);
      setNewMessage('');

      console.log('🔊 Real-time subscription should now broadcast this INSERT to other users');
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

      if (error) {
        // If table doesn't exist, silently set empty array
        if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === 'PGRST200') {
          console.log('trip_travels table not found - itinerary feature not enabled');
          setTravels([]);
          return;
        }
        throw error;
      }
      setTravels(data || []);
    } catch (error) {
      console.error('Error fetching travels:', error);
      setTravels([]);
    }
  };

  const fetchStays = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_stays')
        .select('*')
        .eq('trip_plan_id', planId)
        .order('check_in_date', { ascending: true });

      if (error) {
        // If table doesn't exist, silently set empty array
        if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === 'PGRST200') {
          console.log('trip_stays table not found - itinerary feature not enabled');
          setStays([]);
          return;
        }
        throw error;
      }
      setStays(data || []);
    } catch (error) {
      console.error('Error fetching stays:', error);
      setStays([]);
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_activities')
        .select('*')
        .eq('trip_plan_id', planId)
        .order('scheduled_date', { ascending: true });

      if (error) {
        // If table doesn't exist, silently set empty array
        if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.code === 'PGRST200') {
          console.log('trip_activities table not found - itinerary feature not enabled');
          setActivities([]);
          return;
        }
        throw error;
      }
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
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
        notes: '',
        url: ''
      });
      fetchTravels();
    } catch (error) {
      console.error('Error saving travel:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      alert(`Failed to save travel entry: ${error.message || 'Unknown error'}`);
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
        notes: '',
        url: ''
      });
      fetchStays();
    } catch (error) {
      console.error('Error saving stay:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      alert(`Failed to save stay entry: ${error.message || 'Unknown error'}`);
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
        notes: '',
        url: ''
      });
      fetchActivities();
    } catch (error) {
      console.error('Error saving activity:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      alert(`Failed to save activity entry: ${error.message || 'Unknown error'}`);
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

  // Trip Plan Edit handlers
  const openEditModal = () => {
    setEditForm({
      name: tripPlan.name || '',
      country: tripPlan.country || '',
      start_date: tripPlan.start_date || '',
      end_date: tripPlan.end_date || '',
      description: tripPlan.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateTripPlan = async () => {
    try {
      const { error } = await supabase
        .from('trip_plans')
        .update({
          name: editForm.name,
          country: editForm.country,
          start_date: editForm.start_date || null,
          end_date: editForm.end_date || null,
          description: editForm.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;

      // Update local state
      setTripPlan({
        ...tripPlan,
        name: editForm.name,
        country: editForm.country,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
        description: editForm.description
      });

      setShowEditModal(false);
      alert('Trip plan updated successfully!');
    } catch (error) {
      console.error('Error updating trip plan:', error);
      alert('Failed to update trip plan. Please try again.');
    }
  };

  // Google Places search and details
  const searchPlaces = async (query, types = []) => {
    if (!isLoaded || !window.google || !window.google.maps || !window.google.maps.places) {
      console.log('Google Maps not loaded yet');
      return;
    }

    if (!query || query.trim().length < 2) {
      setPlaceSuggestions([]);
      setShowPlaceSuggestions(false);
      return;
    }

    setSearchingPlace(true);

    try {
      const request = {
        input: query,
        ...(types.length > 0 && { includedPrimaryTypes: types }),
        language: 'en',
      };

      const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      if (suggestions && suggestions.length > 0) {
        const formattedResults = suggestions.slice(0, 5).map(suggestion => {
          const placePrediction = suggestion.placePrediction;
          return {
            place_id: placePrediction?.placeId || Math.random().toString(),
            name: placePrediction?.structuredFormat?.mainText?.text || placePrediction?.text?.text || '',
            address: placePrediction?.structuredFormat?.secondaryText?.text || ''
          };
        });
        setPlaceSuggestions(formattedResults);
        setShowPlaceSuggestions(true);
      } else {
        setPlaceSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      // Fallback to old AutocompleteService
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
            ...(types.length > 0 && { types: types })
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const formattedResults = predictions.slice(0, 5).map(prediction => ({
                place_id: prediction.place_id,
                name: prediction.structured_formatting?.main_text || prediction.description,
                address: prediction.structured_formatting?.secondary_text || ''
              }));
              setPlaceSuggestions(formattedResults);
              setShowPlaceSuggestions(true);
            }
          }
        );
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    } finally {
      setSearchingPlace(false);
    }
  };

  const fetchPlaceDetails = async (placeId, formType) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    return new Promise((resolve, reject) => {
      const map = new window.google.maps.Map(document.createElement('div'));
      const service = new window.google.maps.places.PlacesService(map);

      service.getDetails(
        {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'website', 'formatted_phone_number', 'international_phone_number']
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error('Failed to fetch place details'));
          }
        }
      );
    });
  };

  const handlePlaceSelection = async (place, formType) => {
    setShowPlaceSuggestions(false);
    setPlaceSuggestions([]);

    try {
      const placeDetails = await fetchPlaceDetails(place.place_id, formType);

      if (formType === 'travel') {
        setTravelForm(prev => ({
          ...prev,
          to_location: placeDetails.name || place.name,
          url: placeDetails.website || prev.url
        }));
      } else if (formType === 'stay') {
        setStayForm(prev => ({
          ...prev,
          name: placeDetails.name || place.name,
          location: placeDetails.formatted_address || place.address,
          url: placeDetails.website || prev.url
        }));
      } else if (formType === 'activity') {
        setActivityForm(prev => ({
          ...prev,
          name: placeDetails.name || place.name,
          location: placeDetails.formatted_address || place.address,
          url: placeDetails.website || prev.url
        }));
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      // Fallback: use basic info from autocomplete
      if (formType === 'travel') {
        setTravelForm(prev => ({
          ...prev,
          to_location: place.name
        }));
      } else if (formType === 'stay') {
        setStayForm(prev => ({
          ...prev,
          name: place.name,
          location: place.address
        }));
      } else if (formType === 'activity') {
        setActivityForm(prev => ({
          ...prev,
          name: place.name,
          location: place.address
        }));
      }
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

        <div className="trip-plan-details-wrapper">
          <div className="trip-plan-details-container">
          {/* Hero Section */}
          <div className="trip-plan-hero">
            <div className="trip-plan-hero-content">
              <h1 className="trip-plan-hero-title">🗺️ {tripPlan.name}</h1>
              <div className="trip-plan-hero-info">
                {tripPlan.country && (
                  <div className="trip-plan-hero-location">
                    <span className={`fi fi-${getCountryCode(tripPlan.country)}`}></span>
                    {tripPlan.country}
                  </div>
                )}
                <div className="trip-plan-hero-dates">
                  {tripPlan.start_date || tripPlan.end_date ? (
                    <>
                      📅 {formatDate(tripPlan.start_date)}
                      {tripPlan.start_date && tripPlan.end_date && ' - '}
                      {formatDate(tripPlan.end_date)}
                      {getDurationText(tripPlan.start_date, tripPlan.end_date) &&
                        ` (${getDurationText(tripPlan.start_date, tripPlan.end_date)})`
                      }
                    </>
                  ) : (
                    <span className="no-dates-set">📅 No dates set</span>
                  )}
                </div>
              </div>
              {isOwner ? (
                <div className="hero-action-buttons">
                  <button className="edit-plan-btn-hero" onClick={openEditModal}>
                    ✏️ Edit Details
                  </button>
                  <button className="invite-btn-hero" onClick={openInviteModal}>
                    👥 Invite Collaborators
                  </button>
                </div>
              ) : (
                <div className="shared-indicator">
                  👥 Shared trip plan
                </div>
              )}
            </div>

            {/* Members Section in Header */}
            <div className="hero-members-section">
              <h3 className="hero-members-title">👥 Members ({collaborators.length})</h3>
              <div className="hero-collaborators-grid">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="hero-collaborator-card"
                    onClick={() => {
                      if (collab.user_id === user?.id) {
                        navigate('/profile');
                      } else {
                        navigate(`/profile/${collab.user_id}`);
                      }
                    }}
                    title={`View ${collab.profiles?.username || 'User'}'s profile`}
                  >
                    <div className="hero-collaborator-avatar">
                      {collab.profiles?.avatar_url ? (
                        <img src={collab.profiles.avatar_url} alt={collab.profiles.username} />
                      ) : (
                        <div className="avatar-placeholder">👤</div>
                      )}
                      {collab.role === 'owner' && (
                        <div className="hero-owner-badge">👑</div>
                      )}
                    </div>
                    <div className="hero-collaborator-name">
                      {collab.profiles?.username || 'User'}
                      {collab.user_id === user?.id && ' (You)'}
                    </div>
                    {isOwner && collab.role !== 'owner' && (
                      <button
                        className="hero-remove-collab-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCollaborator(collab.id);
                        }}
                        title="Remove collaborator"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
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

          {/* Travel Section */}
          <div className="trip-plan-section">
            <div className="section-header">
              <h2>✈️ Travel ({travels.length})</h2>
              <button className="add-item-btn" onClick={() => setShowTravelModal(true)}>
                ➕ Add Travel
              </button>
            </div>
            {travels.length === 0 ? (
              <div className="empty-state">
                <p>No travel bookings yet. Add flights, trains, buses, etc.</p>
              </div>
            ) : (
              <div className="itinerary-list">
                {travels.map((travel) => (
                  <div key={travel.id} className="itinerary-item">
                    <div className="itinerary-icon">
                      {travel.travel_type === 'flight' && '✈️'}
                      {travel.travel_type === 'train' && '🚆'}
                      {travel.travel_type === 'bus' && '🚌'}
                      {travel.travel_type === 'car' && '🚗'}
                      {travel.travel_type === 'other' && '🚚'}
                    </div>
                    <div className="itinerary-content">
                      <h4>{travel.from_location} → {travel.to_location}</h4>
                      <p className="itinerary-type">{travel.travel_type.charAt(0).toUpperCase() + travel.travel_type.slice(1)}</p>
                      {travel.departure_date && (
                        <p className="itinerary-date">
                          📅 Depart: {new Date(travel.departure_date).toLocaleString()}
                        </p>
                      )}
                      {travel.arrival_date && (
                        <p className="itinerary-date">
                          📅 Arrive: {new Date(travel.arrival_date).toLocaleString()}
                        </p>
                      )}
                      {travel.confirmation_number && (
                        <p className="itinerary-confirmation">🎫 {travel.confirmation_number}</p>
                      )}
                      {travel.url && (
                        <p className="itinerary-url">
                          🔗 <a href={travel.url} target="_blank" rel="noopener noreferrer">View Details</a>
                        </p>
                      )}
                      {travel.notes && (
                        <p className="itinerary-notes">💭 {travel.notes}</p>
                      )}
                    </div>
                    <div className="itinerary-actions">
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingItem(travel);
                          setTravelForm(travel);
                          setShowTravelModal(true);
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteTravel(travel.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stays Section */}
          <div className="trip-plan-section">
            <div className="section-header">
              <h2>🏨 Stays ({stays.length})</h2>
              <button className="add-item-btn" onClick={() => setShowStayModal(true)}>
                ➕ Add Stay
              </button>
            </div>
            {stays.length === 0 ? (
              <div className="empty-state">
                <p>No accommodations yet. Add hotels, hostels, rentals, etc.</p>
              </div>
            ) : (
              <div className="itinerary-list">
                {stays.map((stay) => (
                  <div key={stay.id} className="itinerary-item">
                    <div className="itinerary-icon">
                      {stay.stay_type === 'hotel' && '🏨'}
                      {stay.stay_type === 'hostel' && '🏠'}
                      {stay.stay_type === 'rental' && '🏡'}
                      {stay.stay_type === 'resort' && '🏖️'}
                      {stay.stay_type === 'other' && '🛏️'}
                    </div>
                    <div className="itinerary-content">
                      <h4>{stay.name}</h4>
                      <p className="itinerary-type">{stay.stay_type.charAt(0).toUpperCase() + stay.stay_type.slice(1)}</p>
                      {stay.location && (
                        <p className="itinerary-location">
                          📍 <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="location-link"
                          >
                            {stay.location}
                          </a>
                        </p>
                      )}
                      {stay.check_in_date && (
                        <p className="itinerary-date">
                          📅 Check-in: {new Date(stay.check_in_date).toLocaleDateString()}
                        </p>
                      )}
                      {stay.check_out_date && (
                        <p className="itinerary-date">
                          📅 Check-out: {new Date(stay.check_out_date).toLocaleDateString()}
                        </p>
                      )}
                      {stay.confirmation_number && (
                        <p className="itinerary-confirmation">🎫 {stay.confirmation_number}</p>
                      )}
                      {stay.url && (
                        <p className="itinerary-url">
                          🔗 <a href={stay.url} target="_blank" rel="noopener noreferrer">View Details</a>
                        </p>
                      )}
                      {stay.notes && (
                        <p className="itinerary-notes">💭 {stay.notes}</p>
                      )}
                    </div>
                    <div className="itinerary-actions">
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingItem(stay);
                          setStayForm(stay);
                          setShowStayModal(true);
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteStay(stay.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activities Section */}
          <div className="trip-plan-section">
            <div className="section-header">
              <h2>🎯 Activities ({activities.length})</h2>
              <button className="add-item-btn" onClick={() => setShowActivityModal(true)}>
                ➕ Add Activity
              </button>
            </div>
            {activities.length === 0 ? (
              <div className="empty-state">
                <p>No activities planned yet. Add tours, events, reservations, etc.</p>
              </div>
            ) : (
              <div className="itinerary-list">
                {activities.map((activity) => (
                  <div key={activity.id} className="itinerary-item">
                    <div className="itinerary-icon">
                      {activity.activity_type === 'tour' && '🗺️'}
                      {activity.activity_type === 'event' && '🎭'}
                      {activity.activity_type === 'restaurant' && '🍽️'}
                      {activity.activity_type === 'adventure' && '🏔️'}
                      {activity.activity_type === 'other' && '🎯'}
                    </div>
                    <div className="itinerary-content">
                      <h4>{activity.name}</h4>
                      <p className="itinerary-type">{activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}</p>
                      {activity.location && (
                        <p className="itinerary-location">
                          📍 <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="location-link"
                          >
                            {activity.location}
                          </a>
                        </p>
                      )}
                      {activity.scheduled_date && (
                        <p className="itinerary-date">
                          📅 {new Date(activity.scheduled_date).toLocaleString()}
                        </p>
                      )}
                      {activity.duration_minutes && (
                        <p className="itinerary-duration">⏱️ {activity.duration_minutes} minutes</p>
                      )}
                      {activity.confirmation_number && (
                        <p className="itinerary-confirmation">🎫 {activity.confirmation_number}</p>
                      )}
                      {activity.url && (
                        <p className="itinerary-url">
                          🔗 <a href={activity.url} target="_blank" rel="noopener noreferrer">View Details</a>
                        </p>
                      )}
                      {activity.notes && (
                        <p className="itinerary-notes">💭 {activity.notes}</p>
                      )}
                    </div>
                    <div className="itinerary-actions">
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingItem(activity);
                          setActivityForm(activity);
                          setShowActivityModal(true);
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteActivity(activity.id)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          {showChat && (
          <>
          <button
            className="toggle-chat-btn"
            onClick={() => setShowChat(false)}
            title="Hide chat"
          >
            ✕
          </button>
          <div className="chat-header">
            <h3>Team Chat</h3>
            <div className="chat-header-actions">
              <div className="chat-members-count">
                {collaborators.length} member{collaborators.length !== 1 ? 's' : ''}
              </div>
              <button
                className="chat-refresh-btn"
                onClick={fetchMessages}
                disabled={loadingMessages}
                title="Refresh messages"
              >
                {loadingMessages ? '⟳' : '↻'}
              </button>
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
          </>
          )}
          {!showChat && (
            <button
              className="toggle-chat-btn show-chat-btn"
              onClick={() => setShowChat(true)}
              title="Show chat"
            >
              💬 Show Chat
            </button>
          )}
        </div>
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

        {/* Add/Edit Travel Modal */}
        {showTravelModal && (
          <div className="modal-overlay" onClick={() => {
            setShowTravelModal(false);
            setEditingItem(null);
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingItem ? '✏️ Edit Travel' : '✈️ Add Travel'}</h2>
                <button className="modal-close" onClick={() => {
                  setShowTravelModal(false);
                  setEditingItem(null);
                }}>✕</button>
              </div>

              <div className="modal-form">
                <div className="form-group">
                  <label>Travel Type *</label>
                  <select
                    value={travelForm.travel_type}
                    onChange={(e) => setTravelForm({...travelForm, travel_type: e.target.value})}
                    required
                  >
                    <option value="flight">✈️ Flight</option>
                    <option value="train">🚆 Train</option>
                    <option value="bus">🚌 Bus</option>
                    <option value="car">🚗 Car</option>
                    <option value="other">🚚 Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>From Location *</label>
                  <input
                    type="text"
                    value={travelForm.from_location}
                    onChange={(e) => setTravelForm({...travelForm, from_location: e.target.value})}
                    placeholder="e.g., Paris CDG Airport"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>To Location *</label>
                  <input
                    type="text"
                    value={travelForm.to_location}
                    onChange={(e) => {
                      setTravelForm({...travelForm, to_location: e.target.value});
                      searchPlaces(e.target.value, ['airport', 'train_station', 'bus_station', 'transit_station']);
                    }}
                    placeholder="e.g., London Heathrow Airport (type to search)"
                    required
                    autoComplete="off"
                  />
                  {showPlaceSuggestions && placeSuggestions.length > 0 && (
                    <div className="place-suggestions">
                      {placeSuggestions.map((place) => (
                        <div
                          key={place.place_id}
                          className="place-suggestion-item"
                          onClick={() => handlePlaceSelection(place, 'travel')}
                        >
                          <div className="place-suggestion-name">{place.name}</div>
                          {place.address && (
                            <div className="place-suggestion-address">{place.address}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Departure Date & Time</label>
                    <input
                      type="datetime-local"
                      value={travelForm.departure_date}
                      onChange={(e) => setTravelForm({...travelForm, departure_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Arrival Date & Time</label>
                    <input
                      type="datetime-local"
                      value={travelForm.arrival_date}
                      onChange={(e) => setTravelForm({...travelForm, arrival_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirmation Number</label>
                  <input
                    type="text"
                    value={travelForm.confirmation_number}
                    onChange={(e) => setTravelForm({...travelForm, confirmation_number: e.target.value})}
                    placeholder="e.g., AB1234"
                  />
                </div>

                <div className="form-group">
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={travelForm.url}
                    onChange={(e) => setTravelForm({...travelForm, url: e.target.value})}
                    placeholder="e.g., https://www.airline.com/booking"
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={travelForm.notes}
                    onChange={(e) => setTravelForm({...travelForm, notes: e.target.value})}
                    placeholder="Add any additional notes..."
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowTravelModal(false);
                    setEditingItem(null);
                  }}>
                    Cancel
                  </button>
                  <button type="button" className="save-btn" onClick={handleSaveTravel}>
                    {editingItem ? 'Update' : 'Add'} Travel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Stay Modal */}
        {showStayModal && (
          <div className="modal-overlay" onClick={() => {
            setShowStayModal(false);
            setEditingItem(null);
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingItem ? '✏️ Edit Stay' : '🏨 Add Stay'}</h2>
                <button className="modal-close" onClick={() => {
                  setShowStayModal(false);
                  setEditingItem(null);
                }}>✕</button>
              </div>

              <div className="modal-form">
                <div className="form-group">
                  <label>Stay Type *</label>
                  <select
                    value={stayForm.stay_type}
                    onChange={(e) => setStayForm({...stayForm, stay_type: e.target.value})}
                    required
                  >
                    <option value="hotel">🏨 Hotel</option>
                    <option value="hostel">🏠 Hostel</option>
                    <option value="rental">🏡 Rental</option>
                    <option value="resort">🏖️ Resort</option>
                    <option value="other">🛏️ Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={stayForm.name}
                    onChange={(e) => {
                      setStayForm({...stayForm, name: e.target.value});
                      searchPlaces(e.target.value, ['lodging', 'hotel', 'hostel', 'guest_house', 'resort_hotel']);
                    }}
                    placeholder="e.g., Hilton Paris Opera (type to search)"
                    required
                    autoComplete="off"
                  />
                  {showPlaceSuggestions && placeSuggestions.length > 0 && (
                    <div className="place-suggestions">
                      {placeSuggestions.map((place) => (
                        <div
                          key={place.place_id}
                          className="place-suggestion-item"
                          onClick={() => handlePlaceSelection(place, 'stay')}
                        >
                          <div className="place-suggestion-name">{place.name}</div>
                          {place.address && (
                            <div className="place-suggestion-address">{place.address}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={stayForm.location}
                    onChange={(e) => setStayForm({...stayForm, location: e.target.value})}
                    placeholder="e.g., 108 Rue Saint-Lazare, Paris"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Check-in Date</label>
                    <input
                      type="date"
                      value={stayForm.check_in_date}
                      onChange={(e) => setStayForm({...stayForm, check_in_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Check-out Date</label>
                    <input
                      type="date"
                      value={stayForm.check_out_date}
                      onChange={(e) => setStayForm({...stayForm, check_out_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirmation Number</label>
                  <input
                    type="text"
                    value={stayForm.confirmation_number}
                    onChange={(e) => setStayForm({...stayForm, confirmation_number: e.target.value})}
                    placeholder="e.g., RES123456"
                  />
                </div>

                <div className="form-group">
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={stayForm.url}
                    onChange={(e) => setStayForm({...stayForm, url: e.target.value})}
                    placeholder="e.g., https://www.hotel.com/reservation"
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={stayForm.notes}
                    onChange={(e) => setStayForm({...stayForm, notes: e.target.value})}
                    placeholder="Add any additional notes..."
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowStayModal(false);
                    setEditingItem(null);
                  }}>
                    Cancel
                  </button>
                  <button type="button" className="save-btn" onClick={handleSaveStay}>
                    {editingItem ? 'Update' : 'Add'} Stay
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Activity Modal */}
        {showActivityModal && (
          <div className="modal-overlay" onClick={() => {
            setShowActivityModal(false);
            setEditingItem(null);
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingItem ? '✏️ Edit Activity' : '🎯 Add Activity'}</h2>
                <button className="modal-close" onClick={() => {
                  setShowActivityModal(false);
                  setEditingItem(null);
                }}>✕</button>
              </div>

              <div className="modal-form">
                <div className="form-group">
                  <label>Activity Type *</label>
                  <select
                    value={activityForm.activity_type}
                    onChange={(e) => setActivityForm({...activityForm, activity_type: e.target.value})}
                    required
                  >
                    <option value="tour">🗺️ Tour</option>
                    <option value="event">🎭 Event</option>
                    <option value="restaurant">🍽️ Restaurant</option>
                    <option value="adventure">🏔️ Adventure</option>
                    <option value="other">🎯 Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={activityForm.name}
                    onChange={(e) => {
                      setActivityForm({...activityForm, name: e.target.value});
                      searchPlaces(e.target.value, ['tourist_attraction', 'restaurant', 'museum', 'park', 'amusement_park']);
                    }}
                    placeholder="e.g., Eiffel Tower Guided Tour (type to search)"
                    required
                    autoComplete="off"
                  />
                  {showPlaceSuggestions && placeSuggestions.length > 0 && (
                    <div className="place-suggestions">
                      {placeSuggestions.map((place) => (
                        <div
                          key={place.place_id}
                          className="place-suggestion-item"
                          onClick={() => handlePlaceSelection(place, 'activity')}
                        >
                          <div className="place-suggestion-name">{place.name}</div>
                          {place.address && (
                            <div className="place-suggestion-address">{place.address}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={activityForm.location}
                    onChange={(e) => setActivityForm({...activityForm, location: e.target.value})}
                    placeholder="e.g., Champ de Mars, Paris"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      value={activityForm.scheduled_date}
                      onChange={(e) => setActivityForm({...activityForm, scheduled_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      value={activityForm.duration_minutes}
                      onChange={(e) => setActivityForm({...activityForm, duration_minutes: e.target.value})}
                      placeholder="e.g., 120"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Confirmation Number</label>
                  <input
                    type="text"
                    value={activityForm.confirmation_number}
                    onChange={(e) => setActivityForm({...activityForm, confirmation_number: e.target.value})}
                    placeholder="e.g., TOUR789"
                  />
                </div>

                <div className="form-group">
                  <label>Website URL</label>
                  <input
                    type="url"
                    value={activityForm.url}
                    onChange={(e) => setActivityForm({...activityForm, url: e.target.value})}
                    placeholder="e.g., https://www.tours.com/booking"
                  />
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={activityForm.notes}
                    onChange={(e) => setActivityForm({...activityForm, notes: e.target.value})}
                    placeholder="Add any additional notes..."
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowActivityModal(false);
                    setEditingItem(null);
                  }}>
                    Cancel
                  </button>
                  <button type="button" className="save-btn" onClick={handleSaveActivity}>
                    {editingItem ? 'Update' : 'Add'} Activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Trip Plan Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✏️ Edit Trip Plan</h2>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
              </div>

              <div className="modal-form">
                <div className="form-group">
                  <label>Trip Name *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    placeholder="e.g., Summer Europe Trip"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <select
                    value={editForm.country}
                    onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={editForm.start_date}
                      onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={editForm.end_date}
                      onChange={(e) => setEditForm({...editForm, end_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    placeholder="Add a description for your trip..."
                    rows="4"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="save-btn"
                    onClick={handleUpdateTripPlan}
                    disabled={!editForm.name.trim()}
                  >
                    Update Trip Plan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default TripPlanDetails;
