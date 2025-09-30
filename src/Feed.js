import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import CreatePost from './CreatePost';
import Post from './Post';
import Sidebar from './Sidebar';
import './Feed.css';

function Feed() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'John Doe',
      isFollowing: true,
      content: 'Had an incredible weekend exploring the historic charm and culinary delights of this amazing city!',
      tripTitle: 'Weekend in Paris',
      location: 'Paris, France',
      startDate: '2024-01-13',
      endDate: '2024-01-15',
      hashtags: ['Paris', 'France', 'Weekend', 'Food', 'Culture', 'Demo'],
      activities: [
        { type: 'restaurant', name: 'Le Comptoir du Relais', description: 'Amazing French bistro with traditional dishes', time: '19:30', rating: 5 },
        { type: 'monument', name: 'Eiffel Tower', description: 'Iconic tower with breathtaking city views', time: '15:00', rating: 5 },
        { type: 'museum', name: 'Louvre Museum', description: 'World-famous art museum', time: '10:00', rating: 4 },
        { type: 'bar', name: 'Hemingway Bar', description: 'Classic cocktails in historic setting', time: '22:00', rating: 4 }
      ],
      timestamp: new Date('2024-01-15T10:30:00'),
      likes: 24,
      comments: [
        { id: 1, author: 'Jane Smith', content: 'Paris looks amazing! How was the food?', timestamp: new Date('2024-01-15T10:35:00') },
        { id: 2, author: 'Mike Johnson', content: 'The Eiffel Tower shot is incredible!', timestamp: new Date('2024-01-15T10:40:00') }
      ]
    },
    {
      id: 2,
      author: 'Sarah Wilson',
      isFollowing: true,
      content: 'Perfect day exploring the beautiful beaches and vibrant culture. The sunset at the beach was absolutely magical! 🌅',
      tripTitle: 'Barcelona Adventure',
      location: 'Barcelona, Spain',
      startDate: '2024-01-12',
      endDate: '2024-01-14',
      hashtags: ['Barcelona', 'Spain', 'Beach', 'Architecture', 'Sunset', 'Demo'],
      activities: [
        { type: 'beach', name: 'Barceloneta Beach', description: 'Beautiful city beach with great atmosphere', time: '14:00', rating: 4 },
        { type: 'monument', name: 'Sagrada Familia', description: 'Gaudí\'s masterpiece basilica', time: '10:30', rating: 5 },
        { type: 'restaurant', name: 'Cal Pep', description: 'Traditional tapas bar', time: '20:00', rating: 5 }
      ],
      timestamp: new Date('2024-01-14T18:45:00'),
      likes: 31,
      comments: [
        { id: 3, author: 'Tom Brown', content: 'Barcelona is on my bucket list!', timestamp: new Date('2024-01-14T18:50:00') }
      ]
    },
    {
      id: 3,
      author: 'Alex Chen',
      isFollowing: false,
      content: 'Solo trip to Tokyo was life-changing. The blend of traditional and modern culture is fascinating. Every meal was an adventure!',
      tripTitle: 'Tokyo Discovery',
      location: 'Tokyo, Japan',
      startDate: '2024-01-10',
      endDate: '2024-01-12',
      hashtags: ['Tokyo', 'Japan', 'Solo', 'Food', 'Culture', 'Demo'],
      activities: [
        { type: 'restaurant', name: 'Sukiyabashi Jiro', description: 'World-renowned sushi restaurant', time: '12:00', rating: 5 },
        { type: 'park', name: 'Senso-ji Temple', description: 'Ancient Buddhist temple', time: '09:00', rating: 4 },
        { type: 'attraction', name: 'Tokyo Skytree', description: 'Tallest structure in Japan', time: '16:00', rating: 4 }
      ],
      timestamp: new Date('2024-01-14T14:20:00'),
      likes: 18,
      comments: []
    },
    {
      id: 4,
      author: 'Maria Rodriguez',
      isFollowing: false,
      content: 'Backpacking through the Andes was an incredible challenge! The views from Machu Picchu at sunrise were absolutely breathtaking.',
      tripTitle: 'Andes Adventure',
      location: 'Cusco, Peru',
      startDate: '2024-01-08',
      endDate: '2024-01-11',
      hashtags: ['Peru', 'MachuPicchu', 'Hiking', 'Adventure', 'Backpacking'],
      activities: [
        { type: 'hiking', name: 'Inca Trail', description: 'Ancient trail to Machu Picchu', time: '06:00', rating: 5 },
        { type: 'monument', name: 'Machu Picchu', description: 'Ancient Incan citadel', time: '05:30', rating: 5 },
        { type: 'restaurant', name: 'Central', description: 'Modern Peruvian cuisine', time: '19:00', rating: 4 }
      ],
      timestamp: new Date('2024-01-12T16:15:00'),
      likes: 42,
      comments: [
        { id: 4, author: 'Adventure Lover', content: 'This looks amazing! How long was the trek?', timestamp: new Date('2024-01-12T16:30:00') }
      ]
    },
    {
      id: 5,
      author: 'David Kim',
      isFollowing: false,
      content: 'Road trip across Iceland was pure magic. From the Northern Lights to geothermal hot springs, every moment was unforgettable!',
      tripTitle: 'Iceland Ring Road',
      location: 'Reykjavik, Iceland',
      startDate: '2024-01-05',
      endDate: '2024-01-09',
      hashtags: ['Iceland', 'NorthernLights', 'RoadTrip', 'Nature', 'Adventure'],
      activities: [
        { type: 'attraction', name: 'Blue Lagoon', description: 'Geothermal spa', time: '14:00', rating: 4 },
        { type: 'park', name: 'Gullfoss Waterfall', description: 'Powerful waterfall', time: '11:00', rating: 5 },
        { type: 'attraction', name: 'Northern Lights', description: 'Aurora viewing', time: '23:00', rating: 5 }
      ],
      timestamp: new Date('2024-01-10T20:45:00'),
      likes: 67,
      comments: [
        { id: 5, author: 'Nature Photographer', content: 'Did you get good photos of the Northern Lights?', timestamp: new Date('2024-01-10T21:00:00') },
        { id: 6, author: 'Travel Enthusiast', content: 'Iceland is on my dream list!', timestamp: new Date('2024-01-10T21:15:00') }
      ]
    },
    {
      id: 6,
      author: 'Emma Thompson',
      isFollowing: true,
      content: 'Wine tasting in Tuscany was the perfect romantic getaway. Rolling hills, historic vineyards, and incredible food made this trip unforgettable!',
      tripTitle: 'Tuscan Romance',
      location: 'Florence, Italy',
      startDate: '2024-01-06',
      endDate: '2024-01-08',
      hashtags: ['Italy', 'Tuscany', 'Wine', 'Food', 'Romance'],
      activities: [
        { type: 'restaurant', name: 'Osteria di Passignano', description: 'Michelin-starred Tuscan cuisine', time: '20:00', rating: 5 },
        { type: 'attraction', name: 'Chianti Wine Tour', description: 'Historic vineyard tour', time: '15:00', rating: 5 },
        { type: 'monument', name: 'Duomo di Firenze', description: 'Gothic cathedral', time: '10:00', rating: 4 }
      ],
      timestamp: new Date('2024-01-09T12:30:00'),
      likes: 35,
      comments: [
        { id: 7, author: 'Wine Lover', content: 'Which vineyard was your favorite?', timestamp: new Date('2024-01-09T13:00:00') }
      ]
    }
  ]);

  useEffect(() => {
    const storedPosts = localStorage.getItem('tripPosts');
    if (storedPosts) {
      setPosts(JSON.parse(storedPosts));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tripPosts', JSON.stringify(posts));
  }, [posts]);

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

  const addPost = (tripData) => {
    const newPost = {
      id: posts.length + 1,
      author: 'Current User',
      content: tripData.content,
      tripTitle: tripData.tripTitle,
      location: tripData.location,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      activities: tripData.activities,
      transport: tripData.transport,
      timestamp: new Date(),
      likes: 0,
      comments: []
    };
    setPosts([newPost, ...posts]);
    setShowCreatePost(false); // Hide create form after successful post
  };

  const likePost = (postId) => {
    // Get current liked posts from localStorage
    const storedLikedPosts = localStorage.getItem('likedPosts');
    let likedPostIds = storedLikedPosts ? JSON.parse(storedLikedPosts) : [];

    const isCurrentlyLiked = likedPostIds.includes(postId);

    // Update posts like count
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));

    // Update liked posts tracking
    if (isCurrentlyLiked) {
      // Unlike
      likedPostIds = likedPostIds.filter(id => id !== postId);
    } else {
      // Like
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