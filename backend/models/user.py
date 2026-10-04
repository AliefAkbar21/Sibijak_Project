from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from database.db import get_storage

class User:
    def __init__(self, data=None):
        """Initialize user from dict data"""
        if data:
            self.id = data.get('id')
            self.email = data.get('email')
            self.password_hash = data.get('password_hash')
            self.name = data.get('name')
            self.role = data.get('role')
            self.phone = data.get('phone')
            self.address = data.get('address')
            self.city = data.get('city')
            self.postal_code = data.get('postal_code')
            self.is_verified = data.get('is_verified', False)
            self.is_active = data.get('is_active', True)
            self.session_preference = data.get('session_preference') or data.get('driver_session')
            self.vehicle_number = data.get('vehicle_number')
            self.wilayah = data.get('wilayah')
            self.profile_picture = data.get('profile_picture')
            self.created_at = data.get('created_at')
            self.updated_at = data.get('updated_at')
        else:
            self.id = None
            self.email = None
            self.password_hash = None
            self.name = None
            self.role = None
            self.phone = None
            self.address = None
            self.city = None
            self.postal_code = None
            self.is_verified = False
            self.is_active = True
            self.session_preference = None
            self.vehicle_number = None
            self.wilayah = None
            self.profile_picture = None
            self.created_at = None
            self.updated_at = None
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if password matches"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'password_hash': self.password_hash,
            'name': self.name,
            'role': self.role,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'postal_code': self.postal_code,
            'is_verified': self.is_verified,
            'is_active': self.is_active,
            'session_preference': self.session_preference if self.role == 'driver' else None,
            'driver_session': self.session_preference if self.role == 'driver' else None,
            'vehicle_number': self.vehicle_number if self.role == 'driver' else None,
            'wilayah': self.wilayah if self.role == 'driver' else None,
            'profile_picture': self.profile_picture,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
    
    def to_public_dict(self):
        """Convert user to public dictionary (without password_hash)"""
        data = self.to_dict()
        data.pop('password_hash', None)
        return data
    
    def save(self):
        """Save user to storage"""
        storage = get_storage()
        if self.id:
            # Update existing user
            storage.update_user(self.id, self.to_dict())
        else:
            # Create new user
            user_data = storage.create_user(self.to_dict())
            self.id = user_data['id']
            self.created_at = user_data['created_at']
            self.updated_at = user_data['updated_at']
        return self
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        storage = get_storage()
        user_data = storage.get_user_by_id(user_id)
        return User(user_data) if user_data else None
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        storage = get_storage()
        user_data = storage.get_user_by_email(email)
        return User(user_data) if user_data else None
    
    @staticmethod
    def get_all():
        """Get all users"""
        storage = get_storage()
        users_data = storage.get_all_users()
        return [User(data) for data in users_data]
    
    @staticmethod
    def get_by_role(role):
        """Get users by role"""
        storage = get_storage()
        users_data = storage.get_all_users()
        return [User(data) for data in users_data if data['role'] == role]
    
    def delete(self):
        """Delete user"""
        storage = get_storage()
        storage.delete_user(self.id)
