import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { createTagNotification } from './notificationHelpers';
import Navbar from './Navbar';
import MentionTextarea from './MentionTextarea';
import LocationAutocomplete from './LocationAutocomplete';
import EventAutocomplete from './EventAutocomplete';
import './CreateTrip.css';
import { popularLocations } from './locations';

function CreateTrip() {
  const navigate = useNavigate();
  const locationRef = useRef(null);
  const [tripData, setTripData] = useState({
    content: '',
    tripTitle: '',
    location: '',
    country: '',
    startDate: '',
    endDate: '',
    images: [],
    links: '',
    isEvent: false,
    eventName: '',
    eventType: '',
    eventTitle: ''
  });

  const [positives, setPositives] = useState([]);
  const [positiveInput, setPositiveInput] = useState('');
  const [redFlags, setRedFlags] = useState([]);
  const [redFlagInput, setRedFlagInput] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [tripRating, setTripRating] = useState(null);

  const ratingEmojis = [
    { emoji: '😞', label: 'Very Bad', value: 1 },
    { emoji: '😕', label: 'Bad', value: 2 },
    { emoji: '😐', label: 'Okay', value: 3 },
    { emoji: '😊', label: 'Good', value: 4 },
    { emoji: '😍', label: 'Excellent', value: 5 }
  ];

  const handlePlaceSelected = (placeData) => {
    setTripData({
      ...tripData,
      location: placeData.location,
      country: placeData.country || ''
    });
  };

  const handleLocationChange = (value) => {
    setTripData({ ...tripData, location: value });
  };

  const handleEventSelected = (eventData) => {
    setTripData({
      ...tripData,
      eventName: eventData.eventName,
      location: eventData.location || tripData.location,
      country: eventData.country || tripData.country,
      eventType: eventData.eventType || tripData.eventType,
      startDate: eventData.date || tripData.startDate
    });
  };

  const handleEventNameChange = (value) => {
    setTripData({ ...tripData, eventName: value });
  };

  const handleAddPositive = () => {
    if (positiveInput.trim() && !positives.includes(positiveInput.trim())) {
      setPositives([...positives, positiveInput.trim()]);
      setPositiveInput('');
    }
  };

  const handleRemovePositive = (item) => {
    setPositives(positives.filter(p => p !== item));
  };

  const handleAddRedFlag = () => {
    if (redFlagInput.trim() && !redFlags.includes(redFlagInput.trim())) {
      setRedFlags([...redFlags, redFlagInput.trim()]);
      setRedFlagInput('');
    }
  };

  const handleRemoveRedFlag = (item) => {
    setRedFlags(redFlags.filter(r => r !== item));
  };

  const handlePositiveKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPositive();
    }
  };

  const handleRedFlagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRedFlag();
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to upload images');
        setUploading(false);
        return;
      }

      const uploadedImages = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `trip-images/${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName);

        uploadedImages.push({
          id: Date.now() + Math.random(),
          url: publicUrl,
          name: file.name
        });
      }

      setTripData({
        ...tripData,
        images: [...tripData.images, ...uploadedImages]
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (imageId) => {
    setTripData({
      ...tripData,
      images: tripData.images.filter(img => img.id !== imageId)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate based on post type
    if (tripData.isEvent) {
      if (!tripData.eventTitle.trim() || !tripData.eventName.trim() || !tripData.location.trim() || !tripData.eventType) {
        alert('Please fill in post title, event name, location, and event type');
        return;
      }
    } else {
      if (!tripData.tripTitle.trim() || !tripData.location.trim()) {
        alert('Please fill in trip title and location');
        return;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to create a trip');
        navigate('/login');
        return;
      }

      // Fetch user's profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .single();

      const displayName = profileData?.full_name || profileData?.username || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
      const avatarUrl = profileData?.avatar_url || user.user_metadata?.avatar_url || null;

      // Extract hashtags from content
      const hashtagRegex = /#(\w+)/g;
      const hashtagMatches = tripData.content.match(hashtagRegex);
      const hashtags = hashtagMatches ? hashtagMatches.map(tag => tag.substring(1)) : [];

      const completeTrip = {
        user_id: user.id,
        author: displayName,
        author_avatar: avatarUrl,
        author_username: profileData?.username || null,
        trip_title: tripData.isEvent ? tripData.eventTitle : tripData.tripTitle,
        is_event: tripData.isEvent || false,
        event_name: tripData.isEvent ? tripData.eventName : null,
        event_type: tripData.isEvent ? tripData.eventType : null,
        content: tripData.content.trim() || (tripData.isEvent
          ? `Attended ${tripData.eventName} in ${tripData.location}!`
          : `Just visited ${tripData.tripTitle}!`),
        location: tripData.location.trim() || tripData.country,
        country: tripData.country || null,
        start_date: tripData.startDate || null,
        end_date: tripData.endDate || null,
        images: tripData.images || [],
        hashtags: hashtags,
        mentioned_users: mentionedUsers.map(u => u.id),
        booking_link: tripData.links.trim() || null,
        positives: positives.length > 0 ? positives : null,
        red_flags: redFlags.length > 0 ? redFlags : null,
        trip_rating: tripRating,
        likes: 0,
        comments: []
      };

      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert([completeTrip])
        .select()
        .single();

      if (postError) {
        console.error('Error creating post:', postError);
        alert('Failed to create post: ' + postError.message);
        return;
      }

      // Send notifications to mentioned users
      if (mentionedUsers.length > 0 && newPost) {
        for (const mentionedUser of mentionedUsers) {
          await createTagNotification(
            mentionedUser.id,
            user.id,
            displayName,
            newPost.id
          );
        }
      }

      // Update visited countries if country is selected
      if (tripData.country && user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('visited_countries')
          .eq('id', user.id)
          .single();

        const visitedCountries = profileData?.visited_countries || [];

        if (!visitedCountries.includes(tripData.country)) {
          const updatedCountries = [...visitedCountries, tripData.country];

          await supabase
            .from('profiles')
            .update({ visited_countries: updatedCountries })
            .eq('id', user.id);
        }
      }

      navigate('/feed');
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('An error occurred while creating your post');
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-trip-container">
        <div className="create-trip-content">
          <div className="create-trip-header">
            <button onClick={() => navigate('/feed')} className="back-btn">
              ← Back
            </button>
            <h1>Share Your Trip</h1>
          </div>

          <form onSubmit={handleSubmit} className="trip-form">
            <div className="form-section">
              <label className="form-label">Post Type</label>
              <div className="post-type-toggle">
                <button
                  type="button"
                  className={`type-btn ${!tripData.isEvent ? 'active' : ''}`}
                  onClick={() => setTripData({ ...tripData, isEvent: false, eventName: '', eventType: '', eventTitle: '' })}
                >
                  🗺️ Trip/Visit
                </button>
                <button
                  type="button"
                  className={`type-btn ${tripData.isEvent ? 'active' : ''}`}
                  onClick={() => setTripData({ ...tripData, isEvent: true, tripTitle: '' })}
                >
                  🎫 Event
                </button>
              </div>
            </div>

            {!tripData.isEvent ? (
              <div className="form-section">
                <label className="form-label">Trip Title</label>
                <input
                  type="text"
                  value={tripData.tripTitle}
                  onChange={(e) => setTripData({ ...tripData, tripTitle: e.target.value })}
                  placeholder="e.g., Weekend in Paris, Summer in Tokyo"
                  className="trip-input title-input"
                  required
                />
              </div>
            ) : (
              <>
                <div className="form-section">
                  <label className="form-label">Post Title</label>
                  <input
                    type="text"
                    value={tripData.eventTitle}
                    onChange={(e) => setTripData({ ...tripData, eventTitle: e.target.value })}
                    placeholder="e.g., Amazing Concert Experience, Epic Festival Weekend"
                    className="trip-input title-input"
                    required
                  />
                  <p className="form-hint">Give your event post a catchy title</p>
                </div>
                <div className="form-section">
                  <label className="form-label">Event Name</label>
                  <EventAutocomplete
                    value={tripData.eventName}
                    onChange={handleEventNameChange}
                    onEventSelected={handleEventSelected}
                    placeholder="Search for events (e.g., Coldplay, Tomorrowland)..."
                  />
                  <p className="form-hint">Search Ticketmaster or enter a custom event name</p>
                </div>
                <div className="form-section">
                  <label className="form-label">Event Type</label>
                  <select
                    value={tripData.eventType}
                    onChange={(e) => setTripData({ ...tripData, eventType: e.target.value })}
                    className="trip-input event-type-select"
                    required
                  >
                    <option value="">Select event type...</option>
                    <option value="concert">🎵 Concert</option>
                    <option value="festival">🎪 Festival</option>
                    <option value="sports">⚽ Sports Event</option>
                    <option value="conference">📊 Conference</option>
                    <option value="exhibition">🎨 Exhibition</option>
                    <option value="theater">🎭 Theater/Show</option>
                    <option value="food">🍽️ Food Event</option>
                    <option value="other">🎉 Other Event</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-section">
              <label className="form-label">{tripData.isEvent ? 'Event Location' : 'Trip Details'}</label>
              <div className="form-row">
                <LocationAutocomplete
                  value={tripData.location}
                  onChange={handleLocationChange}
                  onPlaceSelected={handlePlaceSelected}
                  placeholder={tripData.isEvent ? "Where is the event?" : "Search for a location..."}
                />
              </div>
              <div className="form-row">
                <input
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => setTripData({ ...tripData, startDate: e.target.value })}
                  className="date-input"
                  placeholder={tripData.isEvent ? "Event date" : "Start date"}
                />
                {!tripData.isEvent && (
                  <input
                    type="date"
                    value={tripData.endDate}
                    onChange={(e) => setTripData({ ...tripData, endDate: e.target.value })}
                    className="date-input"
                    placeholder="End date"
                  />
                )}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Your Story</label>
              <MentionTextarea
                value={tripData.content}
                onChange={(value) => setTripData({ ...tripData, content: value })}
                onMentionedUsersChange={setMentionedUsers}
                placeholder="Share your travel experience... What made this trip special? Any tips for others? (Add #hashtags and @mention friends)"
                className="trip-textarea"
                rows={6}
              />
              <p className="form-hint">Add hashtags with #hashtag and mention friends with @username</p>
            </div>

            <div className="tips-section">
              <div className="form-section positives-section">
                <label className="form-label">
                  <span className="tip-icon">⭐</span> What Was Great
                </label>
                <div className="tip-input-container">
                  <input
                    type="text"
                    value={positiveInput}
                    onChange={(e) => setPositiveInput(e.target.value)}
                    onKeyPress={handlePositiveKeyPress}
                    placeholder="Add a positive (press Enter)"
                    className="tip-input positives-input"
                  />
                  <button type="button" onClick={handleAddPositive} className="add-tip-btn positive-btn">
                    +
                  </button>
                </div>
                {positives.length > 0 && (
                  <ul className="tip-list">
                    {positives.map((item, index) => (
                      <li key={index} className="tip-item positive-item">
                        <span className="tip-bullet">⭐</span>
                        <span className="tip-text">{item}</span>
                        <button type="button" onClick={() => handleRemovePositive(item)} className="remove-tip-btn">
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="form-section red-flags-section">
                <label className="form-label">
                  <span className="tip-icon">🚩</span> Red Flags & Tips
                </label>
                <div className="tip-input-container">
                  <input
                    type="text"
                    value={redFlagInput}
                    onChange={(e) => setRedFlagInput(e.target.value)}
                    onKeyPress={handleRedFlagKeyPress}
                    placeholder="Add a warning (press Enter)"
                    className="tip-input red-flags-input"
                  />
                  <button type="button" onClick={handleAddRedFlag} className="add-tip-btn red-flag-btn">
                    +
                  </button>
                </div>
                {redFlags.length > 0 && (
                  <ul className="tip-list">
                    {redFlags.map((item, index) => (
                      <li key={index} className="tip-item red-flag-item">
                        <span className="tip-bullet">🚩</span>
                        <span className="tip-text">{item}</span>
                        <button type="button" onClick={() => handleRemoveRedFlag(item)} className="remove-tip-btn">
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">How was your trip?</label>
              <div className="rating-selector">
                {ratingEmojis.map((rating) => (
                  <button
                    key={rating.value}
                    type="button"
                    className={`rating-emoji-btn ${tripRating === rating.value ? 'selected' : ''}`}
                    onClick={() => setTripRating(rating.value)}
                    title={rating.label}
                  >
                    <span className="rating-emoji">{rating.emoji}</span>
                    <span className="rating-label">{rating.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Photos</label>
              <div className="images-grid">
                {tripData.images.map((image) => (
                  <div key={image.id} className="image-preview">
                    <img src={image.url} alt={image.name} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(image.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <label className="add-image-btn">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                  <span>{uploading ? 'Uploading...' : '📷 Add Photos'}</span>
                </label>
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Links (Optional)</label>
              <input
                type="text"
                value={tripData.links}
                onChange={(e) => setTripData({ ...tripData, links: e.target.value })}
                placeholder="Add links (booking, blog, etc.)"
                className="links-input"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/feed')} className="cancel-btn">
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={
                  tripData.isEvent
                    ? (!tripData.eventTitle.trim() || !tripData.eventName.trim() || !tripData.location.trim() || !tripData.eventType)
                    : (!tripData.tripTitle.trim() || !tripData.location.trim())
                }
              >
                {tripData.isEvent ? 'Share Event' : 'Share Trip'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateTrip;
