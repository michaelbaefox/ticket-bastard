import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Index from './pages/Index.tsx'
import NotFound from './pages/NotFound.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/marketplace" element={<div>Marketplace Page</div>} />
        <Route path="/tickets" element={<div>My Tickets Page</div>} />
        <Route path="/venue" element={<div>Venue Page</div>} />
        <Route path="/organizer" element={<div>Organizer Page</div>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </App>
  </BrowserRouter>
);