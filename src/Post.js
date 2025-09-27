import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Post.css';

function Post({ post, onLike, onComment }) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

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

  const handleTripClick = () => {
    if (post.tripTitle) {
      navigate(`/trip/${post.id}`);
    }
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

          <div className="post-content">
            <p>{post.content}</p>
          </div>

          {post.activities && post.activities.length > 0 && (
            <div className="activities-preview">
              <h4>Activities & Places</h4>
              <div className="activities-list">
                {post.activities.slice(0, 3).map((activity, index) => (
                  <div key={index} className="activity-preview">
                    <span className="activity-icon">{getActivityIcon(activity.type)}</span>
                    <div className="activity-info">
                      <span className="activity-name">{activity.name}</span>
                      {activity.rating > 0 && renderStars(activity.rating)}
                    </div>
                    {activity.time && <span className="activity-time">{activity.time}</span>}
                  </div>
                ))}
                {post.activities.length > 3 && (
                  <div className="more-activities">
                    +{post.activities.length - 3} more activities
                  </div>
                )}
              </div>
              <button className="view-timeline-btn" onClick={handleTripClick}>
                View Full Timeline →
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="post-content">
          <p>{post.content}</p>
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
        <button className="action-btn share-btn">
          <span className="action-icon">📤</span>
        </button>
        <button className="action-btn save-btn">
          <span className="action-icon">🔖</span>
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