from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room, rooms as socketio_rooms
from flask_cors import CORS
import random
from datetime import datetime
from threading import Timer
from flask import copy_current_request_context

auction_timers = {}
room_admins = {}
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
ended_rooms=set()
rooms = {}
active_rooms=set()

players = [
    {
        "playerId": "Virat Kohli",
        "image": "https://example.com/virat.jpg",
        "basePrice": 200,
        "category": "Batsman"
    },
    {
        "playerId": "Jasprit Bumrah",
        "image": "https://example.com/bumrah.jpg",
        "basePrice": 150,
        "category": "Bowler"
    },
]
room_data={}
room_state = {}

def generate_player():
    if not players:
        return None
    return players.pop(0) 

def start_auction_for_room(room_id):
    room = room_data.get(room_id)
    if not room:
        return

    player = generate_player()
    if not player:
        # No more players left
        socketio.emit('auction-finished', {
            'playersWon': room.get('playersWon', {})
        }, room=room_id)
        return

    # Initialize auction state for new player
    room.update({
        'currentPlayer': player,
        'currentBid': player['basePrice'],
        'highestBidder': "",
        'bidHistory': [],
        'timer': 1,
        'bidEnded': False
    })

    # Start the timer
    start_auction_timer(room_id)

    # Emit new player data
    socketio.emit('player-update', {
        'player': player,
        'currentBid': player['basePrice'],
        'highestBidder': "",
        'timer': 1
    }, room=room_id)

def end_bid(room_id):
    room = room_data.get(room_id)
    if not room:
        return

    player = room.get('currentPlayer')
    winner = room.get('highestBidder')
    price = room.get('currentBid')

    if winner and player:
        if winner not in room['playersWon']:
            room['playersWon'][winner] = []
        room['playersWon'][winner].append({
            "playerId": player['id'],
            "price": price
        })

    socketio.emit('bid-ended', {
        "playersWon": room.get('playersWon', {}),
        "player": player,
        "winner": winner,
        "price": price
    }, room=room_id)

    # Start next player
    start_auction_for_room(room_id)

def start_timer_countdown(room_id):
    room = room_data.get(room_id)
    if not room:
        return

    @copy_current_request_context
    def update():
        nonlocal room_id
        room = room_data.get(room_id)
        if not room:
            return

        if room['timer'] > 0:
            room['timer'] -= 1
            socketio.emit('timer-update', {
                'timeLeft': room['timer'],
                'currentBid': room['currentBid'],
                'highestBidder': room['highestBidder']
            }, room=room_id)

            if room['timer'] > 0:
                socketio.start_background_task(lambda: socketio.sleep(1) or update())
        else:
            auction_timeout(room_id)

    socketio.start_background_task(update)

def is_room_active(room_id):
    return room_id in active_rooms

def generate_player():
    player_id = f"Player{random.randint(1, 1000)}"
    image = f"https://via.placeholder.com/100?text={player_id}"
    base_price = random.randint(10, 60)
    category = random.choice(["Batsman", "Bowler", "All-rounder"])
    return {
        "id": player_id,
        "image": image,
        "basePrice": base_price,
        "category": category
    }

@socketio.on('create-room')
def handle_create_room(data):
    room_id = data['roomId']
    team_name = data['teamName']
    
    if room_id in active_rooms:
        emit('error', {
            'message': f'Room {room_id} is already active. Please choose a different ID.'
        }, room=request.sid)
        return
    
    # Initialize new room
    room_data[room_id] = {
        "teams": [],
        "playersWon": {},
        "currentBid": 0,
        "highestBidder": "",
        "currentPlayer": None,
        "bidHistory": [],
        "players": [],
        "admin": team_name  # Make sure admin is set here
    }
    room_admins[room_id] = team_name  # And here
    active_rooms.add(room_id)
    
    emit('room-created', {
        'roomId': room_id,
        'isAdmin': True
    }, room=request.sid)

@socketio.on('join-auction')
def handle_join(data):
    room_id = data['roomId']
    team_name = data['teamName']
    
    if room_id not in active_rooms:
        emit('error', {
            'message': f'Room {room_id} is not active or has ended'
        }, room=request.sid)
        return
    
    join_room(room_id)  # This uses Socket.IO's room functionality
    
    if team_name not in [t['name'] for t in room_data[room_id]['teams']]:
        room_data[room_id]['teams'].append({"name": team_name})
    
    emit('update-teams', room_data[room_id]['teams'], room=room_id)
    emit('admin-status', {
        'isAdmin': room_admins.get(room_id) == team_name
    }, room=request.sid)
    
@socketio.on('kick-team')
def handle_kick(data):
    room_id = data['roomId']
    team_name = data['teamName']
    room = rooms.get(room_id)
    if room:
        room['teams'] = [t for t in room['teams'] if t['name'] != team_name]
        emit('update-teams', room['teams'], room=room_id)


def start_auction_timer(room_id):
    """Start a persistent timer that just shows auction is active"""
    room = room_data.get(room_id)
    if not room:
        return

    # Cancel any existing timer
    if room_id in auction_timers:
        auction_timers[room_id].cancel()

    # Set timer to 1 to indicate active auction
    room['timer'] = 1
    
    # Emit the initial timer state
    socketio.emit('timer-update', {
        'timeLeft': room['timer'],
        'currentBid': room['currentBid'],
        'highestBidder': room['highestBidder']
    }, room=room_id)

def auction_timeout(room_id):
    print(f"Auction timeout in room {room_id}. Skipping player.")
    
    room = rooms.get(room_id)
    if not room:
        return

    player = room.get('currentPlayer')
    winner = room.get('highestBidder')
    price = room.get('currentBid')

    if winner:
        if winner not in room['playersWon']:
            room['playersWon'][winner] = []
        room['playersWon'][winner].append({
            "playerId": player['id'],
            "price": price
        })
    socketio.emit('timer-update', {'timeLeft': 0}, room=room_id)
    socketio.emit('bid-ended', {
        "playersWon": room['playersWon']
    }, room=room_id)

    # Optional: notify that player was skipped
    socketio.emit('player-skipped', {'playerId': player['id']}, room=room_id)

    # Start next player
    skip_player(room_id)
    
def load_next_player(room_id):
    room = rooms.get(room_id)
    if not room:
        return

    # Get next player from your player list
    if not room['players']:
        print(f"[END] All players auctioned in room {room_id}")
        socketio.emit('auction-finished', {
            'playersWon': room['players_won']
        }, room=room_id)
        return

    player = room['players'].pop(0)
    room['current_player'] = player
    room['timer'] = 20
    room['bid_history'] = []
    room['current_bid'] = player['base_price']
    room['highest_bidder'] = None

    print(f"[SKIP] New player started in room {room_id}: {player['id']}")

    # 🔥 Emit to frontend
    socketio.emit('start-auction', {
        'playerId': player['id'],
        'image': player['image'],
        'basePrice': player['base_price'],
        'category': player['category'],
        'categoryCount': room['current_category_count']
    }, room=room_id)

def skip_player(room_id):
    """Skip the current player and move to next one"""
    room = room_data.get(room_id)
    if not room:
        return

    # Cancel any running timer
    if room_id in auction_timers:
        auction_timers[room_id].cancel()

    # Generate new player
    player = generate_player()
    if not player:
        # No more players left
        socketio.emit('auction-finished', {
            'playersWon': room.get('playersWon', {})
        }, room=room_id)
        return

    # Update room state
    room.update({
        'currentPlayer': player,
        'currentBid': player['basePrice'],
        'highestBidder': "",
        'bidHistory': [],
        'timer': 1,  # Just to show it's running
        'bidEnded': False
    })

    # Start the timer (which will just keep running)
    start_auction_timer(room_id)

    socketio.emit('player-skipped', {
        'message': f"Player {player['id']} was skipped"
    }, room=room_id)

    socketio.emit('start-auction', {
        'playerId': player['id'],
        'image': player['image'],
        'basePrice': player['basePrice'],
        'category': player['category']
    }, room=room_id)

def update_timer(room_id):
    room = rooms.get(room_id)
    if not room or room['timer'] <= 0:
        return
    
    room['timer'] -= 1
    socketio.emit('timer-update', {'timeLeft': room['timer']}, room=room_id)
    
    if room['timer'] > 0:
        # Schedule next update in 1 second
        timer = Timer(1.0, update_timer, [room_id])
        auction_timers[room_id] = timer
        timer.start()
        
@socketio.on('start-auction')
def handle_start_auction(data):
    room_id = data.get('roomId')
    team_name = data.get('teamName')
    
    # Verify admin privileges using room_admins
    if room_id not in room_admins or room_admins[room_id] != team_name:
        emit('error', {'message': 'Admin privileges required to start auction'}, room=request.sid)
        return

    room = room_data.get(room_id)
    if not room:
        emit('error', {'message': 'Room not found'}, room=request.sid)
        return

    # Generate new player
    player = generate_player()
    if not player:
        emit('auction-finished', {
            'playersWon': room.get('playersWon', {})
        }, room=room_id)
        return
    
    # Initialize auction state
    room.update({
        'currentPlayer': player,
        'currentBid': player['basePrice'],
        'highestBidder': "",
        'bidHistory': [],
        'timer': 1,  # Persistent timer
        'auctionStarted': True,
        'bidEnded': False,
        'auctionPaused': False
    })

    # Start the persistent timer
    start_auction_timer(room_id)

    # Emit to all clients
    emit('start-auction', {
        'playerId': player['id'],
        'image': player['image'],
        'basePrice': player['basePrice'],
        'category': player['category']
    }, room=room_id)
    
@socketio.on('place-bid')
def handle_place_bid(data):
    room_id = data.get('roomId')
    team_name = data.get('teamName')
    bid_amount = int(data.get('bidAmount', 0))
    
    if not all([room_id, team_name, bid_amount]):
        emit('error', {'message': 'Missing required fields'}, room=request.sid)
        return
        
    room = room_data.get(room_id)
    if not room:
        emit('error', {'message': 'Room not found'}, room=request.sid)
        return
        
    # Validation checks
    if not room.get('currentPlayer'):
        emit('error', {'message': 'No player being auctioned'}, room=request.sid)
        return
        
    current_bid = room['currentBid']
    if bid_amount <= current_bid:
        emit('error', {
            'message': f'Bid must be higher than ₹{current_bid}L (Your bid: ₹{bid_amount}L)'
        }, room=request.sid)
        return
        
    # Update room state
    room['currentBid'] = bid_amount
    room['highestBidder'] = team_name
    room['bidHistory'].append({
        'team': team_name,
        'amount': bid_amount,
        'timestamp': datetime.now().isoformat()
    })
    
    # Broadcast update to all clients
    emit('bid-update', {
        'currentBid': bid_amount,
        'highestBidder': team_name,
        'timer': room['timer']  # Keep sending timer value
    }, room=room_id)
    
def start_timer_countdown(room_id):
    room = room_data.get(room_id)
    if not room:
        return
    
    if room['timer'] > 0:
        room['timer'] -= 1
        emit('timer-update', {'timeLeft': room['timer']}, room=room_id)
        
        # Schedule next update in 1 second if timer still running
        if room['timer'] > 0:
            timer = Timer(1.0, start_timer_countdown, [room_id])
            auction_timers[room_id] = timer
            timer.start()

@socketio.on('end-bid')
def handle_end_bid(data):
    room_id = data.get('roomId')
    team_name = data.get('teamName')
    
    if not room_id:
        emit('error', {'message': 'Room ID required'}, room=request.sid)
        return

    room = room_data.get(room_id)
    if not room:
        emit('error', {'message': 'Room not found'}, room=request.sid)
        return

    # Verify admin privileges
    if room_admins.get(room_id) != team_name:
        emit('error', {'message': 'Admin privileges required to end bid'}, room=request.sid)
        return

    player = room.get('currentPlayer')
    winner = room.get('highestBidder')
    price = room.get('currentBid')

    if winner and player:
        # Player sold to highest bidder
        if winner not in room['playersWon']:
            room['playersWon'][winner] = []
        room['playersWon'][winner].append({
            "playerId": player['id'],
            "price": price,
            "name": player.get('name', player['id']),
            "image": player['image']
        })
        message = f"{player['id']} sold to {winner} for ₹{price}L"
    else:
        # Player unsold
        message = f"{player['id']} went unsold"
    
    # Cancel any running timer
    if room_id in auction_timers:
        auction_timers[room_id].cancel()

    # Emit bid ended first
    socketio.emit('bid-ended', {
        "message": message,
        "playersWon": room.get('playersWon', {}),
        "player": player,
        "winner": winner,
        "price": price
    }, room=room_id)

    # Then immediately start next player
    start_auction_for_room(room_id)

@socketio.on('check-room')
def handle_check_room(data):
    def callback(exists):
        emit('room-exists', {'exists': exists}, room=request.sid)
    
    room_id = data['roomId']
    callback(room_id in rooms)  # Returns True if room exists, False if ended

@socketio.on('skip-player')
def handle_skip_player(data):
    room_id = data['roomId']
    print(f"[MANUAL SKIP] Player manually skipped in room {room_id}")
    skip_player(room_id)

@socketio.on('pause-auction')
def handle_pause(data):
    room_id = data['roomId']
    print(f"[PAUSE] Auction paused in room {room_id}")
    emit('pause-auction', room=room_id)

@socketio.on('resume-auction')
def handle_resume(data):
    room_id = data['roomId']
    print(f"[RESUME] Auction resumed in room {room_id}")
    emit('resume-auction', room=room_id)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5000)