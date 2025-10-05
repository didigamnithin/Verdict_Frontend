import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import GoogleAuth from './components/GoogleAuth';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';

function App() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    // Load saved chats from localStorage
    const savedChats = localStorage.getItem('evidenceai-chats');
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    }
    
    // Load saved OpenAI API key from localStorage
    const savedApiKey = localStorage.getItem('evidenceai-openai-key');
    if (savedApiKey) {
      setGeminiApiKey(savedApiKey);
    }
  }, []);

  useEffect(() => {
    // Save OpenAI API key to localStorage whenever it changes
    if (geminiApiKey) {
      localStorage.setItem('evidenceai-openai-key', geminiApiKey);
    }
  }, [geminiApiKey]);

  useEffect(() => {
    // Save chats to localStorage whenever chats change
    localStorage.setItem('evidenceai-chats', JSON.stringify(chats));
  }, [chats]);

  const createNewChat = () => {
    const newChat = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };

  const updateChat = (chatId, updates) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, ...updates } : chat
    ));
  };

  const deleteChat = (chatId) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const currentChat = chats.find(chat => chat.id === currentChatId);

  return (
    <div className="app">
      <div className="app-header">
        <div className="header-left">
          <h1>EvidenceAI</h1>
        </div>
        <div className="header-right">
          <GoogleAuth user={user} setUser={setUser} />
        </div>
      </div>
      
      <div className="app-body">
        <Sidebar 
          chats={chats}
          currentChatId={currentChatId}
          onChatSelect={setCurrentChatId}
          onNewChat={createNewChat}
          onDeleteChat={deleteChat}
        />
        
        <div className="main-content">
          {currentChat ? (
            <ChatInterface 
              chat={currentChat}
              onUpdateChat={updateChat}
              user={user}
              geminiApiKey={geminiApiKey}
              setGeminiApiKey={setGeminiApiKey}
            />
          ) : (
            <div className="welcome-screen">
              <h2>Welcome to EvidenceAI</h2>
              <p>Your intelligent companion for understanding sentiment in text and documents.</p>
              <button onClick={createNewChat} className="new-chat-btn">
                Start New Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;