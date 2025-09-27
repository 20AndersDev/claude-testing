import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Post from './Post';
import './Profile.css';

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [profile, setProfile] = useState({
    name: 'Current User',
    email: 'user@example.com',
    bio: 'Welcome to my profile! I love sharing thoughts and connecting with others.',
    location: 'New York, NY',
    joinDate: 'January 2024'
  });

  const [editedProfile, setEditedProfile] = useState(profile);

  // Load posts and liked posts from localStorage
  useEffect(() => {
    const storedPosts = localStorage.getItem('tripPosts');
    if (storedPosts) {
      const allPosts = JSON.parse(storedPosts);

      // Filter user's own posts (posts by "Current User" or "You")
      const userPosts = allPosts.filter(post =>
        post.author === 'Current User' || post.author === 'You'
      );
      setPosts(userPosts);

      // Get liked posts from localStorage
      const storedLikedPosts = localStorage.getItem('likedPosts');
      if (storedLikedPosts) {
        const likedPostIds = JSON.parse(storedLikedPosts);
        const likedPostsData = allPosts.filter(post =>
          likedPostIds.includes(post.id)
        );
        setLikedPosts(likedPostsData);
      }
    }
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLike = (postId) => {
    // Handle like functionality - update localStorage
    const storedLikedPosts = localStorage.getItem('likedPosts');
    let likedPostIds = storedLikedPosts ? JSON.parse(storedLikedPosts) : [];

    if (likedPostIds.includes(postId)) {
      // Unlike
      likedPostIds = likedPostIds.filter(id => id !== postId);
    } else {
      // Like
      likedPostIds.push(postId);
    }

    localStorage.setItem('likedPosts', JSON.stringify(likedPostIds));

    // Update liked posts display
    const storedPosts = localStorage.getItem('tripPosts');
    if (storedPosts) {
      const allPosts = JSON.parse(storedPosts);
      const likedPostsData = allPosts.filter(post =>
        likedPostIds.includes(post.id)
      );
      setLikedPosts(likedPostsData);
    }
  };

  const handleComment = (postId, comment) => {
    // Handle comment functionality
    console.log('Comment on post', postId, ':', comment);
  };

  return (
    <>
      <Navbar />
      <div className="profile">
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              👤
            </div>
            <div className="profile-info">
              {isEditing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    name="name"
                    value={editedProfile.name}
                    onChange={handleChange}
                    className="edit-input"
                    placeholder="Name"
                  />
                  <input
                    type="email"
                    name="email"
                    value={editedProfile.email}
                    onChange={handleChange}
                    className="edit-input"
                    placeholder="Email"
                  />
                  <input
                    type="text"
                    name="location"
                    value={editedProfile.location}
                    onChange={handleChange}
                    className="edit-input"
                    placeholder="Location"
                  />
                  <textarea
                    name="bio"
                    value={editedProfile.bio}
                    onChange={handleChange}
                    className="edit-textarea"
                    placeholder="Bio"
                    rows="4"
                  />
                  <div className="edit-buttons">
                    <button onClick={handleSave} className="save-btn">Save</button>
                    <button onClick={handleCancel} className="cancel-btn">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="display-info">
                  <h1 className="profile-name">{profile.name}</h1>
                  <p className="profile-email">{profile.email}</p>
                  <p className="profile-location">📍 {profile.location}</p>
                  <p className="profile-bio">{profile.bio}</p>
                  <p className="profile-join-date">Joined {profile.joinDate}</p>
                  <button onClick={handleEdit} className="edit-btn">Edit Profile</button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat">
              <span className="stat-number">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat">
              <span className="stat-number">{likedPosts.length}</span>
              <span className="stat-label">Liked</span>
            </div>
            <div className="stat">
              <span className="stat-number">{posts.reduce((total, post) => total + (post.likes || 0), 0)}</span>
              <span className="stat-label">Total Likes</span>
            </div>
          </div>

          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              📝 My Posts ({posts.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'liked' ? 'active' : ''}`}
              onClick={() => setActiveTab('liked')}
            >
              ❤️ Liked Posts ({likedPosts.length})
            </button>
          </div>

          <div className="profile-content">
            {activeTab === 'posts' && (
              <div className="posts-section">
                {posts.length > 0 ? (
                  <div className="posts-grid">
                    {posts.map(post => (
                      <Post
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🗺️</div>
                    <h3>No trips shared yet</h3>
                    <p>Start sharing your travel adventures to see them here!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'liked' && (
              <div className="liked-section">
                {likedPosts.length > 0 ? (
                  <div className="posts-grid">
                    {likedPosts.map(post => (
                      <Post
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">❤️</div>
                    <h3>No liked posts yet</h3>
                    <p>Like some posts to see them here!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;