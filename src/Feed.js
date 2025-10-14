import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Navbar from "./Navbar";
import CreatePost from "./CreatePost";
import Post from "./Post";
import Sidebar from "./Sidebar";
import useSwipeNavigation from "./useSwipeNavigation";
import "./Feed.css";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useSwipeNavigation();

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscription for post updates
    const postsSubscription = supabase
      .channel("posts-feed")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          // Update the specific post in the list
          setPosts((prevPosts) =>
            prevPosts.map((post) => {
              if (post.id === payload.new.id) {
                return {
                  ...payload.new,
                  tripTitle: payload.new.trip_title,
                  startDate: payload.new.start_date,
                  endDate: payload.new.end_date,
                  timestamp: payload.new.created_at,
                  userEmail: payload.new.user_id,
                  userId: payload.new.user_id,
                  isFollowing: post.isFollowing, // Keep the existing follow status
                };
              }
              return post;
            })
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          // Add new post to the beginning of the list
          const newPost = {
            ...payload.new,
            tripTitle: payload.new.trip_title,
            startDate: payload.new.start_date,
            endDate: payload.new.end_date,
            timestamp: payload.new.created_at,
            userEmail: payload.new.user_id,
            userId: payload.new.user_id,
            isFollowing: false,
          };
          setPosts((prevPosts) => [newPost, ...prevPosts]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
        },
        (payload) => {
          // Remove deleted post from the list
          setPosts((prevPosts) =>
            prevPosts.filter((post) => post.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch user's follows if logged in
      let followedUserIds = [];
      if (user) {
        const { data: followsData } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        followedUserIds = (followsData || []).map((f) => f.following_id);
      }

      // Map database fields to component format
      const mappedPosts = (postsData || []).map((post) => ({
        ...post,
        tripTitle: post.trip_title,
        startDate: post.start_date,
        endDate: post.end_date,
        timestamp: post.created_at,
        userEmail: post.user_id,
        userId: post.user_id,
        isFollowing: followedUserIds.includes(post.user_id),
      }));

      setPosts(mappedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [filteredPosts, setFilteredPosts] = useState(posts);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("following");

  useEffect(() => {
    let filtered = posts;

    // Apply tab filter first
    if (activeTab === "following") {
      filtered = filtered.filter((post) => post.isFollowing);
    } else if (activeTab === "discovery") {
      filtered = filtered.filter((post) => !post.isFollowing);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.tripTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.activities?.some(
            (activity) =>
              activity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              activity.description
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              activity.type?.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case "popular":
        filtered = filtered.sort((a, b) => b.likes - a.likes);
        break;
      case "recent":
        filtered = filtered.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        break;
      case "weekend":
        filtered = filtered.filter((post) => {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to create a post");
        return;
      }

      const { data, error } = await supabase
        .from("posts")
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
            likes_count: 0,
          },
        ])
        .select();

      if (error) throw error;

      await fetchPosts(); // Refresh posts
      setShowCreatePost(false);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    }
  };

  const likePost = async (postId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get current post
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      // Get current liked_by array (users who liked this post)
      const likedBy = post.liked_by || [];
      const hasLiked = likedBy.includes(user.id);

      // Toggle like
      let newLikedBy;
      let newLikes;

      if (hasLiked) {
        // Unlike: remove user from liked_by array
        newLikedBy = likedBy.filter((id) => id !== user.id);
        newLikes = Math.max(0, (post.likes || 0) - 1);
      } else {
        // Like: add user to liked_by array
        newLikedBy = [...likedBy, user.id];
        newLikes = (post.likes || 0) + 1;
      }

      // Update in Supabase
      const { error } = await supabase
        .from("posts")
        .update({
          likes: newLikes,
          liked_by: newLikedBy,
        })
        .eq("id", postId);

      if (error) {
        console.error("Error updating likes:", error.message, error);
        alert("Failed to update like: " + error.message);
        return;
      }

      // Update local state
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, likes: newLikes, liked_by: newLikedBy } : p
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const addComment = async (postId, commentContent) => {
    try {
      console.log("addComment called with:", postId, commentContent);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user found");
        return;
      }

      // Get current post
      const post = posts.find((p) => p.id === postId);
      if (!post) {
        console.log("Post not found:", postId);
        return;
      }
      console.log("Found post:", post);

      // Fetch user's profile to get display name and avatar
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", user.id)
        .single();

      const displayName =
        profileData?.full_name ||
        profileData?.username ||
        user.user_metadata?.display_name ||
        user.email?.split("@")[0] ||
        "User";
      const avatarUrl =
        profileData?.avatar_url || user.user_metadata?.avatar_url || null;

      // Create new comment
      const newComment = {
        id: Date.now(),
        user_id: user.id,
        author: displayName,
        avatar_url: avatarUrl,
        content: commentContent,
        timestamp: new Date().toISOString(),
      };

      // Update comments in Supabase
      const updatedComments = [...(post.comments || []), newComment];
      console.log("Updating post with comments:", updatedComments);
      const { data, error } = await supabase
        .from("posts")
        .update({ comments: updatedComments })
        .eq("id", postId)
        .select();

      if (error) {
        console.error("Error adding comment:", error);
        return;
      }

      console.log("Comment added successfully:", data);

      // Update local state
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, comments: updatedComments } : p
        )
      );
    } catch (error) {
      console.error("Error commenting on post:", error);
    }
  };

  const handleDelete = (postId) => {
    // Remove the deleted post from state
    setPosts(posts.filter((post) => post.id !== postId));
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      // Get current post
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      // Remove the comment from the array
      const updatedComments = (post.comments || []).filter(
        (c) => c.id !== commentId
      );

      // Update in Supabase
      const { error } = await supabase
        .from("posts")
        .update({ comments: updatedComments })
        .eq("id", postId);

      if (error) {
        console.error("Error deleting comment:", error);
        return;
      }

      // Update local state
      setPosts(
        posts.map((p) =>
          p.id === postId ? { ...p, comments: updatedComments } : p
        )
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <>
      <Navbar
        onSearchChange={handleSearchChange}
        onSidebarToggle={handleSidebarToggle}
      />
      <div className="feed-container page-transition-container">
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
              className={`feed-tab ${
                activeTab === "following" ? "active" : ""
              }`}
              onClick={() => handleTabChange("following")}
            >
              <span className="tab-icon">👥</span>
              Following
            </button>
            <button
              className={`feed-tab ${
                activeTab === "discovery" ? "active" : ""
              }`}
              onClick={() => handleTabChange("discovery")}
            >
              <span className="tab-icon">🌍</span>
              Discover
            </button>
          </div>
          {showCreatePost && <CreatePost onAddPost={addPost} />}
          <div className="posts-container">
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading posts...</p>
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Post
                  key={post.id}
                  post={post}
                  onLike={likePost}
                  onComment={addComment}
                  onDelete={handleDelete}
                  onDeleteComment={handleDeleteComment}
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
