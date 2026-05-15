import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './assets/global.css';
// 1. MAKE SURE THIS IS IMPORTED:
import { AppProvider } from './context/AppContext.jsx' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. MAKE SURE APPPROVIDER WRAPS APP: */}
    <AppProvider>  
      <App />
    </AppProvider>
  </React.StrictMode>,
)