import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { createLikeNotification, createCommentNotification, createFollowNotification } from './notificationHelpers';
import './Post.css';

function Post({ post, onLike, onComment, onDelete, onDeleteComment, onBookmarkRemove, isBookmarked: initialBookmarked }) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCommentMenus, setShowCommentMenus] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked || false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && post.user_id && currentUserId !== post.user_id) {
      checkFollowStatus();
    }
  }, [currentUserId, post.user_id]);

  useEffect(() => {
    if (currentUserId && post.id && !initialBookmarked) {
      checkBookmarkStatus();
    }
  }, [currentUserId, post.id]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
      if (Object.keys(showCommentMenus).length > 0) {
        setShowCommentMenus({});
      }
    };

    if (showMenu || Object.keys(showCommentMenus).length > 0) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMenu, showCommentMenus]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);

      // Fetch user's avatar and name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url, full_name, username')
        .eq('id', user.id)
        .single();

      setCurrentUserAvatar(profileData?.avatar_url || user.user_metadata?.avatar_url || null);
      setCurrentUserName(profileData?.full_name || profileData?.username || 'User');
    }
  };

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', post.user_id)
        .single();

      if (!error && data) {
        setIsFollowing(true);
      }
    } catch (error) {
      // No follow relationship exists
      setIsFollowing(false);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('post_id', post.id)
        .single();

      if (!error && data) {
        setIsBookmarked(true);
      }
    } catch (error) {
      setIsBookmarked(false);
    }
  };

  const handleBookmarkToggle = async (e) => {
    e.stopPropagation();
    if (!currentUserId) return;

    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', post.id);

        if (error) throw error;
        setIsBookmarked(false);

        // Call the remove callback if provided (for bookmarks page)
        if (onBookmarkRemove) {
          onBookmarkRemove();
        }
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: currentUserId,
            post_id: post.id
          });

        if (error) throw error;
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (!currentUserId || currentUserId === post.user_id || isLoadingFollow) return;

    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', post.user_id);

        if (!error) {
          setIsFollowing(false);
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert([{
            follower_id: currentUserId,
            following_id: post.user_id
          }]);

        if (!error) {
          setIsFollowing(true);
          // Create follow notification
          await createFollowNotification(post.user_id, currentUserId, currentUserName);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', post.id);

        if (error) {
          console.error('Error deleting post:', error);
          alert('Failed to delete post');
        } else {
          // Call parent component's onDelete if provided
          if (onDelete) {
            onDelete(post.id);
          }
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const toggleCommentMenu = (commentId, e) => {
    e.stopPropagation();
    setShowCommentMenus(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleLike = async () => {
    onLike(post.id);

    // Create like notification
    const isLiked = post.liked_by?.includes(currentUserId);
    if (!isLiked && post.user_id && currentUserId !== post.user_id) {
      await createLikeNotification(post.user_id, currentUserId, currentUserName, post.id);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    console.log('handleCommentSubmit called, commentText:', commentText);
    if (commentText.trim()) {
      console.log('Calling onComment with:', post.id, commentText);
      await onComment(post.id, commentText);

      // Create comment notification
      if (post.user_id && currentUserId !== post.user_id) {
        console.log('Creating comment notification');
        await createCommentNotification(post.user_id, currentUserId, currentUserName, post.id, commentText);
      }

      setCommentText('');
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diff = now - postDate;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
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

  const getCountryFlag = (country) => {
    const countryFlags = {
      'United States': '🇺🇸',
      'Canada': '🇨🇦',
      'Mexico': '🇲🇽',
      'United Kingdom': '🇬🇧',
      'France': '🇫🇷',
      'Germany': '🇩🇪',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Portugal': '🇵🇹',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪',
      'Switzerland': '🇨🇭',
      'Austria': '🇦🇹',
      'Greece': '🇬🇷',
      'Turkey': '🇹🇷',
      'Poland': '🇵🇱',
      'Czech Republic': '🇨🇿',
      'Hungary': '🇭🇺',
      'Romania': '🇷🇴',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'Denmark': '🇩🇰',
      'Finland': '🇫🇮',
      'Iceland': '🇮🇸',
      'Ireland': '🇮🇪',
      'Russia': '🇷🇺',
      'China': '🇨🇳',
      'Japan': '🇯🇵',
      'South Korea': '🇰🇷',
      'India': '🇮🇳',
      'Thailand': '🇹🇭',
      'Vietnam': '🇻🇳',
      'Singapore': '🇸🇬',
      'Malaysia': '🇲🇾',
      'Indonesia': '🇮🇩',
      'Philippines': '🇵🇭',
      'Australia': '🇦🇺',
      'New Zealand': '🇳🇿',
      'Brazil': '🇧🇷',
      'Argentina': '🇦🇷',
      'Chile': '🇨🇱',
      'Peru': '🇵🇪',
      'Colombia': '🇨🇴',
      'Egypt': '🇪🇬',
      'Morocco': '🇲🇦',
      'South Africa': '🇿🇦',
      'Kenya': '🇰🇪',
      'UAE': '🇦🇪',
      'Israel': '🇮🇱',
      'Saudi Arabia': '🇸🇦'
    };
    return countryFlags[country] || '🌍';
  };

  const getPostImages = () => {
    // Only return images if user actually uploaded them
    if (post.images && post.images.length > 0) {
      return post.images;
    }

    // Return empty array if no images uploaded
    return [];
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

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextImage();
    }
    if (isRightSwipe) {
      prevImage();
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
        <div
          className="post-author-info"
          onClick={() => navigate(currentUserId === post.user_id ? '/profile' : `/profile/${post.user_id}`)}
          style={{ cursor: 'pointer' }}
        >
          <div className="author-avatar">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt={post.author} className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">👤</div>
            )}
          </div>
          <div className="author-details">
            <div className="author-name">{post.author}</div>
            <div className="post-time">{formatTime(post.timestamp)}</div>
          </div>
        </div>
        {currentUserId && post.user_id !== currentUserId && (
          <button
            className={`follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={handleFollowToggle}
            disabled={isLoadingFollow}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
        {currentUserId && post.user_id === currentUserId && (
          <div className="post-menu-container">
            <button className="post-menu-btn" onClick={toggleMenu} title="More options">
              ⋮
            </button>
            {showMenu && (
              <div className="post-menu-dropdown">
                <button className="menu-item delete-item" onClick={handleDelete}>
                  🗑️ Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {post.tripTitle ? (
        <div className="trip-post">
          <div className="trip-header" onClick={handleTripClick} style={{cursor: 'pointer'}}>
            <h3 className="trip-title">🗺️ {post.tripTitle}</h3>
            <div className="trip-location">
              📍 {post.location}
              {post.country && ` • ${getCountryFlag(post.country)} ${post.country}`}
            </div>
            <div className="trip-dates">
              {post.startDate && formatDate(post.startDate)}
              {post.startDate && post.endDate && ' - '}
              {post.endDate && formatDate(post.endDate)}
            </div>
          </div>

          <div className="post-content" style={{cursor: 'pointer'}}>
            <p onClick={handleTripClick}>{post.content}</p>
            {postImages.length > 0 && (
              <div className="post-images">
                <div className="image-gallery">
                  <div
                    className="main-image"
                    onClick={handleTripClick}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                  >
                    <img
                      src={postImages[currentImageIndex].url}
                      alt="Travel destination"
                    />
                    {postImages.length > 1 && (
                      <>
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
                  {postImages.length > 1 && (
                    <div className="image-dots">
                      {postImages.map((_, index) => (
                        <button
                          key={index}
                          className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); goToImage(index); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
          {postImages.length > 0 && (
            <div className="post-images">
              <div className="image-gallery">
                <div
                  className="main-image"
                  onClick={handlePostClick}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                  <img
                    src={postImages[currentImageIndex].url}
                    alt="Content from post"
                  />
                  {postImages.length > 1 && (
                    <>
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
                {postImages.length > 1 && (
                  <div className="image-dots">
                    {postImages.map((_, index) => (
                      <button
                        key={index}
                        className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); goToImage(index); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="post-stats">
        <div className="likes-count">
          {(post.likes || 0) > 0 && `${post.likes} like${post.likes > 1 ? 's' : ''}`}
        </div>
        <div className="comments-count">
          {(post.comments || []).length > 0 && (
            <button
              className="comments-toggle"
              onClick={() => setShowComments(!showComments)}
            >
              {(post.comments || []).length} comment{(post.comments || []).length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      <div className="post-actions">
        <button
          className={`action-btn like-btn ${currentUserId && (post.liked_by || []).includes(currentUserId) ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <span className="action-icon">❤️</span>
          <span className="action-count">{post.likes || 0}</span>
        </button>
        <button
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          <span className="action-icon">💬</span>
          <span className="action-count">{(post.comments || []).length}</span>
        </button>
        <button
          className={`action-btn bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmarkToggle}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this post'}
        >
          <span className="action-icon">{isBookmarked ? '🔖' : '🏷️'}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {(post.comments || []).map(comment => (
            <div key={comment.id} className="comment">
              <div className="comment-avatar">
                {comment.avatar_url ? (
                  <img src={comment.avatar_url} alt={comment.author} className="comment-avatar-image" />
                ) : (
                  <div className="comment-avatar-placeholder">👤</div>
                )}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <div className="comment-author">{comment.author}</div>
                  <div className="comment-time">{formatTime(comment.timestamp)}</div>
                </div>
                <div className="comment-text">{comment.content}</div>
              </div>
              {currentUserId && comment.user_id === currentUserId && onDeleteComment && (
                <div className="comment-menu-container">
                  <button
                    className="comment-menu-btn"
                    onClick={(e) => toggleCommentMenu(comment.id, e)}
                    title="More options"
                  >
                    ⋮
                  </button>
                  {showCommentMenus[comment.id] && (
                    <div className="comment-menu-dropdown">
                      <button
                        className="menu-item delete-item"
                        onClick={() => {
                          setShowCommentMenus({});
                          onDeleteComment(post.id, comment.id);
                        }}
                      >
                        🗑️ Delete Comment
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="add-comment">
            <div className="comment-avatar">
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="Your avatar" className="comment-avatar-image" />
              ) : (
                <div className="comment-avatar-placeholder">👤</div>
              )}
            </div>
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