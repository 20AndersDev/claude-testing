import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './PostModal.css';

function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Mock data - in a real app, this would fetch from an API
  useEffect(() => {
    // Simulate fetching post data
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
      hiking: '🥾'
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

  const calculateTotalCost = () => {
    let total = 0;
    if (post?.activities) {
      post.activities.forEach(activity => {
        if (activity.cost) total += parseFloat(activity.cost);
      });
    }
    if (post?.transport) {
      post.transport.forEach(t => {
        if (t.cost) total += parseFloat(t.cost);
      });
    }
    return total;
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
        url: `https://picsum.photos/800/600?random=${parseInt(postId) + i}&category=${category}`,
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

  if (!post) {
    return (
      <div className="App">
        <Navbar />
        <div style={{ paddingTop: '80px', textAlign: 'center' }}>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Navbar />
      <div className="post-detail-container" style={{
        paddingTop: '80px',
        width: '100%',
        minHeight: '100vh',
        background: 'var(--background)',
        padding: '80px 0 40px 0'
      }}>
        <div className="post-detail-content" style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <button
            className="back-button"
            onClick={() => navigate(-1)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '6px 12px',
              marginBottom: '30px',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px var(--shadow-light)'
            }}
          >
            ← Back
          </button>

          <div className="modal-content" style={{
            position: 'relative',
            margin: '0 auto',
            maxWidth: '100%',
            background: 'var(--surface)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px var(--shadow)',
            overflow: 'hidden'
          }}>
            <div className="modal-header">
              <div className="modal-author">
                <div className="modal-avatar">🧳</div>
                <div className="modal-author-info">
                  <h3>{post.author}</h3>
                  <span className="modal-time">{formatTime(post.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="modal-body">
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
                    <p>{post.content}</p>
                  </div>

                  {post.activities && post.activities.length > 0 && (
                    <div className="modal-activities">
                      <h4>Activities & Places</h4>
                      <div className="modal-activities-list">
                        {post.activities.map((activity, index) => (
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
                  <p>{post.content}</p>
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
                          <div className="modal-comment-text">{comment.content}</div>
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
        </div>
      </div>
    </div>
  );
}

export default PostDetail;