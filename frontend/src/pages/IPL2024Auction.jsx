import React, { useEffect, useState } from 'react';
import socket from '../socket';

const IPL_TEAMS = [
  'Chennai Super Kings', 'Mumbai Indians', 'Royal Challengers Bangalore',
  'Kolkata Knight Riders', 'Rajasthan Royals', 'Sunrisers Hyderabad',
  'Delhi Capitals', 'Punjab Kings', 'Lucknow Super Giants', 'Gujarat Titans'
];

const IPL2024Auction = () => {
  const [roomId, setRoomId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [joined, setJoined] = useState(false);

  const [auctionState, setAuctionState] = useState({
    player: {
      id: '',
      image: '',
      basePrice: 0,
      category: ''
    },
    currentBid: 0,
    highestBidder: '',
    timer: 20,
    auctionStarted: false,
    bidEnded: false,
    auctionPaused: false
  });

  // Restore state setters for use in socket event handlers
  const [playersWon, setPlayersWon] = useState({});
  const [bidHistory, setBidHistory] = useState([]);
  const [bidError, setBidError] = useState('');
  const [availableTeams, setAvailableTeams] = useState(IPL_TEAMS);
  const [teamsInRoom, setTeamsInRoom] = useState([]);
  const [currentCategoryCount, setCurrentCategoryCount] = useState(0);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState('');
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [bidEnded, setBidEnded] = useState(false);
  const [bidControl, setBidControl] = useState({
    canBid: true,
    bidEnded: false
  });

  // eslint-disable-next-line
  useEffect(() => {
    let interval;
    if (joined && auctionState.timer > 0 && !auctionState.bidEnded && !auctionState.auctionPaused) {
      interval = setInterval(() => {
        setAuctionState(prev => ({
          ...prev,
          timer: prev.timer - 1
        }));
      }, 1000);
    } else if (auctionState.timer === 0 && !auctionState.bidEnded) {
      socket.emit('end-bid', { roomId });
      setAuctionState(prev => ({
        ...prev,
        bidEnded: true
      }));
    }
    return () => clearInterval(interval);
  }, [auctionState.timer, joined, auctionState.bidEnded, roomId, auctionState.auctionPaused]);

  useEffect(() => {
    socket.on('admin-status', (data) => {
        setIsAdmin(data.isAdmin);
    });

    socket.on('auction-state', (data) => {
      console.log('[SOCKET] Auction State Updated:', data);
      setCurrentBid(data.currentBid);
      setHighestBidder(data.highestBidder);
      if (data.playersWon) setPlayersWon(data.playersWon);
      if (data.bidHistory) setBidHistory(data.bidHistory);
    });

    // In your socket listeners
    socket.on('bid-update', (data) => {
      setAuctionState(prev => ({
        ...prev,
        currentBid: data.currentBid,
        highestBidder: data.highestBidder
      }));
      
      setBidHistory(prev => [...prev, { 
        team: data.highestBidder, 
        amount: data.currentBid,
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on('start-auction', (data) => {
      console.log('Start auction data received:', data);
      setAuctionState(prev => ({
        ...prev,
        player: {
          id: data.playerId,
          image: data.image,
          basePrice: data.basePrice,
          category: data.category
        },
        currentBid: data.basePrice || 0,
        highestBidder: '',
        timer: 20,
        auctionStarted: true,
        bidEnded: false,
        auctionPaused: false
      }));
      setCurrentCategoryCount(data.categoryCount || 0);
      setAuctionStarted(true);
    });

    socket.on('timer-update', (data) => {
      setAuctionState(prev => ({
        ...prev,
        currentBid: data.currentBid,
        highestBidder: data.highestBidder
      }));
    });

    socket.on('player-update', (data) => {
      setAuctionState({
        player: {
          id: data.player.id,
          image: data.player.image,
          basePrice: data.player.basePrice,
          category: data.player.category
        },
        currentBid: data.currentBid,
        highestBidder: data.highestBidder,
        timer: data.timer,
        auctionStarted: true,
        bidEnded: false,
        auctionPaused: false
      });
    });

    socket.on('timer-update', (data) => {
      setAuctionState(prev => ({
        ...prev,
        timer: data.timeLeft
      }));
    });

    socket.on('pause-auction', () => {
      setAuctionState(prev => ({
        ...prev,
        auctionPaused: true
      }));
    });

    socket.on('resume-auction', () => {
      setAuctionState(prev => ({
        ...prev,
        auctionPaused: false
      }));
    });

    socket.on('bid-ended', (data) => {
      setPlayersWon(data.playersWon || {});
      setBidHistory([]); // Clear history for new player

    });

    socket.on('player-skipped', (data) => {
      console.log('Player skipped:', data);
      setBidControl(prev => ({ ...prev, bidEnded: false, canBid: true }));
    });

    socket.on('room-created', (data) => {
        console.log(`Room ${data.roomId} created successfully`);
        setIsAdmin(data.isAdmin);
    });
    
    socket.on('room-ended', (data) => {
        alert(data.message);
        if (data.roomId === roomId) {
            // Reset state if we were in this room
            setJoined(false);
            setRoomId('');
            setTeamName('');
            setIsAdmin(false);
            // Reset all auction state
            resetAuctionState();
        }
    });
    
    socket.on('error', (data) => {
        alert(data.message);
        if (data.message.includes('ended')) {
            setJoined(false);
            setRoomId('');
        }
    });

    socket.on('auction-finished', (data) => {
      if (data.playersWon) {
        setPlayersWon(data.playersWon);
      }
      alert('Auction has ended!');
    });

    socket.on('update-teams', (teams) => {
      setTeamsInRoom(teams);
      const taken = teams.map(t => t.name);
      setAvailableTeams(IPL_TEAMS.filter(team => !taken.includes(team)));
    });

    return () => {
      socket.off('auction-state');
      socket.off('bid-update');
      socket.off('start-auction');
      socket.off('pause-auction');
      socket.off('resume-auction');
      socket.off('bid-ended');
      socket.off('auction-finished');
      socket.off('update-teams');
      socket.off('admin-status');
      socket.off('room-ended');
      socket.off('timer-update');
      socket.off('player-update');
    };
  }, [roomId]);

  const handleSubmit = () => {
    if (!roomId || !teamName) return alert('Please fill all fields');
    
    if (isAdmin) {
        // Admin path - try to create room first
        socket.emit('create-room', { 
            roomId, 
            teamName 
        }, (response) => {
            if (response && response.error) {
                alert(response.error);
            } else {
                // After successful creation, join the room
                socket.emit('join-auction', { roomId, teamName }, (joinResponse) => {
                    if (joinResponse && joinResponse.error) {
                        alert(joinResponse.error);
                    } else {
                        setJoined(true);
                    }
                });
            }
        });
    } else {
        // Regular user path - just try to join
        socket.emit('join-auction', { roomId, teamName }, (response) => {
            if (response && response.error) {
                alert(response.error);
            } else {
                setJoined(true);
            }
        });
    }
  };

  const resetAuctionState = () => {
    setAuctionState({
      player: {
        id: '',
        image: '',
        basePrice: 0,
        category: ''
      },
      currentBid: 0,
      highestBidder: '',
      timer: 20,
      auctionStarted: false,
      bidEnded: false,
      auctionPaused: false
    });
    setPlayersWon({});
    setBidHistory([]);
    setCurrentCategoryCount(0);
  };
  
  const handlePlaceBid = () => {
    if (!auctionState.auctionStarted || auctionState.auctionPaused) {
      alert("Cannot place bid right now");
      return;
    }

    // Calculate new bid amount
    const bidAmount = auctionState.currentBid + 10; // Standard IPL increment
    
    socket.emit('place-bid', { 
      roomId, 
      teamName,
      bidAmount 
    }, (response) => {
      if (response?.error) {
        setBidError(response.error);
        setTimeout(() => setBidError(''), 3000);
      }
    });
  };

  const handleStartAuction = () => {
    socket.emit('start-auction', { 
      roomId, 
      teamName  // Make sure this is included
    }, (response) => {
      if (response?.error) {
        setBidError(response.error);
        setTimeout(() => setBidError(''), 3000);
      } else {
        setAuctionState(prev => ({
          ...prev,
          auctionStarted: true,
          bidEnded: false
        }));
      }
    });
  };

  // In IPL2024Auction.jsx, modify the handleEndBid function:
  const handleEndBid = () => {
    socket.emit('end-bid', { 
      roomId, 
      teamName 
    });
  };

  const handleKickTeam = (teamToKick) => {
    socket.emit('kick-team', { roomId, teamName: teamToKick });
  };

  const handlePauseAuction = () => {
    socket.emit('pause-auction', { roomId });
  };

  const handleResumeAuction = () => {
    socket.emit('resume-auction', { roomId });
  };

  const handleSkipPlayer = () => {
    socket.emit('skip-player', { roomId });
  };

  const handleNextCategory = () => {
    socket.emit('next-category', { roomId });
    setCurrentCategoryCount(0);
  };

  const playSound = () => {
    // const audio = new Audio('/notification.mp3');
    // audio.play();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] via-[#e8eaf6] to-[#e3e0f3] flex flex-col items-center justify-start py-10 px-2">
      {!joined ? (
        <div className="mb-4 bg-gradient-to-br from-[#f7fafc] via-[#e3e0f3] to-[#f5f7fa] shadow-2xl rounded-2xl p-10 w-full max-w-md flex flex-col items-center border border-[#e0d7f3]">
          <h2 className="text-4xl font-extrabold mb-8 text-[#5a189a] tracking-wide drop-shadow-lg font-serif uppercase">IPL 2024 Auction Room</h2>
          <input
            type="text"
            placeholder="Enter Room ID (e.g., ipl2024)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="border-2 border-[#b8b5d1] bg-[#f8f7fa] rounded-lg px-4 py-2 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-[#a084ca] text-lg transition"
          />
          <select
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="border-2 border-[#b8b5d1] bg-[#f8f7fa] rounded-lg px-4 py-2 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-[#a084ca] text-lg transition"
          >
            <option value="">Select Team</option>
            {availableTeams.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
          <div className="mb-4 flex items-center w-full">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={() => setIsAdmin(!isAdmin)}
              className="mr-2 accent-[#7b2ff2] scale-125 focus:ring-2 focus:ring-[#a084ca]"
              id="adminCheck"
            />
            <label htmlFor="adminCheck" className="text-[#5a189a] font-medium select-none cursor-pointer text-lg">
              I am the Admin (Room Creator)
            </label>
          </div>
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-[#7b2ff2] to-[#f357a8] text-white px-8 py-3 rounded-xl shadow-lg hover:from-[#5a189a] hover:to-[#f357a8] hover:scale-105 transition w-full font-bold text-xl tracking-wide border-2 border-transparent hover:border-[#a084ca]"
          >
            {isAdmin ? 'Create and Join Room' : 'Join Room'}
          </button>
        </div>
      ) : (
        <div className="auction-area bg-gradient-to-br from-[#f7fafc] via-[#e3e0f3] to-[#f5f7fa] shadow-2xl rounded-2xl p-12 w-full max-w-2xl flex flex-col items-center border border-[#e0d7f3]">
          <h2 className="text-3xl font-extrabold mb-2 text-[#7b2ff2] drop-shadow-lg tracking-wide font-serif">Room: {roomId}</h2>
          <p className="text-lg mb-6">Your Team: <span className="font-bold text-[#5a189a]">{teamName}</span></p>

          {auctionState.auctionStarted && (
            <div className="mb-8 w-full flex flex-col md:flex-row md:items-center md:space-x-8">
              {auctionState.player.id ? (
                <>
                  <div className="flex-1 flex flex-col items-center md:items-start mb-4 md:mb-0">
                    <p className="text-lg mb-1">Current Player: <span className="font-bold text-[#22223b] text-xl tracking-wide">{auctionState.player.id}</span></p>
                    <p className="text-lg mb-1">Base Price: <span className="font-semibold text-[#43aa8b]">₹{auctionState.player.basePrice} Lakhs</span></p>
                    <p className="text-lg mb-1">Category: <span className="font-semibold text-[#7b2ff2]">{auctionState.player.category}</span></p>
                  </div>
                  <img 
                    src={auctionState.player.image} 
                    alt={auctionState.player.id} 
                    className="w-36 h-36 object-cover rounded-2xl border-4 border-[#a084ca] shadow-xl bg-white"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=Player'}
                  />
                </>
              ) : (
                <p className="text-lg text-yellow-600">Waiting for next player...</p>
              )}
              <div className="timer-display bg-gradient-to-r from-[#fffbe7] to-[#f7e7ff] p-6 rounded-2xl shadow-lg ml-0 md:ml-8 mt-4 md:mt-0 flex flex-col items-center border border-[#ffe5ec]">
                <p className="text-2xl font-extrabold text-[#7b2ff2] tracking-wider">
                  {auctionState.auctionStarted ? (
                    auctionState.auctionPaused ? (
                      "⏸ Auction Paused"
                    ) : (
                      "⏳ Bidding Active"
                    )
                  ) : (
                    "🕒 Waiting to Start"
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:space-x-8 w-full mb-4">
            <p className="text-lg mb-2 flex-1">Current Bid: <span className="font-bold text-[#43aa8b] text-xl">₹{auctionState.currentBid} Lakhs</span></p>
            <p className="text-lg mb-2 flex-1">Highest Bidder: <span className="font-bold text-[#7b2ff2] text-xl">{auctionState.highestBidder || 'No bids yet'}</span></p>
          </div>

          {bidError && (
            <div className="text-[#f357a8] mb-2 p-2 bg-[#fff0f6] rounded-xl shadow text-center font-semibold border border-[#f357a8] animate-pulse">
              {bidError}
            </div>
          )}

          {auctionState.auctionStarted && (
            <button
              onClick={handlePlaceBid}
              disabled={
                teamName === auctionState.highestBidder || 
                auctionState.bidEnded || 
                auctionState.auctionPaused
              }
              className={`w-full md:w-auto mt-2 md:mt-0 px-10 py-4 rounded-2xl font-bold text-xl shadow-xl transition
                ${teamName === auctionState.highestBidder || auctionState.bidEnded || auctionState.auctionPaused
                  ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#43aa8b] to-[#7b2ff2] hover:from-[#7b2ff2] hover:to-[#43aa8b] text-white hover:scale-105 border-2 border-transparent hover:border-[#f357a8]'}
              `}
            >
              Place Bid (+₹10L) - Current: ₹{auctionState.currentBid}L
            </button>
          )}
          
          {isAdmin && (
            <div className="mt-10 w-full flex flex-col items-center">
              <div className="flex flex-wrap gap-6 justify-center w-full mb-6">
                {!auctionState.auctionStarted ? (
                  <button
                    onClick={handleStartAuction}
                    className="bg-gradient-to-r from-[#7b2ff2] to-[#f357a8] text-white px-8 py-3 rounded-xl shadow-lg hover:from-[#5a189a] hover:to-[#f357a8] hover:scale-105 font-bold text-xl border-2 border-transparent hover:border-[#a084ca] transition"
                  >
                    Start Auction
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleEndBid}
                      className="bg-gradient-to-r from-[#f357a8] to-[#7b2ff2] text-white px-8 py-3 rounded-xl shadow-lg font-bold text-xl hover:from-[#7b2ff2] hover:to-[#f357a8] hover:scale-105 border-2 border-transparent hover:border-[#f357a8] transition"
                    >
                      End Current Bid
                    </button>
                    <button
                      onClick={handleSkipPlayer}
                      className="bg-gradient-to-r from-[#f357a8] to-[#7b2ff2] text-white px-8 py-3 rounded-xl shadow-lg font-bold text-xl hover:from-[#7b2ff2] hover:to-[#f357a8] hover:scale-105 border-2 border-transparent hover:border-[#f357a8] transition"
                    >
                      Skip Player
                    </button>
                    {auctionState.auctionPaused ? (
                      <button
                        onClick={handleResumeAuction}
                        className="bg-gradient-to-r from-[#43aa8b] to-[#7b2ff2] text-white px-8 py-3 rounded-xl shadow-lg font-bold text-xl hover:from-[#7b2ff2] hover:to-[#43aa8b] hover:scale-105 border-2 border-transparent hover:border-[#f357a8] transition"
                      >
                        Resume Auction
                      </button>
                    ) : (
                      <button
                        onClick={handlePauseAuction}
                        className="bg-gradient-to-r from-[#ffe066] to-[#f7e7ff] text-[#7b2ff2] px-8 py-3 rounded-xl shadow-lg font-bold text-xl hover:from-[#ffe066] hover:to-[#f357a8] hover:text-white border-2 border-transparent hover:border-[#f357a8] transition"
                      >
                        Pause Auction
                      </button>
                    )}
                    {currentCategoryCount >= 15 && (
                      <button
                        onClick={handleNextCategory}
                        className="bg-gradient-to-r from-[#a084ca] to-[#7b2ff2] text-white px-8 py-3 rounded-xl shadow-lg font-bold text-xl hover:from-[#7b2ff2] hover:to-[#a084ca] hover:scale-105 border-2 border-transparent hover:border-[#f357a8] transition"
                      >
                        Next Category
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => socket.emit('end-room', { roomId, teamName })}
                  className="bg-gradient-to-r from-[#f357a8] to-[#7b2ff2] text-white px-8 py-3 rounded-xl shadow-lg font-bold text-xl hover:from-[#7b2ff2] hover:to-[#f357a8] hover:scale-105 border-2 border-transparent hover:border-[#a084ca] transition"
                >
                  End Room
                </button>
              </div>
              <div className="w-full">
                <h4 className="font-semibold mb-2 text-[#5a189a] text-lg">Kick Team:</h4>
                <div className="flex flex-wrap gap-3">
                  {teamsInRoom.map((teamObj, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleKickTeam(teamObj.name)}
                      className="bg-gradient-to-r from-[#f357a8] to-[#7b2ff2] text-white px-4 py-2 rounded-lg shadow hover:from-[#7b2ff2] hover:to-[#f357a8] font-medium border-2 border-transparent hover:border-[#a084ca] transition"
                    >
                      Kick {teamObj.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 w-full">
            <h3 className="text-xl font-bold mb-3 text-[#5a189a] tracking-wide">📝 Bid History:</h3>
            <ul className="list-disc list-inside bg-gradient-to-r from-[#f8f7fa] to-[#e3e0f3] rounded-2xl p-6 shadow-lg min-h-[48px] border border-[#e0d7f3]">
              {bidHistory.length === 0 ? (
                <li className="text-gray-400 italic">No bids yet.</li>
              ) : (
                bidHistory.map((bid, idx) => (
                  <li key={idx} className="mb-1 text-[#7b2ff2] text-lg">
                    <span className="font-semibold text-[#5a189a]">{bid.team}</span> bid <span className="font-semibold text-[#43aa8b]">₹{bid.amount}L</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="mt-10 w-full">
            <h3 className="text-xl font-bold mb-3 text-[#5a189a] tracking-wide">Players Bought:</h3>
            <ul className="list-disc list-inside bg-gradient-to-r from-[#f8f7fa] to-[#e3e0f3] rounded-2xl p-6 shadow-lg min-h-[48px] border border-[#e0d7f3]">
              {Object.keys(playersWon).length === 0 ? (
                <li className="text-gray-400 italic">No players bought yet.</li>
              ) : (
                Object.entries(playersWon).map(([team, players]) => (
                  <li key={team} className="mb-1 text-lg">
                    <span className="font-bold text-[#7b2ff2]">{team}</span>: {players.map((p, idx) => (
                      <span key={idx} className="text-[#22223b]">
                        {p.playerId} (₹{p.price}L){idx < players.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="mt-10 w-full">
            <h3 className="text-xl font-bold mb-3 text-[#5a189a] tracking-wide">👥 Teams in Room:</h3>
            <ul className="list-disc list-inside bg-gradient-to-r from-[#f8f7fa] to-[#e3e0f3] rounded-2xl p-6 shadow-lg min-h-[48px] border border-[#e0d7f3]">
              {teamsInRoom.length === 0 ? (
                <li className="text-gray-400 italic">No teams joined yet.</li>
              ) : (
                teamsInRoom.map((teamObj, idx) => (
                  <li key={idx} className="text-[#7b2ff2] font-bold text-lg">{teamObj.name}</li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPL2024Auction;