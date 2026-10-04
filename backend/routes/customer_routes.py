from flask import Blueprint, request, jsonify
from models.order import Order
from models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.config import Config
from datetime import datetime

bp = Blueprint('customer', __name__, url_prefix='/api/customer')

@bp.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'customer':
        return jsonify({'error': 'Only customers can create orders'}), 403
    
    data = request.get_json()
    
    # Validation
    required_fields = ['name', 'address', 'waste_type', 'weight', 'pickup_session', 'pickup_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create order
    order = Order()
    order.customer_id = user_id
    order.name = data['name']
    order.address = data['address']
    order.domicile = data.get('domicile', 'Tidak Ditentukan')
    order.latitude = data.get('latitude')
    order.longitude = data.get('longitude')
    order.waste_type = data['waste_type']
    order.weight = float(data['weight'])
    order.pickup_session = data['pickup_session']
    order.pickup_date = data['pickup_date']
    order.notes = data.get('notes')
    order.payment_method = data.get('payment_method', 'cash')
    
    # Handle QRIS payment proof
    if order.payment_method == 'qris':
        payment_proof = data.get('payment_proof')
        if payment_proof:
            order.payment_proof = payment_proof
            order.payment_verified = False
    
    # Calculate price
    order.calculate_price(
        Config.BASE_PRICE_PER_KG,
        Config.ADMIN_FEE_PERCENTAGE,
        Config.MAX_WEIGHT_NORMAL,
        Config.ADDITIONAL_FEE_PERCENTAGE
    )
    
    order.save()
    
    return jsonify({
        'message': 'Order created successfully',
        'order': order.to_dict()
    }), 201

@bp.route('/orders', methods=['GET'])
@jwt_required()
def get_customer_orders():
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'customer':
        return jsonify({'error': 'Only customers can access this'}), 403
    
    orders = Order.get_by_customer(user_id)
    # Sort by created_at descending
    orders.sort(key=lambda x: x.created_at if x.created_at else '', reverse=True)
    
    return jsonify({
        'orders': [order.to_dict() for order in orders]
    }), 200

@bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order_detail(order_id):
    user_id = int(get_jwt_identity())
    order = Order.get_by_id(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    if order.customer_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(order.to_dict()), 200

@bp.route('/calculate-price', methods=['POST'])
@jwt_required()
def calculate_price():
    try:
        data = request.get_json()
        
        if not data or 'weight' not in data:
            return jsonify({'error': 'Weight is required'}), 400
        
        weight = float(data['weight'])
        
        if weight <= 0:
            return jsonify({'error': 'Weight must be greater than 0'}), 400
        
        base_price = weight * Config.BASE_PRICE_PER_KG
        admin_fee = base_price * Config.ADMIN_FEE_PERCENTAGE
        additional_fee = base_price * Config.ADDITIONAL_FEE_PERCENTAGE if weight > Config.MAX_WEIGHT_NORMAL else 0
        total_price = base_price + admin_fee + additional_fee
        
        return jsonify({
            'weight': weight,
            'base_price': base_price,
            'admin_fee': admin_fee,
            'additional_fee': additional_fee,
            'total_price': total_price,
            'breakdown': {
                'price_per_kg': Config.BASE_PRICE_PER_KG,
                'admin_fee_percentage': Config.ADMIN_FEE_PERCENTAGE * 100,
                'additional_fee_percentage': Config.ADDITIONAL_FEE_PERCENTAGE * 100 if weight > Config.MAX_WEIGHT_NORMAL else 0
            }
        }), 200
    except ValueError as e:
        return jsonify({'error': 'Invalid weight value'}), 400
    except Exception as e:
        print(f"Error in calculate_price: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update customer profile"""
    try:
        user_id = int(get_jwt_identity())
        user = User.get_by_id(user_id)
        
        if user.role != 'customer':
            return jsonify({'error': 'Only customers can update profile'}), 403
        
        data = request.get_json()
        
        print(f"Updating profile for user {user_id}")
        print(f"Current user data: name={user.name}, phone={user.phone}, address={user.address}")
        print(f"Update data: {data}")
        
        # Update allowed fields
        if 'name' in data and data['name']:
            user.name = data['name']
        
        if 'phone' in data:
            user.phone = data['phone']
        
        if 'address' in data:
            user.address = data['address']
        
        if 'city' in data:
            user.city = data['city']
        
        if 'postal_code' in data:
            user.postal_code = data['postal_code']
        
        user.updated_at = datetime.now().isoformat()
        
        print(f"Updated user data: name={user.name}, phone={user.phone}, address={user.address}")
        
        user.save()
        
        # Verify save by reading back
        saved_user = User.get_by_id(user_id)
        print(f"Saved user data: name={saved_user.name}, phone={saved_user.phone}, address={saved_user.address}")
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': saved_user.to_public_dict()
        }), 200
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@bp.route('/profile/picture', methods=['POST'])
@jwt_required()
def update_profile_picture():
    """Update user's profile picture"""
    try:
        user_id = int(get_jwt_identity())
        user = User.get_by_id(user_id)
        
        if user.role != 'customer':
            return jsonify({'error': 'Only customers can update profile picture'}), 403
        
        data = request.get_json()
        
        if 'profile_picture' not in data:
            return jsonify({'error': 'profile_picture is required'}), 400
        
        profile_picture = data['profile_picture']
        
        # Validate base64 image format
        if not profile_picture.startswith('data:image/'):
            return jsonify({'error': 'Invalid image format'}), 400
        
        # Update user profile picture
        user.profile_picture = profile_picture
        user.updated_at = datetime.now().isoformat()
        
        # Save to database
        user.save()
        
        return jsonify({
            'message': 'Profile picture updated successfully',
            'profile_picture': profile_picture
        }), 200
        
    except Exception as e:
        print(f"Error updating profile picture: {str(e)}")
        return jsonify({'error': str(e)}), 500
