import yaml
from flask import Flask, request, jsonify
from flask_restx import Api, Resource, fields
from flask_cors import CORS
import jwt
import datetime
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Integer, String, Boolean 
import os
import binascii
import hashlib
from database_model import db, User, Reservation, Table
import pandas as pd
from flask_mail import Mail, Message

app = Flask(__name__)
CORS(app)

# Konfiguracja sekretnego klucza i bazy danych oraz maila
app.config.from_pyfile('config.cfg')
db.init_app(app)
mail = Mail(app)

# Stworzenie LoginManagera do obsługi logowania
login_manager = LoginManager(app)
login_manager.login_view = 'api.login'

# Konfiguracja API
api = Api(app, version='1.0', title='Authentication API', description='API for user authentication (registration and login)')
ns = api.namespace('api', description='Authentication operations')


# Wczytanie schematu z pliku YAML
with open('../apispecification/defs/auth/User.yaml', 'r') as file:
    user_schema = yaml.safe_load(file)
with open('../apispecification/defs/auth/LoginData.yaml', 'r') as file:
    login_data_schema = yaml.safe_load(file)
with open('../apispecification/defs/auth/RequestResetPassword.yaml', 'r') as file:
    reset_pass_schema = yaml.safe_load(file)
with open('../apispecification/defs/auth/LoginResponse.yaml', 'r') as file:
    login_response_schema = yaml.safe_load(file)

# Dynamiczne tworzenie modelu
user_model = api.schema_model('User', user_schema)
login_data_model = api.schema_model('LoginData', login_data_schema)
reset_pass_model = api.schema_model('RequestResetPassword', reset_pass_schema)
login_response_model = api.schema_model('LoginResponse', login_response_schema)


# User loader callback for flask_login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@ns.route('/init')
class Init(Resource):
    def get(self):
        with app.app_context():
            # Utworzenie wszystkich tabel w bazie danych
            db.create_all()

            # Sprawdzenie, czy użytkownik admin już istnieje
            admin = User.query.filter_by(email='admin@example.com').first()
            if admin is None:
                # Jeśli admin nie istnieje, utwórz go
                admin_password = User.get_hashed_password('1234')
                admin = User(
                    email='admin@example.com',
                    password=admin_password,
                    first_name='King',
                    last_name='Kong',
                    phone_number='123456789',
                    is_admin=True
                )
                db.session.add(admin)
                db.session.commit()
            
            try:
                tables_df = pd.read_excel("SampleData.xlsx", sheet_name="tables")
                users_df = pd.read_excel("SampleData.xlsx", sheet_name="users")

                # Populate the tables:
                for _, t in tables_df.iterrows():
                    existing_table = Table.query.filter_by(description=t["description"]).first()
                    if not existing_table:
                        new_table_entry = Table(
                            available=bool(t["available"]),
                            no_seats=t["no_seats"],
                            description=t["description"],
                            location_x=t["location_x"],
                            location_y=t["location_y"]
                        )
                        db.session.add(new_table_entry)
                    # Populuj użytkowników (z pominięciem admina)
                for _, u in users_df.iterrows():
                    if u["email"] != 'admin@example.com':
                        existing_user = User.query.filter_by(email=u["email"]).first()
                        if not existing_user:
                            hashed_password = User.get_hashed_password(u["password"])
                            new_user_entry = User(
                                first_name=u["first_name"],
                                last_name=u["last_name"],
                                email=u["email"],
                                password=hashed_password,
                                phone_number=u["phone_number"],
                                is_admin=bool(u["is_admin"])
                            )
                            db.session.add(new_user_entry)

                db.session.commit()
                message = "Initial configuration done with sample data!"
            except Exception as e:
                db.session.rollback()
                message = f"Error during initial configuration: {e}"
                return {'message': message}, 500


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
        phone_number = data.get('phone')


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
            phone_number=phone_number,
            is_admin=False
        )
        db.session.add(new_user)
        db.session.commit()

        return {'message': 'User created successfully'}, 201

# Logowanie użytkownika
@ns.route('/login')
class Login(Resource):
    @ns.expect(login_data_model)
    @ns.response(200, 'Login successful')
    @ns.response(400, 'Invalid input')
    @ns.response(401, 'Invalid credentials')
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

        login_response_model = {"name" : user.first_name, 'token' : token}
        return login_response_model, 200

# Wylogowywanie:
@app.route('/logout')
@ns.route('/logout')
class Logout(Resource):
    @ns.response(200, 'Logout successful')
    @ns.response(400, 'Logout invalid')
    @login_required  # Użytkownik musi być zalogowany, aby móc się wylogować
    def post(self):
        logout_user()
        return {'message': 'You are logged out'}, 200


@ns.route('/request-password-reset')
class RequestPasswordReset(Resource):
    @ns.expect(reset_pass_model)
    @ns.response(200, 'Email to reset password has been sent')
    @ns.response(400, 'Cannot send email to reset password')
    def post(self):
        data = request.get_json()
        email = data.get('email')

        if not email:
            return {'message': 'Email is required'}, 400

        user = User.query.filter_by(email=email).first()

        # Always return the same response to prevent email enumeration
        message = 'If an account with that email exists, a password reset email has been sent.'

        if user:
            # Generate a reset token
            reset_token = jwt.encode({
                'user_id': user.id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }, app.config['SECRET_KEY'], algorithm='HS256')

            # Construct the password reset URL
            reset_url = f"http://your-frontend-domain/reset-password?token={reset_token}"

            # Send the email
            try:
                msg = Message("Password Reset Request",
                              recipients=[user.email])
                msg.body = f"""Hello {user.first_name},

To reset your password, please click the following link:

{reset_url}

If you did not request a password reset, please ignore this email.

Best regards,
Table&Taste"""
                mail.send(msg)
            except Exception as e:
                app.logger.error(f'Failed to send password reset email: {str(e)}')
                return {'message': 'Failed to send password reset email'}, 500

        return {'message': message}, 200


@ns.route('/reset-password')
class ResetPassword(Resource):
    def post(self):
        data = request.get_json()
        reset_token = data.get('token')
        new_password = data.get('new_password')

        if not reset_token or not new_password:
            return {'message': 'Reset token and new password are required'}, 400

        try:
            # Decode the token
            payload = jwt.decode(reset_token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user_id = payload['user_id']
        except jwt.ExpiredSignatureError:
            return {'message': 'Reset token has expired'}, 401
        except jwt.InvalidTokenError:
            return {'message': 'Invalid reset token'}, 401

        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 400

        # Update the user's password
        hashed_password = User.get_hashed_password(new_password)
        user.password = hashed_password
        db.session.commit()

        return {'message': 'Password reset successful'}, 200


api.add_namespace(ns)

if __name__ == '__main__':
    app.run(debug=True)
