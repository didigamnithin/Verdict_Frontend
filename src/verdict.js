import React, { useState } from 'react';

function Verdict({ type }) {
  const [text, setText] = useState(''); //  State for storing the text input
  const [file, setFile] = useState(null); //  State for storing the file input
  const [result, setResult] = useState(null); //  State for storing the result of the analysis
  const [loading, setLoading] = useState(false); //  State for loading animation
  const [errorMessage, setErrorMessage] = useState("");
  const allowedExts = ["txt", "docx", "pdf"];



  const handleFileChange = (picked) => {
    if (!picked) {
      setFile(null);
      setErrorMessage("");
      return;
    }
    const ext = picked.name.split(".").pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      setFile(null);
      setErrorMessage("Unsupported format. Please upload .txt, .docx or .pdf.");
    } else {
      setFile(picked);
      setErrorMessage("");
    }
  };






  const handleAnalyze = async () => {
    // Validate input before making request
    if (type === 'sms' && !text.trim()) {
      setErrorMessage("Please enter some text to analyze.");
      return;
    }
    
    if (type === 'document' && !file) {
      setErrorMessage("Please select a file to analyze.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setResult(null);
    
    try {
      let response;
      
      if (type === 'sms') {
        response = await fetch('http://localhost:8000/api/analyze_sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.trim() })
        });
      } else {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch('http://localhost:8000/api/analyze_document', {
          method: 'POST',
          body: formData
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error analyzing:', error);
      setErrorMessage(`Analysis failed: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  return (
  <div className="container">
    <h1>VerdictAI</h1>

    {type === 'sms' ? (
      <textarea
        rows="6"
        placeholder="Enter SMS text..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    ) : (
      <div>
        {/* Supported‐formats notice */}
        <div style={{ marginBottom: 8 }}>
          Supported formats – .txt, .docx, .pdf
        </div>

        {/* File picker with validation */}
        <input
          type="file"
          accept=".txt,.docx,.pdf"
          onChange={(e) => handleFileChange(e.target.files[0])}
        />

        {/* Unsupported‐format error */}
        {errorMessage && (
          <div style={{ color: "red", marginTop: 4 }}>
            {errorMessage}
          </div>
        )}
      </div>
    )}

    <button 
      onClick={handleAnalyze} 
      disabled={loading}
      style={{ 
        opacity: loading ? 0.6 : 1,
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      {loading ? 'Analyzing...' : 'Analyze'}
    </button>

    {loading && (
      <div className="loading" style={{ 
        textAlign: 'center', 
        margin: '20px 0',
        padding: '20px',
        backgroundColor: '#f0f8ff',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
        <p>Processing your {type === 'sms' ? 'text' : 'document'}...</p>
        <p style={{ fontSize: '14px', color: '#666' }}>This may take a few moments</p>
      </div>
    )}

    {errorMessage && (
      <div style={{ 
        color: "red", 
        marginTop: "10px", 
        padding: "10px",
        backgroundColor: "#ffe6e6",
        borderRadius: "5px",
        border: "1px solid #ff9999"
      }}>
        {errorMessage}
      </div>
    )}

    {result && !loading && (
      <div className="result" style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>
          Major Emotion: {result.Predicted_Sentiment} - {result.cd}%
        </h2>
        <h3 style={{ color: '#555', marginBottom: '10px' }}>All Emotions Detected:</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {result.emotions.map(({ emotion, prob }) => (
            <li key={emotion} style={{
              padding: '8px 12px',
              margin: '5px 0',
              backgroundColor: '#fff',
              borderRadius: '4px',
              border: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 'bold' }}>{emotion}:</span>
              <span>{prob}%</span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

}

export default Verdict;