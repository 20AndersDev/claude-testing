import React, { useState, useEffect } from 'react';
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

  // Mock data - in a real app, this would fetch from an API
  useEffect(() => {
    const mockPost = {
      id: parseInt(postId),
      author: 'Travel Explorer',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      content: 'Amazing trip to the mountains! The views were absolutely breathtaking and the hiking trails were perfect for all skill levels. This adventure took us through some of the most spectacular landscapes I have ever seen.',
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
          description: 'Challenging but rewarding hike to the base of the famous Matterhorn peak. The trail offers incredible views and photo opportunities.',
          cost: '50',
          rating: 5
        },
        {
          name: 'Alpine Restaurant Dinner',
          type: 'restaurant',
          description: 'Traditional Swiss cuisine with amazing mountain views. The fondue was exceptional!',
          cost: '75',
          rating: 4
        },
        {
          name: 'Cable Car to Gornergrat',
          type: 'attraction',
          description: 'Scenic railway journey with panoramic views of the Alps. A must-do experience.',
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

  const handleLike = () => {
    if (post) {
      setPost(prev => ({ ...prev, likes: prev.likes + 1 }));
    }
  };

  const handleCommentSubmit = (e) => {
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
      beach: '🏖️',
      hiking: '🥾',
      activity: '🎯'
    };
    return icons[type] || '📍';
  };

  const renderStars = (rating) => {
    return (
      <div className="activity-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              color: star <= rating ? '#FFD700' : '#E5E7EB',
              fontSize: '14px'
            }}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const getPostImages = () => {
    const imageCategories = [
      'nature',
      'food',
      'city',
      'travel',
      'architecture',
      'landscape'
    ];

    const imageCount = Math.min(5, Math.max(1, (parseInt(postId) % 4) + 1));
    const images = [];

    for (let i = 0; i < imageCount; i++) {
      const category = imageCategories[(parseInt(postId) + i) % imageCategories.length];
      images.push({
        id: i,
        url: `https://picsum.photos/1200/800?random=${parseInt(postId) + i}&category=${category}`,
        category
      });
    }

    return images;
  };

  const postImages = getPostImages();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % postImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  const handleImageClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (!post) {
    return (
      <div className="App">
        <Navbar />
        <div style={{
          paddingTop: '80px',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar />

      {/* Hero Section */}
      <div className="post-detail-page">
        <div className="post-detail-hero">
          <button
            className="hero-back-btn"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div className="hero-content">
            {post.tripTitle ? (
              <>
                <h1 className="hero-title">🗺️ {post.tripTitle}</h1>
                <div className="hero-subtitle">📍 {post.location}</div>
                <div className="hero-meta">
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
        <div className="post-detail-container">
          <div className="post-detail-card">

            {/* Author Section */}
            <div className="post-author-section">
              <div className="author-avatar-large">🧳</div>
              <div className="author-info">
                <h2 className="author-name-large">{post.author}</h2>
                <div className="post-timestamp">{formatTime(post.timestamp)}</div>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="post-image-section">
              <div className="main-post-image" onClick={handleImageClick} style={{cursor: 'pointer'}}>
                <img
                  src={postImages[currentImageIndex].url}
                  alt={`${post.tripTitle || 'Post'} photo ${currentImageIndex + 1}`}
                  loading="lazy"
                />
                <div className="image-overlay"></div>

                {postImages.length > 1 && (
                  <>
                    <button
                      className="image-nav-btn prev"
                      onClick={prevImage}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      className="image-nav-btn next"
                      onClick={nextImage}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                    <div className="image-counter">
                      {currentImageIndex + 1} / {postImages.length}
                    </div>
                  </>
                )}
              </div>

              {postImages.length > 1 && (
                <div className="image-dots-container">
                  {postImages.map((_, index) => (
                    <button
                      key={index}
                      className={`image-dot ${index === currentImageIndex ? 'active' : ''}`}
                      onClick={() => goToImage(index)}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="post-content-section">

              {/* Trip Story */}
              <div className="trip-story">
                <h3 className="story-title">
                  📖 {post.tripTitle ? 'Trip Story' : 'Story'}
                </h3>
                <p className="story-text">{post.content}</p>
              </div>

              <div className="section-divider"></div>

              {/* Activities */}
              {post.activities && post.activities.length > 0 && (
                <>
                  <div className="activities-section">
                    <h3 className="section-title">
                      🎯 Activities & Places
                    </h3>
                    <div className="activities-grid">
                      {post.activities.map((activity, index) => (
                        <div key={index} className="activity-card">
                          {activity.cost && (
                            <div className="activity-cost">${activity.cost}</div>
                          )}
                          <div className="activity-header">
                            <div className="activity-icon-large">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="activity-details">
                              <h4 className="activity-name">{activity.name}</h4>
                              <div className="activity-type">{activity.type}</div>
                              {activity.rating > 0 && renderStars(activity.rating)}
                            </div>
                          </div>
                          {activity.description && (
                            <p className="activity-description">{activity.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="section-divider"></div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="action-button like" onClick={handleLike}>
                <span>❤️</span>
                <span>{post.likes} Likes</span>
              </button>
              <button className="action-button comment">
                <span>💬</span>
                <span>{post.comments?.length || 0} Comments</span>
              </button>
            </div>

            {/* Comments Section */}
            <div className="comments-section">
              <h3 className="section-title">
                💬 Comments ({post.comments?.length || 0})
              </h3>

              <div className="comments-list">
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map(comment => (
                    <div key={comment.id} className="comment-card">
                      <div className="comment-header">
                        <div className="comment-avatar">👤</div>
                        <div className="comment-author">{comment.author}</div>
                        <div className="comment-time">{formatTime(comment.timestamp)}</div>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p style={{
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    margin: '24px 0'
                  }}>
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>

              <div className="add-comment-form">
                <div className="comment-form-header">
                  <div className="comment-form-avatar">👤</div>
                  <p className="comment-form-label">Add a comment</p>
                </div>
                <div className="comment-input-container">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="What are your thoughts about this trip?"
                    className="comment-input"
                    rows={3}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit(e);
                      }
                    }}
                  />
                </div>
                <div className="comment-form-actions">
                  <button
                    type="button"
                    className="comment-cancel"
                    onClick={() => setCommentText('')}
                    style={{ display: commentText.trim() ? 'block' : 'none' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCommentSubmit}
                    className="comment-submit"
                    disabled={!commentText.trim()}
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ImageModal
          images={postImages}
          initialIndex={currentImageIndex}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default PostDetail;