// src/pages/Dashboard.js

import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleAuctionSelect = (type) => {
    if (type === 'mega') {
      navigate(`/auction/mega`);  // Navigate to MegaAuction
    } else {
      navigate(`/auction/${type}`);
    }
  };
  

  // IPL 2024 Official 10 Teams
  const teams = [
    'Chennai Super Kings',
    'Mumbai Indians',
    'Royal Challengers Bangalore',
    'Kolkata Knight Riders',
    'Rajasthan Royals',
    'Sunrisers Hyderabad',
    'Lucknow Super Giants',
    'Gujarat Titans',
    'Punjab Kings',
    'Delhi Capitals',
  ];
  // Dummy auction history (to be replaced with real DB later)
  const mockHistory = [
    {
      id: 1,
      type: 'IPL 2024 Auction',
      date: '2025-05-01',
      team: 'Mumbai Indians',
      budget: '₹92 Cr',
      players: 16,
    },
    {
      id: 2,
      type: 'Mega Auction',
      date: '2025-04-10',
      team: 'Royal Challengers Bangalore',
      budget: '₹85 Cr',
      players: 14,
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">🏏 Auction Dashboard</h1>

      {/* Auction Selection */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Select Auction Type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {['mega', 'ipl2024', 'ipl2023', 'ipl2022', 'ipl2021', 'ipl2020'].map((type) => (
            <button
              key={type}
              onClick={() => handleAuctionSelect(type)}
              className="bg-blue-600 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {type === 'mega'
                ? 'Mega Auction'
                : `IPL ${type.replace('ipl', '')} Auction`}
            </button>
          ))}
        </div>
      </div>

      {/* Auction History */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">📜 Your Auction History</h2>
        {mockHistory.length === 0 ? (
          <p>No auction history yet. Start bidding now!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-4 py-2">Auction Type</th>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Team</th>
                  <th className="border px-4 py-2">Budget Used</th>
                  <th className="border px-4 py-2">Players Bought</th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border px-4 py-2">{entry.type}</td>
                    <td className="border px-4 py-2">{entry.date}</td>
                    <td className="border px-4 py-2">{entry.team}</td>
                    <td className="border px-4 py-2">{entry.budget}</td>
                    <td className="border px-4 py-2">{entry.players}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
