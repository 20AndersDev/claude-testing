import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import Navbar from './Navbar';
import './DirectMessages.css';

function DirectMessages() {
  const navigate = useNavigate();
  const { userId: chatUserId } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [isBlockedUser, setIsBlockedUser] = useState(false);
  const [hasBlockedCurrentUser, setHasBlockedCurrentUser] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (chatUserId && user) {
      openConversationWithUser(chatUserId);
    }
  }, [chatUserId, user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      checkBlockStatus(selectedConversation.otherUser.id);

      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`conversation_${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          async (payload) => {
            console.log('New message received:', payload);

            // Fetch profile data for the new message
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', payload.new.sender_id)
              .single();

            const messageWithProfile = {
              ...payload.new,
              profiles: profileData
            };

            // Only add if not from current user (we already added it optimistically)
            if (payload.new.sender_id !== user.id) {
              setMessages((prevMessages) => {
                // Check if message already exists
                if (prevMessages.some(msg => msg.id === payload.new.id)) {
                  return prevMessages;
                }
                return [...prevMessages, messageWithProfile];
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!userSearchQuery.trim()) {
        setUserSearchResults([]);
        return;
      }

      if (!user || !user.id) {
        console.log('User not loaded yet, skipping search');
        return;
      }

      try {
        const query = userSearchQuery.trim().toLowerCase();
        console.log('Searching for users with query:', query);

        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
          .neq('id', user.id)
          .limit(10);

        if (error) {
          console.error('Search error:', error);
          throw error;
        }

        console.log('Search results:', data);
        setUserSearchResults(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setUserSearchResults([]);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery, user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);

      // Fetch all conversations where user is participant
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST116') {
          console.warn('Direct messages table not yet configured. Please set up the database schema.');
          setConversations([]);
          return;
        }
        throw error;
      }

      // Fetch profile data for other participants and unread counts
      const conversationsWithProfiles = await Promise.all(
        (conversationsData || []).map(async (conv) => {
          const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;

          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          // Get unread count for this conversation
          const { count: unreadCount, error: unreadError } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .eq('read', false);

          console.log(`Unread count for conversation ${conv.id}:`, unreadCount);

          const finalUnreadCount = unreadError ? 0 : (unreadCount || 0);

          return {
            ...conv,
            otherUser: profileData,
            unreadCount: finalUnreadCount
          };
        })
      );

      console.log('All conversations with unread counts:', conversationsWithProfiles);
      setConversations(conversationsWithProfiles);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const openConversationWithUser = async (otherUserId) => {
    try {
      // Check if conversation already exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      let conversation;

      if (existingConv) {
        conversation = existingConv;

        // Mark messages as read if conversation exists
        await supabase
          .from('direct_messages')
          .update({ read: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', user.id)
          .eq('read', false);
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert([{
            user1_id: user.id,
            user2_id: otherUserId,
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        conversation = newConv;
      }

      // Fetch other user's profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', otherUserId)
        .single();

      setSelectedConversation({
        ...conversation,
        otherUser: profileData
      });

      setShowNewMessageModal(false);
      await fetchConversations();
    } catch (error) {
      console.error('Error opening conversation:', error);
      alert('Failed to open conversation. Please make sure the database is set up correctly.');
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST116') {
          console.warn('Direct messages table not yet configured.');
          setMessages([]);
          return;
        }
        throw error;
      }

      // Fetch profile data for each message
      const messagesWithProfiles = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          return {
            ...msg,
            profiles: profileData
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          message: newMessage.trim()
        }])
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST116') {
          alert('Direct messaging not yet enabled. Please set up the database schema.');
          return;
        }
        throw error;
      }

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      // Fetch profile data for the new message
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const messageWithProfile = {
        ...data,
        profiles: profileData
      };

      setMessages((prevMessages) => [...prevMessages, messageWithProfile]);
      setNewMessage('');
      await fetchConversations(); // Refresh to update conversation order
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleSelectConversation = async (conv) => {
    setSelectedConversation(conv);
    navigate(`/messages/${conv.otherUser.id}`);

    // Mark all messages in this conversation as read
    try {
      await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', user.id)
        .eq('read', false);

      // Refresh conversations to update unread counts
      await fetchConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSelectUserFromSearch = (selectedUser) => {
    openConversationWithUser(selectedUser.id);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // Remove message from local state
      setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const checkBlockStatus = async (otherUserId) => {
    try {
      // Check if current user blocked the other user
      const { data: blockedByMe, error: error1 } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', otherUserId)
        .single();

      if (error1 && error1.code !== 'PGRST116') {
        console.error('Error checking block status:', error1);
      }

      setIsBlockedUser(!!blockedByMe);

      // Check if other user blocked current user
      const { data: blockedMe, error: error2 } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', otherUserId)
        .eq('blocked_id', user.id)
        .single();

      if (error2 && error2.code !== 'PGRST116') {
        console.error('Error checking if blocked:', error2);
      }

      setHasBlockedCurrentUser(!!blockedMe);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation) return;

    const action = isBlockedUser ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      if (isBlockedUser) {
        // Unblock user
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', user.id)
          .eq('blocked_id', selectedConversation.otherUser.id);

        if (error) throw error;
        setIsBlockedUser(false);
        alert('User unblocked successfully');
      } else {
        // Block user
        const { error } = await supabase
          .from('blocked_users')
          .insert([{
            blocker_id: user.id,
            blocked_id: selectedConversation.otherUser.id
          }]);

        if (error) {
          if (error.code === 'PGRST204' || error.code === 'PGRST116') {
            alert('Block feature not yet enabled. Please set up the database schema.');
            return;
          }
          throw error;
        }
        setIsBlockedUser(true);
        alert('User blocked successfully');
      }
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      alert('Failed to update block status. Please try again.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isThisYear = date.getFullYear() === now.getFullYear();

    // For messages today, show time only (e.g., "14:30")
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    // For messages this year, show date and time (e.g., "Jan 15, 14:30")
    if (isThisYear) {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    // For older messages, include year (e.g., "Jan 15, 2024, 14:30")
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="direct-messages-page">
      <Navbar />
      <div className="direct-messages-container">
        {/* Conversations List */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>Messages</h2>
            <button
              className="new-message-btn"
              onClick={() => setShowNewMessageModal(!showNewMessageModal)}
              title="New Message"
            >
              ✏️
            </button>
          </div>

          {showNewMessageModal && (
            <div className="new-message-search">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="user-search-input"
                autoFocus
              />

              {/* Debug info - Remove after testing */}
              {console.log('Render check - userSearchResults:', userSearchResults)}
              {console.log('Results count:', userSearchResults.length)}

              {userSearchQuery.trim().length > 0 && userSearchResults.length === 0 && (
                <div className="search-no-results">
                  <p>No users found for "{userSearchQuery}"</p>
                </div>
              )}

              {userSearchResults.length > 0 && (
                <div className="user-search-results">
                  <div className="search-results-header">
                    Found {userSearchResults.length} user{userSearchResults.length !== 1 ? 's' : ''}
                  </div>
                  {userSearchResults.map((searchUser) => (
                    <div
                      key={searchUser.id}
                      className="user-search-item"
                      onClick={() => handleSelectUserFromSearch(searchUser)}
                    >
                      {searchUser.avatar_url ? (
                        <img src={searchUser.avatar_url} alt={searchUser.username} className="search-user-avatar" />
                      ) : (
                        <div className="search-user-avatar-placeholder">👤</div>
                      )}
                      <div className="search-user-info">
                        <div className="search-user-name">{searchUser.full_name || searchUser.username}</div>
                        <div className="search-user-username">@{searchUser.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {userSearchQuery.trim().length === 0 && (
                <div className="search-hint-message">
                  <p>Type to search for users</p>
                </div>
              )}
            </div>
          )}

          <div className="conversations-list">
            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet</p>
                <p className="empty-state-hint">Click ✏️ to start a new conversation</p>
              </div>
            ) : (
              conversations.map((conv) => {
                console.log('Rendering conversation:', conv.otherUser?.username, 'unreadCount:', conv.unreadCount);
                return (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.unreadCount > 0 ? 'has-unread' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    {conv.otherUser?.avatar_url ? (
                      <img src={conv.otherUser.avatar_url} alt={conv.otherUser.username} className="conversation-avatar" />
                    ) : (
                      <div className="conversation-avatar-placeholder">👤</div>
                    )}
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <div className="conversation-name">
                          {conv.otherUser?.full_name || conv.otherUser?.username || 'Unknown User'}
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="conversation-unread-badge">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="conversation-time">{formatMessageTime(conv.updated_at)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Messages View */}
        <div className="messages-main">
          {selectedConversation ? (
            <>
              <div className="messages-header">
                <div
                  className="header-user-info"
                  onClick={() => navigate(`/profile/${selectedConversation.otherUser?.username}`)}
                  style={{ cursor: 'pointer' }}
                  title="View profile"
                >
                  {selectedConversation.otherUser?.avatar_url ? (
                    <img src={selectedConversation.otherUser.avatar_url} alt={selectedConversation.otherUser.username} className="header-avatar" />
                  ) : (
                    <div className="header-avatar-placeholder">👤</div>
                  )}
                  <div className="header-user-details">
                    <div className="header-user-name">
                      {selectedConversation.otherUser?.full_name || selectedConversation.otherUser?.username}
                    </div>
                    <div className="header-user-username">@{selectedConversation.otherUser?.username}</div>
                  </div>
                </div>
                <button
                  className={`block-user-btn ${isBlockedUser ? 'blocked' : ''}`}
                  onClick={handleBlockUser}
                  title={isBlockedUser ? 'Unblock user' : 'Block user'}
                >
                  {isBlockedUser ? '🔓 Unblock' : '🔒 Block'}
                </button>
              </div>

              <div className="messages-content">
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${msg.sender_id === user.id ? 'message-sent' : 'message-received'}`}
                    >
                      {msg.sender_id !== user.id && (
                        <div
                          className="message-avatar"
                          onClick={() => navigate(`/profile/${msg.profiles?.username}`)}
                          style={{ cursor: 'pointer' }}
                          title="View profile"
                        >
                          {msg.profiles?.avatar_url ? (
                            <img src={msg.profiles.avatar_url} alt={msg.profiles.username} />
                          ) : (
                            <div className="avatar-placeholder">👤</div>
                          )}
                        </div>
                      )}
                      <div className="message-bubble-wrapper">
                        <div className="message-bubble">
                          {msg.message}
                          <div className="message-time">{formatMessageTime(msg.created_at)}</div>
                        </div>
                        {msg.sender_id === user.id && (
                          <button
                            className="message-delete-btn"
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Delete message"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {hasBlockedCurrentUser ? (
                <div className="blocked-message-notice">
                  <p>⚠️ You cannot send messages to this user</p>
                </div>
              ) : isBlockedUser ? (
                <div className="blocked-message-notice">
                  <p>🔒 You have blocked this user. Unblock to send messages.</p>
                </div>
              ) : (
                <form className="message-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="message-input"
                  />
                  <button type="submit" className="send-button" disabled={!newMessage.trim()}>
                    Send
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="no-conversation-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the left or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DirectMessages;
