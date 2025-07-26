auctions = {}

def initialize_auction():
    return {
        'currentPlayerIndex': 0,
        'currentBid': 10,
        'highestBidder': '',
        'timer': 10,
        'auctionResults': [],
        'participants': []
    }
