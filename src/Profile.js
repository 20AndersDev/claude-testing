import React, { useState } from 'react';
import Navbar from './Navbar';
import './Profile.css';

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Current User',
    email: 'user@example.com',
    bio: 'Welcome to my profile! I love sharing thoughts and connecting with others.',
    location: 'New York, NY',
    joinDate: 'January 2024'
  });

  const [editedProfile, setEditedProfile] = useState(profile);

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
              <span className="stat-number">42</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat">
              <span className="stat-number">128</span>
              <span className="stat-label">Friends</span>
            </div>
            <div className="stat">
              <span className="stat-number">256</span>
              <span className="stat-label">Likes</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;