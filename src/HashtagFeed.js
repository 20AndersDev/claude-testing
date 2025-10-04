import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import Post from './Post';
import './Feed.css';

function HashtagFeed() {
  const { hashtag } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          full_name,
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      // Map database fields to component format
      const mappedPosts = (data || []).map(post => ({
        ...post,
        tripTitle: post.trip_title,
        startDate: post.start_date,
        endDate: post.end_date,
        author: post.profiles?.full_name || post.profiles?.username || 'User',
        timestamp: post.created_at,
        userId: post.user_id
      }));
      setPosts(mappedPosts);
    }
  };

  useEffect(() => {
    if (hashtag && posts.length > 0) {
      const filtered = posts.filter(post =>
        post.hashtags && post.hashtags.includes(hashtag)
      );
      setFilteredPosts(filtered);
    }
  }, [hashtag, posts]);

  const likePost = (postId) => {
    const storedLikedPosts = localStorage.getItem('likedPosts');
    let likedPostIds = storedLikedPosts ? JSON.parse(storedLikedPosts) : [];
    const isCurrentlyLiked = likedPostIds.includes(postId);

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));

    if (isCurrentlyLiked) {
      likedPostIds = likedPostIds.filter(id => id !== postId);
    } else {
      likedPostIds.push(postId);
    }

    localStorage.setItem('likedPosts', JSON.stringify(likedPostIds));
  };

  const addComment = (postId, commentContent) => {
    setPosts(posts.map(post =>
      post.id === postId ? {
        ...post,
        comments: [...post.comments, {
          id: Date.now(),
          author: 'Current User',
          content: commentContent,
          timestamp: new Date()
        }]
      } : post
    ));
  };

  return (
    <>
      <Navbar onSearchChange={() => {}} />
      <div className="feed-container">
        <div className="feed" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="hashtag-header">
            <button className="back-button" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <h1 className="hashtag-title">#{hashtag}</h1>
            <p className="hashtag-subtitle">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
          <div className="posts-container">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <Post
                  key={post.id}
                  post={post}
                  onLike={likePost}
                  onComment={addComment}
                />
              ))
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>No posts found</h3>
                <p>There are no posts with the hashtag #{hashtag}.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default HashtagFeed;
