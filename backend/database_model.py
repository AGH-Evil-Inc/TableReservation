import binascii
import hashlib
import os
from flask_login import UserMixin
from extensions import db


# user = 'dawidmaz'
# password = 'i90DpoJ1ZjX4R0qQ'
# host = 'mysql.agh.edu.pl'
# port = '3306'
# database = 'dawidmaz'

# db_string = f'mysql://{user}:{password}@{host}:{port}/{database}'
# engine = create_engine(db_string)
# Base = declarative_base()

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    email = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255))
    phone_number = db.Column(db.Integer)
    is_admin = db.Column(db.Boolean)
    
    reservations = db.relationship("Reservation", back_populates="user")
    
    def __repr__(self):
        return f'User ID: {self.id}, Email: {self.email}'
    
    @staticmethod
    def get_hashed_password(password):
        """Hash a password for storing."""
        salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
        pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
        pwdhash = binascii.hexlify(pwdhash)
        return (salt + pwdhash).decode('ascii')
    
    @staticmethod
    def verify_password(stored_password_hash, provided_password):
        """Verify a stored password against one provided by user."""
        salt = stored_password_hash[:64]
        stored_password = stored_password_hash[64:]
        pwdhash = hashlib.pbkdf2_hmac(
            'sha512',
            provided_password.encode('utf-8'),
            salt.encode('ascii'),
            100000
        )
        pwdhash = binascii.hexlify(pwdhash).decode('ascii')
        return pwdhash == stored_password

class Table(db.Model):
    __tablename__ = 'tables'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    available = db.Column(db.Boolean)
    no_seats = db.Column(db.Integer)
    description = db.Column(db.Text)
    location_x = db.Column(db.Float)
    location_y = db.Column(db.Float)
    
    reservations = db.relationship("Reservation", back_populates="table")

class Reservation(db.Model):
    __tablename__ = 'reservations'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    table_id = db.Column(db.Integer, db.ForeignKey('tables.id'))
    pending = db.Column(db.Boolean)
    created_at = db.Column(db.DateTime)
    reservation_start = db.Column(db.DateTime)
    reservation_end = db.Column(db.DateTime)
    
    user = db.relationship("User", back_populates="reservations")
    table = db.relationship("Table", back_populates="reservations")



# engine.connect()
# Base.metadata.create_all(engine)

# # Populate database with sample data
# tables = pd.read_excel("SampleData.xlsx", "tables")
# users = pd.read_excel("SampleData.xlsx", "users")

# Session = sessionmaker(bind=engine)
# session = Session()

# for i, t in tables.iterrows():
#     newTableEntry = Table(available=bool(t["available"]), no_seats=t["no_seats"], description=t["description"], location_x=t["location_x"], location_y=t["location_y"])
#     session.add(newTableEntry)
#     session.commit()

# for i, u in users.iterrows():
#     newUserEntry = User(first_name=u["first_name"], last_name=u["last_name"], email=u["email"], password=u["password"], phone_number=u["phone_number"], is_admin=bool(u["is_admin"]))
#     session.add(newUserEntry)
#     session.commit()
