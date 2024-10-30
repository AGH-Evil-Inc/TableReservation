from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy_utils import database_exists, create_database

user = 'dawidmaz'
password = 'Rb5UdDfeHayfNSe2'
host = 'mysql.agh.edu.pl'
port = '3306'
database = 'dawidmaz'

db_string = f'mysql://{user}:{password}@{host}:{port}/{database}'
engine = create_engine(db_string)
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    first_name = Column(String(50))
    last_name = Column(String(50))
    email = Column(String(50))
    password = Column(String(50))
    phone_number = Column(Integer)
    is_admin = Column(Boolean)
    
    reservations = relationship("Reservation", back_populates="user")


class Reservation(Base):
    __tablename__ = 'reservations'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    table_id = Column(Integer, ForeignKey('tables.id'))
    pending = Column(Boolean)
    created_at = Column(DateTime)
    reservation_start = Column(DateTime)
    reservation_end = Column(DateTime)
    
    user = relationship("User", back_populates="reservations")
    table = relationship("Table", back_populates="reservations")


class Table(Base):
    __tablename__ = 'tables'
    
    id = Column(Integer, primary_key=True)
    available = Column(Boolean)
    no_seats = Column(Integer)
    description = Column(Text)
    location_x = Column(Float)
    location_y = Column(Float)
    
    reservations = relationship("Reservation", back_populates="table")


if not database_exists(engine.url):
    create_database(engine.url)
else:
    # Connect the database if exists.
    engine.connect()
    Base.metadata.create_all(engine)