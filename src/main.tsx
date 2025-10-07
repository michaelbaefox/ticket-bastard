import { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoadingScreen from './components/LoadingScreen'

const Index = lazy(() => import('./pages/Index'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const Tickets = lazy(() => import('./pages/Tickets'))
const Venue = lazy(() => import('./pages/Venue'))
const Organizer = lazy(() => import('./pages/Organizer'))
const NotFound = lazy(() => import('./pages/NotFound'))

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/venue" element={<Venue />} />
          <Route path="/organizer" element={<Organizer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </App>
  </BrowserRouter>
);
