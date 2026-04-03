import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GraphicsProvider } from './contexts/GraphicsContext';
import { BrowserRouter } from 'react-router-dom';
import { KernelProvider } from './kernel/KernelProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <KernelProvider>
        <GraphicsProvider>
          <App />
        </GraphicsProvider>
      </KernelProvider>
    </BrowserRouter>
  </React.StrictMode>
);
