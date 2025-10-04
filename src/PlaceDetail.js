import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';
import Navbar from './Navbar';
import './PlaceDetail.css';

const libraries = ['places'];

function PlaceDetail() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_PLACES_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (isLoaded && placeId) {
      fetchPlaceDetails();
    }
  }, [isLoaded, placeId]);

  const fetchPlaceDetails = async () => {
    if (!window.google || !window.google.maps) return;

    try {
      const map = new window.google.maps.Map(document.createElement('div'));
      const service = new window.google.maps.places.PlacesService(map);

      service.getDetails(
        {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'rating', 'photos', 'opening_hours', 'geometry', 'types', 'reviews'],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPlaceDetails(place);
          } else {
            console.error('Error fetching place details:', status);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="place-detail-loading">
          <p>Loading place details...</p>
        </div>
      </>
    );
  }

  if (!placeDetails) {
    return (
      <>
        <Navbar />
        <div className="place-detail-error">
          <p>Place not found</p>
          <button onClick={() => navigate('/feed')}>Back to Feed</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="place-detail-page">
        <div className="place-detail-container">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>

          {placeDetails.photos && placeDetails.photos.length > 0 && (
            <div className="place-hero-image">
              <img src={placeDetails.photos[0].getUrl({ maxWidth: 1200 })} alt={placeDetails.name} />
            </div>
          )}

          <div className="place-detail-content">
            <div className="place-header">
              <h1>{placeDetails.name}</h1>
              {placeDetails.rating && (
                <div className="place-rating">
                  <span className="rating-stars">⭐</span>
                  <span className="rating-value">{placeDetails.rating}</span>
                </div>
              )}
            </div>

            <div className="place-info-grid">
              {placeDetails.formatted_address && (
                <div className="info-item">
                  <span className="info-icon">📍</span>
                  <div className="info-content">
                    <div className="info-label">Address</div>
                    <div className="info-value">{placeDetails.formatted_address}</div>
                  </div>
                </div>
              )}

              {placeDetails.formatted_phone_number && (
                <div className="info-item">
                  <span className="info-icon">📞</span>
                  <div className="info-content">
                    <div className="info-label">Phone</div>
                    <div className="info-value">{placeDetails.formatted_phone_number}</div>
                  </div>
                </div>
              )}

              {placeDetails.website && (
                <div className="info-item">
                  <span className="info-icon">🌐</span>
                  <div className="info-content">
                    <div className="info-label">Website</div>
                    <a href={placeDetails.website} target="_blank" rel="noopener noreferrer" className="info-value info-link">
                      Visit Website
                    </a>
                  </div>
                </div>
              )}

              {placeDetails.opening_hours && (
                <div className="info-item">
                  <span className="info-icon">🕐</span>
                  <div className="info-content">
                    <div className="info-label">Hours</div>
                    <div className="info-value">
                      {placeDetails.opening_hours.isOpen() ? (
                        <span className="status-open">Open Now</span>
                      ) : (
                        <span className="status-closed">Closed</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {placeDetails.opening_hours?.weekday_text && (
              <div className="opening-hours">
                <h3>Opening Hours</h3>
                <div className="hours-list">
                  {placeDetails.opening_hours.weekday_text.map((day, index) => (
                    <div key={index} className="hour-item">{day}</div>
                  ))}
                </div>
              </div>
            )}

            {placeDetails.reviews && placeDetails.reviews.length > 0 && (
              <div className="place-reviews">
                <h3>Reviews</h3>
                <div className="reviews-list">
                  {placeDetails.reviews.slice(0, 3).map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <div className="review-author">{review.author_name}</div>
                        <div className="review-rating">
                          {'⭐'.repeat(review.rating)}
                        </div>
                      </div>
                      <div className="review-text">{review.text}</div>
                      <div className="review-time">{review.relative_time_description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {placeDetails.photos && placeDetails.photos.length > 1 && (
              <div className="place-photos">
                <h3>Photos</h3>
                <div className="photos-grid">
                  {placeDetails.photos.slice(1, 7).map((photo, index) => (
                    <div key={index} className="photo-item">
                      <img src={photo.getUrl({ maxWidth: 400 })} alt={`${placeDetails.name} ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default PlaceDetail;
