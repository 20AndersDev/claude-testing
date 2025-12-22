import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import './CreateTrip.css';
import { popularLocations } from './locations';

function EditTrip() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const locationRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tripData, setTripData] = useState({
    content: '',
    tripTitle: '',
    location: '',
    country: '',
    startDate: '',
    endDate: '',
    images: [],
    links: ''
  });

  const [positives, setPositives] = useState([]);
  const [positiveInput, setPositiveInput] = useState('');
  const [redFlags, setRedFlags] = useState([]);
  const [redFlagInput, setRedFlagInput] = useState('');

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

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to edit a post');
        navigate('/login');
        return;
      }

      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Check if user owns this post
      if (post.user_id !== user.id) {
        alert('You can only edit your own posts');
        navigate('/feed');
        return;
      }

      // Populate form with existing data
      setTripData({
        content: post.content || '',
        tripTitle: post.trip_title || '',
        location: post.location || '',
        country: post.country || '',
        startDate: post.start_date || '',
        endDate: post.end_date || '',
        images: post.images || [],
        links: post.booking_link || ''
      });

      setPositives(post.positives || []);
      setRedFlags(post.red_flags || []);
      setTripRating(post.trip_rating || null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('Failed to load post');
      navigate('/feed');
    }
  };

  const handleLocationInput = (value) => {
    setTripData({ ...tripData, location: value });

    if (value.trim().length > 0) {
      const filtered = popularLocations.filter(loc =>
        loc.city.toLowerCase().includes(value.toLowerCase()) ||
        loc.country.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowLocationSuggestions(true);
    } else {
      setFilteredLocations([]);
      setShowLocationSuggestions(false);
    }
  };

  const selectLocation = (locationData) => {
    setTripData({
      ...tripData,
      location: `${locationData.city}, ${locationData.country}`,
      country: locationData.country
    });
    setShowLocationSuggestions(false);
    setFilteredLocations([]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    if (!tripData.tripTitle.trim() || !tripData.location.trim()) {
      alert('Please fill in trip title and location');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to update a post');
        navigate('/login');
        return;
      }

      // Extract hashtags from content
      const hashtagRegex = /#(\w+)/g;
      const hashtagMatches = tripData.content.match(hashtagRegex);
      const hashtags = hashtagMatches ? hashtagMatches.map(tag => tag.substring(1)) : [];

      const updatedTrip = {
        trip_title: tripData.tripTitle,
        content: tripData.content.trim() || `Just visited ${tripData.tripTitle}!`,
        location: tripData.location.trim() || tripData.country,
        country: tripData.country || null,
        start_date: tripData.startDate || null,
        end_date: tripData.endDate || null,
        images: tripData.images || [],
        hashtags: hashtags,
        booking_link: tripData.links.trim() || null,
        positives: positives.length > 0 ? positives : null,
        red_flags: redFlags.length > 0 ? redFlags : null,
        trip_rating: tripRating
      };

      const { error: updateError } = await supabase
        .from('posts')
        .update(updatedTrip)
        .eq('id', postId);

      if (updateError) {
        console.error('Error updating post:', updateError);
        alert('Failed to update post: ' + updateError.message);
        return;
      }

      // Update visited countries if country changed
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

      navigate(`/post/${postId}`);
    } catch (error) {
      console.error('Error updating trip:', error);
      alert('An error occurred while updating your post');
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="create-trip-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading post...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="create-trip-container">
        <div className="create-trip-content">
          <div className="create-trip-header">
            <button onClick={() => navigate(`/post/${postId}`)} className="back-btn">
              ← Back
            </button>
            <h1>Edit Your Trip</h1>
          </div>

          <form onSubmit={handleSubmit} className="trip-form">
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

            <div className="form-section">
              <label className="form-label">Trip Details</label>
              <div className="form-row">
                <div className="location-search-container" ref={locationRef}>
                  <input
                    type="text"
                    value={tripData.location}
                    onChange={(e) => handleLocationInput(e.target.value)}
                    placeholder="Location (e.g., Paris, Tokyo)"
                    className="trip-input"
                    required
                  />
                  {showLocationSuggestions && filteredLocations.length > 0 && (
                    <div className="location-suggestions">
                      {filteredLocations.slice(0, 8).map((loc, index) => (
                        <div
                          key={index}
                          className="location-suggestion-item"
                          onClick={() => selectLocation(loc)}
                        >
                          <span className="location-flag">{loc.flag}</span>
                          <span className="location-name">{loc.city}, {loc.country}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-row">
                <input
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => setTripData({ ...tripData, startDate: e.target.value })}
                  className="date-input"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={tripData.endDate}
                  onChange={(e) => setTripData({ ...tripData, endDate: e.target.value })}
                  className="date-input"
                  placeholder="End date"
                />
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Your Story</label>
              <textarea
                value={tripData.content}
                onChange={(e) => setTripData({ ...tripData, content: e.target.value })}
                placeholder="Share your travel experience... What made this trip special? Any tips for others? (Add #hashtags to make your post discoverable)"
                className="trip-textarea"
                rows={6}
              />
              <p className="form-hint">Add hashtags with #hashtag in your story</p>
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
              <button type="button" onClick={() => navigate(`/post/${postId}`)} className="cancel-btn">
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={!tripData.tripTitle.trim() || !tripData.location.trim()}
              >
                Update Trip
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default EditTrip;
