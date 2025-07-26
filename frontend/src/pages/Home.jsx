import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import PlayerCard from '../components/PlayerCard';
import BiddingPanel from '../components/BiddingPanel';
import TeamSidebar from '../components/TeamSidebar';

const dummyPlayers = [
  { name: 'Virat Kohli', role: 'Batsman', basePrice: 2000000 },
  { name: 'Jasprit Bumrah', role: 'Bowler', basePrice: 1500000 },
];

const Home = () => {
  const [currentPlayer, setCurrentPlayer] = useState(null);  // Track the current player for bidding
  const [team, setTeam] = useState([]);  // Team containing selected players
  const [totalSpent, setTotalSpent] = useState(0);  // The total money spent on players

  // Function to start bidding on a player (selecting a player for bidding)
  const startBidding = (player) => {
    setCurrentPlayer(player);
  };

  // Adds player to the team and updates the total spent
  const addPlayerToTeam = (player) => {
    setTeam([...team, player]);
    setTotalSpent(totalSpent + player.basePrice);
    setCurrentPlayer(null);  // Reset the current player after adding them to the team
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="sidebar">
          <TeamSidebar team={team} totalSpent={totalSpent} />
        </div>
        <div className="main">
          {/* Iterate over dummyPlayers and allow the user to select a player for bidding */}
          {dummyPlayers.map((player, idx) => (
            <PlayerCard
              key={idx}
              player={player}
              onSelectPlayer={() => startBidding(player)}  // Selecting player for bidding
            />
          ))}
          
          {/* Display the Bidding Panel if a player is selected */}
          {currentPlayer && (
            <BiddingPanel
              player={currentPlayer}
              onAddToTeam={() => addPlayerToTeam(currentPlayer)}  // Add selected player to team
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
