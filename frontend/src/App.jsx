import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LegendaryAuction from './pages/LegendaryAuction';
import IPL2024Auction from './pages/IPL2024Auction';
import AuctionRoom from './components/AuctionRoom'; // ✅ Ensure correct path

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auction/legendary" element={<LegendaryAuction />} />
        <Route path="/auction/ipl2024" element={<IPL2024Auction />} />
        
        {/* ✅ New Route for Auction Room */}
        <Route path="/auction-room/:roomId" element={<AuctionRoom />} />      </Routes>
    </Router>
  );
};

export default App;
