import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Navbar from './Navbar';
import CreatePost from './CreatePost';
import Post from './Post';
import Sidebar from './Sidebar';
import './Feed.css';

function Feed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch comments for each post
      const postsWithComments = await Promise.all(
        postsData.map(async (post) => {
          const { data: commentsData } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          const { data: likesData } = await supabase
            .from('likes')
            .select('user_id')
            .eq('post_id', post.id);

          return {
            ...post,
            timestamp: new Date(post.created_at),
            likes: post.likes_count || 0,
            comments: commentsData?.map(comment => ({
              id: comment.id,
              author: comment.author,
              content: comment.content,
              timestamp: new Date(comment.created_at)
            })) || [],
            isFollowing: false // You can implement following logic later
          };
        })
      );

      setPosts(postsWithComments);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const [filteredPosts, setFilteredPosts] = useState(posts);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('following');

  useEffect(() => {
    let filtered = posts;

    // Apply tab filter first
    if (activeTab === 'following') {
      filtered = filtered.filter(post => post.isFollowing);
    } else if (activeTab === 'discovery') {
      filtered = filtered.filter(post => !post.isFollowing);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.tripTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.activities?.some(activity =>
          activity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.type?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'popular':
        filtered = filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        break;
      case 'weekend':
        filtered = filtered.filter(post => {
          if (!post.startDate || !post.endDate) return false;
          const start = new Date(post.startDate);
          const end = new Date(post.endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return diffDays <= 3; // Weekend trips (1-3 days)
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, activeFilter, activeTab]);

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleCreatePostToggle = () => {
    setShowCreatePost(true);
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const addPost = async (tripData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to create a post');
        return;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            author: user.user_metadata?.full_name || user.email,
            content: tripData.content,
            trip_title: tripData.tripTitle,
            location: tripData.location,
            start_date: tripData.startDate,
            end_date: tripData.endDate,
            activities: tripData.activities,
            transport: tripData.transport,
            hashtags: tripData.hashtags,
            likes_count: 0
          }
        ])
        .select();

      if (error) throw error;

      await fetchPosts(); // Refresh posts
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  const likePost = async (postId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to like posts');
        return;
      }

      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        await supabase
          .from('posts')
          .update({ likes_count: supabase.raw('likes_count - 1') })
          .eq('id', postId);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        await supabase
          .from('posts')
          .update({ likes_count: supabase.raw('likes_count + 1') })
          .eq('id', postId);
      }

      await fetchPosts(); // Refresh posts
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const addComment = async (postId, commentContent) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to comment');
        return;
      }

      const { error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: user.id,
            author: user.user_metadata?.full_name || user.email,
            content: commentContent
          }
        ]);

      if (error) throw error;

      await fetchPosts(); // Refresh posts
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  return (
    <>
      <Navbar
        onSearchChange={handleSearchChange}
        onSidebarToggle={handleSidebarToggle}
      />
      <div className="feed-container">
        <Sidebar
          posts={posts}
          onFilterChange={handleFilterChange}
          onCreatePost={handleCreatePostToggle}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="feed">
          <div className="feed-tabs">
            <button
              className={`feed-tab ${activeTab === 'following' ? 'active' : ''}`}
              onClick={() => handleTabChange('following')}
            >
              <span className="tab-icon">👥</span>
              Following
            </button>
            <button
              className={`feed-tab ${activeTab === 'discovery' ? 'active' : ''}`}
              onClick={() => handleTabChange('discovery')}
            >
              <span className="tab-icon">🌍</span>
              Discovery
            </button>
          </div>
          {showCreatePost && <CreatePost onAddPost={addPost} />}
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
                <h3>No trips found</h3>
                <p>Try adjusting your search or filters to find more trips.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Feed;