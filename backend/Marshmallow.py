from marshmallow import Schema, fields as ma_fields, validate, ValidationError


# Marshmallow Schemas for Validation
class UserSchema(Schema):
    email = ma_fields.Email(required=True)
    first_name = ma_fields.Str(required=True, validate=validate.Regexp('^[A-Za-z]+$'))
    last_name = ma_fields.Str(required=True, validate=validate.Regexp('^[A-Za-z]+$'))
    password = ma_fields.Str(required=True, validate=validate.Length(min=6))
    phone = ma_fields.Str(validate=validate.Regexp(r'^\d{9}$'))

class LoginSchema(Schema):
    email = ma_fields.Email(required=True)
    password = ma_fields.Str(required=True)

class ResetPasswordSchema(Schema):
    email = ma_fields.Email(required=True)

class NewPasswordSchema(Schema):
    token = ma_fields.Str(required=True)
    new_password = ma_fields.Str(required=True, validate=validate.Length(min=6))