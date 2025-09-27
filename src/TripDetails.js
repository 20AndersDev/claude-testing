import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './TripDetails.css';

function TripDetails() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    const storedPosts = localStorage.getItem('tripPosts');
    if (storedPosts) {
      const posts = JSON.parse(storedPosts);
      const foundTrip = posts.find(post => post.id === parseInt(tripId));
      if (foundTrip) {
        setTrip(foundTrip);
      } else {
        navigate('/feed');
      }
    } else {
      navigate('/feed');
    }
  }, [tripId, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getActivityIcon = (type) => {
    const icons = {
      restaurant: '🍽️',
      bar: '🍺',
      monument: '🏛️',
      attraction: '🎢',
      hotel: '🏨',
      museum: '🏛️',
      park: '🌳',
      beach: '🏖️'
    };
    return icons[type] || '📍';
  };

  const getTransportIcon = (type) => {
    const icons = {
      plane: '✈️',
      train: '🚊',
      car: '🚗',
      bus: '🚌',
      boat: '🛥️',
      bike: '🚴',
      walking: '🚶',
      taxi: '🚕',
      metro: '🚇'
    };
    return icons[type] || '🚗';
  };

  const calculateCosts = () => {
    let activityCost = 0;
    let transportCost = 0;

    if (trip.activities) {
      trip.activities.forEach(activity => {
        if (activity.cost) activityCost += parseFloat(activity.cost);
      });
    }

    if (trip.transport) {
      trip.transport.forEach(t => {
        if (t.cost) transportCost += parseFloat(t.cost);
      });
    }

    return {
      activities: activityCost,
      transport: transportCost,
      total: activityCost + transportCost
    };
  };

  const getDurationText = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  };

  const renderStars = (rating) => {
    return (
      <div className="rating-display">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`rating-star ${star <= rating ? 'filled' : 'empty'}`}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const getAverageRating = (activities) => {
    const ratedActivities = activities.filter(a => a.rating > 0);
    if (ratedActivities.length === 0) return 0;
    const sum = ratedActivities.reduce((acc, activity) => acc + activity.rating, 0);
    return (sum / ratedActivities.length).toFixed(1);
  };

  if (!trip) {
    return (
      <>
        <Navbar />
        <div className="trip-details-loading">
          <div className="loading-spinner">🧳</div>
          <p>Loading trip details...</p>
        </div>
      </>
    );
  }

  const sortedActivities = trip.activities ?
    [...trip.activities].sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    }) : [];

  return (
    <>
      <Navbar />
      <div className="trip-details">
        <button
          className="back-btn"
          onClick={() => navigate('/feed')}
          title="Back to Feed"
        >
          ←
        </button>

        <div className="trip-details-container">
          <div className="trip-hero">
            <div className="trip-hero-content">
              <h1 className="trip-hero-title">🗺️ {trip.tripTitle}</h1>
              <div className="trip-hero-info">
                <div className="trip-hero-location">📍 {trip.location}</div>
                <div className="trip-hero-dates">
                  {formatDate(trip.startDate)}
                  {trip.startDate && trip.endDate && ' - '}
                  {formatDate(trip.endDate)}
                  {getDurationText(trip.startDate, trip.endDate) &&
                    ` (${getDurationText(trip.startDate, trip.endDate)})`
                  }
                </div>
                {sortedActivities.length > 0 && getAverageRating(sortedActivities) > 0 && (
                  <div className="trip-hero-rating">
                    <span className="rating-label">Overall Rating:</span>
                    <div className="hero-rating-display">
                      {renderStars(Math.round(getAverageRating(sortedActivities)))}
                      <span className="rating-value">{getAverageRating(sortedActivities)}/5</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="trip-content-section">
            <h2>Trip Story</h2>
            <div className="trip-story">
              <p>{trip.content}</p>
            </div>
          </div>

          {sortedActivities.length > 0 && (
            <div className="timeline-section">
              <h2>Timeline</h2>
              <div className="timeline">
                {sortedActivities.map((activity, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">
                      <span className="timeline-icon">
                        {getActivityIcon(activity.type)}
                      </span>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <div className="activity-header-left">
                          <h3 className="activity-name">{activity.name}</h3>
                          {activity.rating > 0 && (
                            <div className="activity-rating">
                              {renderStars(activity.rating)}
                              <span className="rating-text">({activity.rating}/5)</span>
                            </div>
                          )}
                        </div>
                        {activity.time && (
                          <span className="activity-time">
                            {formatTime(activity.time)}
                          </span>
                        )}
                      </div>
                      <div className="activity-type">
                        {getActivityIcon(activity.type)} {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                        {activity.cost && (
                          <span className="activity-cost-badge">${activity.cost}</span>
                        )}
                      </div>
                      {activity.description && (
                        <p className="activity-description">{activity.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trip.transport && trip.transport.length > 0 && (
            <div className="transport-section">
              <h2>🚗 Transportation</h2>
              <div className="transport-timeline">
                {trip.transport.map((transport, index) => (
                  <div key={index} className="transport-item">
                    <div className="transport-icon-container">
                      <span className="transport-icon-large">
                        {getTransportIcon(transport.type)}
                      </span>
                    </div>
                    <div className="transport-content">
                      <div className="transport-header">
                        <h3 className="transport-route">{transport.from} → {transport.to}</h3>
                        {transport.time && (
                          <span className="transport-time">
                            {formatTime(transport.time)}
                          </span>
                        )}
                      </div>
                      <div className="transport-type">
                        {getTransportIcon(transport.type)} {transport.type.charAt(0).toUpperCase() + transport.type.slice(1)}
                        {transport.cost && (
                          <span className="transport-cost-badge">${transport.cost}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {calculateCosts().total > 0 && (
            <div className="cost-breakdown-section">
              <h2>💰 Cost Breakdown</h2>
              <div className="cost-breakdown">
                <div className="cost-item">
                  <span className="cost-category">🍽️ Activities & Places</span>
                  <span className="cost-amount">${calculateCosts().activities.toFixed(2)}</span>
                </div>
                <div className="cost-item">
                  <span className="cost-category">🚗 Transportation</span>
                  <span className="cost-amount">${calculateCosts().transport.toFixed(2)}</span>
                </div>
                <div className="cost-total">
                  <span className="cost-category">💎 Total Trip Cost</span>
                  <span className="cost-amount">${calculateCosts().total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="trip-stats">
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div className="stat-info">
                <div className="stat-number">{sortedActivities.length}</div>
                <div className="stat-label">Places Visited</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🍽️</div>
              <div className="stat-info">
                <div className="stat-number">
                  {sortedActivities.filter(a => a.type === 'restaurant').length}
                </div>
                <div className="stat-label">Restaurants</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏛️</div>
              <div className="stat-info">
                <div className="stat-number">
                  {sortedActivities.filter(a => ['monument', 'museum', 'attraction'].includes(a.type)).length}
                </div>
                <div className="stat-label">Attractions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TripDetails;