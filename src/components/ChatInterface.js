import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, FileText, Image, X } from 'lucide-react';

function ChatInterface({ chat, onUpdateChat, user }) {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['txt', 'pdf', 'docx'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
        setAttachedFile(file);
      } else {
        alert('Please select a .txt, .pdf, or .docx file');
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText size={16} />;
      case 'docx':
        return <FileText size={16} />;
      case 'txt':
        return <FileText size={16} />;
      default:
        return <Image size={16} />;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !attachedFile) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      file: attachedFile,
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    const updatedMessages = [...(chat.messages || []), userMessage];
    onUpdateChat(chat.id, { 
      messages: updatedMessages,
      title: chat.title === 'New Chat' ? inputText.trim().substring(0, 30) + '...' : chat.title
    });

    setInputText('');
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsLoading(true);

    try {
      let response;
      
      const API_BASE_URL = process.envweb-production-7999.up.railway.appREACT_APP_API_URL || 'http://localhost:8000';
      
      if (attachedFile) {
        // Send file for analysis
        const formData = new FormData();
        formData.append('file', attachedFile);
        response = await fetch(`${API_BASE_URL}/api/analyze_document`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Send text for analysis
        response = await fetch(`${API_BASE_URL}/api/analyze_sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText.trim() })
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data,
        timestamp: new Date().toISOString()
      };

      onUpdateChat(chat.id, { 
        messages: [...updatedMessages, aiMessage]
      });

    } catch (error) {
      console.error('Error analyzing:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: { error: `Analysis failed: ${error.message}` },
        timestamp: new Date().toISOString()
      };
      
      onUpdateChat(chat.id, { 
        messages: [...updatedMessages, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (message) => {
    if (message.type === 'user') {
      return (
        <div key={message.id} className="message user-message">
          <div className="message-content">
            {message.file && (
              <div className="file-attachment">
                {getFileIcon(message.file.name)}
                <span>{message.file.name}</span>
              </div>
            )}
            {message.content && <p>{message.content}</p>}
          </div>
          <div className="message-time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      );
    } else {
      return (
        <div key={message.id} className="message ai-message">
          <div className="message-content">
            {message.content.error ? (
              <div className="error-message">
                <p>❌ {message.content.error}</p>
              </div>
            ) : (
              <div className="analysis-result">
                <div className="primary-emotion">
                  <h3>🎯 Primary Emotion</h3>
                  <div className="emotion-card primary">
                    <span className="emotion-name">{message.content.Predicted_Sentiment}</span>
                    <span className="emotion-score">{message.content.cd}%</span>
                  </div>
                </div>
                
                <div className="all-emotions">
                  <h4>📊 All Detected Emotions</h4>
                  <div className="emotions-grid">
                    {message.content.emotions?.map((emotion, index) => (
                      <div key={index} className="emotion-card">
                        <span className="emotion-name">{emotion.emotion}</span>
                        <span className="emotion-score">{emotion.prob}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="message-time">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>{chat.title}</h2>
        <div className="chat-meta">
          {chat.messages?.length || 0} messages
        </div>
      </div>
      
      <div className="messages-container">
        {chat.messages?.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-content">
              <h3>Start a conversation</h3>
              <p>Send a message or upload a document to analyze its sentiment</p>
              <div className="example-prompts">
                <button 
                  className="example-prompt"
                  onClick={() => setInputText("I'm so excited about this new project!")}
                >
                  "I'm so excited about this new project!"
                </button>
                <button 
                  className="example-prompt"
                  onClick={() => setInputText("This is really frustrating and disappointing.")}
                >
                  "This is really frustrating and disappointing."
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="messages">
            {chat.messages?.map(renderMessage)}
            {isLoading && (
              <div className="message ai-message loading">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <p>Analyzing your message...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="chat-input-container">
        {attachedFile && (
          <div className="file-preview">
            {getFileIcon(attachedFile.name)}
            <span>{attachedFile.name}</span>
            <button onClick={removeFile} className="remove-file">
              <X size={14} />
            </button>
          </div>
        )}
        
        <div className="chat-input">
          <button 
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or upload a document..."
            rows="1"
            disabled={isLoading}
          />
          
          <button 
            className="send-button"
            onClick={sendMessage}
            disabled={(!inputText.trim() && !attachedFile) || isLoading}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
