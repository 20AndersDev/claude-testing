import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import './MentionTextarea.css';

function MentionTextarea({
  value,
  onChange,
  onMentionedUsersChange,
  placeholder = "What's on your mind?",
  className = "",
  rows = 4
}) {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionUsers, setMentionUsers] = useState([]);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Search for users when @ is typed
  useEffect(() => {
    const searchMentionUsers = async () => {
      if (!mentionSearch) {
        setMentionUsers([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .or(`username.ilike.%${mentionSearch}%,full_name.ilike.%${mentionSearch}%`)
          .limit(5);

        if (error) throw error;
        setMentionUsers(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setMentionUsers([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchMentionUsers();
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [mentionSearch]);

  // Handle text change and detect @ mentions
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const newCursorPosition = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(newCursorPosition);

    // Check if @ symbol was typed
    const textBeforeCursor = newValue.substring(0, newCursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtSymbol + 1);
      // Check if there's a space after @, if so, stop showing dropdown
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt);
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0);
        return;
      }
    }

    setShowMentionDropdown(false);
    setMentionSearch('');
  };

  // Handle mention selection
  const selectMention = (user) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbol !== -1) {
      const beforeAt = value.substring(0, lastAtSymbol);
      const mention = `@${user.username}`;
      const newValue = beforeAt + mention + ' ' + textAfterCursor;
      const newCursorPos = beforeAt.length + mention.length + 1;

      onChange(newValue);

      // Add user to mentioned users if not already there
      if (!mentionedUsers.find(u => u.id === user.id)) {
        const newMentionedUsers = [...mentionedUsers, user];
        setMentionedUsers(newMentionedUsers);
        if (onMentionedUsersChange) {
          onMentionedUsersChange(newMentionedUsers);
        }
      }

      setShowMentionDropdown(false);
      setMentionSearch('');

      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Handle keyboard navigation in dropdown
  const handleKeyDown = (e) => {
    if (!showMentionDropdown || mentionUsers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex((prev) =>
        prev < mentionUsers.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex((prev) => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && showMentionDropdown) {
      e.preventDefault();
      if (mentionUsers[selectedMentionIndex]) {
        selectMention(mentionUsers[selectedMentionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentionDropdown(false);
      setMentionSearch('');
    }
  };

  // Track mentioned users when text changes (in case user deletes a mention)
  useEffect(() => {
    const currentMentions = value.match(/@(\w+)/g) || [];
    const currentUsernames = currentMentions.map(m => m.substring(1));

    // Filter out users whose mentions were removed
    const updatedMentionedUsers = mentionedUsers.filter(user =>
      currentUsernames.includes(user.username)
    );

    if (updatedMentionedUsers.length !== mentionedUsers.length) {
      setMentionedUsers(updatedMentionedUsers);
      if (onMentionedUsersChange) {
        onMentionedUsersChange(updatedMentionedUsers);
      }
    }
  }, [value]);

  return (
    <div className="mention-textarea-container">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`mention-textarea ${className}`}
        rows={rows}
      />

      {showMentionDropdown && mentionUsers.length > 0 && (
        <div className="mention-dropdown" ref={dropdownRef}>
          {mentionUsers.map((user, index) => (
            <div
              key={user.id}
              className={`mention-dropdown-item ${index === selectedMentionIndex ? 'selected' : ''}`}
              onClick={() => selectMention(user)}
              onMouseEnter={() => setSelectedMentionIndex(index)}
            >
              <div className="mention-user-avatar">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} />
                ) : (
                  <div className="mention-avatar-placeholder">👤</div>
                )}
              </div>
              <div className="mention-user-info">
                <div className="mention-user-name">
                  {user.full_name || user.username}
                </div>
                <div className="mention-user-username">@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mentionedUsers.length > 0 && (
        <div className="mentioned-users-preview">
          <span className="mentioned-label">Mentioning:</span>
          {mentionedUsers.map((user, index) => (
            <span key={user.id} className="mentioned-user-tag">
              @{user.username}
              {index < mentionedUsers.length - 1 && ', '}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default MentionTextarea;
