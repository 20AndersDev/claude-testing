import React, { useState } from 'react';
import Navbar from './Navbar';
import CreatePost from './CreatePost';
import Post from './Post';
import './Feed.css';

function Feed() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'John Doe',
      content: 'Just had an amazing cup of coffee! ☕ What a great way to start the day.',
      timestamp: new Date('2024-01-15T10:30:00'),
      likes: 12,
      comments: [
        { id: 1, author: 'Jane Smith', content: 'Where did you get it from?', timestamp: new Date('2024-01-15T10:35:00') },
        { id: 2, author: 'Mike Johnson', content: 'Coffee is life! ☕', timestamp: new Date('2024-01-15T10:40:00') }
      ]
    },
    {
      id: 2,
      author: 'Sarah Wilson',
      content: 'Beautiful sunset today! Nature never fails to amaze me. 🌅',
      timestamp: new Date('2024-01-14T18:45:00'),
      likes: 28,
      comments: [
        { id: 3, author: 'Tom Brown', content: 'Stunning photo!', timestamp: new Date('2024-01-14T18:50:00') }
      ]
    },
    {
      id: 3,
      author: 'Alex Chen',
      content: 'Just finished reading an incredible book. Highly recommend "The Midnight Library" by Matt Haig. Anyone else read it?',
      timestamp: new Date('2024-01-14T14:20:00'),
      likes: 15,
      comments: []
    }
  ]);

  const addPost = (content) => {
    const newPost = {
      id: posts.length + 1,
      author: 'Current User',
      content: content,
      timestamp: new Date(),
      likes: 0,
      comments: []
    };
    setPosts([newPost, ...posts]);
  };

  const likePost = (postId) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
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
      <Navbar />
      <div className="feed">
        <CreatePost onAddPost={addPost} />
        <div className="posts-container">
          {posts.map(post => (
            <Post
              key={post.id}
              post={post}
              onLike={likePost}
              onComment={addComment}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default Feed;