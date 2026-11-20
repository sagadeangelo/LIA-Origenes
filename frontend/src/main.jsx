import React from 'react'
import {createRoot} from 'react-dom/client'
import App from './App'
import './styles/global.css'
import './styles/legacy.css'
import './styles/exhibition.css'
createRoot(document.getElementById('root')).render(<App/>)
