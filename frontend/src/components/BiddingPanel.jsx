// src/components/BiddingPanel.jsx
import React, { useState } from 'react';

const BiddingPanel = ({ player }) => {
  const [currentBid, setCurrentBid] = useState(player.basePrice);
  const [bid, setBid] = useState(player.basePrice);

  const handleBidChange = (e) => {
    setBid(Number(e.target.value));
  };

  const placeBid = () => {
    if (bid > currentBid) {
      setCurrentBid(bid);
    } else {
      alert("Bid must be higher than the current bid");
    }
  };

  return (
    <div className="bidding-panel p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold text-center mb-4">Bidding for {player.name}</h3>
      <div className="text-center mb-4">
        <p className="text-lg">Current Bid: ${currentBid}</p>
      </div>
      <input
        type="number"
        value={bid}
        onChange={handleBidChange}
        className="border p-2 rounded mb-4 w-full"
      />
      <button
        onClick={placeBid}
        className="bg-green-600 text-white py-2 px-4 rounded w-full hover:bg-green-700 transition-all"
      >
        Place Bid
      </button>
    </div>
  );
};

export default BiddingPanel;
