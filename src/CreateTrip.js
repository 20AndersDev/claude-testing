import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useLoadScript } from '@react-google-maps/api';
import Navbar from './Navbar';
import './CreateTrip.css';

const libraries = ['places'];

function CreateTrip() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState({
    content: '',
    tripTitle: '',
    location: '',
    country: '',
    startDate: '',
    endDate: '',
    priceRange: '1000',
    images: []
  });

  const [activities, setActivities] = useState([
    { type: 'restaurant', name: '', description: '', time: '', rating: 0, cost: '', images: [] }
  ]);

  const [accommodations, setAccommodations] = useState([
    { type: 'hotel', name: '', address: '', description: '', checkIn: '', checkOut: '', cost: '', rating: 0, images: [] }
  ]);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [activityPlaceSuggestions, setActivityPlaceSuggestions] = useState([]);
  const [showActivitySuggestions, setShowActivitySuggestions] = useState(null);
  const [accommodationPlaceSuggestions, setAccommodationPlaceSuggestions] = useState([]);
  const [showAccommodationSuggestions, setShowAccommodationSuggestions] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_PLACES_API_KEY,
    libraries,
  });

  const handleTripDataChange = (field, value) => {
    setTripData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (file, section, index = null) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = {
        id: Date.now(),
        url: e.target.result,
        name: file.name
      };

      if (section === 'trip') {
        setTripData(prev => ({
          ...prev,
          images: [...prev.images, imageData]
        }));
      } else if (section === 'activities' && index !== null) {
        setActivities(prev => prev.map((activity, i) =>
          i === index ? { ...activity, images: [...activity.images, imageData] } : activity
        ));
      } else if (section === 'accommodations' && index !== null) {
        setAccommodations(prev => prev.map((acc, i) =>
          i === index ? { ...acc, images: [...acc.images, imageData] } : acc
        ));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (section, imageId, index = null) => {
    if (section === 'trip') {
      setTripData(prev => ({
        ...prev,
        images: prev.images.filter(img => img.id !== imageId)
      }));
    } else if (section === 'activities' && index !== null) {
      setActivities(prev => prev.map((activity, i) =>
        i === index ? { ...activity, images: activity.images.filter(img => img.id !== imageId) } : activity
      ));
    } else if (section === 'accommodations' && index !== null) {
      setAccommodations(prev => prev.map((acc, i) =>
        i === index ? { ...acc, images: acc.images.filter(img => img.id !== imageId) } : acc
      ));
    }
  };

  const updateActivity = (index, field, value) => {
    setActivities(prev => prev.map((activity, i) =>
      i === index ? { ...activity, [field]: value } : activity
    ));

    // Search for places when name field changes
    if (field === 'name' && value.trim().length > 0 && isLoaded) {
      searchPlacesForActivity(value, index);
    } else if (field === 'name' && value.trim().length === 0) {
      setActivityPlaceSuggestions([]);
      setShowActivitySuggestions(null);
    }
  };

  const searchPlacesForActivity = async (query, activityIndex) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    try {
      const request = {
        input: query,
        includedPrimaryTypes: ['establishment', 'tourist_attraction'],
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
        setActivityPlaceSuggestions(formattedResults);
        setShowActivitySuggestions(activityIndex);
      } else {
        setActivityPlaceSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching place suggestions:', error);
      // Fallback to old AutocompleteService
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
            types: ['establishment'],
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const formattedResults = predictions.slice(0, 5).map(pred => ({
                place_id: pred.place_id,
                name: pred.structured_formatting.main_text,
                address: pred.structured_formatting.secondary_text || ''
              }));
              setActivityPlaceSuggestions(formattedResults);
              setShowActivitySuggestions(activityIndex);
            }
          }
        );
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  };

  const selectPlaceForActivity = (index, place) => {
    updateActivity(index, 'name', place.name);
    setActivityPlaceSuggestions([]);
    setShowActivitySuggestions(null);
  };

  const addActivity = () => {
    setActivities(prev => [...prev, {
      type: 'restaurant',
      name: '',
      description: '',
      time: '',
      rating: 0,
      cost: '',
      images: []
    }]);
  };

  const removeActivity = (index) => {
    setActivities(prev => prev.filter((_, i) => i !== index));
  };

  const updateAccommodation = (index, field, value) => {
    setAccommodations(prev => prev.map((acc, i) =>
      i === index ? { ...acc, [field]: value } : acc
    ));

    // Search for lodging places when name field changes
    if (field === 'name' && value.trim().length > 0 && isLoaded) {
      searchPlacesForAccommodation(value, index);
    } else if (field === 'name' && value.trim().length === 0) {
      setAccommodationPlaceSuggestions([]);
      setShowAccommodationSuggestions(null);
    }
  };

  const searchPlacesForAccommodation = async (query, accommodationIndex) => {
    if (!window.google || !window.google.maps || !window.google.maps.places) return;

    try {
      const request = {
        input: query,
        includedPrimaryTypes: ['lodging', 'hotel', 'hostel', 'guest_house', 'resort_hotel'],
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
        setAccommodationPlaceSuggestions(formattedResults);
        setShowAccommodationSuggestions(accommodationIndex);
      } else {
        setAccommodationPlaceSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching accommodation suggestions:', error);
      // Fallback to old AutocompleteService
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          {
            input: query,
            types: ['lodging'],
          },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
              const formattedResults = predictions.slice(0, 5).map(pred => ({
                place_id: pred.place_id,
                name: pred.structured_formatting.main_text,
                address: pred.structured_formatting.secondary_text || ''
              }));
              setAccommodationPlaceSuggestions(formattedResults);
              setShowAccommodationSuggestions(accommodationIndex);
            }
          }
        );
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
      }
    }
  };

  const selectPlaceForAccommodation = (index, place) => {
    setAccommodations(prev => prev.map((acc, i) =>
      i === index ? {
        ...acc,
        name: place.name,
        address: place.address || acc.address
      } : acc
    ));
    setAccommodationPlaceSuggestions([]);
    setShowAccommodationSuggestions(null);
  };

  const addAccommodation = () => {
    setAccommodations(prev => [...prev, {
      type: 'hotel',
      name: '',
      address: '',
      description: '',
      checkIn: '',
      checkOut: '',
      cost: '',
      rating: 0,
      images: []
    }]);
  };

  const removeAccommodation = (index) => {
    setAccommodations(prev => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to create a post');
        return;
      }

      // Fetch user's profile to get display name and avatar
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .single();

      const displayName = profileData?.full_name || profileData?.username || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
      const avatarUrl = profileData?.avatar_url || user.user_metadata?.avatar_url || null;

      const completeTrip = {
        user_id: user.id,
        author: displayName,
        author_avatar: avatarUrl,
        trip_title: tripData.tripTitle,
        content: tripData.content.trim() || `Just visited ${tripData.tripTitle}!`,
        location: tripData.location.trim() || 'Unknown location',
        country: tripData.country,
        start_date: tripData.startDate || null,
        end_date: tripData.endDate || null,
        price_range: parseInt(tripData.priceRange) || 1,
        images: tripData.images || [],
        activities: activities.filter(activity => activity.name.trim()),
        accommodations: accommodations.filter(acc => acc.name.trim()),
        likes: 0,
        comments: []
      };

      // Save post to Supabase
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

      // Update visited countries in database if country is selected
      if (tripData.country && user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('visited_countries')
          .eq('id', user.id)
          .single();

        const visitedCountries = profileData?.visited_countries || [];

        // Add country if not already in the list
        if (!visitedCountries.includes(tripData.country)) {
          const updatedCountries = [...visitedCountries, tripData.country];

          await supabase
            .from('profiles')
            .update({ visited_countries: updatedCountries })
            .eq('id', user.id);
        }
      }

      // Navigate back to feed
      navigate('/feed');
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('An error occurred while creating your post');
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return tripData.tripTitle && tripData.tripTitle.trim().length > 0 && tripData.country && tripData.country.trim().length > 0;
      case 2:
      case 3:
        return true; // All other steps are optional
      default:
        return false;
    }
  };

  const StarRating = ({ rating, onRatingChange }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => onRatingChange(star)}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  const ImageUploader = ({ images, onImageUpload, onImageRemove, label }) => {
    return (
      <div className="image-uploader">
        <label className="upload-label">{label}</label>
        <div className="images-grid">
          {images.map((image) => (
            <div key={image.id} className="image-preview">
              <img src={image.url} alt={image.name} />
              <button
                type="button"
                className="remove-image-btn"
                onClick={() => onImageRemove(image.id)}
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
              onChange={(e) => {
                Array.from(e.target.files).forEach(file => onImageUpload(file));
              }}
              style={{ display: 'none' }}
            />
            <span>📷 Add Photos</span>
          </label>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>✈️ Tell us about your trip</h2>
            <div className="form-group">
              <label>Trip Title <span className="required">*</span></label>
              <input
                type="text"
                value={tripData.tripTitle}
                onChange={(e) => handleTripDataChange('tripTitle', e.target.value)}
                placeholder="e.g., Weekend in Paris"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Country <span className="required">*</span></label>
              <select
                value={tripData.country}
                onChange={(e) => handleTripDataChange('country', e.target.value)}
                className="form-input"
                required
              >
                <option value="">Select a country</option>
                <option value="Norway">Norway</option>
                <option value="Sweden">Sweden</option>
                <option value="Denmark">Denmark</option>
                <option value="Finland">Finland</option>
                <option value="Iceland">Iceland</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Ireland">Ireland</option>
                <option value="France">France</option>
                <option value="Germany">Germany</option>
                <option value="Spain">Spain</option>
                <option value="Italy">Italy</option>
                <option value="Portugal">Portugal</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Belgium">Belgium</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Austria">Austria</option>
                <option value="Greece">Greece</option>
                <option value="Poland">Poland</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Mexico">Mexico</option>
                <option value="Brazil">Brazil</option>
                <option value="Argentina">Argentina</option>
                <option value="Japan">Japan</option>
                <option value="China">China</option>
                <option value="South Korea">South Korea</option>
                <option value="Thailand">Thailand</option>
                <option value="Vietnam">Vietnam</option>
                <option value="Australia">Australia</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Egypt">Egypt</option>
                <option value="Morocco">Morocco</option>
                <option value="South Africa">South Africa</option>
              </select>
            </div>
            <div className="form-group">
              <label>City/Location <span className="optional">(optional)</span></label>
              <input
                type="text"
                value={tripData.location}
                onChange={(e) => handleTripDataChange('location', e.target.value)}
                placeholder="e.g., Paris"
                className="form-input"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date <span className="optional">(optional)</span></label>
                <input
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => handleTripDataChange('startDate', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>End Date <span className="optional">(optional)</span></label>
                <input
                  type="date"
                  value={tripData.endDate}
                  onChange={(e) => handleTripDataChange('endDate', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Price Range <span className="optional">(optional)</span></label>
              <div className="price-range-slider">
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={tripData.priceRange}
                  onChange={(e) => handleTripDataChange('priceRange', e.target.value)}
                  className="range-input"
                />
                <div className="price-range-labels">
                  <span className={tripData.priceRange == 1 ? 'active' : ''}>$</span>
                  <span className={tripData.priceRange == 2 ? 'active' : ''}>$$</span>
                  <span className={tripData.priceRange == 3 ? 'active' : ''}>$$$</span>
                  <span className={tripData.priceRange == 4 ? 'active' : ''}>$$$$</span>
                </div>
                <div className="price-range-description">
                  {tripData.priceRange == 1 && 'Budget (Under $500)'}
                  {tripData.priceRange == 2 && 'Moderate ($500-$1500)'}
                  {tripData.priceRange == 3 && 'Expensive ($1500-$3000)'}
                  {tripData.priceRange == 4 && 'Luxury (Over $3000)'}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Trip Story <span className="optional">(optional)</span></label>
              <textarea
                value={tripData.content}
                onChange={(e) => handleTripDataChange('content', e.target.value)}
                placeholder="Share your amazing travel experience..."
                className="form-textarea"
                rows="4"
              />
            </div>
            <ImageUploader
              images={tripData.images}
              onImageUpload={(file) => handleImageUpload(file, 'trip')}
              onImageRemove={(imageId) => removeImage('trip', imageId)}
              label="Trip Photos"
            />
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>🏨 Accommodations <span className="optional-step">(optional)</span></h2>
            {accommodations.map((acc, index) => (
              <div key={index} className="accommodation-card">
                {accommodations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAccommodation(index)}
                    className="remove-btn-top"
                  >
                    ✕
                  </button>
                )}
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={acc.type}
                    onChange={(e) => updateAccommodation(index, 'type', e.target.value)}
                    className="form-input"
                  >
                    <option value="hotel">🏨 Hotel</option>
                    <option value="airbnb">🏠 Airbnb</option>
                    <option value="hostel">🏃 Hostel</option>
                    <option value="resort">🏖️ Resort</option>
                    <option value="guesthouse">🏡 Guesthouse</option>
                    <option value="apartment">🏢 Apartment</option>
                    <option value="villa">🏘️ Villa</option>
                    <option value="camping">⛺ Camping</option>
                  </select>
                </div>
                <div className="form-group activity-name-field">
                  <label>Accommodation</label>
                  <div className="autocomplete-wrapper">
                    <input
                      type="search"
                      name={`accommodation-place-${index}`}
                      value={acc.name}
                      onChange={(e) => updateAccommodation(index, 'name', e.target.value)}
                      onFocus={() => acc.name.trim().length > 0 && setShowAccommodationSuggestions(index)}
                      onBlur={() => setTimeout(() => setShowAccommodationSuggestions(null), 200)}
                      placeholder="Search for accommodation..."
                      className="form-input"
                      autoComplete="off"
                      data-lpignore="true"
                    />
                    {showAccommodationSuggestions === index && accommodationPlaceSuggestions.length > 0 && (
                      <div className="place-suggestions-dropdown">
                        {accommodationPlaceSuggestions.map((place) => (
                          <div
                            key={place.place_id}
                            className="place-suggestion-item"
                            onClick={() => selectPlaceForAccommodation(index, place)}
                          >
                            <div className="place-suggestion-icon">🏨</div>
                            <div className="place-suggestion-info">
                              <div className="place-suggestion-name">{place.name}</div>
                              {place.address && (
                                <div className="place-suggestion-address">{place.address}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={acc.address}
                    onChange={(e) => updateAccommodation(index, 'address', e.target.value)}
                    placeholder="Full address"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={acc.description}
                    onChange={(e) => updateAccommodation(index, 'description', e.target.value)}
                    placeholder="Tell us about your stay..."
                    className="form-textarea"
                    rows="4"
                  />
                </div>
                <div className="activity-extras">
                  <div className="activity-extras-row">
                    <div className="form-group">
                      <label>Rating</label>
                      <StarRating
                        rating={acc.rating}
                        onRatingChange={(rating) => updateAccommodation(index, 'rating', rating)}
                      />
                    </div>
                    <ImageUploader
                      images={acc.images}
                      onImageUpload={(file) => handleImageUpload(file, 'accommodations', index)}
                      onImageRemove={(imageId) => removeImage('accommodations', imageId, index)}
                      label="Photos"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addAccommodation} className="add-btn">
              + Add Another Accommodation
            </button>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>🎯 Activities & Attractions <span className="optional-step">(optional)</span></h2>
            {activities.map((activity, index) => (
              <div key={index} className="activity-card">
                {activities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeActivity(index)}
                    className="remove-btn-top"
                  >
                    ✕
                  </button>
                )}
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={activity.type}
                    onChange={(e) => updateActivity(index, 'type', e.target.value)}
                    className="form-input"
                  >
                    <option value="restaurant">🍽️ Restaurant</option>
                    <option value="bar">🍺 Bar/Pub</option>
                    <option value="monument">🏛️ Monument</option>
                    <option value="attraction">🎢 Attraction</option>
                    <option value="museum">🖼️ Museum</option>
                    <option value="park">🌳 Park</option>
                    <option value="beach">🏖️ Beach</option>
                    <option value="shopping">🛍️ Shopping</option>
                    <option value="nightlife">🌃 Nightlife</option>
                  </select>
                </div>
                <div className="form-group activity-name-field">
                  <label>Place</label>
                  <div className="autocomplete-wrapper">
                    <input
                      type="search"
                      name={`activity-place-${index}`}
                      value={activity.name}
                      onChange={(e) => updateActivity(index, 'name', e.target.value)}
                      onFocus={() => activity.name.trim().length > 0 && setShowActivitySuggestions(index)}
                      onBlur={() => setTimeout(() => setShowActivitySuggestions(null), 200)}
                      placeholder="Search for a place..."
                      className="form-input"
                      autoComplete="off"
                      data-lpignore="true"
                    />
                    {showActivitySuggestions === index && activityPlaceSuggestions.length > 0 && (
                      <div className="place-suggestions-dropdown">
                        {activityPlaceSuggestions.map((place) => (
                          <div
                            key={place.place_id}
                            className="place-suggestion-item"
                            onClick={() => selectPlaceForActivity(index, place)}
                          >
                            <div className="place-suggestion-icon">📍</div>
                            <div className="place-suggestion-info">
                              <div className="place-suggestion-name">{place.name}</div>
                              {place.address && (
                                <div className="place-suggestion-address">{place.address}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={activity.description}
                    onChange={(e) => updateActivity(index, 'description', e.target.value)}
                    placeholder="What made this place special?"
                    className="form-textarea"
                    rows="4"
                  />
                </div>
                <div className="activity-extras">
                  <div className="activity-extras-row">
                    <div className="form-group">
                      <label>Rating</label>
                      <StarRating
                        rating={activity.rating}
                        onRatingChange={(rating) => updateActivity(index, 'rating', rating)}
                      />
                    </div>
                    <ImageUploader
                      images={activity.images}
                      onImageUpload={(file) => handleImageUpload(file, 'activities', index)}
                      onImageRemove={(imageId) => removeImage('activities', imageId, index)}
                      label="Photos"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addActivity} className="add-btn">
              + Add Another Activity
            </button>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="create-trip">
        <div className="create-trip-container">
          <div className="progress-bar">
            <div className="progress-steps">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
                >
                  <span className="step-number">{step}</span>
                  <span className="step-label">
                    {step === 1 && 'Trip Info'}
                    {step === 2 && 'Stay'}
                    {step === 3 && 'Activities'}
                  </span>
                </div>
              ))}
            </div>
            <div className="progress-line">
              <div
                className="progress-fill"
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="step-container">
            {renderStep()}
          </div>

          <div className="navigation-buttons">
            <button
              type="button"
              onClick={prevStep}
              className="nav-btn secondary"
              disabled={currentStep === 1}
            >
              Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="nav-btn primary"
                disabled={!isStepValid()}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="nav-btn primary submit"
                disabled={!isStepValid()}
              >
                Share Trip
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateTrip;