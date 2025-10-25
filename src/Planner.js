import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { useLoadScript } from '@react-google-maps/api';
import { getCountryCode } from './utils/countryHelpers';
import Navbar from './Navbar';
import './Planner.css';

const libraries = ['places'];

function Planner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tripPlans, setTripPlans] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [showAddAttractionModal, setShowAddAttractionModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTripPlan, setSelectedTripPlan] = useState(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [collaborators, setCollaborators] = useState({});
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [newTripPlan, setNewTripPlan] = useState({
    name: '',
    description: '',
    country: '',
    start_date: '',
    end_date: ''
  });

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
  const [newAttraction, setNewAttraction] = useState({
    place_id: '',
    place_name: '',
    place_address: '',
    place_lat: null,
    place_lng: null,
    place_photo_url: '',
    notes: '',
    planned_date: ''
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_PLACES_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (user) {
      fetchTripPlans();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Don't close if clicking inside the dropdown menu
      if (showDropdown && !e.target.closest('.trip-plan-menu')) {
        setShowDropdown(null);
      }
    };

    // Use mousedown instead of click to avoid interference with confirm dialog
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const fetchTripPlans = async () => {
    try {
      setLoading(true);

      // Fetch trip plans owned by user
      const { data: ownedPlans, error: ownedError } = await supabase
        .from('trip_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (ownedError) throw ownedError;

      // Fetch trip plans where user is a collaborator
      const { data: sharedPlans, error: sharedError } = await supabase
        .from('trip_plans')
        .select(`
          *,
          trip_collaborators!inner(user_id)
        `)
        .eq('trip_collaborators.user_id', user.id)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sharedError) throw sharedError;

      // Combine owned and shared plans
      const allPlans = [...(ownedPlans || []), ...(sharedPlans || [])];
      setTripPlans(allPlans);

      // Fetch all attractions for these trip plans
      const tripPlanIds = allPlans.map(plan => plan.id);
      const { data: attractionsData, error: attractionsError } = await supabase
        .from('planned_attractions')
        .select('*')
        .in('trip_plan_id', tripPlanIds)
        .order('created_at', { ascending: false });

      if (attractionsError) throw attractionsError;

      setAttractions(attractionsData || []);

      // Fetch collaborators with profiles for each trip plan
      const collaboratorsMap = {};
      for (const plan of allPlans) {
        // Get owner profile
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', plan.user_id)
          .single();

        // Get collaborators
        const { data: collabData } = await supabase
          .from('trip_collaborators')
          .select('user_id')
          .eq('trip_plan_id', plan.id);

        // Fetch profiles for collaborators
        const members = [ownerProfile];
        if (collabData && collabData.length > 0) {
          const collabIds = collabData.map(c => c.user_id);
          const { data: collabProfiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', collabIds);

          if (collabProfiles) {
            // Filter out the owner to prevent duplicates
            const filteredProfiles = collabProfiles.filter(p => p.id !== plan.user_id);
            members.push(...filteredProfiles);
          }
        }

        collaboratorsMap[plan.id] = members;
      }

      setCollaborators(collaboratorsMap);
    } catch (error) {
      console.error('Error fetching trip plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPlaces = async (query) => {
    if (!window.google || !window.google.maps || !window.google.maps.places || !query) {
      setSearchResults([]);
      return;
    }

    try {
      const request = {
        input: query,
        includedPrimaryTypes: ['tourist_attraction', 'museum', 'park', 'restaurant', 'point_of_interest'],
        language: 'en',
      };

      const { suggestions } = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      if (suggestions && suggestions.length > 0) {
        const formattedResults = suggestions.map(suggestion => {
          const placePrediction = suggestion.placePrediction;
          return {
            place_id: placePrediction?.placeId || '',
            description: placePrediction?.text?.text || '',
            structured_formatting: {
              main_text: placePrediction?.structuredFormat?.mainText?.text || '',
              secondary_text: placePrediction?.structuredFormat?.secondaryText?.text || ''
            }
          };
        });
        setSearchResults(formattedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setSearchResults([]);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length > 2) {
      searchPlaces(value);
    } else {
      setSearchResults([]);
    }
  };

  const selectPlace = async (place) => {
    setSearchQuery(place.description);
    setSearchResults([]);

    // Fetch place details
    if (window.google && window.google.maps && place.place_id) {
      try {
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails(
          {
            placeId: place.place_id,
            fields: ['name', 'formatted_address', 'geometry', 'photos']
          },
          (placeDetails, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
              const photoUrl = placeDetails.photos?.[0]?.getUrl({ maxWidth: 400 }) || '';

              setNewAttraction({
                ...newAttraction,
                place_id: place.place_id,
                place_name: placeDetails.name || place.structured_formatting.main_text,
                place_address: placeDetails.formatted_address || place.structured_formatting.secondary_text,
                place_lat: placeDetails.geometry?.location?.lat() || null,
                place_lng: placeDetails.geometry?.location?.lng() || null,
                place_photo_url: photoUrl
              });
            }
          }
        );
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    }
  };

  const handleCreateTripPlan = async (e) => {
    e.preventDefault();

    if (!newTripPlan.name.trim()) {
      alert('Please enter a trip name');
      return;
    }

    if (!newTripPlan.country) {
      alert('Please select a country');
      return;
    }

    try {
      // Convert empty date strings to null for database insertion
      const tripPlanData = {
        user_id: user.id,
        name: newTripPlan.name,
        description: newTripPlan.description || null,
        country: newTripPlan.country,
        start_date: newTripPlan.start_date || null,
        end_date: newTripPlan.end_date || null
      };

      const { data, error } = await supabase
        .from('trip_plans')
        .insert([tripPlanData])
        .select();

      if (error) throw error;

      // Reset form and close modal
      setNewTripPlan({
        name: '',
        description: '',
        country: '',
        start_date: '',
        end_date: ''
      });
      setShowCreateTripModal(false);

      // Refresh trip plans
      fetchTripPlans();
    } catch (error) {
      console.error('Error creating trip plan:', error);
      alert('Failed to create trip plan');
    }
  };

  const handleAddAttraction = async (e) => {
    e.preventDefault();

    if (!newAttraction.place_name) {
      alert('Please select a place');
      return;
    }

    if (!selectedTripPlan) {
      alert('Please select a trip plan');
      return;
    }

    try {
      const { error } = await supabase
        .from('planned_attractions')
        .insert([{
          user_id: user.id,
          trip_plan_id: selectedTripPlan,
          ...newAttraction
        }]);

      if (error) throw error;

      // Reset form and close modal
      setNewAttraction({
        place_id: '',
        place_name: '',
        place_address: '',
        place_lat: null,
        place_lng: null,
        place_photo_url: '',
        notes: '',
        planned_date: ''
      });
      setSearchQuery('');
      setShowAddAttractionModal(false);
      setSelectedTripPlan(null);

      // Refresh attractions
      fetchTripPlans();
    } catch (error) {
      console.error('Error adding attraction:', error);
      alert('Failed to add attraction');
    }
  };

  const handleDeleteAttraction = async (id) => {
    if (!window.confirm('Are you sure you want to remove this attraction?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('planned_attractions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAttractions(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting attraction:', error);
      alert('Failed to delete attraction');
    }
  };

  const confirmDeleteTripPlan = async () => {
    const id = showDeleteConfirm;
    console.log('Confirming delete for trip plan:', id);
    setShowDeleteConfirm(null);

    try {
      const { error } = await supabase
        .from('trip_plans')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('Trip plan deleted successfully');
      fetchTripPlans();
    } catch (error) {
      console.error('Error deleting trip plan:', error);
      alert('Failed to delete trip plan: ' + error.message);
    }
  };

  const handleDeleteTripPlan = (id) => {
    console.log('handleDeleteTripPlan called with id:', id);
    setShowDeleteConfirm(id);
  };

  const openAddAttractionModal = (tripPlanId) => {
    setSelectedTripPlan(tripPlanId);
    setShowAddAttractionModal(true);
  };

  const openInviteModal = async (tripPlanId) => {
    setSelectedTripPlan(tripPlanId);
    setShowInviteModal(true);
    setInviteUsername('');
    setSelectedUser(null);
    setUserSearchResults([]);
    // Fetch existing collaborators
    await fetchCollaborators(tripPlanId);
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

  const fetchCollaborators = async (tripPlanId) => {
    try {
      const { data: collabData, error } = await supabase
        .from('trip_collaborators')
        .select('*')
        .eq('trip_plan_id', tripPlanId);

      if (error) throw error;

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

      setCollaborators(prev => ({
        ...prev,
        [tripPlanId]: collabsWithProfiles
      }));
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      alert('Please select a user from the search results');
      return;
    }

    try {
      // Add directly to collaborators with default 'editor' role
      const { error } = await supabase
        .from('trip_collaborators')
        .insert([{
          trip_plan_id: selectedTripPlan,
          user_id: selectedUser.id,
          role: 'editor',
          invited_by: user.id
        }]);

      if (error) throw error;

      alert(`${selectedUser.username} has been added as a collaborator!`);
      setInviteUsername('');
      setSelectedUser(null);
      setUserSearchResults([]);

      // Refresh collaborators list
      await fetchCollaborators(selectedTripPlan);
    } catch (error) {
      console.error('Error sending invite:', error);
      if (error.code === '23505') {
        alert('This user is already a collaborator on this trip plan');
      } else {
        alert('Failed to add collaborator');
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
      await fetchCollaborators(selectedTripPlan);
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Failed to remove collaborator');
    }
  };

  const handleLeaveGroup = async (tripPlanId) => {
    if (!window.confirm('Are you sure you want to leave this trip plan? You will lose access to it.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trip_collaborators')
        .delete()
        .eq('trip_plan_id', tripPlanId)
        .eq('user_id', user.id);

      if (error) throw error;

      alert('You have left the trip plan');
      // Refresh trip plans to remove it from the list
      await fetchTripPlans();
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave trip plan');
    }
  };

  return (
    <>
      <Navbar />
      <div className="planner-page page-transition-container">
        <div className="planner-container">
          <div className="planner-header">
            <h1>🗓️ Trip Planner</h1>
            <p className="planner-subtitle">
              {tripPlans.length === 0
                ? 'Create trip plans and save attractions'
                : `${tripPlans.length} ${tripPlans.length === 1 ? 'trip plan' : 'trip plans'}`}
            </p>
          </div>

          <div className="planner-controls">
            <button className="create-trip-btn" onClick={() => setShowCreateTripModal(true)}>
              ➕ Create New Trip Plan
            </button>
          </div>

          {loading ? (
            <div className="planner-loading">
              <div className="loading-spinner"></div>
              <p>Loading your planner...</p>
            </div>
          ) : tripPlans.length === 0 ? (
            <div className="planner-empty">
              <div className="empty-icon">✈️</div>
              <h3>No trip plans yet</h3>
              <p>Create your first trip plan to start saving attractions!</p>
              <button className="add-first-btn" onClick={() => setShowCreateTripModal(true)}>
                Create Your First Trip Plan
              </button>
            </div>
          ) : (
            <div className="trip-plans-grid">
              {tripPlans.map((tripPlan) => {
                const tripAttractions = attractions.filter(a => a.trip_plan_id === tripPlan.id);

                return (
                  <div key={tripPlan.id} className="trip-plan-card">
                    {tripPlan.user_id === user.id && (
                      <div className="trip-plan-menu">
                        <button
                          className="menu-dots-btn"
                          onClick={(e) => {
                            console.log('Three dots clicked for trip plan:', tripPlan.id);
                            e.stopPropagation();
                            e.preventDefault();
                            setShowDropdown(showDropdown === tripPlan.id ? null : tripPlan.id);
                          }}
                          title="Options"
                        >
                          ⋮
                        </button>
                        {showDropdown === tripPlan.id && (
                          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="dropdown-item delete-item"
                              onClick={(e) => {
                                console.log('Delete button clicked for trip plan:', tripPlan.id);
                                e.stopPropagation();
                                e.preventDefault();

                                // Close dropdown first
                                setShowDropdown(null);

                                // Then show confirm dialog after a brief delay
                                setTimeout(() => {
                                  handleDeleteTripPlan(tripPlan.id);
                                }, 100);
                              }}
                            >
                              🗑️ Delete Trip Plan
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className="trip-plan-clickable"
                      onClick={() => navigate(`/planner/${tripPlan.id}`)}
                    >
                      <div className="trip-plan-header">
                        <div className="trip-plan-info">
                          <div className="trip-plan-name-row">
                            <h2 className="trip-plan-name">{tripPlan.name}</h2>
                            {tripPlan.user_id !== user.id && (
                              <span className="shared-badge">👥 Shared</span>
                            )}
                          </div>
                        {tripPlan.country && (
                          <p className="trip-plan-country">
                            <span className={`fi fi-${getCountryCode(tripPlan.country)}`}></span>
                            {tripPlan.country}
                          </p>
                        )}
                        {tripPlan.description && (
                          <p className="trip-plan-description">{tripPlan.description}</p>
                        )}
                        {(tripPlan.start_date || tripPlan.end_date) && (
                          <p className="trip-plan-dates">
                            📅 {tripPlan.start_date ? new Date(tripPlan.start_date).toLocaleDateString() : '?'}
                            {' - '}
                            {tripPlan.end_date ? new Date(tripPlan.end_date).toLocaleDateString() : '?'}
                          </p>
                        )}
                      </div>
                      </div>

                      <div className="trip-plan-stats">
                        <span className="stat">
                          📍 {tripAttractions.length} {tripAttractions.length === 1 ? 'attraction' : 'attractions'}
                        </span>
                      </div>

                      {/* Member Avatars */}
                      {collaborators[tripPlan.id] && collaborators[tripPlan.id].length > 0 && (
                        <div className="trip-members">
                          <div className="trip-members-avatars">
                            {collaborators[tripPlan.id].slice(0, 4).map((member, index) => (
                              <div key={member.id} className="trip-member-avatar" style={{ zIndex: 4 - index }}>
                                {member.avatar_url ? (
                                  <img src={member.avatar_url} alt={member.username} title={member.username} />
                                ) : (
                                  <div className="trip-avatar-placeholder" title={member.username}>
                                    {member.username?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                )}
                              </div>
                            ))}
                            {collaborators[tripPlan.id].length > 4 && (
                              <div className="trip-member-avatar trip-member-more">
                                +{collaborators[tripPlan.id].length - 4}
                              </div>
                            )}
                          </div>
                          <span className="trip-members-count">
                            {collaborators[tripPlan.id].length} {collaborators[tripPlan.id].length === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Trip Plan Modal */}
        {showCreateTripModal && (
          <div className="modal-overlay" onClick={() => setShowCreateTripModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Trip Plan</h2>
                <button className="modal-close" onClick={() => setShowCreateTripModal(false)}>✕</button>
              </div>

              <form onSubmit={handleCreateTripPlan} className="trip-plan-form">
                <div className="form-group">
                  <label>Trip Name *</label>
                  <input
                    type="text"
                    value={newTripPlan.name}
                    onChange={(e) => setNewTripPlan({...newTripPlan, name: e.target.value})}
                    placeholder="e.g., Summer 2025 Europe Trip"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Country *</label>
                  <select
                    value={newTripPlan.country}
                    onChange={(e) => setNewTripPlan({...newTripPlan, country: e.target.value})}
                    required
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newTripPlan.description}
                    onChange={(e) => setNewTripPlan({...newTripPlan, description: e.target.value})}
                    placeholder="Describe your trip plans..."
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={newTripPlan.start_date}
                      onChange={(e) => setNewTripPlan({...newTripPlan, start_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={newTripPlan.end_date}
                      onChange={(e) => setNewTripPlan({...newTripPlan, end_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowCreateTripModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    Create Trip Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Attraction Modal */}
        {showAddAttractionModal && (
          <div className="modal-overlay" onClick={() => setShowAddAttractionModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Attraction</h2>
                <button className="modal-close" onClick={() => setShowAddAttractionModal(false)}>✕</button>
              </div>

              <form onSubmit={handleAddAttraction} className="add-attraction-form">
                <div className="form-group">
                  <label>Search for a place *</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search for attractions, museums, parks..."
                    className="search-input"
                    disabled={!isLoaded}
                  />
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map((result) => (
                        <div
                          key={result.place_id}
                          className="search-result-item"
                          onClick={() => selectPlace(result)}
                        >
                          <strong>{result.structured_formatting.main_text}</strong>
                          <br />
                          <small>{result.structured_formatting.secondary_text}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {newAttraction.place_name && (
                  <>
                    <div className="selected-place">
                      ✓ Selected: {newAttraction.place_name}
                    </div>

                    <div className="form-group">
                      <label>Planned Date</label>
                      <input
                        type="date"
                        value={newAttraction.planned_date}
                        onChange={(e) => setNewAttraction({...newAttraction, planned_date: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label>Notes</label>
                      <textarea
                        value={newAttraction.notes}
                        onChange={(e) => setNewAttraction({...newAttraction, notes: e.target.value})}
                        placeholder="Add any notes about this attraction..."
                        rows="3"
                      />
                    </div>

                    <div className="modal-actions">
                      <button type="button" className="cancel-btn" onClick={() => setShowAddAttractionModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="save-btn">
                        Add to Trip
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

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

              {/* Existing Collaborators */}
              {collaborators[selectedTripPlan] && collaborators[selectedTripPlan].length > 0 && (
                <div className="collaborators-section">
                  <h3>Current Collaborators</h3>
                  <div className="collaborators-list">
                    {collaborators[selectedTripPlan].map((collab) => {
                      const tripPlan = tripPlans.find(tp => tp.id === selectedTripPlan);
                      const isOwner = tripPlan?.user_id === user.id;
                      const isCurrentUser = collab.user_id === user.id;

                      return (
                        <div key={collab.id} className="collaborator-item">
                          <div className="collaborator-info">
                            <div className="collaborator-name">
                              {collab.profiles?.full_name || collab.profiles?.username || 'User'}
                              {isCurrentUser && ' (You)'}
                            </div>
                            <div className="collaborator-role">
                              {collab.role === 'owner' && '👑 Co-owner'}
                              {(collab.role === 'editor' || collab.role === 'viewer') && '✏️ Collaborator'}
                            </div>
                          </div>
                          {isCurrentUser && !isOwner ? (
                            <button
                              type="button"
                              className="leave-group-btn"
                              onClick={() => handleLeaveGroup(selectedTripPlan)}
                            >
                              Leave
                            </button>
                          ) : isOwner && !isCurrentUser && collab.role !== 'owner' ? (
                            <button
                              type="button"
                              className="remove-collaborator-btn"
                              onClick={() => handleRemoveCollaborator(collab.id)}
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
            <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>⚠️ Delete Trip Plan</h2>
                <button className="modal-close" onClick={() => setShowDeleteConfirm(null)}>✕</button>
              </div>
              <div className="delete-confirm-content">
                <p>Are you sure you want to delete this trip plan?</p>
                {attractions.filter(a => a.trip_plan_id === showDeleteConfirm).length > 0 && (
                  <p className="warning-text">
                    This will also delete {attractions.filter(a => a.trip_plan_id === showDeleteConfirm).length} attraction(s).
                  </p>
                )}
                <p className="warning-text">This action cannot be undone.</p>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className="delete-confirm-btn" onClick={confirmDeleteTripPlan}>
                  Delete Trip Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Planner;
