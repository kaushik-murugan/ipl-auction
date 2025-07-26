from extensions import db

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    base_price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50))
    image = db.Column(db.String(255))

class Bid(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    bidder = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    player = db.relationship('Player', backref=db.backref('bids', lazy=True))

class Team(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    budget = db.Column(db.Float, nullable=False)
