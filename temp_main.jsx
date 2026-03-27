import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GraphicsProvider } from './contexts/GraphicsContext';
import { AuthProvider } from './hooks/useAuth.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <GraphicsProvider>
        <App />
      </GraphicsProvider>
    </AuthProvider>
  </React.StrictMode>
);
