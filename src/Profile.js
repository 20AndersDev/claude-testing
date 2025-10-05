import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { createFollowNotification } from './notificationHelpers';
import Navbar from './Navbar';
import Post from './Post';
import WorldMap from './WorldMap';
import VisitedCountriesMap from './VisitedCountriesMap';
import './Profile.css';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [visitedCountries, setVisitedCountries] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    bio: 'Welcome to my profile! I love sharing thoughts and connecting with others.',
    location: '',
    joinDate: 'Recently',
    profilePicture: null
  });

  const [editedProfile, setEditedProfile] = useState(profile);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);

  // Load user data from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        // If no userId param, viewing own profile
        // If userId param matches current user, also own profile
        const viewingOwnProfile = !userId || userId === user.id;
        setIsOwnProfile(viewingOwnProfile);
      }
    };
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (currentUserId !== null) {
      const profileUserId = userId || currentUserId;
      fetchUserProfile(profileUserId);
      fetchUserPosts(profileUserId);
      fetchFollowers(profileUserId);
      fetchFollowing(profileUserId);
      if (!isOwnProfile) {
        checkFollowStatus(profileUserId);
      }

      // Set up real-time subscription for post updates
      const postsSubscription = supabase
        .channel(`profile-posts-${profileUserId}`)
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'posts',
            filter: `user_id=eq.${profileUserId}`
          },
          (payload) => {
            // Update the specific post in the list
            setPosts(prevPosts => prevPosts.map(post => {
              if (post.id === payload.new.id) {
                return {
                  ...payload.new,
                  tripTitle: payload.new.trip_title,
                  startDate: payload.new.start_date,
                  endDate: payload.new.end_date,
                  timestamp: payload.new.created_at,
                  userId: payload.new.user_id
                };
              }
              return post;
            }));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(postsSubscription);
      };
    }
  }, [currentUserId, userId]);

  const checkFollowStatus = async (profileUserId) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', profileUserId)
        .single();

      setIsFollowing(!!data);
    } catch (error) {
      setIsFollowing(false);
    }
  };

  const handleFollowToggle = async () => {
    if (isLoadingFollow) return;

    const profileUserId = userId || currentUserId;
    setIsLoadingFollow(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', profileUserId);

        if (error) throw error;
        setIsFollowing(false);

        // Update followers count
        setFollowers(prev => prev.filter(f => f.id !== currentUserId));
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: profileUserId
          });

        if (error) throw error;
        setIsFollowing(true);

        // Update followers count - fetch current user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('id', currentUserId)
          .single();

        if (profileData) {
          const followerName = profileData.full_name || profileData.username || 'User';

          setFollowers(prev => [...prev, {
            id: profileData.id,
            name: followerName,
            username: profileData.username,
            avatar_url: profileData.avatar_url
          }]);

          // Create notification for the followed user
          await createFollowNotification(profileUserId, currentUserId, followerName);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const fetchUserProfile = async (profileUserId) => {
    try {
      // Fetch profile data from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, username, bio, location, avatar_url')
        .eq('id', profileUserId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Get user creation date and email from auth.users
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      let joinDate = 'Recently';
      let userEmail = '';

      // Only get auth data if viewing own profile
      if (user && user.id === profileUserId) {
        joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        userEmail = user.email || '';
      }

      if (profileData) {
        const profileObject = {
          name: profileData.full_name || profileData.username || user?.user_metadata?.display_name || user?.user_metadata?.full_name || userEmail?.split('@')[0] || 'User',
          username: profileData.username || '',
          bio: profileData.bio || 'Welcome to my profile! I love sharing thoughts and connecting with others.',
          location: profileData.location || '',
          joinDate: joinDate,
          profilePicture: profileData.avatar_url || user?.user_metadata?.avatar_url
        };

        setProfile(profileObject);

        // Only cache own profile in localStorage
        if (isOwnProfile) {
          localStorage.setItem('userProfile', JSON.stringify(profileObject));
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserPosts = async (profileUserId) => {
    try {
      // Fetch user's posts from Supabase
      const { data: userPostsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileUserId)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
      } else {
        // Map database fields to component format
        const mappedPosts = (userPostsData || []).map(post => ({
          ...post,
          tripTitle: post.trip_title,
          startDate: post.start_date,
          endDate: post.end_date,
          timestamp: post.created_at,
          userId: post.user_id
        }));
        setPosts(mappedPosts);
      }

      // TODO: Implement likes functionality in Supabase
      // For now, liked posts will be empty
      setLikedPosts([]);

      // Load visited countries from profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('visited_countries')
        .eq('id', profileUserId)
        .single();

      if (profileData?.visited_countries) {
        setVisitedCountries(profileData.visited_countries);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const fetchFollowers = async (profileUserId) => {
    try {
      // Get users who follow this profile
      const { data: followsData, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', profileUserId);

      if (error) {
        console.error('Error fetching followers:', error);
        return;
      }

      if (!followsData || followsData.length === 0) {
        setFollowers([]);
        return;
      }

      // Fetch profile data for each follower
      const followerIds = followsData.map(f => f.follower_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', followerIds);

      if (profilesError) {
        console.error('Error fetching follower profiles:', profilesError);
        return;
      }

      const followersList = (profilesData || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || profile.username || 'User',
        username: profile.username,
        avatar_url: profile.avatar_url
      }));

      setFollowers(followersList);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async (profileUserId) => {
    try {
      // Get users this profile follows
      const { data: followsData, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', profileUserId);

      if (error) {
        console.error('Error fetching following:', error);
        return;
      }

      if (!followsData || followsData.length === 0) {
        setFollowing([]);
        return;
      }

      // Fetch profile data for each followed user
      const followingIds = followsData.map(f => f.following_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', followingIds);

      if (profilesError) {
        console.error('Error fetching following profiles:', profilesError);
        return;
      }

      const followingList = (profilesData || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || profile.username || 'User',
        username: profile.username,
        avatar_url: profile.avatar_url
      }));

      setFollowing(followingList);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedProfile = { ...editedProfile };

      // Upload profile picture to Supabase Storage if a file was selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          alert(`Failed to upload profile picture: ${uploadError.message}`);
          return;
        }

        // Get public URL
        const { data } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        updatedProfile.profilePicture = data.publicUrl;
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          bio: updatedProfile.bio,
          avatar_url: updatedProfile.profilePicture
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        alert('Failed to update profile');
        return;
      }

      setProfile(updatedProfile);
      // Update localStorage immediately
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);

      // Refresh profile data from database
      await fetchUserProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
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

  const handleLike = async (postId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current post
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Get current liked_by array (users who liked this post)
      const likedBy = post.liked_by || [];
      const hasLiked = likedBy.includes(user.id);

      // Toggle like
      let newLikedBy;
      let newLikes;

      if (hasLiked) {
        // Unlike: remove user from liked_by array
        newLikedBy = likedBy.filter(id => id !== user.id);
        newLikes = Math.max(0, (post.likes || 0) - 1);
      } else {
        // Like: add user to liked_by array
        newLikedBy = [...likedBy, user.id];
        newLikes = (post.likes || 0) + 1;
      }

      // Update in Supabase
      const { error } = await supabase
        .from('posts')
        .update({
          likes: newLikes,
          liked_by: newLikedBy
        })
        .eq('id', postId);

      if (error) {
        console.error('Error updating likes:', error.message, error);
        alert('Failed to update like: ' + error.message);
        return;
      }

      // Update local state
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, likes: newLikes, liked_by: newLikedBy } : p
      ));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId, commentText) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current post
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Fetch user's profile to get display name and avatar
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .single();

      const displayName = profileData?.full_name || profileData?.username || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
      const avatarUrl = profileData?.avatar_url || user.user_metadata?.avatar_url || null;

      // Create new comment
      const newComment = {
        id: Date.now(),
        user_id: user.id,
        author: displayName,
        avatar_url: avatarUrl,
        content: commentText,
        timestamp: new Date().toISOString()
      };

      // Update comments in Supabase
      const updatedComments = [...(post.comments || []), newComment];
      const { error } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);

      if (error) {
        console.error('Error adding comment:', error);
        return;
      }

      // Update local state
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, comments: updatedComments } : p
      ));
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  };

  const handleDelete = (postId) => {
    // Remove the deleted post from state
    setPosts(posts.filter(post => post.id !== postId));
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      // Get current post
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Remove the comment from the array
      const updatedComments = (post.comments || []).filter(c => c.id !== commentId);

      // Update in Supabase
      const { error } = await supabase
        .from('posts')
        .update({ comments: updatedComments })
        .eq('id', postId);

      if (error) {
        console.error('Error deleting comment:', error);
        return;
      }

      // Update local state
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, comments: updatedComments } : p
      ));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
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
                    {(previewUrl || editedProfile.profilePicture) ? (
                      <img
                        src={previewUrl || editedProfile.profilePicture}
                        alt="Profile"
                        className="avatar-preview"
                      />
                    ) : (
                      <div className="avatar-placeholder">👤</div>
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
                <div className="profile-header-top">
                  <div className="profile-avatar-section">
                    <div className="profile-avatar">
                      {profile.profilePicture ? (
                        <img src={profile.profilePicture} alt="Profile" className="avatar-image" />
                      ) : (
                        <div className="avatar-placeholder">👤</div>
                      )}
                    </div>
                    {isOwnProfile ? (
                      <button onClick={handleEdit} className="edit-btn">✏️ Edit Profile</button>
                    ) : (
                      <button
                        onClick={handleFollowToggle}
                        className={`follow-profile-btn ${isFollowing ? 'following' : ''} ${isFollowing && isHoveringFollow ? 'unfollow-hover' : ''}`}
                        disabled={isLoadingFollow}
                        onMouseEnter={() => setIsHoveringFollow(true)}
                        onMouseLeave={() => setIsHoveringFollow(false)}
                      >
                        {isFollowing && isHoveringFollow ? '✗ Unfollow' : isFollowing ? '✓ Following' : '+ Follow'}
                      </button>
                    )}
                  </div>
                  <div className="profile-info">
                    <div className="display-info">
                      <div className="profile-name-row">
                        <div className="profile-name-section">
                          <h1 className="profile-name">{profile.name}</h1>
                          {profile.username && <p className="profile-username">@{profile.username}</p>}
                          <p className="profile-join-date">Joined {profile.joinDate}</p>
                        </div>
                        <div className="profile-stats">
                          <button onClick={() => setActiveTab('followers')} className="stat-item">
                            <span className="stat-number">{followers.length}</span>
                            <span className="stat-label">Followers</span>
                          </button>
                          <button onClick={() => setActiveTab('following')} className="stat-item">
                            <span className="stat-number">{following.length}</span>
                            <span className="stat-label">Following</span>
                          </button>
                          <div className="stat-item">
                            <span className="stat-number">{posts.length}</span>
                            <span className="stat-label">Posts</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="profile-details">
                  <p className="profile-location">📍 {profile.location}</p>
                  <p className="profile-bio">{profile.bio}</p>
                </div>
              </>
            )}
          </div>

          {/* Travel Map */}
          <VisitedCountriesMap
            userId={userId || currentUserId}
            isOwnProfile={isOwnProfile}
          />

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
                        onDelete={handleDelete}
                        onDeleteComment={handleDeleteComment}
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

            {activeTab === 'followers' && (
              <div className="followers-section">
                {followers.length > 0 ? (
                  <div className="users-list">
                    {followers.map(follower => (
                      <div key={follower.id} className="user-item">
                        <div className="user-avatar">
                          {follower.avatar_url ? (
                            <img src={follower.avatar_url} alt={follower.name} />
                          ) : (
                            <div className="avatar-placeholder">👤</div>
                          )}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{follower.name}</div>
                          {follower.username && (
                            <div className="user-username">@{follower.username}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>No followers yet</h3>
                    <p>Share your trips to gain followers!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'following' && (
              <div className="following-section">
                {following.length > 0 ? (
                  <div className="users-list">
                    {following.map(user => (
                      <div key={user.id} className="user-item">
                        <div className="user-avatar">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name} />
                          ) : (
                            <div className="avatar-placeholder">👤</div>
                          )}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{user.name}</div>
                          {user.username && (
                            <div className="user-username">@{user.username}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">➕</div>
                    <h3>Not following anyone yet</h3>
                    <p>Discover and follow travelers to see their posts!</p>
                  </div>
                )}
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