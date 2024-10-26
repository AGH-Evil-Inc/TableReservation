import yaml
from flask import Flask, request, jsonify
from flask_restx import Api, Resource, fields
from flask_cors import CORS
import jwt
import datetime
from flask_login import LoginManager, UserMixin, login_user, logout_user
# from flask_sqlalchemy import SQLAlchemy  # TODO: Odkomentuj po podłączeniu bazy danych
# from sqlalchemy import Integer, String, Boolean  # TODO: Odkomentuj po podłączeniu bazy danych
import os
import binascii
import hashlib

app = Flask(__name__)
CORS(app)

# Konfiguracja sekretnego klucza i bazy danych
app.config.from_pyfile('config.cfg')
# db = SQLAlchemy(app)  # TODO: Odkomentuj po podłączeniu bazy danych

# Stworzenie LoginManagera do obsługi logowania
login_manager = LoginManager(app)
login_manager.login_view = 'api.login'

# Konfiguracja API
api = Api(app, version='1.0', title='Authentication API', description='API for user authentication (registration and login)')
ns = api.namespace('api', description='Authentication operations')

# Prosta baza danych użytkowników (słownik)
users_db = {}

# Wczytanie schematu z pliku YAML
with open('../apispecification/defs/auth/User.yaml', 'r') as file:
    user_schema = yaml.safe_load(file)

# Dynamiczne tworzenie modelu
user_model = api.schema_model('User', user_schema)

# User model (bez SQLAlchemy)
class User(UserMixin):
    def __init__(self, id, email, first_name, last_name, password, is_admin=False):
        self.id = id
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.password = password
        self.is_admin = is_admin

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

# TODO: Przywróć poniższy kod po podłączeniu bazy danych
'''
# User model for SQLAlchemy
class User(db.Model, UserMixin):
    id = db.Column(Integer, primary_key=True, autoincrement=True)
    email = db.Column(String(120), unique=True, nullable=False)
    first_name = db.Column(String(50))
    last_name = db.Column(String(50))
    password = db.Column(String(100))
    is_admin = db.Column(Boolean, default=False)

    def __repr__(self):
        return f'User ID: {self.id}, Email: {self.email}'

    @staticmethod
    def get_hashed_password(password):
        # ... (metoda pozostaje bez zmian)
    @staticmethod
    def verify_password(stored_password_hash, provided_password):
        # ... (metoda pozostaje bez zmian)
'''

# User loader callback for flask_login
@login_manager.user_loader
def load_user(user_id):
    return users_db.get(int(user_id))

# TODO: Przywróć poniższy kod po podłączeniu bazy danych
'''
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
'''

# Ścieżka inicjalizująca bazę danych
@ns.route('/init')
class Init(Resource):
    def get(self):
        # Inicjalizacja słownika użytkowników z kontem admina
        if 1 not in users_db:
            admin_password = User.get_hashed_password('1234')
            admin = User(
                id=1,
                email='admin@example.com',
                password=admin_password,
                first_name='King',
                last_name='Kong',
                is_admin=True
            )
            users_db[1] = admin

        return {'message': 'Initial configuration done!'}, 200

# Rejestracja nowego użytkownika
@ns.route('/register')
class Register(Resource):
    @ns.expect(user_model)
    @ns.response(201, 'User created successfully')
    @ns.response(400, 'Invalid input')
    def post(self):
        data = request.get_json()
        email = data.get('email')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        password = data.get('password')

        if not email or not first_name or not last_name or not password:
            return {'message': 'Invalid input'}, 400

        # Sprawdzenie, czy użytkownik już istnieje w users_db
        for user in users_db.values():
            if user.email == email:
                return {'message': 'User already exists'}, 400

        # Generowanie nowego ID
        new_id = max(users_db.keys(), default=0) + 1

        # Tworzenie nowego użytkownika
        hashed_password = User.get_hashed_password(password)
        new_user = User(
            id=new_id,
            email=email,
            password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            is_admin=False  # Domyślnie False
        )
        users_db[new_id] = new_user

        return {'message': 'User created successfully'}, 201

    # TODO: Przywróć poniższy kod po podłączeniu bazy danych
    '''
    def post(self):
        data = request.get_json()
        email = data.get('email')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        password = data.get('password')

        if not email or not first_name or not last_name or not password:
            return {'message': 'Invalid input'}, 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return {'message': 'User already exists'}, 400

        hashed_password = User.get_hashed_password(password)
        new_user = User(
            email=email,
            password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            is_admin=False
        )
        db.session.add(new_user)
        db.session.commit()

        return {'message': 'User created successfully'}, 201
    '''

# Logowanie użytkownika
@ns.route('/login')
class Login(Resource):
    @ns.expect(user_model)
    @ns.response(200, 'Login successful')
    @ns.response(400, 'Invalid input')
    @ns.response(401, 'Invalid credentials')
    def post(self):
        data = request.get_json()
        email = data.get('email')  # Użytkownik podaje tylko email i hasło
        password = data.get('password')

        if not email or not password:
            return {'message': 'Invalid input'}, 400

        # Wyszukanie użytkownika po emailu
        user = None
        for u in users_db.values():
            if u.email == email:
                user = u
                break

        if user is None or not User.verify_password(user.password, password):
            return {'message': 'Invalid credentials'}, 401

        login_user(user)

        # Generowanie JWT tokena (wewnętrznie używamy user.id)
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return {'token': token}, 200

    # TODO: Przywróć poniższy kod po podłączeniu bazy danych
    '''
    def post(self):
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return {'message': 'Invalid input'}, 400

        user = User.query.filter_by(email=email).first()
        if user is None or not User.verify_password(user.password, password):
            return {'message': 'Invalid credentials'}, 401

        login_user(user)

        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return {'token': token}, 200
    '''

api.add_namespace(ns)

if __name__ == '__main__':
    app.run(debug=True)
