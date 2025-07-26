import React, { useState, useEffect, useCallback } from 'react';

const players2020_2023 = [
  { name: 'Virat Kohli', basePrice: 10 },
  { name: 'Rohit Sharma', basePrice: 9 },
  { name: 'MS Dhoni', basePrice: 11 },
  { name: 'Ravindra Jadeja', basePrice: 8 },
  { name: 'Hardik Pandya', basePrice: 10 },
  { name: 'KL Rahul', basePrice: 9 },
  { name: 'David Warner', basePrice: 9 },
  { name: 'Shubman Gill', basePrice: 8 },
  { name: 'Jasprit Bumrah', basePrice: 10 },
  { name: 'Suryakumar Yadav', basePrice: 9 },
];

const LegendaryAuction = () => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState(players2020_2023[0].basePrice);
  const [highestBidder, setHighestBidder] = useState('');
  const [timer, setTimer] = useState(10);
  const [auctionResults, setAuctionResults] = useState([]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(countdown);
          finalizeAuction();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [currentPlayerIndex]);

  const handleBid = (bidderName, bidAmount) => {
    if (bidAmount > currentBid) {
      setCurrentBid(bidAmount);
      setHighestBidder(bidderName);
      setTimer(10); // Reset timer on new bid
    }
  };

  const finalizeAuction = useCallback(() => {
    const player = players2020_2023[currentPlayerIndex];
    setAuctionResults((prevResults) => [
      ...prevResults,
      {
        player: player.name,
        soldTo: highestBidder || 'Unsold',
        price: highestBidder ? currentBid : 0,
      },
    ]);

    if (currentPlayerIndex < players2020_2023.length - 1) {
      const nextIndex = currentPlayerIndex + 1;
      setCurrentPlayerIndex(nextIndex);
      setCurrentBid(players2020_2023[nextIndex].basePrice);
      setHighestBidder('');
    } else {
      alert('Legendary Auction completed!');
    }
  }, [currentPlayerIndex, highestBidder, currentBid]);

  useEffect(() => {
    const timer = setTimeout(() => {
      finalizeAuction();
    }, 10000);

    return () => clearTimeout(timer);
  }, [finalizeAuction]);

  return (
    <div className="p-6 min-h-screen bg-white">
      <h1 className="text-2xl font-bold mb-4">🏏 Legendary Auction Live</h1>

      <div className="bg-gray-100 p-4 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold">{players2020_2023[currentPlayerIndex].name}</h2>
        <p>Base Price: ₹{players2020_2023[currentPlayerIndex].basePrice} Cr</p>
        <p>Current Bid: ₹{currentBid} Cr</p>
        <p>Highest Bidder: {highestBidder || 'No bids yet'}</p>
        <p>Time Remaining: {timer}s</p>
      </div>

      <div className="flex gap-4 mb-4">
        <button onClick={() => handleBid('Team A', currentBid + 1)} className="bg-blue-600 text-white px-4 py-2 rounded">
          Team A Bid +1 Cr
        </button>
        <button onClick={() => handleBid('Team B', currentBid + 2)} className="bg-green-600 text-white px-4 py-2 rounded">
          Team B Bid +2 Cr
        </button>
        <button onClick={() => handleBid('Team C', currentBid + 3)} className="bg-purple-600 text-white px-4 py-2 rounded">
          Team C Bid +3 Cr
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-2">Auction Results</h2>
      <ul className="list-disc pl-6">
        {auctionResults.map((result, index) => (
          <li key={index}>
            {result.player} - {result.soldTo} for ₹{result.price} Cr
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LegendaryAuction;
