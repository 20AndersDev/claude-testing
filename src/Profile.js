import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Post from './Post';
import WorldMap from './WorldMap';
import './Profile.css';

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [visitedCountries, setVisitedCountries] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Current User',
    email: 'user@example.com',
    bio: 'Welcome to my profile! I love sharing thoughts and connecting with others.',
    location: 'New York, NY',
    joinDate: 'January 2024',
    profilePicture: '👤'
  });

  const [editedProfile, setEditedProfile] = useState(profile);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Load posts, liked posts, and visited countries from localStorage
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

    // Load visited countries from localStorage
    const storedVisitedCountries = localStorage.getItem('visitedCountries');
    if (storedVisitedCountries) {
      setVisitedCountries(JSON.parse(storedVisitedCountries));
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
    const updatedProfile = { ...editedProfile };
    if (previewUrl) {
      updatedProfile.profilePicture = previewUrl;
    }
    setProfile(updatedProfile);
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setEditedProfile(prev => ({
      ...prev,
      profilePicture: emoji
    }));
    setPreviewUrl(null);
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

  const handleCountryToggle = (countryId, countryName) => {
    const newVisitedCountries = [...visitedCountries];
    const index = newVisitedCountries.indexOf(countryId);

    if (index > -1) {
      // Remove country if already visited
      newVisitedCountries.splice(index, 1);
    } else {
      // Add country if not visited
      newVisitedCountries.push(countryId);
    }

    setVisitedCountries(newVisitedCountries);
    localStorage.setItem('visitedCountries', JSON.stringify(newVisitedCountries));
  };

  return (
    <>
      <Navbar />
      <div className="profile">
        <div className="profile-container">
          <div className="profile-header">
            {isEditing ? (
              <div className="profile-edit-container">
                <div className="profile-picture-edit">
                  <div className="current-avatar">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile" className="avatar-preview" />
                    ) : (
                      <span className="avatar-emoji">{editedProfile.profilePicture}</span>
                    )}
                  </div>
                  <div className="avatar-options">
                    <label htmlFor="file-upload" className="upload-btn">
                      📷 Upload Photo
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <div className="emoji-picker">
                      <p className="emoji-label">Or choose an emoji:</p>
                      <div className="emoji-grid">
                        {['👤', '😊', '🧳', '✈️', '🌍', '🏖️', '🗺️', '📸', '🎒', '🚀', '🌟', '💼'].map((emoji) => (
                          <button
                            key={emoji}
                            className={`emoji-option ${editedProfile.profilePicture === emoji ? 'selected' : ''}`}
                            onClick={() => handleEmojiSelect(emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="profile-bio-edit">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={editedProfile.bio}
                    onChange={handleChange}
                    className="edit-textarea"
                    placeholder="Tell us about yourself..."
                    rows="6"
                  />
                </div>
                <div className="edit-buttons">
                  <button onClick={handleSave} className="save-btn">💾 Save Changes</button>
                  <button onClick={handleCancel} className="cancel-btn">❌ Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="profile-avatar">
                  {profile.profilePicture.startsWith('data:') ? (
                    <img src={profile.profilePicture} alt="Profile" className="avatar-image" />
                  ) : (
                    <span className="avatar-emoji">{profile.profilePicture}</span>
                  )}
                </div>
                <div className="profile-info">
                  <div className="display-info">
                    <h1 className="profile-name">{profile.name}</h1>
                    <p className="profile-email">{profile.email}</p>
                    <p className="profile-location">📍 {profile.location}</p>
                    <p className="profile-bio">{profile.bio}</p>
                    <p className="profile-join-date">Joined {profile.joinDate}</p>
                    <button onClick={handleEdit} className="edit-btn">✏️ Edit Profile</button>
                  </div>
                </div>
              </>
            )}
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
            <button
              className={`tab-btn ${activeTab === 'traveled' ? 'active' : ''}`}
              onClick={() => setActiveTab('traveled')}
            >
              🌍 Traveled ({visitedCountries.length})
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

            {activeTab === 'traveled' && (
              <div className="traveled-section">
                <button
                  className="open-map-btn mobile-only"
                  onClick={() => setShowMapModal(true)}
                >
                  🗺️ View Travel Map
                </button>
                <div className="desktop-map">
                  <WorldMap
                    visitedCountries={visitedCountries}
                    onCountryToggle={handleCountryToggle}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMapModal && (
        <div className="map-modal-overlay" onClick={() => setShowMapModal(false)}>
          <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="map-modal-close" onClick={() => setShowMapModal(false)}>
              ✕
            </button>
            <WorldMap
              visitedCountries={visitedCountries}
              onCountryToggle={handleCountryToggle}
              isModal={true}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;