import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Verdict from './verdict';
import './styles.css';

function Home() {
  return (
    <div className="container">
      <h1>Verdict AI</h1>
      <p>
        Welcome to Verdict, your intelligent companion for understanding sentiment in text. <br/>Enter any statement or document to instantly reveal its emotional tone<br/>—powered by advanced natural language processing.
      </p>
      <div style={{ textAlign: 'center' }}>
        <Link to="/sms"><button>Analyze SMS</button></Link>
        <Link to="/document"><button>Analyze Document</button></Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sms" element={<Verdict type="sms" />} />
        <Route path="/document" element={<Verdict type="document" />} />
      </Routes>
    </Router>
  );
}

export default App;