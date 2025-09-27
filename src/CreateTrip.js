import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './CreateTrip.css';

function CreateTrip() {
  const navigate = useNavigate();
  const [tripData, setTripData] = useState({
    content: '',
    tripTitle: '',
    location: '',
    startDate: '',
    endDate: '',
    images: []
  });

  const [activities, setActivities] = useState([
    { type: 'restaurant', name: '', description: '', time: '', rating: 0, cost: '', images: [] }
  ]);

  const [accommodations, setAccommodations] = useState([
    { type: 'hotel', name: '', address: '', checkIn: '', checkOut: '', cost: '', rating: 0, images: [] }
  ]);

  const [transport, setTransport] = useState([
    { type: 'plane', from: '', to: '', date: '', time: '', cost: '', images: [] }
  ]);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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
      } else if (section === 'transport' && index !== null) {
        setTransport(prev => prev.map((t, i) =>
          i === index ? { ...t, images: [...t.images, imageData] } : t
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
    } else if (section === 'transport' && index !== null) {
      setTransport(prev => prev.map((t, i) =>
        i === index ? { ...t, images: t.images.filter(img => img.id !== imageId) } : t
      ));
    }
  };

  const updateActivity = (index, field, value) => {
    setActivities(prev => prev.map((activity, i) =>
      i === index ? { ...activity, [field]: value } : activity
    ));
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
  };

  const addAccommodation = () => {
    setAccommodations(prev => [...prev, {
      type: 'hotel',
      name: '',
      address: '',
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

  const updateTransport = (index, field, value) => {
    setTransport(prev => prev.map((t, i) =>
      i === index ? { ...t, [field]: value } : t
    ));
  };

  const addTransport = () => {
    setTransport(prev => [...prev, {
      type: 'plane',
      from: '',
      to: '',
      date: '',
      time: '',
      cost: '',
      images: []
    }]);
  };

  const removeTransport = (index) => {
    setTransport(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const completeTrip = {
      ...tripData,
      // Provide defaults for required fields if empty
      content: tripData.content.trim() || `Just visited ${tripData.tripTitle}!`,
      location: tripData.location.trim() || 'Unknown location',
      activities: activities.filter(activity => activity.name.trim()),
      accommodations: accommodations.filter(acc => acc.name.trim()),
      transport: transport.filter(t => t.from.trim() && t.to.trim()),
      timestamp: new Date(),
      id: Date.now(),
      author: 'Current User',
      likes: 0,
      comments: []
    };

    // Save to localStorage
    const existingPosts = JSON.parse(localStorage.getItem('tripPosts') || '[]');
    const updatedPosts = [completeTrip, ...existingPosts];
    localStorage.setItem('tripPosts', JSON.stringify(updatedPosts));

    // Navigate back to feed
    navigate('/feed');
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
        return tripData.tripTitle.trim(); // Only title is required
      case 2:
      case 3:
      case 4:
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
              <label>Location <span className="optional">(optional)</span></label>
              <input
                type="text"
                value={tripData.location}
                onChange={(e) => handleTripDataChange('location', e.target.value)}
                placeholder="e.g., Paris, France"
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
            <h2>🎯 Activities & Attractions <span className="optional-step">(optional)</span></h2>
            {activities.map((activity, index) => (
              <div key={index} className="activity-card">
                <div className="card-header">
                  <select
                    value={activity.type}
                    onChange={(e) => updateActivity(index, 'type', e.target.value)}
                    className="form-select"
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
                  {activities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeActivity(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={activity.name}
                      onChange={(e) => updateActivity(index, 'name', e.target.value)}
                      placeholder="Place name"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost ($)</label>
                    <input
                      type="number"
                      value={activity.cost}
                      onChange={(e) => updateActivity(index, 'cost', e.target.value)}
                      placeholder="0.00"
                      className="form-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={activity.description}
                    onChange={(e) => updateActivity(index, 'description', e.target.value)}
                    placeholder="What made this place special?"
                    className="form-textarea"
                    rows="2"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Time Visited</label>
                    <input
                      type="time"
                      value={activity.time}
                      onChange={(e) => updateActivity(index, 'time', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Rating</label>
                    <StarRating
                      rating={activity.rating}
                      onRatingChange={(rating) => updateActivity(index, 'rating', rating)}
                    />
                  </div>
                </div>
                <ImageUploader
                  images={activity.images}
                  onImageUpload={(file) => handleImageUpload(file, 'activities', index)}
                  onImageRemove={(imageId) => removeImage('activities', imageId, index)}
                  label="Activity Photos"
                />
              </div>
            ))}
            <button type="button" onClick={addActivity} className="add-btn">
              + Add Another Activity
            </button>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>🏨 Accommodations <span className="optional-step">(optional)</span></h2>
            {accommodations.map((acc, index) => (
              <div key={index} className="accommodation-card">
                <div className="card-header">
                  <select
                    value={acc.type}
                    onChange={(e) => updateAccommodation(index, 'type', e.target.value)}
                    className="form-select"
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
                  {accommodations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAccommodation(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={acc.name}
                    onChange={(e) => updateAccommodation(index, 'name', e.target.value)}
                    placeholder="Accommodation name"
                    className="form-input"
                  />
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
                <div className="form-row">
                  <div className="form-group">
                    <label>Check-in</label>
                    <input
                      type="date"
                      value={acc.checkIn}
                      onChange={(e) => updateAccommodation(index, 'checkIn', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Check-out</label>
                    <input
                      type="date"
                      value={acc.checkOut}
                      onChange={(e) => updateAccommodation(index, 'checkOut', e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Total Cost ($)</label>
                    <input
                      type="number"
                      value={acc.cost}
                      onChange={(e) => updateAccommodation(index, 'cost', e.target.value)}
                      placeholder="Total stay cost"
                      className="form-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Rating</label>
                    <StarRating
                      rating={acc.rating}
                      onRatingChange={(rating) => updateAccommodation(index, 'rating', rating)}
                    />
                  </div>
                </div>
                <ImageUploader
                  images={acc.images}
                  onImageUpload={(file) => handleImageUpload(file, 'accommodations', index)}
                  onImageRemove={(imageId) => removeImage('accommodations', imageId, index)}
                  label="Accommodation Photos"
                />
              </div>
            ))}
            <button type="button" onClick={addAccommodation} className="add-btn">
              + Add Another Accommodation
            </button>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>🚗 Transportation <span className="optional-step">(optional)</span></h2>
            {transport.map((t, index) => (
              <div key={index} className="transport-card">
                <div className="card-header">
                  <select
                    value={t.type}
                    onChange={(e) => updateTransport(index, 'type', e.target.value)}
                    className="form-select"
                  >
                    <option value="plane">✈️ Flight</option>
                    <option value="train">🚊 Train</option>
                    <option value="car">🚗 Car</option>
                    <option value="bus">🚌 Bus</option>
                    <option value="boat">🛥️ Boat</option>
                    <option value="bike">🚴 Bike</option>
                    <option value="walking">🚶 Walking</option>
                    <option value="taxi">🚕 Taxi/Uber</option>
                    <option value="metro">🚇 Metro/Subway</option>
                    <option value="rental">🚙 Rental Car</option>
                  </select>
                  {transport.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTransport(index)}
                      className="remove-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>From</label>
                    <input
                      type="text"
                      value={t.from}
                      onChange={(e) => updateTransport(index, 'from', e.target.value)}
                      placeholder="Departure location"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>To</label>
                    <input
                      type="text"
                      value={t.to}
                      onChange={(e) => updateTransport(index, 'to', e.target.value)}
                      placeholder="Arrival location"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={t.date}
                      onChange={(e) => updateTransport(index, 'date', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={t.time}
                      onChange={(e) => updateTransport(index, 'time', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Cost ($)</label>
                    <input
                      type="number"
                      value={t.cost}
                      onChange={(e) => updateTransport(index, 'cost', e.target.value)}
                      placeholder="0.00"
                      className="form-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <ImageUploader
                  images={t.images}
                  onImageUpload={(file) => handleImageUpload(file, 'transport', index)}
                  onImageRemove={(imageId) => removeImage('transport', imageId, index)}
                  label="Transport Photos"
                />
              </div>
            ))}
            <button type="button" onClick={addTransport} className="add-btn">
              + Add Transportation
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
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
                >
                  <span className="step-number">{step}</span>
                  <span className="step-label">
                    {step === 1 && 'Trip Info'}
                    {step === 2 && 'Activities'}
                    {step === 3 && 'Stay'}
                    {step === 4 && 'Transport'}
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
              ← Previous
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="nav-btn primary"
                disabled={!isStepValid()}
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="nav-btn primary submit"
                disabled={!isStepValid()}
              >
                🚀 Share Trip
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateTrip;