import React, { useState } from 'react';
import './CreatePost.css';

function CreatePost({ onAddPost }) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [tripTitle, setTripTitle] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activities, setActivities] = useState([{ type: 'restaurant', name: '', description: '', time: '', rating: 0, cost: '' }]);
  const [transport, setTransport] = useState([{ type: 'plane', from: '', to: '', time: '', cost: '' }]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [bookingLink, setBookingLink] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim() && tripTitle.trim() && location.trim()) {
      const tripPost = {
        content,
        tripTitle,
        location,
        startDate,
        endDate,
        activities: activities.filter(activity => activity.name.trim()),
        transport: transport.filter(t => t.from.trim() && t.to.trim()),
        hashtags: hashtags,
        bookingLink: bookingLink.trim()
      };
      onAddPost(tripPost);
      setContent('');
      setTripTitle('');
      setLocation('');
      setStartDate('');
      setEndDate('');
      setActivities([{ type: 'restaurant', name: '', description: '', time: '', rating: 0, cost: '' }]);
      setTransport([{ type: 'plane', from: '', to: '', time: '', cost: '' }]);
      setHashtags([]);
      setHashtagInput('');
      setBookingLink('');
      setIsExpanded(false);
    }
  };

  const handleTextareaClick = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setContent('');
    setTripTitle('');
    setLocation('');
    setStartDate('');
    setEndDate('');
    setActivities([{ type: 'restaurant', name: '', description: '', time: '', rating: 0, cost: '' }]);
    setTransport([{ type: 'plane', from: '', to: '', time: '', cost: '' }]);
    setHashtags([]);
    setHashtagInput('');
    setBookingLink('');
    setIsExpanded(false);
  };

  const handleHashtagInput = (e) => {
    const value = e.target.value;
    if (value.endsWith(' ') || value.endsWith(',')) {
      const tag = value.slice(0, -1).trim().replace('#', '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
      }
      setHashtagInput('');
    } else {
      setHashtagInput(value);
    }
  };

  const removeHashtag = (tagToRemove) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const addActivity = () => {
    setActivities([...activities, { type: 'restaurant', name: '', description: '', time: '', rating: 0, cost: '' }]);
  };

  const addTransport = () => {
    setTransport([...transport, { type: 'plane', from: '', to: '', time: '', cost: '' }]);
  };

  const updateTransport = (index, field, value) => {
    const updated = transport.map((t, i) =>
      i === index ? { ...t, [field]: value } : t
    );
    setTransport(updated);
  };

  const removeTransport = (index) => {
    setTransport(transport.filter((_, i) => i !== index));
  };

  const updateActivity = (index, field, value) => {
    const updated = activities.map((activity, i) =>
      i === index ? { ...activity, [field]: value } : activity
    );
    setActivities(updated);
  };

  const removeActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const StarRating = ({ rating, onRatingChange, activityIndex }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star ${star <= rating ? 'filled' : ''}`}
            onClick={() => onRatingChange(activityIndex, 'rating', star)}
          >
            ⭐
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="create-post">
      <div className="create-post-header">
        <div className="user-avatar">🧳</div>
        <form onSubmit={handleSubmit} className="post-form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onClick={handleTextareaClick}
            placeholder="Share your travel experience..."
            className={`post-textarea ${isExpanded ? 'expanded' : ''}`}
            rows={isExpanded ? 3 : 1}
          />
          {isExpanded && (
            <div className="trip-details">
              <div className="form-row">
                <input
                  type="text"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  placeholder="Trip title (e.g., Weekend in Paris)"
                  className="trip-input"
                />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location"
                  className="trip-input"
                />
              </div>
              <div className="form-row">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>

              <div className="activities-section">
                <h4>Activities & Places</h4>
                {activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <select
                      value={activity.type}
                      onChange={(e) => updateActivity(index, 'type', e.target.value)}
                      className="activity-select"
                    >
                      <option value="restaurant">🍽️ Restaurant</option>
                      <option value="bar">🍺 Bar</option>
                      <option value="monument">🏛️ Monument</option>
                      <option value="attraction">🎢 Attraction</option>
                      <option value="hotel">🏨 Hotel</option>
                      <option value="museum">🏛️ Museum</option>
                      <option value="park">🌳 Park</option>
                      <option value="beach">🏖️ Beach</option>
                    </select>
                    <input
                      type="text"
                      value={activity.name}
                      onChange={(e) => updateActivity(index, 'name', e.target.value)}
                      placeholder="Name"
                      className="activity-input"
                    />
                    <input
                      type="text"
                      value={activity.description}
                      onChange={(e) => updateActivity(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="activity-input"
                    />
                    <input
                      type="time"
                      value={activity.time}
                      onChange={(e) => updateActivity(index, 'time', e.target.value)}
                      className="time-input"
                    />
                    <input
                      type="number"
                      value={activity.cost}
                      onChange={(e) => updateActivity(index, 'cost', e.target.value)}
                      placeholder="Cost ($)"
                      className="cost-input"
                      min="0"
                      step="0.01"
                    />
                    <div className="rating-container">
                      <label className="rating-label">Rating:</label>
                      <StarRating
                        rating={activity.rating}
                        onRatingChange={updateActivity}
                        activityIndex={index}
                      />
                    </div>
                    {activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeActivity(index)}
                        className="remove-activity-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addActivity} className="add-activity-btn">
                  + Add Activity
                </button>
              </div>

              <div className="transport-section">
                <h4>🚗 Transportation</h4>
                {transport.map((t, index) => (
                  <div key={index} className="transport-item">
                    <select
                      value={t.type}
                      onChange={(e) => updateTransport(index, 'type', e.target.value)}
                      className="transport-select"
                    >
                      <option value="plane">✈️ Plane</option>
                      <option value="train">🚊 Train</option>
                      <option value="car">🚗 Car</option>
                      <option value="bus">🚌 Bus</option>
                      <option value="boat">🛥️ Boat</option>
                      <option value="bike">🚴 Bike</option>
                      <option value="walking">🚶 Walking</option>
                      <option value="taxi">🚕 Taxi</option>
                      <option value="metro">🚇 Metro</option>
                    </select>
                    <input
                      type="text"
                      value={t.from}
                      onChange={(e) => updateTransport(index, 'from', e.target.value)}
                      placeholder="From"
                      className="transport-input"
                    />
                    <input
                      type="text"
                      value={t.to}
                      onChange={(e) => updateTransport(index, 'to', e.target.value)}
                      placeholder="To"
                      className="transport-input"
                    />
                    <input
                      type="time"
                      value={t.time}
                      onChange={(e) => updateTransport(index, 'time', e.target.value)}
                      className="time-input"
                    />
                    <input
                      type="number"
                      value={t.cost}
                      onChange={(e) => updateTransport(index, 'cost', e.target.value)}
                      placeholder="Cost ($)"
                      className="cost-input"
                      min="0"
                      step="0.01"
                    />
                    {transport.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTransport(index)}
                        className="remove-transport-btn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addTransport} className="add-transport-btn">
                  + Add Transportation
                </button>
              </div>

              <div className="hashtag-section">
                <h4>#️⃣ Hashtags</h4>
                <div className="hashtag-input-container">
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={handleHashtagInput}
                    placeholder="Add hashtags (press space or comma to add)"
                    className="hashtag-input"
                  />
                </div>
                {hashtags.length > 0 && (
                  <div className="hashtag-tags">
                    {hashtags.map((tag, index) => (
                      <div key={index} className="hashtag-tag">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeHashtag(tag)}
                          className="remove-hashtag-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="booking-link-section">
                <h4>🔗 Booking Link (Optional)</h4>
                <input
                  type="url"
                  value={bookingLink}
                  onChange={(e) => setBookingLink(e.target.value)}
                  placeholder="e.g., https://booking.com/hotel-name or https://airbnb.com/listing"
                  className="booking-link-input"
                />
                <p className="booking-hint">Share where you booked your accommodation, flights, or activities</p>
              </div>

              <div className="post-actions">
                <button type="button" onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="post-btn"
                  disabled={!content.trim() || !tripTitle.trim() || !location.trim()}
                >
                  Share Trip
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default CreatePost;