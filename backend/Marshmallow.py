from marshmallow import Schema, fields as ma_fields, validate, ValidationError, validates_schema
from datetime import datetime, timezone, timedelta, time
from dateutil.relativedelta import relativedelta

# Marshmallow Schemas for Validation
class UserSchema(Schema):
    email = ma_fields.Email(required=True)
    first_name = ma_fields.Str(required=True, validate=validate.Regexp('^[A-Za-z]+$'))
    last_name = ma_fields.Str(required=True, validate=validate.Regexp('^[A-Za-z]+$'))
    password = ma_fields.Str(required=True, validate=validate.Length(min=6))
    phone_number = ma_fields.Str(validate=validate.Regexp(r'^\d{9}$'))

class LoginSchema(Schema):
    email = ma_fields.Email(required=True)
    password = ma_fields.Str(required=True)

class ResetPasswordSchema(Schema):
    email = ma_fields.Email(required=True)

class NewPasswordSchema(Schema):
    print(Schema)
    resetToken = ma_fields.Str(required=True)
    newPassword = ma_fields.Str(required=True, validate=validate.Length(min=6))

class ReservationSchema(Schema):
    table_ids = ma_fields.List(ma_fields.Int(), required=True)  # Zamiast table_id
    reservation_start = ma_fields.DateTime(required=True)
    reservation_end = ma_fields.DateTime(required=True)
    pending = ma_fields.Bool()  # Optional, default handled in code

    @validates_schema
    def validate_dates(self, data, **kwargs):
        reservation_start = data['reservation_start'].replace(tzinfo=timezone.utc)
        reservation_end = data['reservation_end'].replace(tzinfo=timezone.utc)
        current_time = datetime.now(timezone.utc)

        if reservation_start >= reservation_end:
            raise ValidationError('reservation_start must be before reservation_end', field_name='reservation_start')

        # Sprawdzenie minimalnego i maksymalnego czasu trwania rezerwacji
        duration = reservation_end - reservation_start
        min_duration = timedelta(minutes=15)
        max_duration = timedelta(hours=4, minutes=30)

        if duration < min_duration:
            raise ValidationError('The minimal time of the reservation is 15 minutes', field_name='reservation_end')
        if duration > max_duration:
            raise ValidationError('The maximal time of the reservvation is 4.5 hours', field_name='reservation_end')

        # Sprawdzenie, czy rezerwacja jest w przyszłości
        if reservation_start < current_time:
            raise ValidationError('reservation_start must be in the future', field_name='reservation_start')
        
        # **Sprawdzenie maksymalnego wyprzedzenia (dokładnie 4 miesiące)**
        max_advance = current_time + relativedelta(months=4)
        if reservation_start > max_advance:
            raise ValidationError('The reservations can be made up to 4 months ahead', field_name='reservation_start')
        

class SettingsSchema(Schema):
    day_of_week = ma_fields.Int(required=True, validate=validate.Range(min=0, max=6))
    opening_time = ma_fields.Time(required=True, format='%H:%M:%S')
    closing_time = ma_fields.Time(required=True, format='%H:%M:%S')

    @validates_schema
    def validate_times(self, data, **kwargs):
        opening_time = data['opening_time']
        closing_time = data['closing_time']
        if opening_time == closing_time:
            raise ValidationError('Godzina otwarcia i zamknięcia nie mogą być takie same.')