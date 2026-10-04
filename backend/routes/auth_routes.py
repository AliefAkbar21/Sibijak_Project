from flask import Blueprint, request, jsonify
from models.user import User
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from utils.validators import validate_email

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Valid regions for drivers
VALID_REGIONS = [
    "Larangan, Larangan Utara",
    "Larangan, Larangan Selatan",
    "Larangan, Larangan Indah",
    "Larangan, Gaga",
    "Larangan, Cipadu",
    "Larangan, Cipadu Jaya",
    "Larangan, Kreo",
    "Larangan, Kreo Selatan"
]
MAX_DRIVERS_PER_REGION = 100

@bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    
    # Validation
    required_fields = ['email', 'password', 'name', 'role']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    if User.get_by_email(data['email']):
        return jsonify({'error': 'Email already registered'}), 409
    
    # Driver specific validation
    if data['role'] == 'driver':
        wilayah = data.get('wilayah')
        if not wilayah:
            return jsonify({'error': 'Wilayah penugasan wajib diisi untuk driver'}), 400
        
        if wilayah not in VALID_REGIONS:
            return jsonify({'error': 'Wilayah tidak valid'}), 400
        
        # Check region driver limit
        all_drivers = User.get_by_role('driver')
        region_drivers = [d for d in all_drivers if d.wilayah == wilayah]
        if len(region_drivers) >= MAX_DRIVERS_PER_REGION:
            return jsonify({'error': f'Wilayah {wilayah} sudah mencapai batas maksimal {MAX_DRIVERS_PER_REGION} driver'}), 400
    
    # Create user
    user = User()
    user.email = data['email']
    user.name = data['name']
    user.role = data['role']
    user.phone = data.get('phone')
    user.address = data.get('address')
    user.set_password(data['password'])
    
    # Driver specific fields
    if data['role'] == 'driver':
        user.session_preference = data.get('session_preference', 'both')
        user.vehicle_number = data.get('vehicle_number')
        user.wilayah = data.get('wilayah')
        user.is_verified = False  # Drivers need admin verification
    
    user.save()
    
    return jsonify({
        'message': 'User registered successfully',
        'user': user.to_public_dict()
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password required'}), 400
    
    user = User.get_by_email(data['email'])
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is disabled'}), 403
    
    # Ensure user.id is string for JWT
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_public_dict()
    }), 200

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    # Convert to int since JSON storage uses integer IDs
    user = User.get_by_id(int(user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_public_dict()), 200

    if data['role'] not in ('customer', 'driver'):
        return jsonify({'error': 'Role tidak valid'}), 400