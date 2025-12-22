import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { createLikeNotification, createCommentNotification } from './notificationHelpers';
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
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showCommentMenus, setShowCommentMenus] = useState({});

  // Fetch post data
  useEffect(() => {
    fetchPost();
    getCurrentUser();

    // Set up real-time subscription for post updates
    const postSubscription = supabase
      .channel(`post-${postId}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${postId}`
        },
        async (payload) => {
          // Fetch current profile data for the author
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          // Update post with new data
          const updatedPost = {
            ...payload.new,
            author: profileData?.full_name || profileData?.username || payload.new.author || 'User',
            author_avatar: profileData?.avatar_url || payload.new.author_avatar,
            author_username: profileData?.username || payload.new.author_username,
            tripTitle: payload.new.trip_title,
            startDate: payload.new.start_date,
            endDate: payload.new.end_date,
            timestamp: payload.new.created_at,
            userId: payload.new.user_id
          };
          setPost(updatedPost);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postSubscription);
    };
  }, [postId]);

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

      // Fetch user's name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single();

      setCurrentUserName(profileData?.full_name || profileData?.username || 'User');
    }
  };

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !data) {
      console.error('Error fetching post:', error);
      navigate('/feed');
    } else {
      // Fetch the current profile information for the post author
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', data.user_id)
        .single();

      // Map database fields to component format
      const mappedPost = {
        ...data,
        author: profileData?.full_name || profileData?.username || data.author || 'User',
        author_avatar: profileData?.avatar_url || data.author_avatar,
        author_username: profileData?.username || data.author_username,
        tripTitle: data.trip_title,
        startDate: data.start_date,
        endDate: data.end_date,
        timestamp: data.created_at,
        userId: data.user_id
      };
      setPost(mappedPost);
    }
  };

  // Get post images from uploaded images
  const postImages = useMemo(() => {
    if (!post) return [];
    // Only return images if user actually uploaded them
    if (post.images && post.images.length > 0) {
      return post.images;
    }
    // Return empty array if no images uploaded
    return [];
  }, [post]);

  // Handlers
  const handleLike = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !post) return;

      // Get current liked_by array (users who liked this post)
      const likedBy = post.liked_by || [];
      const hasLiked = likedBy.includes(user.id);

      // Toggle like
      let newLikedBy;
      let newLikes;

      if (hasLiked) {
        // Unlike: remove user from liked_by array
        newLikedBy = likedBy.filter(id => id !== user.id);
        newLikes = Math.max(0, (post.likes || 0) - 1);
      } else {
        // Like: add user to liked_by array
        newLikedBy = [...likedBy, user.id];
        newLikes = (post.likes || 0) + 1;
      }

      // Update in Supabase
      const { error } = await supabase
        .from('posts')
        .update({
          likes: newLikes,
          liked_by: newLikedBy
        })
        .eq('id', post.id);

      if (error) {
        console.error('Error updating likes:', error.message, error);
        return;
      }

      // Update local state
      setPost(prev => ({ ...prev, likes: newLikes, liked_by: newLikedBy }));

      // Create like notification
      if (!hasLiked && post.userId && user.id !== post.userId) {
        await createLikeNotification(post.userId, user.id, currentUserName, post.id);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }, [post, currentUserName]);

  const handleCommentSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (commentText.trim() && post) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user's profile to get display name and avatar
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', user.id)
          .single();

        const displayName = profileData?.full_name || profileData?.username || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
        const avatarUrl = profileData?.avatar_url || user.user_metadata?.avatar_url || null;

        // Create new comment
        const newComment = {
          id: Date.now(),
          user_id: user.id,
          author: displayName,
          avatar_url: avatarUrl,
          content: commentText,
          timestamp: new Date().toISOString()
        };

        // Update comments in Supabase
        const updatedComments = [...(post.comments || []), newComment];
        const { error } = await supabase
          .from('posts')
          .update({ comments: updatedComments })
          .eq('id', post.id);

        if (error) {
          console.error('Error adding comment:', error);
          return;
        }

        // Update local state
        setPost(prev => ({
          ...prev,
          comments: updatedComments
        }));

        // Create comment notification
        if (post.userId && user.id !== post.userId) {
          await createCommentNotification(post.userId, user.id, displayName, post.id, commentText);
        }

        setCommentText('');
      } catch (error) {
        console.error('Error commenting on post:', error);
      }
    }
  }, [commentText, post]);

  const renderTextWithHashtags = (text) => {
    if (!text) return null;

    // Regex to match hashtags (#word)
    const hashtagRegex = /(#[\w]+)/g;
    const parts = text.split(hashtagRegex);

    return parts.map((part, index) => {
      if (part.match(hashtagRegex)) {
        const hashtag = part.substring(1); // Remove the # symbol
        return (
          <span
            key={index}
            className="hashtag-link"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/hashtag/${hashtag}`);
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const nextImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev + 1) % postImages.length);
  }, [postImages.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex(prev => (prev - 1 + postImages.length) % postImages.length);
  }, [postImages.length]);

  const goToImage = useCallback((index) => {
    setCurrentImageIndex(index);
  }, []);

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
          navigate('/feed');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      // Remove the comment from the array
      const updatedComments = (post.comments || []).filter(c => c.id !== commentId);

      // Update in Supabase
      const { error } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', post.id);

      if (error) {
        console.error('Error deleting comment:', error);
        return;
      }

      // Update local state
      setPost(prev => ({
        ...prev,
        comments: updatedComments
      }));
      setShowCommentMenus({});
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Utility functions
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

  const getRatingEmoji = (rating) => {
    const emojis = {
      1: { emoji: '😞', label: 'Very Bad' },
      2: { emoji: '😕', label: 'Bad' },
      3: { emoji: '😐', label: 'Okay' },
      4: { emoji: '😊', label: 'Good' },
      5: { emoji: '😍', label: 'Excellent' }
    };
    return emojis[rating] || null;
  };

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
            <div
              className="author-avatar-lg clickable"
              onClick={() => navigate(currentUserId === post.userId ? '/profile' : `/profile/${post.userId}`)}
              style={{ cursor: 'pointer' }}
            >
              {post.author_avatar ? (
                <img src={post.author_avatar} alt={post.author} className="author-avatar-image" />
              ) : (
                <div className="author-avatar-placeholder">👤</div>
              )}
            </div>
            <div className="author-info">
              <h2
                className="author-name"
                onClick={() => navigate(currentUserId === post.userId ? '/profile' : `/profile/${post.userId}`)}
                style={{ cursor: 'pointer' }}
              >
                {post.author}
              </h2>
              <div className="post-time">{formatTime(post.timestamp)}</div>
            </div>
            {currentUserId && post.userId === currentUserId && (
              <div className="post-menu-container">
                <button className="post-menu-btn" onClick={toggleMenu} title="More options">
                  ⋮
                </button>
                {showMenu && (
                  <div className="post-menu-dropdown">
                    <button className="menu-item edit-item" onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      navigate(`/edit-trip/${post.id}`);
                    }}>
                      ✏️ Edit Post
                    </button>
                    <button className="menu-item delete-item" onClick={handleDelete}>
                      🗑️ Delete Post
                    </button>
                  </div>
                )}
              </div>
            )}
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
            {post.trip_rating && (
              <div className="trip-rating-section">
                <h3 className="section-title">Overall Experience</h3>
                <div className="trip-rating-badge">
                  <span className="rating-emoji-xl">{getRatingEmoji(post.trip_rating).emoji}</span>
                  <span className="rating-label-large">{getRatingEmoji(post.trip_rating).label}</span>
                </div>
              </div>
            )}

            <div className="story">
              <h3 className="section-title">📖 {post.tripTitle ? 'Trip Story' : 'Story'}</h3>
              <p className="story-text">{renderTextWithHashtags(post.content)}</p>
            </div>

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="post-hashtags">
                {post.hashtags.map((hashtag, index) => (
                  <span
                    key={index}
                    className="hashtag-tag"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/hashtag/${hashtag}`);
                    }}
                  >
                    #{hashtag}
                  </span>
                ))}
              </div>
            )}

            {/* Positives and Red Flags */}
            {(post.positives || post.red_flags) && (
              <>
                <div className="divider"></div>
                <div className="tips-display">
                  {post.positives && post.positives.length > 0 && (
                    <div className="positives-display">
                      <h3 className="section-title positives-title">
                        <span className="tip-icon-display">⭐</span> What Was Great
                      </h3>
                      <ul className="tip-list-display">
                        {post.positives.map((item, index) => (
                          <li key={index} className="tip-item-display positive-item-display">
                            <span className="tip-bullet">⭐</span>
                            <span className="tip-text">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {post.red_flags && post.red_flags.length > 0 && (
                    <div className="red-flags-display">
                      <h3 className="section-title red-flags-title">
                        <span className="tip-icon-display">🚩</span> Red Flags & Tips
                      </h3>
                      <ul className="tip-list-display">
                        {post.red_flags.map((item, index) => (
                          <li key={index} className="tip-item-display red-flag-item-display">
                            <span className="tip-bullet">🚩</span>
                            <span className="tip-text">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}

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
                        <div className="activity-header">
                          <div className="activity-icon-lg">{getActivityIcon(activity.type)}</div>
                          <div className="activity-details">
                            <h4 className="activity-name">{activity.name}</h4>
                            <div className="activity-type">{activity.type}</div>
                            {activity.rating > 0 && renderStars(activity.rating)}
                            {activity.description && <p className="activity-desc">{activity.description}</p>}
                          </div>
                        </div>
                        {activity.images && activity.images.length > 0 && (
                          <div className="activity-images-grid">
                            {activity.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="activity-image-item">
                                <img src={image.url} alt={`${activity.name} ${imgIndex + 1}`} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Accommodations */}
            {post.accommodations && post.accommodations.length > 0 && (
              <>
                <div className="divider"></div>
                <div className="accommodations">
                  <h3 className="section-title">🏨 Accommodations</h3>
                  <div className="activities-grid">
                    {post.accommodations.map((acc, index) => (
                      <div key={index} className="activity-card">
                        {acc.cost && <div className="activity-cost">${acc.cost}</div>}
                        <div className="activity-header">
                          <div className="activity-icon-lg">{getActivityIcon(acc.type)}</div>
                          <div className="activity-details">
                            <h4 className="activity-name">{acc.name}</h4>
                            <div className="activity-type">{acc.type}</div>
                            {acc.address && <div className="accommodation-address">📍 {acc.address}</div>}
                            {acc.rating > 0 && renderStars(acc.rating)}
                            {acc.description && <p className="activity-desc">{acc.description}</p>}
                          </div>
                        </div>
                        {acc.images && acc.images.length > 0 && (
                          <div className="activity-images-grid">
                            {acc.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="activity-image-item">
                                <img src={image.url} alt={`${acc.name} ${imgIndex + 1}`} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="actions">
            <button className="action-btn" onClick={handleLike}>
              <span className="action-icon">❤️</span>
              <span className="action-count">{post.likes || 0}</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">💬</span>
              <span className="action-count">{post.comments?.length || 0}</span>
            </button>
          </div>

          {/* Comments */}
          <div className="comments">
            <h3 className="section-title">💬 Comments ({post.comments?.length || 0})</h3>
            <div className="comments-list">
              {post.comments && post.comments.length > 0 ? (
                post.comments.map(comment => (
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
                      <p className="comment-text">{comment.content}</p>
                    </div>
                    {currentUserId && comment.user_id === currentUserId && (
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
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              🗑️ Delete Comment
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
