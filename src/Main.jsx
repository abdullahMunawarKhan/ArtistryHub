// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/style.css';
import { HashRouter } from 'react-router-dom';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>


      {/* You can wrap App in an ErrorBoundary or HelmetProvider here if needed */}
      <App />

    </HashRouter>
  </React.StrictMode>
);
