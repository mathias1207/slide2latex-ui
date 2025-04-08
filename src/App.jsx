// src/App.jsx
import React from 'react';
import UploadForm from './components/UploadForm';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <h1>Slide2LaTeX Converter</h1>
      <UploadForm />
    </div>
  );
}

export default App;
