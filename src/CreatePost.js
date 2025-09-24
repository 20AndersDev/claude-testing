import React, { useState } from 'react';
import './CreatePost.css';

function CreatePost({ onAddPost }) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onAddPost(content);
      setContent('');
      setIsExpanded(false);
    }
  };

  const handleTextareaClick = () => {
    setIsExpanded(true);
  };

  const handleCancel = () => {
    setContent('');
    setIsExpanded(false);
  };

  return (
    <div className="create-post">
      <div className="create-post-header">
        <div className="user-avatar">👤</div>
        <form onSubmit={handleSubmit} className="post-form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onClick={handleTextareaClick}
            placeholder="What's on your mind?"
            className={`post-textarea ${isExpanded ? 'expanded' : ''}`}
            rows={isExpanded ? 4 : 1}
          />
          {isExpanded && (
            <div className="post-actions">
              <button type="button" onClick={handleCancel} className="cancel-btn">
                Cancel
              </button>
              <button
                type="submit"
                className="post-btn"
                disabled={!content.trim()}
              >
                Post
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default CreatePost;