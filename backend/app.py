import yaml
from flask import Flask, request, jsonify
from flask_restx import Api, Resource, fields
from flask_cors import CORS
import jwt
import datetime
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user, fresh_login_required
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Integer, String, Boolean
import os
import binascii
import hashlib

app = Flask(__name__)
CORS(app)

# Koniguracja skretnego klucz i bazy danych
app.config.from_pyfile('config.cfg')
# Przekazanie że baza danych będzie w postaci SQLAlchemy
db = SQLAlchemy(app)

# Stworzenie Login managera do obsługi Logowania itp.
login_manager = LoginManager(app)
login_manager.login_view = 'api.login'

# Konfiguracja API
api = Api(app, version='1.0', title='Authentication API', description='API for user authentication (registration and login)')
ns = api.namespace('api', description='Authentication operations')

# Prosta baza danych użytkowników (przykład)
users_db = {}

# Wczytanie schematu z pliku YAML
with open('../apispecification/defs/auth/User.yaml', 'r') as file:
    user_schema = yaml.safe_load(file)

# Dynamiczne tworzenie modelu
user_model = api.schema_model('User', user_schema)


# User model for SQLAlchemy
class User(db.Model, UserMixin):
    id = db.Column(Integer, primary_key=True)
    first_name = db.Column(String(50))
    last_name = db.Column(String(50))
    password = db.Column(String(100))
    is_admin = db.Column(Boolean, default=False)

    def __repr__(self):
        return f'User: {self.name}, {self.first_name}'

    @staticmethod
    def get_hashed_password(password):
        """Hash a password for storing."""
        salt = hashlib.sha256(os.urandom(60)).hexdigest().encode('ascii')
        pwdhash = hashlib.pbkdf2_hmac('sha512', password.encode('utf-8'), salt, 100000)
        pwdhash = binascii.hexlify(pwdhash)
        return (salt + pwdhash).decode('ascii')

    @staticmethod
    def verify_password(stored_password_hash, provided_password):
        """Verify a stored password against one provided by user"""
        salt = stored_password_hash[:64]
        stored_password = stored_password_hash[64:]
        pwdhash = hashlib.pbkdf2_hmac('sha512', provided_password.encode('utf-8'), salt.encode('ascii'), 100000)
        pwdhash = binascii.hexlify(pwdhash).decode('ascii')
        return pwdhash == stored_password


# User loader callback for flask_login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Ścieżka inicjalizująca bazę danych w MySQL
@ns.route('/init')
def init():
    db.create_all()

    admin = User.query.filter_by(name='admin').first()
    if admin is None:
        admin = User(id=1, name='admin', password=User.get_hashed_password(
            '1234'), first_name='King', last_name='Kong',is_admin=True)
        db.session.add(admin)
        db.session.commit()

    return {'message': 'Initial configuration done!'}, 200


# Rejestracja nowego użytkownika
@ns.route('/register')
class Register(Resource):

    @ns.expect(db.Query.filter_by)
    @ns.response(201, 'User created successfully')
    @ns.response(400, 'Invalid input')
    def post(self):
        data = request.get_json()
        id = data.get('id')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        password = data.get('password')
        is_admin = data.get("is_admin")

        if not id or not password:
            return {'message': 'Invalid input'}, 400

        if id in users_db:
            return {'message': 'User already exists'}, 400
        
        # Tworzenie nowego usera
        hashed_password = User.get_hashed_password(password)
        new_user = User(password=hashed_password, last_name=last_name)
        db.session.add(new_user)
        db.session.commit()

        return {'message': 'User created successfully'}, 201

# Logowanie użytkownika
@ns.route('/login')
class Login(Resource):
    @ns.expect(user_model)
    @ns.response(200, 'Login successful')
    @ns.response(400, 'Invalid input')
    @ns.response(401, 'Invalid credentials')
    def post(self):
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return {'message': 'Invalid input'}, 400

        if users_db.get(username) != password:
            return {'message': 'Invalid credentials'}, 401

        # Generowanie JWT tokena
        token = jwt.encode({
            'username': username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, SECRET_KEY, algorithm='HS256')

        return {'token': token}, 200

api.add_namespace(ns)

if __name__ == '__main__':
    app.run(debug=True)
