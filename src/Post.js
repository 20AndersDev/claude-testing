import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import {
  createLikeNotification,
  createCommentNotification,
  createFollowNotification,
} from "./notificationHelpers";
import "./Post.css";

function Post({ post, onLike, onComment, onDelete, onDeleteComment }) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
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
  const [currentUserName, setCurrentUserName] = useState("");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && post.user_id && currentUserId !== post.user_id) {
      checkFollowStatus();
    }
    if (currentUserId) {
      checkBookmarkStatus();
    }
  }, [currentUserId, post.user_id]);

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
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu, showCommentMenus]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);

      // Fetch user's avatar and name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, username")
        .eq("id", user.id)
        .single();

      setCurrentUserAvatar(
        profileData?.avatar_url || user.user_metadata?.avatar_url || null
      );
      setCurrentUserName(
        profileData?.full_name || profileData?.username || "User"
      );
    }
  };

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", post.user_id)
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
        .from("bookmarks")
        .select("id")
        .eq("user_id", currentUserId)
        .eq("post_id", post.id)
        .single();

      if (!error && data) {
        setIsBookmarked(true);
      }
    } catch (error) {
      // No bookmark exists
      setIsBookmarked(false);
    }
  };

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (!currentUserId || currentUserId === post.user_id || isLoadingFollow)
      return;

    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", post.user_id);

        if (!error) {
          setIsFollowing(false);
        }
      } else {
        // Follow
        const { error } = await supabase.from("follows").insert([
          {
            follower_id: currentUserId,
            following_id: post.user_id,
          },
        ]);

        if (!error) {
          setIsFollowing(true);
          // Create follow notification
          await createFollowNotification(
            post.user_id,
            currentUserId,
            currentUserName
          );
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleBookmark = async () => {
    if (!currentUserId) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", post.id);

        if (!error) {
          setIsBookmarked(false);
        }
      } else {
        // Add bookmark
        const { error } = await supabase.from("bookmarks").insert([
          {
            user_id: currentUserId,
            post_id: post.id,
          },
        ]);

        if (!error) {
          setIsBookmarked(true);
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const { error } = await supabase
          .from("posts")
          .delete()
          .eq("id", post.id);

        if (error) {
          console.error("Error deleting post:", error);
          alert("Failed to delete post");
        } else {
          // Call parent component's onDelete if provided
          if (onDelete) {
            onDelete(post.id);
          }
        }
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete post");
      }
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const toggleCommentMenu = (commentId, e) => {
    e.stopPropagation();
    setShowCommentMenus((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleLike = async () => {
    if (!currentUserId) {
      setShowLoginPrompt(true);
      return;
    }

    onLike(post.id);

    // Create like notification
    const isLiked = post.liked_by?.includes(currentUserId);
    if (!isLiked && post.user_id && currentUserId !== post.user_id) {
      await createLikeNotification(
        post.user_id,
        currentUserId,
        currentUserName,
        post.id
      );
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      setShowLoginPrompt(true);
      return;
    }
    console.log("handleCommentSubmit called, commentText:", commentText);
    if (commentText.trim()) {
      console.log("Calling onComment with:", post.id, commentText);
      await onComment(post.id, commentText);

      // Create comment notification
      if (post.user_id && currentUserId !== post.user_id) {
        console.log("Creating comment notification");
        await createCommentNotification(
          post.user_id,
          currentUserId,
          currentUserName,
          post.id,
          commentText
        );
      }

      setCommentText("");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getActivityIcon = (type) => {
    const icons = {
      restaurant: "🍽️",
      bar: "🍺",
      monument: "🏛️",
      attraction: "🎢",
      hotel: "🏨",
      museum: "🏛️",
      park: "🌳",
      beach: "🏖️",
    };
    return icons[type] || "📍";
  };

  const getTransportIcon = (type) => {
    const icons = {
      plane: "✈️",
      train: "🚊",
      car: "🚗",
      bus: "🚌",
      boat: "🛥️",
      bike: "🚴",
      walking: "🚶",
      taxi: "🚕",
      metro: "🚇",
    };
    return icons[type] || "🚗";
  };

  const calculateTotalCost = () => {
    let total = 0;
    if (post.activities) {
      post.activities.forEach((activity) => {
        if (activity.cost) total += parseFloat(activity.cost);
      });
    }
    if (post.transport) {
      post.transport.forEach((t) => {
        if (t.cost) total += parseFloat(t.cost);
      });
    }
    if (post.accommodations) {
      post.accommodations.forEach((acc) => {
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

  const getEventIcon = (eventType) => {
    const eventIcons = {
      concert: '🎵',
      festival: '🎪',
      sports: '⚽',
      conference: '📊',
      exhibition: '🎨',
      theater: '🎭',
      food: '🍽️',
      other: '🎉'
    };
    return eventIcons[eventType] || '🎫';
  };

  const getCountryFlag = (country) => {
    const countryFlags = {
      "United States": "🇺🇸",
      Canada: "🇨🇦",
      Mexico: "🇲🇽",
      "United Kingdom": "🇬🇧",
      France: "🇫🇷",
      Germany: "🇩🇪",
      Italy: "🇮🇹",
      Spain: "🇪🇸",
      Portugal: "🇵🇹",
      Netherlands: "🇳🇱",
      Belgium: "🇧🇪",
      Switzerland: "🇨🇭",
      Austria: "🇦🇹",
      Greece: "🇬🇷",
      Turkey: "🇹🇷",
      Poland: "🇵🇱",
      "Czech Republic": "🇨🇿",
      Hungary: "🇭🇺",
      Romania: "🇷🇴",
      Sweden: "🇸🇪",
      Norway: "🇳🇴",
      Denmark: "🇩🇰",
      Finland: "🇫🇮",
      Iceland: "🇮🇸",
      Ireland: "🇮🇪",
      Russia: "🇷🇺",
      China: "🇨🇳",
      Japan: "🇯🇵",
      "South Korea": "🇰🇷",
      India: "🇮🇳",
      Thailand: "🇹🇭",
      Vietnam: "🇻🇳",
      Singapore: "🇸🇬",
      Malaysia: "🇲🇾",
      Indonesia: "🇮🇩",
      Philippines: "🇵🇭",
      Australia: "🇦🇺",
      "New Zealand": "🇳🇿",
      Brazil: "🇧🇷",
      Argentina: "🇦🇷",
      Chile: "🇨🇱",
      Peru: "🇵🇪",
      Colombia: "🇨🇴",
      Egypt: "🇪🇬",
      Morocco: "🇲🇦",
      "South Africa": "🇿🇦",
      Kenya: "🇰🇪",
      UAE: "🇦🇪",
      Israel: "🇮🇱",
      "Saudi Arabia": "🇸🇦",
    };
    return countryFlags[country] || "🌍";
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
    setCurrentImageIndex(
      (prev) => (prev - 1 + postImages.length) % postImages.length
    );
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
            className={`rating-star ${star <= rating ? "filled" : "empty"}`}
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

  const getRatingEmoji = (rating) => {
    const emojis = {
      1: "😞",
      2: "😕",
      3: "😐",
      4: "😊",
      5: "😍",
    };
    return emojis[rating] || null;
  };

  const getRatingText = (rating) => {
    const texts = {
      1: "Not Great",
      2: "Okay",
      3: "Good",
      4: "Really Good",
      5: "Loved It",
    };
    return texts[rating] || null;
  };

  const shouldTruncateText = (text) => {
    if (!text) return false;
    return text.length > 250;
  };

  const getTruncatedText = (text) => {
    if (!text) return "";
    if (text.length <= 250) return text;

    // Find the last space before the 250 character limit to avoid cutting mid-word
    const truncated = text.substring(0, 250);
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace > 200) {
      return text.substring(0, lastSpace) + "...";
    }

    return truncated + "...";
  };

  return (
    <div className="post">
      <div className="post-header">
        <div className="post-author-info">
          <div
            className="author-avatar"
            onClick={() =>
              navigate(
                currentUserId === post.user_id
                  ? "/profile"
                  : `/profile/${post.user_id}`
              )
            }
            style={{ cursor: "pointer" }}
          >
            {post.author_avatar ? (
              <img
                src={post.author_avatar}
                alt={post.author}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">👤</div>
            )}
          </div>
          <div className="author-details">
            <div className="author-name-row">
              <div className="author-info-container">
                {post.is_event && post.event_name && post.location ? (
                  <div className="visit-announcement">
                    <span
                      className="author-name-inline"
                      onClick={() =>
                        navigate(
                          currentUserId === post.user_id
                            ? "/profile"
                            : `/profile/${post.user_id}`
                        )
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {post.author}
                    </span>
                    <span className="visit-text"> was at </span>
                    <span className="event-name-inline">
                      {getEventIcon(post.event_type)} {post.event_name}
                    </span>
                    <span className="visit-text"> in </span>
                    <span className="visit-location">{post.location}</span>
                    {post.country && (
                      <span className="country-flag-inline">
                        {getCountryFlag(post.country)}
                      </span>
                    )}
                  </div>
                ) : post.tripTitle && post.location ? (
                  <div className="visit-announcement">
                    <span
                      className="author-name-inline"
                      onClick={() =>
                        navigate(
                          currentUserId === post.user_id
                            ? "/profile"
                            : `/profile/${post.user_id}`
                        )
                      }
                      style={{ cursor: "pointer" }}
                    >
                      {post.author}
                    </span>
                    <span className="visit-text"> visited </span>
                    <span className="visit-location">{post.location}</span>
                    {post.country && (
                      <span className="country-flag-inline">
                        {getCountryFlag(post.country)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className="author-name"
                    onClick={() =>
                      navigate(
                        currentUserId === post.user_id
                          ? "/profile"
                          : `/profile/${post.user_id}`
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {post.author}
                  </div>
                )}
                {post.author_username && (
                  <div className="author-handle">@{post.author_username}</div>
                )}
              </div>
              {currentUserId &&
                post.user_id !== currentUserId &&
                !isFollowing && (
                  <button
                    className="follow-btn-compact"
                    onClick={handleFollowToggle}
                    disabled={isLoadingFollow}
                    title="Follow"
                  >
                    <span className="follow-icon">+</span>
                  </button>
                )}
            </div>
          </div>
        </div>
        <div className="post-header-actions">
          <div className="post-timestamp">
            <div className="post-date">{formatDate(post.timestamp)}</div>
            <div className="post-time">{formatTime(post.timestamp)}</div>
          </div>
          {currentUserId && post.user_id === currentUserId && (
            <div className="post-menu-container">
              <button
                className="post-menu-btn"
                onClick={toggleMenu}
                title="More options"
              >
                ⋮
              </button>
              {showMenu && (
                <div className="post-menu-dropdown">
                  <button
                    className="menu-item edit-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      navigate(`/edit-trip/${post.id}`);
                    }}
                  >
                    ✏️ Edit Post
                  </button>
                  <button
                    className="menu-item delete-item"
                    onClick={handleDelete}
                  >
                    🗑️ Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {post.is_event || post.tripTitle ? (
        <div className="trip-post">
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
                    alt={post.is_event ? "Event" : "Travel destination"}
                  />
                  {postImages.length > 1 && (
                    <>
                      <div className="image-counter">
                        {currentImageIndex + 1}/{postImages.length}
                      </div>
                      <button
                        className="nav-btn prev-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        ‹
                      </button>
                      <button
                        className="nav-btn next-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
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
                        className={`dot ${
                          index === currentImageIndex ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          goToImage(index);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className="trip-header"
            onClick={handleTripClick}
            style={{ cursor: "pointer" }}
          >
            <div className="trip-header-content">
              <div className="trip-title-section">
                {post.is_event ? (
                  <>
                    <h3 className="trip-title">
                      {getEventIcon(post.event_type)} {post.tripTitle}
                    </h3>
                    {post.event_name && (
                      <div className="event-name-subtitle">
                        🎫 {post.event_name}
                      </div>
                    )}
                    <div className="trip-dates">
                      📅 {post.startDate && formatDate(post.startDate)}
                      {post.startDate && post.endDate && " - "}
                      {post.endDate && formatDate(post.endDate)}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="trip-title">🗺️ {post.tripTitle}</h3>
                    <div className="trip-dates">
                      📅 {post.startDate && formatDate(post.startDate)}
                      {post.startDate && post.endDate && " - "}
                      {post.endDate && formatDate(post.endDate)}
                    </div>
                  </>
                )}
              </div>
              {post.trip_rating && (
                <div className="trip-rating-badge">
                  <span className="rating-emoji-header">
                    {getRatingEmoji(post.trip_rating)}
                  </span>
                  <span className="rating-text">
                    {getRatingText(post.trip_rating)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="post-content">
            <p onClick={handleTripClick} style={{ cursor: "pointer" }}>
              {renderTextWithHashtags(
                isTextExpanded || !shouldTruncateText(post.content)
                  ? post.content
                  : getTruncatedText(post.content)
              )}
            </p>
            {shouldTruncateText(post.content) && !isTextExpanded && (
              <button
                className="show-more-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTripClick();
                }}
              >
                Show more
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="post-content">
          <p onClick={handlePostClick} style={{ cursor: "pointer" }}>
            {renderTextWithHashtags(
              isTextExpanded || !shouldTruncateText(post.content)
                ? post.content
                : getTruncatedText(post.content)
            )}
          </p>
          {shouldTruncateText(post.content) && !isTextExpanded && (
            <button
              className="show-more-btn"
              onClick={(e) => {
                e.stopPropagation();
                handlePostClick();
              }}
            >
              Show more
            </button>
          )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                      >
                        ‹
                      </button>
                      <button
                        className="nav-btn next-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
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
                        className={`dot ${
                          index === currentImageIndex ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          goToImage(index);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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

      <div className="post-stats">
        <div className="likes-count">
          {(post.likes || 0) > 0 &&
            `${post.likes} like${post.likes > 1 ? "s" : ""}`}
        </div>
        <div className="comments-count">
          {(post.comments || []).length > 0 && (
            <button
              className="comments-toggle"
              onClick={() => setShowComments(!showComments)}
            >
              {(post.comments || []).length} comment
              {(post.comments || []).length > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {post.booking_link && (
        <div className="booking-link-container">
          <a
            href={post.booking_link}
            target="_blank"
            rel="noopener noreferrer"
            className="booking-link-button"
          >
            <span className="booking-link-icon">🔗</span>
            <span className="booking-link-text">View Booking Details</span>
            <span className="booking-link-arrow">→</span>
          </a>
        </div>
      )}

      <div className="post-actions">
        <button
          className={`action-btn like-btn ${
            currentUserId && (post.liked_by || []).includes(currentUserId)
              ? "liked"
              : ""
          }`}
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
          className={`action-btn bookmark-btn ${
            isBookmarked ? "bookmarked" : ""
          }`}
          onClick={handleBookmark}
          title={isBookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <span className="action-icon">{isBookmarked ? "🔖" : "🏷️"}</span>
          <span className="action-text">
            {isBookmarked ? "Saved" : "Bookmark"}
          </span>
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {(post.comments || []).map((comment) => (
            <div key={comment.id} className="comment">
              <div className="comment-avatar">
                {comment.avatar_url ? (
                  <img
                    src={comment.avatar_url}
                    alt={comment.author}
                    className="comment-avatar-image"
                  />
                ) : (
                  <div className="comment-avatar-placeholder">👤</div>
                )}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <div className="comment-author">{comment.author}</div>
                  <div className="comment-time">
                    {formatTime(comment.timestamp)}
                  </div>
                </div>
                <div className="comment-text">{renderTextWithHashtags(comment.content)}</div>
              </div>
              {currentUserId &&
                comment.user_id === currentUserId &&
                onDeleteComment && (
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
                <img
                  src={currentUserAvatar}
                  alt="Your avatar"
                  className="comment-avatar-image"
                />
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

      {showLoginPrompt && (
        <div
          className="login-prompt-overlay"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="login-prompt-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="login-prompt-close"
              onClick={() => setShowLoginPrompt(false)}
            >
              ✕
            </button>
            <div className="login-prompt-icon">🔒</div>
            <h3>Sign in required</h3>
            <p>You need to be signed in to interact with posts.</p>
            <div className="login-prompt-actions">
              <button
                className="login-prompt-btn primary"
                onClick={() => navigate("/login")}
              >
                Sign In
              </button>
              <button
                className="login-prompt-btn secondary"
                onClick={() => setShowLoginPrompt(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Post;
