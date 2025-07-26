from app import app, db
from models import Player

with app.app_context():
    # Create tables (if not already created)
    db.create_all()

    # Add sample players
    p1 = Player(name="Virat Kohli", base_price=200, category="Batsman", image="kohli.jpg")
    p2 = Player(name="Jasprit Bumrah", base_price=150, category="Bowler", image="bumrah.jpg")
    
    db.session.add_all([p1, p2])
    db.session.commit()

    print("Sample players added successfully.")
