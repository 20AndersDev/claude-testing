import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import Post from './Post';
import './Bookmarks.css';

function Bookmarks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);

      // Fetch bookmarks with post details
      const { data: bookmarks, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          post_id,
          posts (
            id,
            content,
            images,
            location,
            likes,
            user_id,
            created_at,
            hashtags,
            comments,
            liked_by
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each post
      const postsWithProfiles = await Promise.all(
        bookmarks
          .filter(b => b.posts)
          .map(async (bookmark) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, username, avatar_url')
              .eq('id', bookmark.posts.user_id)
              .single();

            return {
              ...bookmark.posts,
              bookmarkId: bookmark.id,
              timestamp: bookmark.posts.created_at,
              userId: bookmark.posts.user_id,
              user_id: bookmark.posts.user_id,
              author: profile?.full_name || profile?.username || 'User',
              author_avatar: profile?.avatar_url || null,
            };
          })
      );

      setBookmarkedPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;

      // Remove from local state
      setBookmarkedPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="bookmarks-page page-transition-container">
        <div className="bookmarks-container">
          <div className="bookmarks-header">
            <h1>🔖 Bookmarks</h1>
            <p className="bookmarks-subtitle">
              {bookmarkedPosts.length === 0
                ? 'Save trips and posts to revisit later'
                : `${bookmarkedPosts.length} ${bookmarkedPosts.length === 1 ? 'bookmark' : 'bookmarks'} saved`}
            </p>
          </div>

          {loading ? (
            <div className="bookmarks-loading">
              <div className="loading-spinner"></div>
              <p>Loading bookmarks...</p>
            </div>
          ) : bookmarkedPosts.length === 0 ? (
            <div className="bookmarks-empty">
              <div className="empty-icon">📌</div>
              <h3>No bookmarks yet</h3>
              <p>Start saving posts and trips you want to explore!</p>
              <button className="browse-btn" onClick={() => navigate('/feed')}>
                Browse Feed
              </button>
            </div>
          ) : (
            <div className="bookmarks-grid">
              {bookmarkedPosts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onBookmarkRemove={() => handleRemoveBookmark(post.id)}
                  isBookmarked={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Bookmarks;
