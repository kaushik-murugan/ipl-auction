from flask_socketio import join_room, leave_room, emit
from flask import request
from app import socketio
from threading import Timer
import random
rooms = {}
bid_timers = {}
BID_TIMEOUT = 20  # seconds
BID_STEP = 10  # fixed increment for every click (₹10 lakh)

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

def end_bidding(room_id):
    if room_id not in rooms:
        return

    final_bid = rooms[room_id]['currentBid']
    winner = rooms[room_id]['highestBidder']
    current_player = rooms[room_id]['playerQueue'].pop(0) if rooms[room_id]['playerQueue'] else None

    if 'playersWon' not in rooms[room_id]:
        rooms[room_id]['playersWon'] = {}

    if winner and current_player:
        rooms[room_id]['playersWon'].setdefault(winner, []).append({
            'playerId': current_player,
            'price': final_bid
        })

    emit('bid-ended', {
        'winner': winner,
        'finalBid': final_bid,
        'playerId': current_player
    }, room=room_id)

    rooms[room_id]['currentBid'] = 0
    rooms[room_id]['highestBidder'] = ''

    if rooms[room_id]['playerQueue']:
        next_player = rooms[room_id]['playerQueue'][0]
        emit('start-auction', {'playerId': next_player}, room=room_id)
        start_bid_timer(room_id)
    else:
        emit('auction-finished', {
            'playersWon': rooms[room_id]['playersWon']
        }, room=room_id)

def start_bid_timer(room_id):
    if room_id in bid_timers and bid_timers[room_id]:
        bid_timers[room_id].cancel()
    bid_timers[room_id] = Timer(BID_TIMEOUT, lambda: end_bidding(room_id))
    bid_timers[room_id].start()

@socketio.on('create-room')
def handle_create_room(data):
    room_id = data['roomId']
    team_name = data['teamName']
    join_room(room_id)
    rooms[room_id] = {
        'currentBid': 0,
        'highestBidder': '',
        'teams': {team_name: request.sid},
        'playerQueue': [],
        'playersWon': {}
    }
    emit('room-created', {'message': 'Room created successfully'}, room=request.sid)

@socketio.on('join-auction')
def handle_join(data):
    room_id = data['roomId']
    team_name = data['teamName']
    join_room(room_id)

    if room_id not in rooms:
        emit('error', {'message': 'Room does not exist'}, room=request.sid)
        return

    rooms[room_id]['teams'][team_name] = request.sid

    emit('auction-state', {
        'currentBid': rooms[room_id]['currentBid'],
        'highestBidder': rooms[room_id]['highestBidder'],
        'playersWon': rooms[room_id]['playersWon']
    }, room=request.sid)

@socketio.on('start-auction')
def handle_start_auction(data):
    room_id = data.get('roomId')
    if room_id not in rooms:
        emit('error', {'message': 'Room does not exist'}, room=request.sid)
        return

    player = generate_player()
    rooms[room_id]['currentPlayer'] = player
    rooms[room_id]['currentBid'] = player['basePrice']
    rooms[room_id]['highestBidder'] = ""
    rooms[room_id]['bidHistory'] = []

    emit('start-auction', {
        "playerId": player['id'],
        "image": player['image'],
        "basePrice": player['basePrice'],
        "category": player['category']
    }, room=room_id)
    start_bid_timer(room_id)

@socketio.on('place-bid')
def handle_place_bid(data):
    room_id = data.get('roomId')
    bid_amount = data.get('bidAmount')
    team_name = data.get('teamName')
    print(f"[BID] {team_name} placed bid {bid_amount} in room {room_id}")
    
    # Broadcast bid to all clients in the room
    socketio.emit('bid-placed', {
        'bidAmount': bid_amount,
        'teamName': team_name
    }, room=room_id)

