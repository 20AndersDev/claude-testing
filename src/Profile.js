import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { createFollowNotification, createFollowRequestNotification } from './notificationHelpers';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import Post from './Post';
import WorldMap from './WorldMap';
import VisitedCountriesMap from './VisitedCountriesMap';
import useSwipeNavigation from './useSwipeNavigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './Profile.css';

const COUNTRIES = [
  { name: "Afghanistan", flag: "🇦🇫" },
  { name: "Albania", flag: "🇦🇱" },
  { name: "Algeria", flag: "🇩🇿" },
  { name: "Andorra", flag: "🇦🇩" },
  { name: "Angola", flag: "🇦🇴" },
  { name: "Antigua and Barbuda", flag: "🇦🇬" },
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Armenia", flag: "🇦🇲" },
  { name: "Australia", flag: "🇦🇺" },
  { name: "Austria", flag: "🇦🇹" },
  { name: "Azerbaijan", flag: "🇦🇿" },
  { name: "Bahamas", flag: "🇧🇸" },
  { name: "Bahrain", flag: "🇧🇭" },
  { name: "Bangladesh", flag: "🇧🇩" },
  { name: "Barbados", flag: "🇧🇧" },
  { name: "Belarus", flag: "🇧🇾" },
  { name: "Belgium", flag: "🇧🇪" },
  { name: "Belize", flag: "🇧🇿" },
  { name: "Benin", flag: "🇧🇯" },
  { name: "Bhutan", flag: "🇧🇹" },
  { name: "Bolivia", flag: "🇧🇴" },
  { name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { name: "Botswana", flag: "🇧🇼" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Brunei", flag: "🇧🇳" },
  { name: "Bulgaria", flag: "🇧🇬" },
  { name: "Burkina Faso", flag: "🇧🇫" },
  { name: "Burundi", flag: "🇧🇮" },
  { name: "Cabo Verde", flag: "🇨🇻" },
  { name: "Cambodia", flag: "🇰🇭" },
  { name: "Cameroon", flag: "🇨🇲" },
  { name: "Canada", flag: "🇨🇦" },
  { name: "Central African Republic", flag: "🇨🇫" },
  { name: "Chad", flag: "🇹🇩" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "China", flag: "🇨🇳" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Comoros", flag: "🇰🇲" },
  { name: "Congo", flag: "🇨🇬" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Croatia", flag: "🇭🇷" },
  { name: "Cuba", flag: "🇨🇺" },
  { name: "Cyprus", flag: "🇨🇾" },
  { name: "Czech Republic", flag: "🇨🇿" },
  { name: "Denmark", flag: "🇩🇰" },
  { name: "Djibouti", flag: "🇩🇯" },
  { name: "Dominica", flag: "🇩🇲" },
  { name: "Dominican Republic", flag: "🇩🇴" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "Egypt", flag: "🇪🇬" },
  { name: "El Salvador", flag: "🇸🇻" },
  { name: "Equatorial Guinea", flag: "🇬🇶" },
  { name: "Eritrea", flag: "🇪🇷" },
  { name: "Estonia", flag: "🇪🇪" },
  { name: "Eswatini", flag: "🇸🇿" },
  { name: "Ethiopia", flag: "🇪🇹" },
  { name: "Fiji", flag: "🇫🇯" },
  { name: "Finland", flag: "🇫🇮" },
  { name: "France", flag: "🇫🇷" },
  { name: "Gabon", flag: "🇬🇦" },
  { name: "Gambia", flag: "🇬🇲" },
  { name: "Georgia", flag: "🇬🇪" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "Greece", flag: "🇬🇷" },
  { name: "Grenada", flag: "🇬🇩" },
  { name: "Guatemala", flag: "🇬🇹" },
  { name: "Guinea", flag: "🇬🇳" },
  { name: "Guinea-Bissau", flag: "🇬🇼" },
  { name: "Guyana", flag: "🇬🇾" },
  { name: "Haiti", flag: "🇭🇹" },
  { name: "Honduras", flag: "🇭🇳" },
  { name: "Hungary", flag: "🇭🇺" },
  { name: "Iceland", flag: "🇮🇸" },
  { name: "India", flag: "🇮🇳" },
  { name: "Indonesia", flag: "🇮🇩" },
  { name: "Iran", flag: "🇮🇷" },
  { name: "Iraq", flag: "🇮🇶" },
  { name: "Ireland", flag: "🇮🇪" },
  { name: "Israel", flag: "🇮🇱" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Jamaica", flag: "🇯🇲" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "Jordan", flag: "🇯🇴" },
  { name: "Kazakhstan", flag: "🇰🇿" },
  { name: "Kenya", flag: "🇰🇪" },
  { name: "Kiribati", flag: "🇰🇮" },
  { name: "Kosovo", flag: "🇽🇰" },
  { name: "Kuwait", flag: "🇰🇼" },
  { name: "Kyrgyzstan", flag: "🇰🇬" },
  { name: "Laos", flag: "🇱🇦" },
  { name: "Latvia", flag: "🇱🇻" },
  { name: "Lebanon", flag: "🇱🇧" },
  { name: "Lesotho", flag: "🇱🇸" },
  { name: "Liberia", flag: "🇱🇷" },
  { name: "Libya", flag: "🇱🇾" },
  { name: "Liechtenstein", flag: "🇱🇮" },
  { name: "Lithuania", flag: "🇱🇹" },
  { name: "Luxembourg", flag: "🇱🇺" },
  { name: "Madagascar", flag: "🇲🇬" },
  { name: "Malawi", flag: "🇲🇼" },
  { name: "Malaysia", flag: "🇲🇾" },
  { name: "Maldives", flag: "🇲🇻" },
  { name: "Mali", flag: "🇲🇱" },
  { name: "Malta", flag: "🇲🇹" },
  { name: "Marshall Islands", flag: "🇲🇭" },
  { name: "Mauritania", flag: "🇲🇷" },
  { name: "Mauritius", flag: "🇲🇺" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Micronesia", flag: "🇫🇲" },
  { name: "Moldova", flag: "🇲🇩" },
  { name: "Monaco", flag: "🇲🇨" },
  { name: "Mongolia", flag: "🇲🇳" },
  { name: "Montenegro", flag: "🇲🇪" },
  { name: "Morocco", flag: "🇲🇦" },
  { name: "Mozambique", flag: "🇲🇿" },
  { name: "Myanmar", flag: "🇲🇲" },
  { name: "Namibia", flag: "🇳🇦" },
  { name: "Nauru", flag: "🇳🇷" },
  { name: "Nepal", flag: "🇳🇵" },
  { name: "Netherlands", flag: "🇳🇱" },
  { name: "New Zealand", flag: "🇳🇿" },
  { name: "Nicaragua", flag: "🇳🇮" },
  { name: "Niger", flag: "🇳🇪" },
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "North Korea", flag: "🇰🇵" },
  { name: "North Macedonia", flag: "🇲🇰" },
  { name: "Norway", flag: "🇳🇴" },
  { name: "Oman", flag: "🇴🇲" },
  { name: "Pakistan", flag: "🇵🇰" },
  { name: "Palau", flag: "🇵🇼" },
  { name: "Palestine", flag: "🇵🇸" },
  { name: "Panama", flag: "🇵🇦" },
  { name: "Papua New Guinea", flag: "🇵🇬" },
  { name: "Paraguay", flag: "🇵🇾" },
  { name: "Peru", flag: "🇵🇪" },
  { name: "Philippines", flag: "🇵🇭" },
  { name: "Poland", flag: "🇵🇱" },
  { name: "Portugal", flag: "🇵🇹" },
  { name: "Qatar", flag: "🇶🇦" },
  { name: "Romania", flag: "🇷🇴" },
  { name: "Russia", flag: "🇷🇺" },
  { name: "Rwanda", flag: "🇷🇼" },
  { name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { name: "Saint Lucia", flag: "🇱🇨" },
  { name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { name: "Samoa", flag: "🇼🇸" },
  { name: "San Marino", flag: "🇸🇲" },
  { name: "Sao Tome and Principe", flag: "🇸🇹" },
  { name: "Saudi Arabia", flag: "🇸🇦" },
  { name: "Senegal", flag: "🇸🇳" },
  { name: "Serbia", flag: "🇷🇸" },
  { name: "Seychelles", flag: "🇸🇨" },
  { name: "Sierra Leone", flag: "🇸🇱" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "Slovakia", flag: "🇸🇰" },
  { name: "Slovenia", flag: "🇸🇮" },
  { name: "Solomon Islands", flag: "🇸🇧" },
  { name: "Somalia", flag: "🇸🇴" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "South Korea", flag: "🇰🇷" },
  { name: "South Sudan", flag: "🇸🇸" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "Sri Lanka", flag: "🇱🇰" },
  { name: "Sudan", flag: "🇸🇩" },
  { name: "Suriname", flag: "🇸🇷" },
  { name: "Sweden", flag: "🇸🇪" },
  { name: "Switzerland", flag: "🇨🇭" },
  { name: "Syria", flag: "🇸🇾" },
  { name: "Taiwan", flag: "🇹🇼" },
  { name: "Tajikistan", flag: "🇹🇯" },
  { name: "Tanzania", flag: "🇹🇿" },
  { name: "Thailand", flag: "🇹🇭" },
  { name: "Timor-Leste", flag: "🇹🇱" },
  { name: "Togo", flag: "🇹🇬" },
  { name: "Tonga", flag: "🇹🇴" },
  { name: "Trinidad and Tobago", flag: "🇹🇹" },
  { name: "Tunisia", flag: "🇹🇳" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "Turkmenistan", flag: "🇹🇲" },
  { name: "Tuvalu", flag: "🇹🇻" },
  { name: "Uganda", flag: "🇺🇬" },
  { name: "Ukraine", flag: "🇺🇦" },
  { name: "United Arab Emirates", flag: "🇦🇪" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "United States", flag: "🇺🇸" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Uzbekistan", flag: "🇺🇿" },
  { name: "Vanuatu", flag: "🇻🇺" },
  { name: "Vatican City", flag: "🇻🇦" },
  { name: "Venezuela", flag: "🇻🇪" },
  { name: "Vietnam", flag: "🇻🇳" },
  { name: "Yemen", flag: "🇾🇪" },
  { name: "Zambia", flag: "🇿🇲" },
  { name: "Zimbabwe", flag: "🇿🇼" }
];

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useSwipeNavigation();
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
    dateOfBirth: '',
    country: '',
    joinDate: 'Recently',
    profilePicture: null,
    isPrivate: false
  });

  const [editedProfile, setEditedProfile] = useState(profile);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isHoveringFollow, setIsHoveringFollow] = useState(false);
  const [followRequestStatus, setFollowRequestStatus] = useState(null); // 'pending', 'accepted', 'rejected', or null
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [followRequestId, setFollowRequestId] = useState(null);
  const [isBlockedUser, setIsBlockedUser] = useState(false);
  const [hasBlockedCurrentUser, setHasBlockedCurrentUser] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null); // Actual user ID of the profile being viewed

  // Load user data from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || loading) return;

      setCurrentUserId(user.id);
      // If no userId param, viewing own profile
      // If userId param matches current user, also own profile
      const viewingOwnProfile = !userId || userId === user.id;
      setIsOwnProfile(viewingOwnProfile);
    };
    loadProfile();
  }, [user, loading, userId]);

  useEffect(() => {
    if (currentUserId !== null) {
      const loadProfileData = async () => {
        setIsLoadingProfile(true);
        let actualUserId = userId || currentUserId;

        // If userId is provided, check if it's a username or ID
        if (userId && userId !== currentUserId) {
          // Try to get user ID from username
          const { data: userData, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', userId)
            .single();

          if (userData) {
            actualUserId = userData.id;
          } else {
            // If not found by username, assume it's already an ID
            actualUserId = userId;
          }
        }

        setProfileUserId(actualUserId);

        await Promise.all([
          fetchUserProfile(actualUserId),
          fetchUserPosts(actualUserId),
          fetchFollowers(actualUserId),
          fetchFollowing(actualUserId),
          !isOwnProfile && checkFollowStatus(actualUserId),
          !isOwnProfile && checkFollowRequestStatus(actualUserId),
          !isOwnProfile && checkBlockStatus(actualUserId)
        ]);

        setIsLoadingProfile(false);
      };

      loadProfileData();

      const profileUserId = userId || currentUserId;
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

  const checkFollowRequestStatus = async (profileUserId) => {
    try {
      const { data, error } = await supabase
        .from('follow_requests')
        .select('id, status')
        .eq('requester_id', currentUserId)
        .eq('requested_id', profileUserId)
        .single();

      if (data) {
        setFollowRequestStatus(data.status);
        setFollowRequestId(data.id);
      } else {
        setFollowRequestStatus(null);
        setFollowRequestId(null);
      }
    } catch (error) {
      setFollowRequestStatus(null);
      setFollowRequestId(null);
    }
  };

  const checkBlockStatus = async (profileUserId) => {
    try {
      // Check if current user blocked the profile user
      const { data: blockedByMe, error: error1 } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', profileUserId)
        .single();

      if (error1 && error1.code !== 'PGRST116') {
        console.error('Error checking block status:', error1);
      }

      setIsBlockedUser(!!blockedByMe);

      // Check if profile user blocked current user
      const { data: blockedMe, error: error2 } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', profileUserId)
        .eq('blocked_id', currentUserId)
        .single();

      if (error2 && error2.code !== 'PGRST116') {
        console.error('Error checking if blocked:', error2);
      }

      setHasBlockedCurrentUser(!!blockedMe);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleBlockUser = async (e) => {
    console.log('handleBlockUser called');
    console.log('Current state:', { profileUserId, currentUserId, isBlockedUser });

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!profileUserId) {
      console.error('No profile user ID available');
      alert('Error: No profile user ID available');
      return;
    }

    if (!currentUserId) {
      console.error('No current user ID available');
      alert('Error: No current user ID available');
      return;
    }

    const action = isBlockedUser ? 'unblock' : 'block';
    console.log(`Attempting to ${action} user`);

    // Temporarily removed confirmation for debugging
    // const confirmed = window.confirm(`Are you sure you want to ${action} this user?`);
    // console.log('Confirmation result:', confirmed);
    // if (!confirmed) {
    //   console.log('User cancelled action');
    //   return;
    // }

    try {
      if (isBlockedUser) {
        // Unblock user
        console.log('Unblocking user:', { blocker_id: currentUserId, blocked_id: profileUserId });
        const { data, error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', currentUserId)
          .eq('blocked_id', profileUserId)
          .select();

        console.log('Unblock result:', { data, error });

        if (error) {
          console.error('Unblock error:', error);
          throw error;
        }

        console.log('Setting isBlockedUser to false');
        setIsBlockedUser(false);
        alert('User unblocked successfully');
      } else {
        // Block user
        console.log('Blocking user:', { blocker_id: currentUserId, blocked_id: profileUserId });
        const { data, error } = await supabase
          .from('blocked_users')
          .insert([{
            blocker_id: currentUserId,
            blocked_id: profileUserId
          }])
          .select();

        console.log('Block result:', { data, error });

        if (error) {
          console.error('Block error:', error);
          if (error.code === 'PGRST204' || error.code === 'PGRST116') {
            alert('Block feature not yet enabled. Please set up the database schema.');
            return;
          }
          throw error;
        }

        console.log('Setting isBlockedUser to true');
        setIsBlockedUser(true);
        alert('User blocked successfully');
      }
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      alert(`Failed to update block status: ${error.message}`);
    }
  };

  const handleFollowToggle = async () => {
    if (isLoadingFollow) return;

    if (!profileUserId) {
      console.error('No profile user ID available');
      return;
    }

    setIsLoadingFollow(true);

    try {
      console.log('Follow toggle:', { currentUserId, profileUserId, isFollowing, followRequestStatus });

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', profileUserId);

        if (error) {
          console.error('Unfollow error:', error);
          throw error;
        }
        setIsFollowing(false);

        // Update followers count
        setFollowers(prev => prev.filter(f => f.id !== currentUserId));
      } else if (followRequestStatus === 'pending') {
        // Cancel follow request
        const { error } = await supabase
          .from('follow_requests')
          .delete()
          .eq('id', followRequestId);

        if (error) {
          console.error('Cancel request error:', error);
          throw error;
        }
        setFollowRequestStatus(null);
        setFollowRequestId(null);
      } else {
        // Check if the profile is private
        if (profile.isPrivate) {
          // First check if a follow request already exists
          const { data: existingRequest } = await supabase
            .from('follow_requests')
            .select('id, status')
            .eq('requester_id', currentUserId)
            .eq('requested_id', profileUserId)
            .single();

          if (existingRequest) {
            console.log('Follow request already exists:', existingRequest);
            setFollowRequestStatus(existingRequest.status);
            setFollowRequestId(existingRequest.id);
            alert('Follow request already sent');
            return;
          }

          // Create follow request instead of direct follow
          console.log('Creating follow request:', { requester_id: currentUserId, requested_id: profileUserId });
          const { data: requestData, error: requestError } = await supabase
            .from('follow_requests')
            .insert({
              requester_id: currentUserId,
              requested_id: profileUserId,
              status: 'pending'
            })
            .select()
            .single();

          if (requestError) {
            console.error('Follow request error:', requestError);
            // If duplicate key error, fetch the existing request
            if (requestError.code === '23505') {
              const { data: existingReq } = await supabase
                .from('follow_requests')
                .select('id, status')
                .eq('requester_id', currentUserId)
                .eq('requested_id', profileUserId)
                .single();

              if (existingReq) {
                setFollowRequestStatus(existingReq.status);
                setFollowRequestId(existingReq.id);
                return;
              }
            }
            throw requestError;
          }
          setFollowRequestStatus('pending');
          setFollowRequestId(requestData.id);

          // Get current user profile for notification
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', currentUserId)
            .single();

          if (profileData) {
            const requesterName = profileData.full_name || profileData.username || 'User';
            // Create notification for the follow request
            console.log('Creating follow request notification:', {
              requestedUserId: profileUserId,
              requesterId: currentUserId,
              requesterName,
              requestId: requestData.id
            });
            await createFollowRequestNotification(profileUserId, currentUserId, requesterName, requestData.id);
            console.log('Follow request notification created successfully');
            alert('Follow request sent!');
          }
        } else {
          // Public profile - direct follow
          // First check if already following
          const { data: existingFollow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUserId)
            .eq('following_id', profileUserId)
            .single();

          if (existingFollow) {
            console.log('Already following this user');
            setIsFollowing(true);
            return;
          }

          console.log('Creating direct follow:', { follower_id: currentUserId, following_id: profileUserId });
          const { error } = await supabase
            .from('follows')
            .insert({
              follower_id: currentUserId,
              following_id: profileUserId
            });

          if (error) {
            console.error('Follow error:', error);
            // If duplicate key error, just update state
            if (error.code === '23505') {
              setIsFollowing(true);
              return;
            }
            throw error;
          }
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
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const fetchUserProfile = async (profileUserId) => {
    try {
      // Check cache first
      const cacheKey = `profile_${profileUserId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const cachedProfile = JSON.parse(cached);
        setProfile(cachedProfile);
        setEditedProfile(cachedProfile);
      }

      // Fetch profile data from database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, username, bio, location, date_of_birth, country, avatar_url, is_private')
        .eq('id', profileUserId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

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
          dateOfBirth: profileData.date_of_birth || '',
          country: profileData.country || '',
          joinDate: joinDate,
          profilePicture: profileData.avatar_url || user?.user_metadata?.avatar_url,
          isPrivate: profileData.is_private || false
        };

        setProfile(profileObject);
        setEditedProfile(profileObject);

        // Cache in sessionStorage for faster navigation
        sessionStorage.setItem(cacheKey, JSON.stringify(profileObject));

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
          full_name: updatedProfile.name,
          bio: updatedProfile.bio,
          location: updatedProfile.location,
          date_of_birth: updatedProfile.dateOfBirth,
          country: updatedProfile.country,
          avatar_url: updatedProfile.profilePicture,
          is_private: updatedProfile.isPrivate
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
      await fetchUserProfile(user.id);
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

  const handleRemovePhoto = () => {
    setEditedProfile(prev => ({
      ...prev,
      profilePicture: null
    }));
    setPreviewUrl(null);
    setSelectedFile(null);
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

  // Show loading state
  if (loading || isLoadingProfile) {
    return (
      <>
        <Navbar />
        <div className="profile page-transition-container">
          <div className="profile-container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show sign-in prompt when not authenticated
  if (!user) {
    return (
      <>
        <Navbar />
        <div className="profile page-transition-container">
          <div className="profile-container">
            <div className="sign-in-prompt">
              <div className="sign-in-icon">🔒</div>
              <h2>Sign in to view your profile</h2>
              <p>You need to be signed in to access your profile and view your trips.</p>
              <button
                onClick={() => navigate('/login')}
                className="sign-in-btn"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show private profile view for non-followers
  const isPrivateProfile = profile.isPrivate && !isOwnProfile && !isFollowing;

  if (isPrivateProfile) {
    return (
      <>
        <Navbar />
        <div className="profile page-transition-container">
          <div className="profile-container">
            <div className="profile-header">
              <div className="profile-header-top">
                <div className="profile-avatar-section">
                  <div className="profile-avatar">
                    {profile.profilePicture ? (
                      <img src={profile.profilePicture} alt="Profile" className="avatar-image" />
                    ) : (
                      <div className="avatar-placeholder">👤</div>
                    )}
                  </div>
                  <div className="profile-name-section">
                    <h1 className="profile-name">{profile.name}</h1>
                    {profile.username && <p className="profile-username">@{profile.username}</p>}
                    <p className="profile-join-date">Joined {profile.joinDate}</p>
                  </div>
                  <div className="profile-action-buttons">
                    <button
                      onClick={() => navigate(`/messages/${profileUserId}`)}
                      className="message-profile-btn"
                      title="Send Message"
                    >
                      💬
                    </button>
                    <button
                      onClick={handleFollowToggle}
                      className={`follow-profile-btn ${isFollowing ? 'following' : ''} ${followRequestStatus === 'pending' ? 'requested' : ''}`}
                      disabled={isLoadingFollow}
                      title={followRequestStatus === 'pending' ? 'Request Pending' : isFollowing ? 'Following' : 'Follow'}
                    >
                      {isFollowing ? '✓' : followRequestStatus === 'pending' ? '⏳' : '+'}
                    </button>
                    <button
                      className={`block-user-btn ${isBlockedUser ? 'blocked' : ''}`}
                      onClick={handleBlockUser}
                      title={isBlockedUser ? 'Unblock user' : 'Block user'}
                    >
                      {isBlockedUser ? '🔓' : '🔒'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="private-profile-notice">
              <div className="private-icon">🔒</div>
              <h3>This Account is Private</h3>
              <p>Follow this account to see their posts and stats.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="profile page-transition-container">
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
                      Upload Photo
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {(previewUrl || editedProfile.profilePicture) && (
                      <button onClick={handleRemovePhoto} className="remove-photo-btn">
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
                <div className="profile-field-edit">
                  <label htmlFor="name">Display Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={editedProfile.name}
                    onChange={handleChange}
                    className="edit-input"
                    placeholder="Your display name"
                  />
                </div>
                <div className="profile-field-edit">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <DatePicker
                    id="dateOfBirth"
                    selected={editedProfile.dateOfBirth ? new Date(editedProfile.dateOfBirth) : null}
                    onChange={(date) => {
                      setEditedProfile(prev => ({
                        ...prev,
                        dateOfBirth: date ? date.toISOString().split('T')[0] : ''
                      }));
                    }}
                    dateFormat="dd.MM.yyyy"
                    placeholderText="dd.mm.yyyy"
                    className="edit-input date-picker-input"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                    maxDate={new Date()}
                  />
                </div>
                <div className="profile-field-edit">
                  <label htmlFor="country">Country</label>
                  <select
                    id="country"
                    name="country"
                    value={editedProfile.country}
                    onChange={handleChange}
                    className="edit-input country-select"
                  >
                    <option value="">Select your country</option>
                    {COUNTRIES.map(country => (
                      <option key={country.name} value={country.name}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="profile-field-edit">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={editedProfile.location}
                    onChange={handleChange}
                    className="edit-input"
                    placeholder="City, State"
                  />
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
                    rows="4"
                  />
                </div>
                <div className="profile-privacy-edit">
                  <div className="privacy-toggle-container">
                    <div className="privacy-toggle-info">
                      <label htmlFor="isPrivate" className="privacy-label">
                        🔒 Private Profile
                      </label>
                      <p className="privacy-description">
                        When enabled, only your followers can see your posts and stats
                      </p>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        id="isPrivate"
                        checked={editedProfile.isPrivate}
                        onChange={(e) => setEditedProfile(prev => ({
                          ...prev,
                          isPrivate: e.target.checked
                        }))}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                <div className="edit-buttons">
                  <button onClick={handleSave} className="save-btn">Save Changes</button>
                  <button onClick={handleCancel} className="cancel-btn">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                {isOwnProfile && (
                  <button onClick={handleEdit} className="edit-btn-icon" aria-label="Edit Profile">
                    ✏️
                  </button>
                )}
                <div className="profile-header-top">
                  <div className="profile-avatar-section">
                    <div className="profile-avatar">
                      {profile.profilePicture ? (
                        <img src={profile.profilePicture} alt="Profile" className="avatar-image" />
                      ) : (
                        <div className="avatar-placeholder">👤</div>
                      )}
                    </div>
                    <div className="profile-name-section">
                      <h1 className="profile-name">{profile.name}</h1>
                      {profile.username && <p className="profile-username">@{profile.username}</p>}
                      <p className="profile-join-date">Joined {profile.joinDate}</p>
                    </div>
                    {!isOwnProfile && (
                      <div className="profile-action-buttons">
                        <button
                          onClick={() => navigate(`/messages/${profileUserId}`)}
                          className="message-profile-btn"
                          title="Send Message"
                        >
                          💬
                        </button>
                        <button
                          onClick={handleFollowToggle}
                          className={`follow-profile-btn ${isFollowing ? 'following' : ''} ${followRequestStatus === 'pending' ? 'requested' : ''} ${isFollowing && isHoveringFollow ? 'unfollow-hover' : ''}`}
                          disabled={isLoadingFollow}
                          onMouseEnter={() => setIsHoveringFollow(true)}
                          onMouseLeave={() => setIsHoveringFollow(false)}
                          title={followRequestStatus === 'pending' ? (isHoveringFollow ? 'Cancel Request' : 'Request Pending') : isFollowing ? (isHoveringFollow ? 'Unfollow' : 'Following') : 'Follow'}
                        >
                          {followRequestStatus === 'pending' && isHoveringFollow ? '✗' : followRequestStatus === 'pending' ? '⏳' : isFollowing && isHoveringFollow ? '✗' : isFollowing ? '✓' : '+'}
                        </button>
                        <button
                          className={`block-user-btn ${isBlockedUser ? 'blocked' : ''}`}
                          onClick={handleBlockUser}
                          title={isBlockedUser ? 'Unblock user' : 'Block user'}
                        >
                          {isBlockedUser ? '🔓' : '🔒'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <div className="display-info">
                      <div className="profile-name-row">
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
                      <div className="profile-details">
                        <div className="profile-info-row">
                          {profile.dateOfBirth && <p className="profile-dob">🎂 {new Date(profile.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                          {profile.country && <p className="profile-country">{COUNTRIES.find(c => c.name === profile.country)?.flag || '🌍'} {profile.country}</p>}
                          {profile.location && <p className="profile-location">📍 {profile.location}</p>}
                        </div>
                        <p className="profile-bio">{profile.bio}</p>
                      </div>
                    </div>
                  </div>
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
              📝 {isOwnProfile ? 'My Posts' : 'Posts'} ({posts.length})
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