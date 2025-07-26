from flask_socketio import emit, join_room
from .auction_state import auctions, initialize_auction

def register_socket_events(socketio):
    @socketio.on('join-room')
    def handle_join(data):
        room = data['roomId']
        team = data['teamName']
        join_room(room)
        
        if room not in auctions:
            auctions[room] = initialize_auction()
        
        auctions[room]['participants'].append(team)
        emit('auction-state', auctions[room], to=room)

    @socketio.on('bid')
    def handle_bid(data):
        room = data['roomId']
        team = data['teamName']
        bid_amount = data['bidAmount']

        auction = auctions.get(room)
        if auction and bid_amount > auction['currentBid']:
            auction['currentBid'] = bid_amount
            auction['highestBidder'] = team
            auction['timer'] = 10  # Reset timer
            emit('bid-update', {
                'currentBid': bid_amount,
                'highestBidder': team
            }, to=room)
