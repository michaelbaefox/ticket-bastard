import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index'
import Marketplace from './pages/Marketplace'
import Tickets from './pages/Tickets'
import Venue from './pages/Venue'
import Organizer from './pages/Organizer'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/venue" element={<Venue />} />
        <Route path="/organizer" element={<Organizer />} />
      </Routes>
    </App>
  </BrowserRouter>
);
