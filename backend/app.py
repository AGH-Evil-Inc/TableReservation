import yaml
from flask import Flask, logging, make_response, request, jsonify
from flask_restx import Api, Resource, fields
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import jwt
from datetime import datetime, timedelta, timezone, time
from flask_mail import Mail, Message
from Marshmallow import UserSchema, LoginSchema, ResetPasswordSchema, NewPasswordSchema, ReservationSchema
from marshmallow import ValidationError
from extensions import db  # Import db from extensions.py
from functools import wraps
from flask import request
from dateutil.relativedelta import relativedelta


app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuration
app.config.from_pyfile('config.cfg')

# Initialize extensions
db.init_app(app)
mail = Mail(app)

# Now import models after db is initialized
from database_model import Settings, User, Reservation, Table

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
with open('../apispecification/defs/reservation/Table.yaml', 'r') as file:
    table_schema = yaml.safe_load(file)
with open('../apispecification/manager.yaml', 'r') as file:
    manager_spec = yaml.safe_load(file)
with open('../apispecification/defs/manager/UpdateReservation.yaml', 'r') as file:
    update_reservation_schema = yaml.safe_load(file)
with open('../apispecification/defs/manager/UpdateUser.yaml', 'r') as file:
    update_user_schema = yaml.safe_load(file)
with open('../apispecification/defs/manager/ReservationSchema.yaml', 'r') as file:
    update_settings_schema = yaml.safe_load(file)

# Dynamiczne tworzenie modelu
user_model = api.schema_model('User', user_schema)
login_data_model = api.schema_model('LoginData', login_data_schema)
req_reset_pass_model = api.schema_model('RequestResetPassword', req_reset_pass_schema)
reset_pass_model = api.schema_model('ResetPassword', reset_pass_schema)
login_response_model = api.schema_model('LoginResponse', login_response_schema)
reservation_model = api.schema_model('Reservation', reservation_schema)
table_model = api.schema_model('Table', table_schema)
update_user_model = api.schema_model('UpdateUser', update_user_schema)
update_reservation_model = api.schema_model('UpdateReservation', update_reservation_schema)
update_settings_model = api.schema_model('UpdateSettings', update_settings_schema)

# Helper function to validate JWT tokens
def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(" ")
            if len(parts) == 2 and parts[0].lower() == 'bearer':
                token = parts[1]

        if not token:
            return {'message': 'Token is missing'}, 401

        try:
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = db.session.get(User, payload['user_id'])
            if not current_user:
                return {'message': 'User not found'}, 401
        except jwt.ExpiredSignatureError:
            return {'message': 'Token has expired'}, 401
        except jwt.InvalidTokenError:
            return {'message': 'Invalid token'}, 401

        request.current_user = current_user
        return f(*args, **kwargs)
    return decorator

def admin_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        if not getattr(request, 'current_user', None):
            return {'message': 'User not found'}, 401
        if not request.current_user.is_admin:
            return {'message': 'Admin privileges required'}, 403
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

            # Inicjalizacja domyślnych godzin otwarcia
            existing_hours = Settings.query.first()
            if not existing_hours:
                opening_hours_data = [
                    # Poniedziałek (0) do Piątku (4): 10:00 - 22:00
                    {'day_of_week': i, 'opening_time': time(10, 0), 'closing_time': time(22, 0)} for i in range(0, 5)
                ] + [
                    # Sobota (5) i Niedziela (6): 12:00 - 00:00
                    {'day_of_week': i, 'opening_time': time(12, 0), 'closing_time': time(0, 0)} for i in range(5, 7)
                ]

                for oh in opening_hours_data:
                    opening_hour = Settings(
                        day_of_week=oh['day_of_week'],
                        opening_time=oh['opening_time'],
                        closing_time=oh['closing_time']
                    )
                    db.session.add(opening_hour)
                db.session.commit()

            # Inicjalizacja użytkownika admin (pozostała część kodu bez zmian)
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
            'exp': datetime.now(timezone.utc) + timedelta(hours=1)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return {'name': user.first_name, 'token': token, 'isAdmin': user.is_admin}, 200


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
                'exp':  datetime.now(timezone.utc) + timedelta(hours=1)
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
    
@ns.route('/tables')
class TableList(Resource):
    @ns.response(200, 'Success', [table_model])
    @ns.response(400, 'Invalid input')
    def get(self):
        """Get all tables"""
        tables = Table.query.all()
        return jsonify([table.to_dict() for table in tables])
      

    @ns.expect(table_model)
    @ns.response(201, 'Table created successfully')
    @ns.response(400, 'Invalid input')
    def post(self):
        """Create a new table"""
        data = request.get_json()
        new_table = Table(**data)
        db.session.add(new_table)
        db.session.commit()
        return {'message': 'Table created successfully', 'id': new_table.id}, 201
      


@ns.route('/tables/<int:table_id>')
class TableDetail(Resource):
    @ns.response(200, 'Success', table_model)
    @ns.response(404, 'Table not found')
    def get(self, table_id):
        """Get a specific table by ID"""
        table = Table.query.get(table_id)
        if not table:
            return {'message': 'Table not found'}, 404
        return jsonify(table.to_dict())

    @ns.expect(table_model)
    @ns.response(200, 'Table updated successfully')
    @ns.response(404, 'Table not found')
    @ns.response(400, 'Invalid input')
    def put(self, table_id):
        """Update an existing table"""
        data = request.get_json()
        table = Table.query.get(table_id)
        if not table:
            return {'message': 'Table not found'}, 404

    
        for key, value in data.items():
            setattr(table, key, value)
        db.session.commit()
        return {'message': 'Table updated successfully'}


    @ns.response(204, 'Table deleted successfully')
    @ns.response(404, 'Table not found')
    def delete(self, table_id):
        """Delete a table by ID and related reservations, notify users via email"""
        table = Table.query.get(table_id)
        if not table:
            return {'message': 'Table not found'}, 404
        
        # Pobierz wszystkie rezerwacje związane z tym stolikiem
        reservations = Reservation.query.filter_by(table_id=table_id).all()

        # Dla każdej rezerwacji wysyłamy e-mail do użytkownika, informując o anulowaniu
        for reservation in reservations:
            user = reservation.user
            if user and user.email:
                # Konstruujemy wiadomość e-mail
                msg = Message("Reservation Cancelled",
                              recipients=[user.email])
                msg.body = f"""Hello {user.first_name},

We regret to inform you that your reservation has been cancelled due to the table being removed from our system.

We apologize for any inconvenience caused.

Best regards,
Table&Taste
"""
                try:
                    mail.send(msg)
                except Exception as e:
                    app.logger.error(f'Failed to send cancellation email to {user.email}: {str(e)}')

            # Usuwamy rezerwację z bazy danych
            db.session.delete(reservation)

        # Na koniec usuwamy sam stolik
        db.session.delete(table)
        db.session.commit()

        return '', 204
       

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
        table_ids = validated_data['table_ids']
        reservation_start = validated_data['reservation_start'].replace(tzinfo=timezone.utc)
        reservation_end = validated_data['reservation_end'].replace(tzinfo=timezone.utc)
        pending = validated_data.get('pending', True)

        # Walidacja godzin otwarcia
        day_of_week = reservation_start.weekday()
        opening_hours = Settings.query.filter_by(day_of_week=day_of_week).first()
        if not opening_hours:
            return {
                'message': 'The openning hours are not set up',
                'errors': {'reservation_start': ['Opening hours are not set up']}
            }, 400

        opening_time = opening_hours.opening_time
        closing_time = opening_hours.closing_time

        # Połączenie daty rezerwacji z godzinami otwarcia i zamknięcia
        opening_datetime = datetime.combine(reservation_start.date(), opening_time).replace(tzinfo=timezone.utc)
        closing_datetime = datetime.combine(reservation_start.date(), closing_time).replace(tzinfo=timezone.utc)

        # Obsługa zamknięcia po północy
        if closing_time <= opening_time:
            closing_datetime += timedelta(days=1)

        # Sprawdzenie, czy rezerwacja mieści się w godzinach otwarcia
        if not (opening_datetime <= reservation_start < closing_datetime and
                opening_datetime < reservation_end <= closing_datetime):
            return {
                'message': 'The reservation must be during opening hours',
                'errors': {'reservation_start': ['The reservation must be during opening hours']}
            }, 400
        
        # Sprawdzenie, czy rezerwacja jest dokonana co najmniej 30 minut przed zamknięciem
        last_reservation_time = closing_datetime - timedelta(minutes=30)
        if reservation_start > last_reservation_time:
            return {
                'message': 'The last reservation can be made no later than 30 minutes before closing',
                'errors': {'reservation_start': ['The last reservation can be made no later than 30 minutes before closing']}
            }, 400

        # Sprawdzenie minimalnego i maksymalnego czasu trwania rezerwacji
        duration = reservation_end - reservation_start
        min_duration = timedelta(minutes=15)
        max_duration = timedelta(hours=4, minutes=30)

        if duration < min_duration:
            return {
                'message': 'The minimal time of the reservation is 15 minutes',
                'errors': {'reservation_end': ['The minimal time of the reservation is 15 minutes']}
            }, 400
        if duration > max_duration:
            return {
                'message': 'The maximal time of the reservation is 4.5 hours',
                'errors': {'reservation_end': ['The maximal time of the reservation is 4.5 hours']}
            }, 400
        
        # Sprawdzenie maksymalnego wyprzedzenia (dokładnie 4 miesiące)
        current_time = datetime.now(timezone.utc)
        max_advance = current_time + relativedelta(months=4)
        if reservation_start > max_advance:
            return {
                'message': 'Rezerwację można dokonać maksymalnie na 4 miesiące do przodu.',
                'errors': {'reservation_start': ['Rezerwację można dokonać maksymalnie na 4 miesiące do przodu.']}
            }, 400

        # Sprawdzenie, czy rezerwacja jest w przyszłości
        if reservation_start < current_time:
            return {
                'message': 'Rezerwacja nie może być w przeszłości.',
                'errors': {'reservation_start': ['Rezerwacja nie może być w przeszłości.']}
            }, 400

        # Sprawdzenie dostępności każdego stolika
        unavailable_tables = []
        for table_id in table_ids:
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
                unavailable_tables.append(table_id)

        if unavailable_tables:
            return {'message': f'Table {unavailable_tables} is already reserved during that time'}, 409
            

        # Create the reservation
        reserved_tables = []
        for table_id in table_ids:
            new_reservation = Reservation(
                user_id=user_id,
                table_id=table_id,
                pending=pending,
                created_at=datetime.now(timezone.utc),
                reservation_start=reservation_start,
                reservation_end=reservation_end
            )
            db.session.add(new_reservation)
            reserved_tables.append(table_id)

        db.session.commit()
        # Emitowanie aktualizacji do klientów
        socketio.emit('reservation_update', {
            'table_ids': reserved_tables,
            'reservation_start': reservation_start.isoformat(),
            'reservation_end': reservation_end.isoformat() 
        })

        return {
            'message': 'Reservation has been created sucessfully',
            'reserved_tables': reserved_tables,
            'reservation_start': reservation_start.isoformat(),
            'reservation_end': reservation_end.isoformat()
        }, 201


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
            reservation_start = datetime.strptime(reservation_start_str, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
            reservation_end = datetime.strptime(reservation_end_str, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
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
    

@ns.route('/manager/settings')
class ManagerSettings(Resource):
    @token_required
    @admin_required
    def get(self):
        """Get all settings (manager only)"""
        settings = Settings.query.all()
        return jsonify([{
            'day_of_week': s.day_of_week,
            'opening_time': s.opening_time.strftime('%H:%M') if s.opening_time else None,
            'closing_time': s.closing_time.strftime('%H:%M') if s.closing_time else None,
            'min_reservation_length': s.min_reservation_length if s.min_reservation_length else None,
            'max_reservation_length': s.max_reservation_length if s.max_reservation_length else None,
        } for s in settings])

    @ns.expect(update_settings_model)
    @token_required
    @admin_required
    def put(self):
        """
        Update all or some fields of settings for each day (manager only).
        You can pass only some fields (like only 'opening_time') and the rest will remain unchanged.
        Example JSON:
        {
          "0": {"opening_time": "09:00"},
          "1": {"closing_time": "23:00", "min_reservation_length": 20}
        }
        """
        data = request.json
        try:
            for day_str, values in data.items():
                day = int(day_str)
                setting = Settings.query.filter_by(day_of_week=day).first()
                if not setting:
                    setting = Settings(day_of_week=day)
                    db.session.add(setting)

                if 'opening_time' in values:
                    setting.opening_time = datetime.strptime(values['opening_time'], '%H:%M').time()
                if 'closing_time' in values:
                    setting.closing_time = datetime.strptime(values['closing_time'], '%H:%M').time()
                if 'min_reservation_length' in values:
                    setting.min_reservation_length = values['min_reservation_length']
                if 'max_reservation_length' in values:
                    setting.max_reservation_length = values['max_reservation_length']

            db.session.commit()
            return {'message': 'Settings updated successfully'}, 200
        except Exception as e:
            return {'message': 'Failed to update settings', 'error': str(e)}, 400
        
@ns.route('/manager/users')
class ManagerUsers(Resource):
    @token_required
    @admin_required
    def get(self):
        """Get all users (manager only)"""
        users = User.query.all()
        return jsonify([{
            'id': u.id,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'phone_number': u.phone_number,
            'is_admin': u.is_admin
        } for u in users])

    @ns.expect(user_model)  # Używamy już istniejącego modelu User, który jest stosowany przy rejestracji
    @token_required
    @admin_required
    def post(self):
        """
        Create a new user (manager only).
        Manager can create a user (including setting is_admin if needed).
        Example JSON:
        {
          "email": "newuser@example.com",
          "first_name": "John",
          "last_name": "Doe",
          "phone_number": "123456789",
          "password": "somepassword",
          "is_admin": false
        }
        """
        data = request.get_json()
        
        # Walidacja po stronie Marshmallow jeśli chcesz, lub samodzielna:
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
        # Menadżer może nadawać prawa admina, jeśli chce:
        is_admin = data.get('is_admin', False)

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
            is_admin=is_admin
        )
        db.session.add(new_user)
        db.session.commit()

        return {'message': 'User created successfully by manager', 'user_id': new_user.id}, 201
    
@ns.route('/manager/users/<int:user_id>')
class ManagerUserDetail(Resource):
    @token_required
    @admin_required
    def delete(self, user_id):
        """Delete a user by ID (manager only) and send them an email."""
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404

        # Zapamiętujemy email przed usunięciem
        user_email = user.email
        user_first_name = user.first_name

        # Usuwamy rezerwacje użytkownika
        reservations = Reservation.query.filter_by(user_id=user_id).all()
        for res in reservations:
            db.session.delete(res)

        db.session.delete(user)
        db.session.commit()

        # Wysyłamy email do usuniętego użytkownika
        if user_email:
            msg = Message("Account Deleted",
                          recipients=[user_email])
            msg.body = f"""Hello {user_first_name},

We regret to inform you that your account has been deleted by our manager.

If you have any questions, please contact support.

Best regards,
Table&Taste
"""
            try:
                mail.send(msg)
            except Exception as e:
                app.logger.error(f'Failed to send deletion email to {user_email}: {str(e)}')

        return {'message': 'User deleted successfully'}, 200
    
    @ns.expect(update_user_model)
    @token_required
    @admin_required
    def put(self, user_id):
        """
        Update user data (manager only).
        You can update any of the user's fields such as email, first_name, last_name, phone_number, is_admin.
        Example JSON:
        {
          "email": "newmail@example.com",
          "is_admin": true
        }
        """
        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404

        data = request.json
        # Aktualizujemy tylko pola, które zostały podane
        if 'email' in data:
            user.email = data['email']
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone_number' in data:
            user.phone_number = data['phone_number']
        if 'is_admin' in data:
            user.is_admin = data['is_admin']

        db.session.commit()
        return {'message': 'User updated successfully'}, 200
    
@ns.route('/manager/reservations')
class ManagerReservations(Resource):
    @token_required
    @admin_required
    def get(self):
        """Get all reservations (manager only)"""
        reservations = Reservation.query.all()
        return jsonify([{
            'id': r.id,
            'user_id': r.user_id,
            'table_id': r.table_id,
            'pending': r.pending,
            'created_at': r.created_at.isoformat() if r.created_at else None,
            'reservation_start': r.reservation_start.isoformat() if r.reservation_start else None,
            'reservation_end': r.reservation_end.isoformat() if r.reservation_end else None
        } for r in reservations])
    
    @ns.expect(reservation_model)  
    @token_required
    @admin_required
    def post(self):
        """
        Create a new reservation (manager only).
        Manager can create a reservation for any user by specifying user_id, table_ids, reservation_start, reservation_end.
        Example JSON:
        {
          "user_id": 10,
          "table_ids": [1, 2],
          "reservation_start": "2024-05-10T18:00",
          "reservation_end": "2024-05-10T20:00",
          "pending": true
        }
        """
        data = request.get_json()
        
        # Walidacja schematu
        schema = ReservationSchema()
        try:
            validated_data = schema.load(data)
        except ValidationError as err:
            return {'message': 'Invalid input', 'errors': err.messages}, 400

        # Menadżer może podać user_id, dla kogo tworzy rezerwację
        user_id = data.get('user_id')
        if not user_id:
            return {'message': 'user_id is required'}, 400

        user = User.query.get(user_id)
        if not user:
            return {'message': 'User not found'}, 404

        table_ids = validated_data['table_ids']
        reservation_start = validated_data['reservation_start'].replace(tzinfo=timezone.utc)
        reservation_end = validated_data['reservation_end'].replace(tzinfo=timezone.utc)
        pending = validated_data.get('pending', True)

        # Walidacja czasu tak jak przy normalnej rezerwacji
        day_of_week = reservation_start.weekday()
        opening_hours = Settings.query.filter_by(day_of_week=day_of_week).first()
        if not opening_hours:
            return {
                'message': 'The opening hours are not set up',
                'errors': {'reservation_start': ['Opening hours are not set up']}
            }, 400

        opening_time = opening_hours.opening_time
        closing_time = opening_hours.closing_time
        opening_datetime = datetime.combine(reservation_start.date(), opening_time).replace(tzinfo=timezone.utc)
        closing_datetime = datetime.combine(reservation_start.date(), closing_time).replace(tzinfo=timezone.utc)
        if closing_time <= opening_time:
            closing_datetime += timedelta(days=1)

        if not (opening_datetime <= reservation_start < closing_datetime and
                opening_datetime < reservation_end <= closing_datetime):
            return {
                'message': 'The reservation must be during opening hours',
                'errors': {'reservation_start': ['The reservation must be during opening hours']}
            }, 400

        last_reservation_time = closing_datetime - timedelta(minutes=30)
        if reservation_start > last_reservation_time:
            return {
                'message': 'The last reservation can be made no later than 30 minutes before closing',
                'errors': {'reservation_start': ['The last reservation can be made no later than 30 minutes before closing']}
            }, 400

        # Sprawdzenie czasu trwania jak wcześniej
        duration = reservation_end - reservation_start
        min_duration = timedelta(minutes=15)
        max_duration = timedelta(hours=4, minutes=30)

        if duration < min_duration:
            return {
                'message': 'The minimal time of the reservation is 15 minutes',
                'errors': {'reservation_end': ['The minimal time of the reservation is 15 minutes']}
            }, 400
        if duration > max_duration:
            return {
                'message': 'The maximal time of the reservation is 4.5 hours',
                'errors': {'reservation_end': ['The maximal time of the reservation is 4.5 hours']}
            }, 400
        
        current_time = datetime.now(timezone.utc)
        max_advance = current_time + relativedelta(months=4)
        if reservation_start > max_advance:
            return {
                'message': 'Rezerwację można dokonać maksymalnie na 4 miesiące do przodu.',
                'errors': {'reservation_start': ['Rezerwację można dokonać maksymalnie na 4 miesiące do przodu.']}
            }, 400

        if reservation_start < current_time:
            return {
                'message': 'Rezerwacja nie może być w przeszłości.',
                'errors': {'reservation_start': ['Rezerwacja nie może być w przeszłości.']}
            }, 400

        # Sprawdzenie dostępności stolików
        unavailable_tables = []
        for table_id in table_ids:
            table = Table.query.get(table_id)
            if not table:
                return {'message': f'Table {table_id} does not exist'}, 400
            if not table.available:
                return {'message': f'Table {table_id} is currently unavailable'}, 400

            overlapping_reservations = Reservation.query.filter(
                Reservation.table_id == table_id,
                Reservation.reservation_end > reservation_start,
                Reservation.reservation_start < reservation_end,
                Reservation.pending == True
            ).first()

            if overlapping_reservations:
                unavailable_tables.append(table_id)

        if unavailable_tables:
            return {'message': f'Table {unavailable_tables} is already reserved during that time'}, 409

        # Tworzenie rezerwacji
        reserved_tables = []
        for t_id in table_ids:
            new_res = Reservation(
                user_id=user_id,
                table_id=t_id,
                pending=pending,
                created_at=datetime.now(timezone.utc),
                reservation_start=reservation_start,
                reservation_end=reservation_end
            )
            db.session.add(new_res)
            reserved_tables.append(t_id)

        db.session.commit()

        socketio.emit('reservation_update', {
            'table_ids': reserved_tables,
            'reservation_start': reservation_start.isoformat(),
            'reservation_end': reservation_end.isoformat() 
        })

        return {
            'message': 'Reservation created successfully by manager',
            'reserved_tables': reserved_tables,
            'reservation_start': reservation_start.isoformat(),
            'reservation_end': reservation_end.isoformat()
        }, 201
    
@ns.route('/manager/reservations/<int:reservation_id>')
class ManagerReservationDetail(Resource):
    @token_required
    @admin_required
    def delete(self, reservation_id):
        """Delete a reservation by ID (manager only) and send user an email."""
        reservation = Reservation.query.get(reservation_id)
        if not reservation:
            return {'message': 'Reservation not found'}, 404

        user = reservation.user
        user_email = user.email if user else None
        user_first_name = user.first_name if user else None

        db.session.delete(reservation)
        db.session.commit()

        # Wysyłamy email do użytkownika
        if user_email:
            msg = Message("Reservation Cancelled",
                          recipients=[user_email])
            msg.body = f"""Hello {user_first_name},

We regret to inform you that your reservation has been cancelled by our manager.

We apologize for any inconvenience caused.

Best regards,
Table&Taste
"""
            try:
                mail.send(msg)
            except Exception as e:
                app.logger.error(f'Failed to send cancellation email to {user_email}: {str(e)}')

        return {'message': 'Reservation deleted successfully'}, 200

    @ns.expect(update_reservation_model)    
    @token_required
    @admin_required
    def put(self, reservation_id):
        """
        Update reservation data (manager only).
        You can update fields such as table_id, pending, reservation_start, reservation_end.
        Example JSON:
        {
          "table_id": 2,
          "pending": false,
          "reservation_start": "2024-05-10T18:00",
          "reservation_end": "2024-05-10T20:00"
        }
        """
        reservation = Reservation.query.get(reservation_id)
        if not reservation:
            return {'message': 'Reservation not found'}, 404

        data = request.json

        # Aktualizujemy tylko pola, które zostały podane
        if 'table_id' in data:
            table_id = data['table_id']
            # Sprawdzamy czy taki stół istnieje
            table = Table.query.get(table_id)
            if not table:
                return {'message': f'Table {table_id} does not exist'}, 400
            reservation.table_id = table_id

        if 'pending' in data:
            reservation.pending = data['pending']

        # Zmiana czasu rezerwacji jeśli podane
        fmt = '%Y-%m-%dT%H:%M'
        if 'reservation_start' in data:
            try:
                reservation.reservation_start = datetime.strptime(data['reservation_start'], fmt).replace(tzinfo=timezone.utc)
            except ValueError:
                return {'message': 'Invalid reservation_start format, use YYYY-MM-DDTHH:MM'}, 400

        if 'reservation_end' in data:
            try:
                reservation.reservation_end = datetime.strptime(data['reservation_end'], fmt).replace(tzinfo=timezone.utc)
            except ValueError:
                return {'message': 'Invalid reservation_end format, use YYYY-MM-DDTHH:MM'}, 400

        db.session.commit()
        return {'message': 'Reservation updated successfully'}, 200

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
