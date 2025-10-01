import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Post.css';

function Post({ post, onLike, onComment }) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      month: 'short',
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

  const handleTripClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handlePostClick = () => {
    navigate(`/post/${post.id}`);
  };

  const getPostImages = () => {
    // Generate multiple images for each post
    const imageCategories = [
      'nature',
      'food',
      'city',
      'travel',
      'architecture',
      'landscape'
    ];

    const imageCount = Math.min(5, Math.max(1, (post.id % 4) + 1)); // 1-4 images per post
    const images = [];

    for (let i = 0; i < imageCount; i++) {
      const category = imageCategories[(post.id + i) % imageCategories.length];
      images.push({
        id: i,
        url: `https://picsum.photos/500/300?random=${post.id + i}&category=${category}`,
        category
      });
    }

    return images;
  };

  const postImages = getPostImages();

  const nextImage = () => {
    if (isTransitioning) return;
    setCurrentImageIndex((prev) => (prev + 1) % postImages.length);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setCurrentImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
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

  return (
    <div className="post">
      <div className="post-header">
        <div className="post-author-info">
          <div className="author-avatar">🧳</div>
          <div className="author-details">
            <div className="author-name">{post.author}</div>
            <div className="post-time">{formatTime(post.timestamp)}</div>
          </div>
        </div>
      </div>

      {post.tripTitle ? (
        <div className="trip-post">
          <div className="trip-header" onClick={handleTripClick} style={{cursor: 'pointer'}}>
            <h3 className="trip-title">🗺️ {post.tripTitle}</h3>
            <div className="trip-location">📍 {post.location}</div>
            <div className="trip-dates">
              {post.startDate && formatDate(post.startDate)}
              {post.startDate && post.endDate && ' - '}
              {post.endDate && formatDate(post.endDate)}
            </div>
          </div>

          <div className="post-content" style={{cursor: 'pointer'}}>
            <p onClick={handleTripClick}>{post.content}</p>
            <div className="post-images">
              <div className="image-gallery">
                <div className="main-image">
                  <img
                    src={postImages[currentImageIndex].url}
                    alt="Travel destination"
                  />
                  {postImages.length > 1 && (
                    <>
                      <div className="image-counter">
                        📷 {postImages.length}
                      </div>
                      <button
                        className="nav-btn prev-btn"
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      >
                        ‹
                      </button>
                      <button
                        className="nav-btn next-btn"
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
                {false && postImages.length > 1 && (
                  <div className="image-dots">
                    {postImages.map((_, index) => (
                      <button
                        key={index}
                        className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => goToImage(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {post.activities && post.activities.length > 0 && (
            <div className="activities-preview">
              <div className="activities-count-mobile">
                📍 {post.activities.length} {post.activities.length === 1 ? 'Activity' : 'Activities'}
              </div>
              <h4>Activities & Places</h4>
              <div className="activities-list">
                {post.activities.slice(0, 3).map((activity, index) => (
                  <div key={index} className="activity-preview">
                    <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                    <div className="activity-info">
                      <span className="activity-name">{activity.name}</span>
                      <div className="activity-details">
                        {activity.rating > 0 && renderStars(activity.rating)}
                        {activity.cost && <span className="activity-cost">${activity.cost}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {post.activities.length > 3 && (
                  <div className="more-activities">
                    +{post.activities.length - 3} more activities
                  </div>
                )}
              </div>
              {post.transport && post.transport.length > 0 && (
                <div className="transport-preview">
                  <h4>🚗 Transportation</h4>
                  <div className="transport-list">
                    {post.transport.slice(0, 2).map((transport, index) => (
                      <div key={index} className="transport-item-preview">
                        <span className="transport-icon">{getTransportIcon(transport.type)}</span>
                        <span className="transport-route">{transport.from} → {transport.to}</span>
                        {transport.cost && <span className="transport-cost">${transport.cost}</span>}
                      </div>
                    ))}
                    {post.transport.length > 2 && (
                      <div className="more-transport">
                        +{post.transport.length - 2} more transports
                      </div>
                    )}
                  </div>
                </div>
              )}

              {calculateTotalCost() > 0 && (
                <div className="trip-cost-summary">
                  <span className="cost-label">💰 Total Trip Cost:</span>
                  <span className="total-cost">${calculateTotalCost().toFixed(2)}</span>
                </div>
              )}

            </div>
          )}
        </div>
      ) : (
        <div className="post-content" style={{cursor: 'pointer'}}>
          <p onClick={handlePostClick}>{post.content}</p>
          <div className="post-images">
            <div className="image-gallery">
              <div className="main-image">
                <img
                  src={postImages[currentImageIndex].url}
                  alt="Content from post"
                />
                {postImages.length > 1 && (
                  <>
                    <div className="image-counter">
                      📷 {postImages.length}
                    </div>
                    <button
                      className="nav-btn prev-btn"
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    >
                      ‹
                    </button>
                    <button
                      className="nav-btn next-btn"
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {false && postImages.length > 1 && (
                <div className="image-dots">
                  {postImages.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => goToImage(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="post-stats">
        <div className="likes-count">
          {post.likes > 0 && `${post.likes} like${post.likes > 1 ? 's' : ''}`}
        </div>
        <div className="comments-count">
          {post.comments.length > 0 && (
            <button
              className="comments-toggle"
              onClick={() => setShowComments(!showComments)}
            >
              {post.comments.length} comment{post.comments.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      <div className="post-actions">
        <button className="action-btn like-btn" onClick={handleLike}>
          <span className="action-icon">❤️</span>
          <span className="action-count">{post.likes}</span>
        </button>
        <button
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <span className="action-icon">💬</span>
          <span className="action-count">{post.comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {post.comments.map(comment => (
            <div key={comment.id} className="comment">
              <div className="comment-avatar">👤</div>
              <div className="comment-content">
                <div className="comment-author">{comment.author}</div>
                <div className="comment-text">{comment.content}</div>
                <div className="comment-time">{formatTime(comment.timestamp)}</div>
              </div>
            </div>
          ))}

          <div className="add-comment">
            <div className="comment-avatar">👤</div>
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="comment-input"
              />
              <button
                type="submit"
                className="comment-submit"
                disabled={!commentText.trim()}
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default Post;