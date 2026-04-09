import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/global.css';
import App from './App';

document.documentElement.setAttribute('data-theme', 'light');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
