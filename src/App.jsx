// In App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './contexts/Web3Context';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SportEventsPage from './pages/SportEventsPage';
import TicketBookingPage from './pages/TicketBookingPage';
import PaymentPage from './pages/PaymentPage';
import MyTicketsPage from './pages/MyTicketsPage';
import ReceivePage from './pages/ReceivePage';
// Components
import Navbar from './components/Navbar';

function App() {
  return (
    <Web3Provider>
      <Router>
        <Toaster position="top-center" />
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sports/:sport" element={<SportEventsPage />} />
          <Route path="/book/:matchId" element={<TicketBookingPage />} />
          <Route path="/payment/:matchId/:quantity" element={<PaymentPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/receive" element={<ReceivePage />} />
          {/* Add a catch-all route to redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </Web3Provider>
  );
}

export default App;