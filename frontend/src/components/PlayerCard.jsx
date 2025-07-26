// src/components/PlayerCard.jsx
import React from 'react';

const PlayerCard = ({ player, onBidStart }) => {
  return (
    <div className="player-card border rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition-all">
      <h3 className="text-xl font-semibold">{player.name}</h3>
      <p className="text-sm text-gray-600">{player.role}</p>
      <p className="text-lg font-bold text-blue-600">Base Price: ${player.basePrice}</p>
      <button
        onClick={() => onBidStart(player)}
        className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-all"
      >
        Start Bidding
      </button>
    </div>
  );
};

export default PlayerCard;
