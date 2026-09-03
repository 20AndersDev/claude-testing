import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './PostModal.css';

function PostModal({ post, onClose, onLike, onComment }) {
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLike = () => {
    onLike(post.id);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return 'Just now';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const renderTextWithHashtags = (text) => {
    if (!text) return null;

    // Regex to match hashtags (#word) and mentions (@username)
    const hashtagRegex = /(#[\w]+)/g;
    const mentionRegex = /(@[\w]+)/g;
    const combinedRegex = /(#[\w]+|@[\w]+)/g;
    const parts = text.split(combinedRegex);

    return parts.map((part, index) => {
      if (part.match(hashtagRegex)) {
        const hashtag = part.substring(1); // Remove the # symbol
        return (
          <span
            key={index}
            className="hashtag-link"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              navigate(`/hashtag/${hashtag}`);
            }}
          >
            {part}
          </span>
        );
      } else if (part.match(mentionRegex)) {
        const username = part.substring(1); // Remove the @ symbol
        return (
          <span
            key={index}
            className="mention-link"
            onClick={async (e) => {
              e.stopPropagation();
              // Fetch user ID from username
              try {
                const { data: userData } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('username', username)
                  .single();

                if (userData) {
                  onClose();
                  if (currentUserId === userData.id) {
                    navigate('/profile');
                  } else {
                    navigate(`/profile/${userData.id}`);
                  }
                }
              } catch (error) {
                console.error('Error fetching user:', error);
              }
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const calculateTotalCost = () => {
    let total = 0;
    if (post.activities) {
      post.activities.forEach(activity => {
        if (activity.cost) total += parseFloat(activity.cost);
      });
    }
    if (post.transport) {
      post.transport.forEach(t => {
        if (t.cost) total += parseFloat(t.cost);
      });
    }
    if (post.accommodations) {
      post.accommodations.forEach(acc => {
        if (acc.cost) total += parseFloat(acc.cost);
      });
    }
    return total;
  };

  const activities = post.activities || [];

  // Image gallery functions
  const getPostImages = () => {
    const imageCategories = [
      'nature',
      'food',
      'city',
      'travel',
      'architecture',
      'landscape'
    ];

    const imageCount = Math.min(5, Math.max(1, (post.id % 4) + 1));
    const images = [];

    for (let i = 0; i < imageCount; i++) {
      const category = imageCategories[(post.id + i) % imageCategories.length];
      images.push({
        id: i,
        url: `https://picsum.photos/800/600?random=${post.id + i}&category=${category}`,
        category
      });
    }

    return images;
  };

  const postImages = getPostImages();

  const nextImage = () => {
    if (isTransitioning) return;
    setSlideDirection('next');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % postImages.length);
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection('');
      }, 250);
    }, 250);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setSlideDirection('prev');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length);
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection('');
      }, 250);
    }, 250);
  };

  const goToImage = (index) => {
    if (isTransitioning || index === currentImageIndex) return;
    const direction = index > currentImageIndex ? 'next' : 'prev';
    setSlideDirection(direction);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection('');
      }, 250);
    }, 250);
  };

  // Handle escape key and arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [onClose, prevImage, nextImage]);

  if (!post) return null;

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <div className="modal-author">
            <div className="modal-avatar">🧳</div>
            <div className="modal-author-info">
              <h3>{post.author}</h3>
              <span className="modal-time">{formatTime(post.timestamp)}</span>
            </div>
          </div>
        </div>

        {post.tripTitle ? (
          <div className="modal-trip">
            <div className="modal-trip-header">
              <h2 className="modal-trip-title">🗺️ {post.tripTitle}</h2>
              <div className="modal-trip-location">📍 {post.location}</div>
              <div className="modal-trip-dates">
                {post.startDate && formatDate(post.startDate)}
                {post.startDate && post.endDate && ' - '}
                {post.endDate && formatDate(post.endDate)}
              </div>
            </div>

            <div className="modal-images">
              <div className="modal-image-gallery">
                <div className="modal-main-image">
                  <img
                    src={postImages[currentImageIndex].url}
                    alt={`Travel photo ${currentImageIndex + 1}`}
                    loading="lazy"
                    className={`${isTransitioning ? 'transitioning' : ''} ${slideDirection ? `slide-${slideDirection}` : ''}`}
                  />
                  {postImages.length > 1 && (
                    <>
                      <button
                        className="modal-nav-btn modal-prev-btn"
                        onClick={prevImage}
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        className="modal-nav-btn modal-next-btn"
                        onClick={nextImage}
                        aria-label="Next image"
                      >
                        ›
                      </button>
                      <div className="modal-image-counter">
                        {currentImageIndex + 1} / {postImages.length}
                      </div>
                    </>
                  )}
                </div>
                {postImages.length > 1 && (
                  <div className="modal-image-dots">
                    {postImages.map((_, index) => (
                      <button
                        key={index}
                        className={`modal-dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => goToImage(index)}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-story">
              <h4>Trip Story</h4>
              <p>{renderTextWithHashtags(post.content)}</p>
            </div>

            {activities.length > 0 && (
              <div className="modal-activities">
                <h4>Activities & Places</h4>
                <div className="modal-activities-list">
                  {activities.map((activity, index) => (
                    <div key={index} className="modal-activity">
                      <div className="modal-activity-icon">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="modal-activity-content">
                        <div className="modal-activity-header">
                          <h5>{activity.name}</h5>
                        </div>
                        <div className="modal-activity-details">
                          <span className="modal-activity-type">
                            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                          </span>
                          {activity.cost && (
                            <span className="modal-activity-cost">${activity.cost}</span>
                          )}
                        </div>
                        {activity.rating > 0 && (
                          <div className="modal-activity-rating">
                            {renderStars(activity.rating)}
                          </div>
                        )}
                        {activity.description && (
                          <p className="modal-activity-description">{activity.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {post.accommodations && post.accommodations.length > 0 && (
              <div className="modal-accommodations">
                <h4>🏨 Accommodations</h4>
                <div className="modal-accommodations-list">
                  {post.accommodations.map((acc, index) => (
                    <div key={index} className="modal-accommodation">
                      <div className="modal-accommodation-icon">
                        {acc.type === 'hotel' ? '🏨' :
                         acc.type === 'airbnb' ? '🏠' :
                         acc.type === 'hostel' ? '🏃' :
                         acc.type === 'resort' ? '🏖️' :
                         acc.type === 'guesthouse' ? '🏡' :
                         acc.type === 'apartment' ? '🏢' :
                         acc.type === 'villa' ? '🏘️' :
                         acc.type === 'camping' ? '⛺' : '🏨'}
                      </div>
                      <div className="modal-accommodation-content">
                        <div className="modal-accommodation-header">
                          <h5>{acc.name}</h5>
                          {acc.rating > 0 && renderStars(acc.rating)}
                        </div>
                        <div className="modal-accommodation-details">
                          <span className="modal-accommodation-type">
                            {acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}
                          </span>
                          {acc.address && (
                            <span className="modal-accommodation-address">📍 {acc.address}</span>
                          )}
                          {acc.cost && (
                            <span className="modal-accommodation-cost">${acc.cost}</span>
                          )}
                        </div>
                        {(acc.checkIn || acc.checkOut) && (
                          <div className="modal-accommodation-dates">
                            {acc.checkIn && <span>Check-in: {formatDate(acc.checkIn)}</span>}
                            {acc.checkOut && <span>Check-out: {formatDate(acc.checkOut)}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {post.transport && post.transport.length > 0 && (
              <div className="modal-transport">
                <h4>🚗 Transportation</h4>
                <div className="modal-transport-list">
                  {post.transport.map((transport, index) => (
                    <div key={index} className="modal-transport-item">
                      <div className="modal-transport-icon">
                        {getTransportIcon(transport.type)}
                      </div>
                      <div className="modal-transport-content">
                        <div className="modal-transport-route">
                          {transport.from} → {transport.to}
                        </div>
                        <div className="modal-transport-details">
                          <span className="modal-transport-type">
                            {transport.type.charAt(0).toUpperCase() + transport.type.slice(1)}
                          </span>
                          {transport.time && (
                            <span className="modal-transport-time">{transport.time}</span>
                          )}
                          {transport.cost && (
                            <span className="modal-transport-cost">${transport.cost}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {calculateTotalCost() > 0 && (
              <div className="modal-cost-summary">
                <h4>💰 Trip Cost</h4>
                <div className="modal-total-cost">${calculateTotalCost().toFixed(2)}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="modal-simple-post">
            <div className="modal-images">
              <div className="modal-image-gallery">
                <div className="modal-main-image">
                  <img
                    src={postImages[currentImageIndex].url}
                    alt={`Photo ${currentImageIndex + 1}`}
                    loading="lazy"
                    className={`${isTransitioning ? 'transitioning' : ''} ${slideDirection ? `slide-${slideDirection}` : ''}`}
                  />
                  {postImages.length > 1 && (
                    <>
                      <button
                        className="modal-nav-btn modal-prev-btn"
                        onClick={prevImage}
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        className="modal-nav-btn modal-next-btn"
                        onClick={nextImage}
                        aria-label="Next image"
                      >
                        ›
                      </button>
                      <div className="modal-image-counter">
                        {currentImageIndex + 1} / {postImages.length}
                      </div>
                    </>
                  )}
                </div>
                {postImages.length > 1 && (
                  <div className="modal-image-dots">
                    {postImages.map((_, index) => (
                      <button
                        key={index}
                        className={`modal-dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => goToImage(index)}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p>{renderTextWithHashtags(post.content)}</p>
          </div>
        )}

        <div className="modal-comments">
          <h4>💬 Comments</h4>
          <div className="modal-comments-list">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map(comment => (
                <div key={comment.id} className="modal-comment">
                  <div className="modal-comment-avatar">👤</div>
                  <div className="modal-comment-content">
                    <div className="modal-comment-author">{comment.author}</div>
                    <div className="modal-comment-text">{renderTextWithHashtags(comment.content)}</div>
                    <div className="modal-comment-time">{formatTime(comment.timestamp)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="modal-no-comments">No comments yet. Be the first to comment!</div>
            )}
          </div>

          <div className="modal-add-comment">
            <div className="modal-comment-avatar">👤</div>
            <form onSubmit={handleCommentSubmit} className="modal-comment-form">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="modal-comment-input"
              />
              <button
                type="submit"
                className="modal-comment-submit"
                disabled={!commentText.trim()}
              >
                Post
              </button>
            </form>
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-action-btn modal-like-btn" onClick={handleLike}>
            <span className="modal-action-icon">❤️</span>
            <span className="modal-action-count">{post.likes}</span>
          </button>
          <button className="modal-action-btn modal-comment-btn">
            <span className="modal-action-icon">💬</span>
            <span className="modal-action-count">{post.comments?.length || 0}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PostModal;