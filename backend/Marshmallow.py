from marshmallow import Schema, fields as ma_fields, validate, ValidationError, validates_schema
from datetime import datetime, timezone


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
    token = ma_fields.Str(required=True)
    new_password = ma_fields.Str(required=True, validate=validate.Length(min=6))

class ReservationSchema(Schema):
    table_id = ma_fields.Int(required=True)
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
        if reservation_start < current_time:
            raise ValidationError('reservation_start must be in the future', field_name='reservation_start')
