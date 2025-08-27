import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index'
import Marketplace from './pages/Marketplace'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/marketplace" element={<Marketplace />} />
      </Routes>
    </App>
  </BrowserRouter>
);
