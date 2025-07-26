// src/components/TeamSidebar.jsx
import React from 'react';

const TeamSidebar = ({ team, totalSpent }) => {
  return (
    <div className="team-sidebar bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold text-center mb-4">Your Team</h3>
      <div className="mb-4">
        <p className="text-lg font-semibold">Total Spent: ${totalSpent}</p>
      </div>
      <ul>
        {team.map((player, idx) => (
          <li key={idx} className="mb-2 text-lg">{player.name} - ${player.price}</li>
        ))}
      </ul>
    </div>
  );
};

export default TeamSidebar;
