// src/pages/AuctionPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

const AuctionPage = () => {
  const { type } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Auction: {type.toUpperCase()}</h1>
      <p>This is where the {type} auction will be implemented.</p>
    </div>
  );
};

export default AuctionPage;
