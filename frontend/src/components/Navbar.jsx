// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 p-4 text-white">
      <div className="flex justify-between items-center">
        <Link to="/" className="text-2xl font-semibold">IPL Auction</Link>
        <div className="space-x-4">
          <Link to="/signup" className="hover:underline">Sign Up</Link>
          <Link to="/login" className="hover:underline">Login</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
