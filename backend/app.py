import yaml
from flask import Flask, logging, make_response, request, jsonify
from flask_restx import Api, Resource, fields
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import jwt
import datetime
from flask_mail import Mail, Message
from Marshmallow import UserSchema, LoginSchema, ResetPasswordSchema, NewPasswordSchema, ReservationSchema
from marshmallow import ValidationError
from datetime import timedelta, timezone
from extensions import db  # Import db from extensions.py
from functools import wraps
from flask import request

app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuration
app.config.from_pyfile('config.cfg')

# Initialize extensions
db.init_app(app)
mail = Mail(app)

# Now import models after db is initialized
from database_model import User, Reservation, Table

# Configuration for JWT
app.config['SECRET_KEY'] = 'your-secret-key'  # Use a strong key for production

# Konfiguracja API
api = Api(app, version='1.0', title='Authentication API', description='API for user authentication (registration and login)')
ns = api.namespace('api', description='Authentication operations')

# Wczytanie schematu z pliku YAML
with open('../apispecification/defs/auth/User.yaml', 'r') as file:
    user_schema = yaml.safe_load(file)
with open('../apispecification/defs/auth/LoginData.yaml', 'r') as file:
    login_data_schema = yaml.safe_load(file)
with open('../apispecification/defs/auth/RequestResetPassword.yaml', 'r') as file:
    req_reset_pass_schema = yaml.safe_load(file)
with open('../apispecification/defs/auth/ResetPassword.yaml', 'r') as file:
    reset_pass_schema = yaml.safe_load(file)
with open('../apispecification/defs/auth/LoginResponse.yaml', 'r') as file:
    login_response_schema = yaml.safe_load(file)
with open('../apispecification/defs/reservation/Reservation.yaml', 'r') as file:
    reservation_schema = yaml.safe_load(file)

# Dynamiczne tworzenie modelu
user_model = api.schema_model('User', user_schema)
login_data_model = api.schema_model('LoginData', login_data_schema)
req_reset_pass_model = api.schema_model('RequestResetPassword', req_reset_pass_schema)
reset_pass_model = api.schema_model('ResetPassword', reset_pass_schema)
login_response_model = api.schema_model('LoginResponse', login_response_schema)
reservation_model = api.schema_model('Reservation', reservation_schema)

# Helper function to validate JWT tokens
def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]  # Extract token from Authorization header

        if not token:
            return {'message': 'Token is missing'}, 401

        try:
            # Decode the JWT token to get user_id
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = db.session.get(User, payload['user_id'])
            if not current_user:
                return {'message': 'User not found'}, 401
        except jwt.ExpiredSignatureError:
            return {'message': 'Token has expired'}, 401
        except jwt.InvalidTokenError:
            return {'message': 'Invalid token'}, 401

        # Attach current_user to the request context
        request.current_user = current_user
        return f(*args, **kwargs)
    return decorator

def decode_jwt(token):
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token wygasł
    except jwt.InvalidTokenError:
        return None  # Niepoprawny token
    
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

            return {'message': 'Initial configuration done!'}, 200

# Rejestracja nowego użytkownika
@ns.route('/auth/register')
class Register(Resource):
    @ns.expect(user_model)
    @ns.response(201, 'User created successfully')
    @ns.response(400, 'Invalid input')
    def post(self):
        data = request.get_json()
        schema = UserSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {'message': 'Invalid input', 'errors': err.messages}, 400
        
        email = validated_data['email']
        first_name = validated_data['first_name']
        last_name = validated_data['last_name']
        password = validated_data['password']
        phone_number = validated_data.get('phone_number')

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
@ns.route('/auth/login')
class Login(Resource):
    @ns.expect(login_data_model)
    @ns.response(200, 'Login successful')
    @ns.response(400, 'Invalid input')
    @ns.response(401, 'Invalid credentials')
    def post(self):
        data = request.get_json()
        schema = LoginSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {'message': 'Invalid input', 'errors': err.messages}, 400

        email = validated_data['email']
        password = validated_data['password']

        user = User.query.filter_by(email=email).first()
        if user is None or not User.verify_password(user.password, password):
            return {'message': 'Invalid credentials'}, 401

        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return {'name': user.first_name, 'token': token}, 200


# Wylogowywanie:
@ns.route('/auth/logout')
class Logout(Resource):
    @ns.response(200, 'Logout successful')
    @token_required
    def post(self):
        # JWT does not require server-side logout, just inform the client to discard the token
        return {'message': 'You are logged out'}, 200
    
@ns.route('/auth/check-login')
class CheckLoginStatus(Resource):
    @token_required
    def get(self):
        """
        Endpoint sprawdzający status logowania użytkownika.
        Weryfikuje token JWT, zwracając informację o statusie logowania.
        """
        return {'status': 'logged_in'}, 200

@ns.route('/auth/request-password-reset')
class RequestPasswordReset(Resource):
    @ns.expect(req_reset_pass_model)
    @ns.response(200, 'Email to reset password has been sent')
    @ns.response(400, 'Cannot send email to reset password')
    def post(self):
        data = request.get_json()
        schema = ResetPasswordSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {'message': 'Invalid input', 'errors': err.messages}, 400

        email = validated_data['email']

        user = User.query.filter_by(email=email).first()

        # Always return the same response to prevent email enumeration
        message = 'If an account with that email exists, a password reset email has been sent.'

        if user:
            # Generate a reset token
            reset_token = jwt.encode({
                'user_id': user.id,
                'exp':  datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=1)
            }, app.config['SECRET_KEY'], algorithm='HS256')

            # Construct the password reset URL
            reset_url = f"http://localhost:4200/reset-password?token={reset_token}"

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


@ns.route('/auth/reset-password')
class ResetPassword(Resource):
    @ns.expect(reset_pass_model)
    def post(self):
        data = request.get_json()
        
        schema = NewPasswordSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {'message': 'Invalid input', 'errors': err.messages}, 400

        reset_token = validated_data['resetToken']
        new_password = validated_data['newPassword']

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

@ns.route('/reservation')
class CreateReservation(Resource):
    @ns.expect(reservation_model)
    @ns.response(201, 'Reservation created successfully')
    @ns.response(400, 'Invalid input')
    @ns.response(409, 'Conflict - Table already reserved')
    @token_required
    def post(self):
        """
        Create a new reservation
        """

        data = request.get_json()
        schema = ReservationSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {'message': 'Invalid input', 'errors': err.messages}, 400
        
        token = request.headers.get('Authorization') 

        if not token:
            return {'message': 'Token is missing'}, 401

        # Usuwamy "Bearer " z tokenu, jeśli jest obecne
        token = token.replace("Bearer ", "")

        # Dekodowanie tokenu
        payload = decode_jwt(token)
        
        if not payload:
            return {'message': 'Unauthorized'}, 401

        # Wyciąganie user_id z payload
        user_id = payload.get('user_id')
        table_id = validated_data['table_id']
        reservation_start = validated_data['reservation_start'].replace(tzinfo=timezone.utc)
        reservation_end = validated_data['reservation_end'].replace(tzinfo=timezone.utc)
        pending = validated_data.get('pending', True)

        # Check if the table exists
        table = Table.query.get(table_id)
        if not table:
            return {'message': f'Table {table_id} does not exist'}, 400
        
        # Check if the table is available
        if not table.available:
            return {'message': f'Table {table_id} is currently unavailable'}, 400

        # Check for overlapping reservations
        overlapping_reservations = Reservation.query.filter(
            Reservation.table_id == table_id,
            Reservation.reservation_end > reservation_start,
            Reservation.reservation_start < reservation_end,
            Reservation.pending == True  # Only consider pending reservations
        ).first()

        if overlapping_reservations:
            return {'message': f'Table {table_id} is already reserved during that time'}, 409
        

        # Create the reservation
        new_reservation = Reservation(
            user_id=user_id,
            table_id=table_id,
            pending=pending,
            created_at= datetime.datetime.now(datetime.UTC),
            reservation_start=reservation_start,
            reservation_end=reservation_end
        )
        db.session.add(new_reservation)
        db.session.commit()

        # Emitowanie aktualizacji do klientów
        socketio.emit('reservation_update', {
            'table_id': table_id,
            'reservation_start': reservation_start.isoformat(),
            'reservation_end': reservation_end.isoformat() 
        })

        return {'message': 'Reservation created successfully'}, 201


    @ns.doc(params={
        'reservation_start': 'Start time of the time range to check (format: YYYY-MM-DDTHH:MM)',
        'reservation_end': 'End time of the time range to check (format: YYYY-MM-DDTHH:MM)'
    })
    @ns.response(200, 'Success')
    @ns.response(400, 'Invalid input')
    @token_required
    def get(self):
        reservation_start_str = request.args.get('reservation_start')
        reservation_end_str = request.args.get('reservation_end')

        if not reservation_start_str or not reservation_end_str:
            return {'message': 'reservation_start and reservation_end query parameters are required'}, 400

        try:
            reservation_start = datetime.datetime.strptime(reservation_start_str, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
            reservation_end = datetime.datetime.strptime(reservation_end_str, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
        except ValueError as e:
            return {'message': 'Invalid date format', 'errors': str(e)}, 400

        if reservation_start >= reservation_end:
            return {'message': 'reservation_start must be before reservation_end'}, 400

        

        # Get all overlapping reservations
        overlapping_reservations = Reservation.query.filter(
            Reservation.reservation_end > reservation_start,
            Reservation.reservation_start < reservation_end,
            Reservation.pending == True  # Only consider pending reservations
        ).all()

        # Extract occupied table IDs
        occupied_table_ids = [reservation.table_id for reservation in overlapping_reservations]

        return {'occupied_table_ids': occupied_table_ids}, 200

@socketio.on('connect')
def handle_connect():
    print('Client connected') 
    emit('my_response', {'data': 'Connected'}, broadcast=True)  # Broadcast optional if needed globally

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')
    emit('my_response', {'data': 'Disconnected'}, broadcast=True)
    
api.add_namespace(ns)

if __name__ == '__main__':
    socketio.run(app, debug=True)
    # app.run(debug=True)
