import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import Post from './Post';
import './Feed.css';

function CountryFeed() {
  const { countryName } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      console.error('Error details:', error.message, error.details, error.hint);
    } else {
      console.log('Fetched posts data:', data);
      // Map database fields to component format
      const mappedPosts = (data || []).map(post => ({
        ...post,
        tripTitle: post.trip_title,
        startDate: post.start_date,
        endDate: post.end_date,
        author: post.author || 'User',
        timestamp: post.created_at,
        userId: post.user_id,
        comments: post.comments || []
      }));
      console.log('Mapped posts:', mappedPosts);
      setPosts(mappedPosts);
    }
  };

  useEffect(() => {
    if (countryName && posts.length > 0) {
      // Decode the country name from URL
      const decodedCountry = decodeURIComponent(countryName);

      const filtered = posts.filter(post => {
        // Check if the post's location contains the country name
        if (!post.location) return false;

        // Case-insensitive search
        const locationLower = post.location.toLowerCase();
        const countryLower = decodedCountry.toLowerCase();

        // Try multiple matching strategies:
        // 1. Exact match of country name in location
        // 2. Word boundary match (e.g., "Finland" matches but not "Fin")
        // 3. Check if location ends with country name (e.g., "Helsinki, Finland")
        const exactMatch = locationLower.includes(countryLower);
        const wordMatch = locationLower.split(/[\s,]+/).some(word => word === countryLower);

        return exactMatch || wordMatch;
      });

      console.log('Country:', decodedCountry);
      console.log('Total posts:', posts.length);
      console.log('Filtered posts:', filtered.length);
      console.log('All locations:', posts.map(p => p.location));
      console.log('Filtered locations:', filtered.map(p => p.location));

      setFilteredPosts(filtered);
    }
  }, [countryName, posts]);

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

  // Decode country name for display
  const displayCountryName = decodeURIComponent(countryName);

  return (
    <>
      <Navbar onSearchChange={() => {}} />
      <div className="feed-container" style={{ justifyContent: 'center' }}>
        <div className="feed">
          <div className="hashtag-header">
            <button className="back-button" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <h1 className="hashtag-title">🌍 {displayCountryName}</h1>
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
                <p>There are no posts about {displayCountryName}.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CountryFeed;
