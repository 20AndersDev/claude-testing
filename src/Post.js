import React, { useState } from 'react';
import './Post.css';

function Post({ post, onLike, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleLike = () => {
    onLike(post.id);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className="post">
      <div className="post-header">
        <div className="post-author-info">
          <div className="author-avatar">👤</div>
          <div className="author-details">
            <div className="author-name">{post.author}</div>
            <div className="post-time">{formatTime(post.timestamp)}</div>
          </div>
        </div>
      </div>

      <div className="post-content">
        <p>{post.content}</p>
      </div>

      <div className="post-stats">
        <div className="likes-count">
          {post.likes > 0 && `${post.likes} like${post.likes > 1 ? 's' : ''}`}
        </div>
        <div className="comments-count">
          {post.comments.length > 0 && (
            <button
              className="comments-toggle"
              onClick={() => setShowComments(!showComments)}
            >
              {post.comments.length} comment{post.comments.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      <div className="post-actions">
        <button className="action-btn like-btn" onClick={handleLike}>
          👍 Like
        </button>
        <button
          className="action-btn comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comment
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {post.comments.map(comment => (
            <div key={comment.id} className="comment">
              <div className="comment-avatar">👤</div>
              <div className="comment-content">
                <div className="comment-author">{comment.author}</div>
                <div className="comment-text">{comment.content}</div>
                <div className="comment-time">{formatTime(comment.timestamp)}</div>
              </div>
            </div>
          ))}

          <div className="add-comment">
            <div className="comment-avatar">👤</div>
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="comment-input"
              />
              <button
                type="submit"
                className="comment-submit"
                disabled={!commentText.trim()}
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Post;