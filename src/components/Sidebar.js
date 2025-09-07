import React from 'react';
import { Plus, MessageSquare, Trash2, User } from 'lucide-react';

function Sidebar({ chats, currentChatId, onChatSelect, onNewChat, onDeleteChat }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button className="new-chat-button" onClick={onNewChat}>
          <Plus size={16} />
          New Chat
        </button>
      </div>
      
      <div className="chat-list">
        {chats.length === 0 ? (
          <div className="no-chats">
            <MessageSquare size={24} />
            <p>No chats yet</p>
            <p>Start a new conversation to begin</p>
          </div>
        ) : (
          <div className="chats-container">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                onClick={() => onChatSelect(chat.id)}
              >
                <div className="chat-content">
                  <div className="chat-title">
                    <MessageSquare size={14} />
                    <span>{chat.title}</span>
                  </div>
                  <div className="chat-meta">
                    <span className="chat-date">{formatDate(chat.createdAt)}</span>
                    <span className="chat-message-count">
                      {chat.messages?.length || 0} messages
                    </span>
                  </div>
                </div>
                <button
                  className="delete-chat-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  title="Delete chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <User size={16} />
          <span>Verdict AI</span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
