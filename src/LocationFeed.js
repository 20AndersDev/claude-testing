import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { createLikeNotification, createCommentNotification } from './notificationHelpers';
import Navbar from './Navbar';
import Post from './Post';
import './Feed.css';

function LocationFeed() {
  const { location } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (location) {
      fetchPosts();
    }
  }, [location]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .single();

      setCurrentUser({
        id: user.id,
        name: profileData?.full_name || profileData?.username || 'User',
        avatar: profileData?.avatar_url || null
      });
    }
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      // Decode the location from URL
      const decodedLocation = decodeURIComponent(location);

      // Fetch posts that match this location (case-insensitive)
      const { data: postsData, error } = await supabase
        .from('posts')
        .select('*')
        .ilike('location', `%${decodedLocation}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
        setIsLoading(false);
        return;
      }

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      // Get unique user IDs from posts
      const userIds = [...new Set(postsData.map(post => post.user_id))];

      // Fetch profiles for these users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);

      // Create a map of user profiles
      const profilesMap = {};
      (profilesData || []).forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // Map posts with profile data
      const mappedPosts = postsData.map(post => {
        const profile = profilesMap[post.user_id];
        return {
          ...post,
          tripTitle: post.trip_title,
          startDate: post.start_date,
          endDate: post.end_date,
          author: profile?.full_name || profile?.username || 'User',
          author_avatar: profile?.avatar_url || null,
          author_username: profile?.username || null,
          timestamp: post.created_at,
          userId: post.user_id
        };
      });

      setPosts(mappedPosts);
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const likePost = async (postId) => {
    if (!currentUser) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.liked_by?.includes(currentUser.id) || false;
    const newLikes = isLiked ? post.likes - 1 : post.likes + 1;
    const newLikedBy = isLiked
      ? (post.liked_by || []).filter(id => id !== currentUser.id)
      : [...(post.liked_by || []), currentUser.id];

    // Optimistically update UI
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, likes: newLikes, liked_by: newLikedBy }
        : p
    ));

    // Update database
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          likes: newLikes,
          liked_by: newLikedBy
        })
        .eq('id', postId);

      if (error) {
        console.error('Error updating likes:', error);
        // Revert on error
        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, likes: post.likes, liked_by: post.liked_by }
            : p
        ));
      } else if (!isLiked && post.user_id !== currentUser.id) {
        await createLikeNotification(
          post.user_id,
          currentUser.id,
          currentUser.name,
          postId
        );
      }
    } catch (error) {
      console.error('Error in likePost:', error);
    }
  };

  const addComment = async (postId, commentContent) => {
    if (!currentUser || !commentContent.trim()) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newComment = {
      id: Date.now(),
      author: currentUser.name,
      avatar_url: currentUser.avatar,
      user_id: currentUser.id,
      content: commentContent,
      timestamp: new Date().toISOString()
    };

    // Optimistically update UI
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, comments: [...(p.comments || []), newComment] }
        : p
    ));

    // Update database
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          comments: [...(post.comments || []), newComment]
        })
        .eq('id', postId);

      if (error) {
        console.error('Error adding comment:', error);
        // Revert on error
        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, comments: post.comments }
            : p
        ));
      } else if (post.user_id !== currentUser.id) {
        await createCommentNotification(
          post.user_id,
          currentUser.id,
          currentUser.name,
          postId,
          commentContent
        );
      }
    } catch (error) {
      console.error('Error in addComment:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const handleDeleteComment = async (postId, commentId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const updatedComments = (post.comments || []).filter(c => c.id !== commentId);

    // Optimistically update UI
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, comments: updatedComments }
        : p
    ));

    // Update database
    try {
      const { error } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);

      if (error) {
        console.error('Error deleting comment:', error);
        // Revert on error
        setPosts(posts.map(p =>
          p.id === postId
            ? { ...p, comments: post.comments }
            : p
        ));
      }
    } catch (error) {
      console.error('Error in handleDeleteComment:', error);
    }
  };

  const decodedLocation = decodeURIComponent(location);

  return (
    <>
      <Navbar onSearchChange={() => {}} />
      <div className="feed-container">
        <div className="feed" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="location-header" style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '20px'
          }}>
            <button
              className="back-button"
              onClick={() => navigate(-1)}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ← Back
            </button>
            <h1 className="location-title" style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--text)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span>📍</span>
              {decodedLocation}
            </h1>
            <p className="location-subtitle" style={{
              fontSize: '14px',
              color: 'var(--text-muted)'
            }}>
              {isLoading ? 'Loading...' : `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`}
            </p>
          </div>

          <div className="posts-container">
            {isLoading ? (
              <div className="loading-state" style={{
                padding: '60px 20px',
                textAlign: 'center'
              }}>
                <div className="loading-spinner" style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid var(--border)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Loading posts...</p>
              </div>
            ) : posts.length > 0 ? (
              posts.map(post => (
                <Post
                  key={post.id}
                  post={post}
                  onLike={likePost}
                  onComment={addComment}
                  onDelete={handleDeletePost}
                  onDeleteComment={handleDeleteComment}
                />
              ))
            ) : (
              <div className="no-results" style={{
                padding: '60px 20px',
                textAlign: 'center'
              }}>
                <div className="no-results-icon" style={{
                  fontSize: '64px',
                  marginBottom: '16px'
                }}>📍</div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text)'
                }}>No posts found</h3>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)'
                }}>There are no posts from {decodedLocation} yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default LocationFeed;
