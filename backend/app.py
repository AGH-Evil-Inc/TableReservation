import yaml
from flask import Flask, request, jsonify
from flask_restx import Api, Resource, fields
from flask_cors import CORS
import jwt
import datetime


app = Flask(__name__)
CORS(app)
api = Api(app, version='1.0', title='Authentication API', description='API for user authentication (registration and login)')
ns = api.namespace('api', description='Authentication operations')

# Klucz tajny używany do generowania JWT tokenów
SECRET_KEY = 'twoj_tajny_klucz'

# Prosta baza danych użytkowników (przykład)
users_db = {}

# Wczytanie schematu z pliku YAML
with open('../apispecification/defs/auth/User.yaml', 'r') as file:
    user_schema = yaml.safe_load(file)

# Dynamiczne tworzenie modelu
user_model = api.schema_model('User', user_schema)


# Rejestracja nowego użytkownika
@ns.route('/register')
class Register(Resource):
    @ns.expect(user_model)
    @ns.response(201, 'User created successfully')
    @ns.response(400, 'Invalid input')
    def post(self):
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return {'message': 'Invalid input'}, 400

        if username in users_db:
            return {'message': 'User already exists'}, 400

        # Dodanie użytkownika do "bazy danych"
        users_db[username] = password
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
