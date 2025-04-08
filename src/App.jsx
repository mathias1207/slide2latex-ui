// src/App.jsx
import React, { useEffect } from 'react';
import UploadForm from './components/UploadForm';

function App() {
  useEffect(() => {
    console.log('App component mounted');
    // Forcer le style vert
    document.body.style.backgroundColor = '#2e7d32';
    document.documentElement.style.backgroundColor = '#2e7d32';
  }, []);

  return (
    <div className="App" style={{ backgroundColor: '#2e7d32', minHeight: '100vh' }}>
      <h1>Slide2LaTeX Converter</h1>
      <UploadForm />
    </div>
  );
}

export default App;
