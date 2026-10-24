import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { seedDefaultFonts } from './lib/fonts.js';
import './styles.css';

// Make the bundled Google Fonts list available in every font picker (the stylesheet is linked in index.html).
seedDefaultFonts();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
