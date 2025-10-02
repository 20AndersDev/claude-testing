import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ImageModal from './ImageModal';
import './PostDetail.css';

function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Fetch post data
  useEffect(() => {
    const mockPost = {
      id: parseInt(postId),
      author: 'Travel Explorer',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      content: 'Amazing trip to the mountains! The views were absolutely breathtaking and the hiking trails were perfect for all skill levels.',
      tripTitle: 'Mountain Adventure',
      location: 'Swiss Alps, Switzerland',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      likes: 42,
      comments: [
        {
          id: 1,
          author: 'Adventure Seeker',
          content: 'Looks incredible! Did you do any night hiking?',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
        },
        {
          id: 2,
          author: 'Mountain Lover',
          content: 'Swiss Alps are the best! Which trail did you take?',
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        },
        {
          id: 3,
          author: 'Photo Enthusiast',
          content: 'The photography in this post is absolutely stunning!',
          timestamp: new Date(Date.now() - 15 * 60 * 1000)
        }
      ],
      activities: [
        {
          name: 'Matterhorn Base Camp Hike',
          type: 'hiking',
          description: 'Challenging but rewarding hike to the base of the famous Matterhorn peak.',
          cost: '50',
          rating: 5
        },
        {
          name: 'Alpine Restaurant Dinner',
          type: 'restaurant',
          description: 'Traditional Swiss cuisine with amazing mountain views.',
          cost: '75',
          rating: 4
        },
        {
          name: 'Cable Car to Gornergrat',
          type: 'attraction',
          description: 'Scenic railway journey with panoramic views of the Alps.',
          cost: '45',
          rating: 5
        },
        {
          name: 'Mountain Photography Workshop',
          type: 'activity',
          description: 'Learn photography techniques specific to mountain landscapes.',
          cost: '120',
          rating: 4
        }
      ],
      transport: [
        {
          type: 'train',
          from: 'Zurich',
          to: 'Zermatt',
          cost: '120',
          time: '3h 30m'
        }
      ]
    };
    setPost(mockPost);
  }, [postId]);

  // Memoized image generation
  const postImages = useMemo(() => {
    if (!post) return [];
    const imageCategories = ['nature', 'food', 'city', 'travel', 'architecture', 'landscape'];
    const imageCount = Math.min(5, Math.max(1, (parseInt(postId) % 4) + 1));
    return Array.from({ length: imageCount }, (_, i) => ({
      id: i,
      url: `https://picsum.photos/1200/800?random=${parseInt(postId) + i}&category=${imageCategories[(parseInt(postId) + i) % imageCategories.length]}`,
      category: imageCategories[(parseInt(postId) + i) % imageCategories.length]
    }));
  }, [post, postId]);

  // Handlers
  const handleLike = useCallback(() => {
    setPost(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
  }, []);

  const handleCommentSubmit = useCallback((e) => {
    e.preventDefault();
    if (commentText.trim() && post) {
      const newComment = {
        id: post.comments.length + 1,
        author: 'Current User',
        content: commentText,
        timestamp: new Date()
      };
      setPost(prev => ({
        ...prev,
        comments: [...prev.comments, newComment]
      }));
      setCommentText('');
    }
  }, [commentText, post]);

  const nextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev + 1) % postImages.length);
  }, [postImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev - 1 + postImages.length) % postImages.length);
  }, [postImages.length]);

  const goToImage = useCallback((index) => {
    setCurrentImageIndex(index);
  }, []);

  // Utility functions
  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    return days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : 'Just now';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
      beach: '🏖️',
      hiking: '🥾',
      activity: '🎯'
    };
    return icons[type] || '📍';
  };

  const renderStars = (rating) => (
    <div className="activity-rating">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= rating ? 'star-filled' : 'star-empty'}>⭐</span>
      ))}
    </div>
  );

  if (!post) {
    return (
      <div className="App">
        <Navbar />
        <div className="loading-container">
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar />

      {/* Hero Section */}
      <div className="detail-hero">
        <button className="back-btn" onClick={() => navigate(-1)}>←</button>
        <div className="hero-content">
          {post.tripTitle ? (
            <>
              <h1 className="hero-title">🗺️ {post.tripTitle}</h1>
              <div className="hero-location">📍 {post.location}</div>
              <div className="hero-dates">
                {post.startDate && formatDate(post.startDate)}
                {post.startDate && post.endDate && ' - '}
                {post.endDate && formatDate(post.endDate)}
              </div>
            </>
          ) : (
            <>
              <h1 className="hero-title">📸 Photo Post</h1>
              <div className="hero-subtitle">By {post.author}</div>
              <div className="hero-meta">{formatTime(post.timestamp)}</div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-container">
        <div className="detail-card">

          {/* Author Section */}
          <div className="author-section">
            <div className="author-avatar-lg">🧳</div>
            <div className="author-info">
              <h2 className="author-name">{post.author}</h2>
              <div className="post-time">{formatTime(post.timestamp)}</div>
            </div>
          </div>

          {/* Image Gallery */}
          {postImages.length > 0 && (
            <div className="image-section">
              <div className="main-image" onClick={() => setShowModal(true)}>
                <img src={postImages[currentImageIndex].url} alt={`${post.tripTitle || 'Post'} photo ${currentImageIndex + 1}`} loading="lazy" />
                {postImages.length > 1 && (
                  <>
                    <button className="nav-btn prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>‹</button>
                    <button className="nav-btn next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>›</button>
                  </>
                )}
              </div>
              {postImages.length > 1 && (
                <div className="image-dots">
                  {postImages.map((_, index) => (
                    <button key={index} className={`dot ${index === currentImageIndex ? 'active' : ''}`} onClick={() => goToImage(index)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content Section */}
          <div className="content-section">
            <div className="story">
              <h3 className="section-title">📖 {post.tripTitle ? 'Trip Story' : 'Story'}</h3>
              <p className="story-text">{post.content}</p>
            </div>

            {/* Activities */}
            {post.activities && post.activities.length > 0 && (
              <>
                <div className="divider"></div>
                <div className="activities">
                  <h3 className="section-title">🎯 Activities & Places</h3>
                  <div className="activities-grid">
                    {post.activities.map((activity, index) => (
                      <div key={index} className="activity-card">
                        {activity.cost && <div className="activity-cost">${activity.cost}</div>}
                        <div className="activity-icon-lg">{getActivityIcon(activity.type)}</div>
                        <div className="activity-details">
                          <h4 className="activity-name">{activity.name}</h4>
                          <div className="activity-type">{activity.type}</div>
                          {activity.rating > 0 && renderStars(activity.rating)}
                          {activity.description && <p className="activity-desc">{activity.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="actions">
            <button className="action-btn like" onClick={handleLike}>
              <span>❤️</span>
              <span>{post.likes} Likes</span>
            </button>
            <button className="action-btn comment">
              <span>💬</span>
              <span>{post.comments?.length || 0} Comments</span>
            </button>
          </div>

          {/* Comments */}
          <div className="comments">
            <h3 className="section-title">💬 Comments ({post.comments?.length || 0})</h3>
            <div className="comments-list">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map(comment => (
                  <div key={comment.id} className="comment">
                    <div className="comment-avatar">👤</div>
                    <div className="comment-content">
                      <div className="comment-header">
                        <div className="comment-author">{comment.author}</div>
                        <div className="comment-time">{formatTime(comment.timestamp)}</div>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-comments">No comments yet. Be the first to comment!</p>
              )}
            </div>

            <div className="add-comment">
              <div className="comment-avatar">👤</div>
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="What are your thoughts?"
                  className="comment-input"
                  rows={3}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit(e);
                    }
                  }}
                />
                <div className="comment-actions">
                  <button type="button" className="btn-cancel" onClick={() => setCommentText('')} style={{ display: commentText.trim() ? 'block' : 'none' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={!commentText.trim()}>
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ImageModal images={postImages} initialIndex={currentImageIndex} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default PostDetail;
