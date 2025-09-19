import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { UserProvider } from './context/UserContext.jsx'
import { Auth0Provider } from './context/Auth0Context.jsx'
import registerCustomIcons from './assets/icons/registerCustomIcons.js'

registerCustomIcons();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0Provider>
        <UserProvider>
          <App />
        </UserProvider>
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>,
)
