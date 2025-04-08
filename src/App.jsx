// src/App.jsx
import React, { useEffect } from 'react';
import UploadForm from './components/UploadForm';

function App() {
  useEffect(() => {
    console.log('App component mounted');
  }, []);

  return (
    <div className="App">
      <h1>Slide2LaTeX Converter</h1>
      <UploadForm />
    </div>
  );
}

export default App;
