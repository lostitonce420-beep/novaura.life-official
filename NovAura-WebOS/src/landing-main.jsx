/**
 * Landing Page Entry Point
 * Standalone search engine for novaura.life
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { Toaster } from './components/ui/sonner';
import './index.css';

// Standalone landing page (no OS)
function LandingApp() {
  return (
    <BrowserRouter>
      <LandingPage 
        onLaunchOS={() => {
          // Redirect to OS
          window.location.href = '/system';
        }}
        isAuthenticated={false}
      />
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LandingApp />
  </React.StrictMode>
);
