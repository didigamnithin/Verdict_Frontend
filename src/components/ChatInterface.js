import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, FileText, Image, X } from 'lucide-react';

function ChatInterface({ chat, onUpdateChat, user, geminiApiKey, setGeminiApiKey }) {
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDocumentOptions, setShowDocumentOptions] = useState(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingMessageId, setCurrentTypingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, typingText]);

  // Typing effect
  useEffect(() => {
    if (isTyping && currentTypingMessageId) {
      const message = chat.messages?.find(m => m.id === currentTypingMessageId);
      if (message && message.content) {
        let fullText = '';
        
        // Get the text to type
        if (message.action === 'Summarize') {
          fullText = message.content.summary || '';
        } else if (message.content.error) {
          fullText = message.content.error;
        } else {
          // For sentiment analysis, skip typing effect
          setIsTyping(false);
          setCurrentTypingMessageId(null);
          return;
        }

        let currentIndex = 0;
        setTypingText('');

        typingIntervalRef.current = setInterval(() => {
          if (currentIndex < fullText.length) {
            setTypingText(fullText.substring(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(typingIntervalRef.current);
            setIsTyping(false);
            setCurrentTypingMessageId(null);
          }
        }, 10); // Adjust speed: lower = faster

        return () => {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
          }
        };
      }
    }
  }, [isTyping, currentTypingMessageId, chat.messages]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['txt', 'pdf', 'docx'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
        setAttachedFile(file);
        setShowDocumentOptions(true);
      } else {
        alert('Please select a .txt, .pdf, or .docx file');
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setShowDocumentOptions(false);
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
    setShowDocumentOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setIsLoading(true);

    try {
      let response;
      
      // Force AWS EC2 URL - remove all old platform references
      const API_BASE_URL = 'https://postpituitary-patria-pettishly.ngrok-free.dev';
      console.log('🔗 API_BASE_URL:', API_BASE_URL);
      console.log('🌍 Environment:', process.env.NODE_ENV);
      console.log('✅ Using AWS EC2 Backend:', API_BASE_URL);
      console.log('🚀 VERSION: 2.0 - AWS EC2 DEPLOYMENT');
      console.log('❌ OLD RAILWAY URL REMOVED - USING AWS ONLY');
      
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
      
      // Create AI message with typing effect
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data,
        timestamp: new Date().toISOString(),
        isTyping: true
      };

      // Add message and start typing effect
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

  const handleDocumentAction = async (action) => {
    if (!attachedFile) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `${action} document: ${attachedFile.name}`,
      file: attachedFile,
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    const updatedMessages = [...(chat.messages || []), userMessage];
    onUpdateChat(chat.id, { 
      messages: updatedMessages,
      title: chat.title === 'New Chat' ? `${action} ${attachedFile.name}`.substring(0, 30) + '...' : chat.title
    });

    setIsLoading(true);
    setShowDocumentOptions(false);

    try {
      // Force AWS EC2 URL - remove all old platform references
      // new url updated
      const API_BASE_URL = 'https://postpituitary-patria-pettishly.ngrok-free.dev';
      console.log('📄 Document Action API_BASE_URL:', API_BASE_URL);
      const formData = new FormData();
      formData.append('file', attachedFile);
      
      let endpoint;
      if (action === 'Summarize') {
        endpoint = '/api/summarize_document';
        formData.append('question', 'Summarize this document');
        // API key is now handled by backend from .env
      } else {
        endpoint = '/api/analyze_document';
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data,
        action: action,
        timestamp: new Date().toISOString()
      };

      onUpdateChat(chat.id, { 
        messages: [...updatedMessages, aiMessage]
      });

      // Start typing effect for summary
      if (action === 'Summarize') {
        setIsTyping(true);
        setCurrentTypingMessageId(aiMessage.id);
      }

    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing:`, error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: { error: `${action} failed: ${error.message}` },
        timestamp: new Date().toISOString()
      };
      
      onUpdateChat(chat.id, { 
        messages: [...updatedMessages, errorMessage]
      });
    } finally {
      setIsLoading(false);
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format summary text with markdown-like formatting
  const formatSummary = (text) => {
    if (!text) return '';
    
    // Function to convert **text** to <strong>text</strong>
    const parseBold = (line) => {
      const parts = [];
      let lastIndex = 0;
      const regex = /\*\*(.*?)\*\*/g;
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        // Add bold text
        parts.push(<strong key={match.index}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : line;
    };
    
    // Split into lines and format
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers (lines ending with :)
      if (line.trim().endsWith(':') && line.trim().length > 0) {
        return <h4 key={index} className="summary-header">{parseBold(line.trim())}</h4>;
      }
      // Bullet points
      else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        return <li key={index} className="summary-bullet">{parseBold(line.trim().substring(1).trim())}</li>;
      }
      // Regular paragraphs
      else if (line.trim().length > 0) {
        return <p key={index} className="summary-paragraph">{parseBold(line.trim())}</p>;
      }
      return null;
    }).filter(Boolean);
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
          <div className="ai-avatar">
            <span>AI</span>
          </div>
          <div className="message-content">
            {message.content.error ? (
              <div className="error-message">
                <p>❌ {message.content.error}</p>
              </div>
            ) : message.action === 'Summarize' ? (
              <div className="summary-result">
                <h3 className="summary-title">📄 Document Summary</h3>
                <div className="summary-content">
                  {isTyping && currentTypingMessageId === message.id ? (
                    <>
                      {formatSummary(typingText)}
                      <span className="typing-cursor">▋</span>
                    </>
                  ) : (
                    formatSummary(message.content.summary)
                  )}
                </div>
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
                <div className="ai-avatar">
                  <span>AI</span>
                </div>
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

        {showDocumentOptions && attachedFile && (
          <div className="document-options">
            <h4>What would you like to do with this document?</h4>
            <div className="option-buttons">
              <button 
                className="option-button summarize-btn"
                onClick={() => handleDocumentAction('Summarize')}
                disabled={isLoading}
              >
                📄 Summarize
              </button>
              <button 
                className="option-button analyze-btn"
                onClick={() => handleDocumentAction('Analyze Sentiment')}
                disabled={isLoading}
              >
                🎯 Analyze Sentiment
              </button>
            </div>
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
