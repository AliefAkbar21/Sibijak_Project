from flask import Blueprint, request, jsonify
from models.order import Order
from models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

bp = Blueprint('driver', __name__, url_prefix='/api/driver')

@bp.route('/orders', methods=['GET'])
@jwt_required()
def get_driver_orders():
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'driver':
        return jsonify({'error': 'Only drivers can access this'}), 403
    
    # Get pending orders in driver's region AND orders assigned by admin to this driver
    all_orders = Order.get_all()
    
    # Pending orders in driver's region (not assigned to anyone yet)
    pending_orders = [o for o in all_orders if o.status == 'pending']
    
    # Filter out QRIS orders that haven't been verified
    pending_orders = [o for o in pending_orders if 
                      o.payment_method == 'cash' or 
                      o.payment_verified]
    
    # Filter by driver's session preference
    if user.session_preference in ['morning', 'afternoon']:
        pending_orders = [o for o in pending_orders if o.pickup_session == user.session_preference]
    
    # Filter by driver's wilayah (region) - only show orders in driver's area
    if user.wilayah:
        pending_orders = [o for o in pending_orders if o.domicile == user.wilayah]
    
    # Orders assigned by admin to this specific driver
    assigned_by_admin = [o for o in all_orders if 
                         o.status == 'assigned' and 
                         o.driver_id == user_id]
    
    # Combine both lists
    orders = pending_orders + assigned_by_admin
    
    # Sort by created_at descending
    orders.sort(key=lambda x: x.created_at if x.created_at else '', reverse=True)
    
    return jsonify({
        'orders': [order.to_dict() for order in orders],
        'session_preference': user.session_preference,
        'wilayah': user.wilayah
    }), 200

@bp.route('/orders/assigned', methods=['GET'])
@jwt_required()
def get_assigned_orders():
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'driver':
        return jsonify({'error': 'Only drivers can access this'}), 403
    
    orders = Order.get_by_driver(user_id)
    # Show orders that driver has accepted (not just assigned by admin)
    orders = [o for o in orders if o.status in ['accepted', 'in_progress']]
    
    # Sort by pickup_date and pickup_time
    orders.sort(key=lambda x: (x.pickup_date if x.pickup_date else '', x.pickup_time if x.pickup_time else ''))
    
    return jsonify({
        'orders': [order.to_dict() for order in orders]
    }), 200


@bp.route('/orders/history', methods=['GET'])
@jwt_required()
def get_completed_orders():
    """Get driver's completed orders history"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'driver':
        return jsonify({'error': 'Only drivers can access this'}), 403
    
    orders = Order.get_by_driver(user_id)
    orders = [o for o in orders if o.status == 'completed']
    
    # Sort by completed_at descending (newest first)
    orders.sort(key=lambda x: x.completed_at if x.completed_at else '', reverse=True)
    
    # Calculate total earnings
    total_earnings = sum([o.total_price for o in orders if o.total_price])
    
    return jsonify({
        'orders': [order.to_dict() for order in orders],
        'total_completed': len(orders),
        'total_earnings': float(total_earnings)
    }), 200

@bp.route('/orders/<int:order_id>/accept', methods=['POST'])
@jwt_required()
def accept_order(order_id):
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'driver':
        return jsonify({'error': 'Only drivers can accept orders'}), 403
    
    order = Order.get_by_id(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Handle two cases: 
    # 1. Pending orders - driver picks it themselves
    # 2. Assigned orders - admin assigned to this driver
    if order.status == 'pending':
        # Driver is picking an unassigned order
        # Block unverified QRIS payments - must be verified by admin first
        if order.payment_method == 'qris' and not order.payment_verified:
            return jsonify({'error': 'Pembayaran QRIS belum diverifikasi admin. Tunggu verifikasi sebelum menerima pesanan.'}), 400
        
        # Check race condition - verify order is still pending before accepting
        fresh_order = Order.get_by_id(order_id)
        if fresh_order.status != 'pending':
            return jsonify({'error': 'Pesanan sudah diambil driver lain'}), 400
        
        order.driver_id = user_id
        order.status = 'accepted'
        order.save()
        
        return jsonify({
            'message': 'Order accepted successfully',
            'order': order.to_dict()
        }), 200
        
    elif order.status == 'assigned':
        # Admin has assigned this order to a driver
        # Verify it's assigned to this driver
        if order.driver_id != user_id:
            return jsonify({'error': 'Order is not assigned to you'}), 403
        
        # Driver accepts the admin-assigned order
        order.status = 'accepted'
        order.save()
        
        return jsonify({
            'message': 'Order accepted successfully',
            'order': order.to_dict()
        }), 200
    else:
        return jsonify({'error': 'Order is not available'}), 400

@bp.route('/orders/<int:order_id>/start', methods=['POST'])
@jwt_required()
def start_order(order_id):
    user_id = int(get_jwt_identity())
    order = Order.get_by_id(order_id)
    
    if not order or order.driver_id != user_id:
        return jsonify({'error': 'Order not found or unauthorized'}), 404
    
    if order.status != 'accepted':
        return jsonify({'error': 'Order must be accepted first before starting'}), 400
    
    order.status = 'in_progress'
    order.save()
    
    return jsonify({
        'message': 'Order started',
        'order': order.to_dict()
    }), 200

@bp.route('/orders/<int:order_id>/reject', methods=['POST'])
@jwt_required()
def reject_order(order_id):
    """Driver rejects an admin-assigned order"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'driver':
        return jsonify({'error': 'Only drivers can reject orders'}), 403
    
    order = Order.get_by_id(order_id)
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Only allow rejecting orders that are assigned by admin but not yet accepted
    if order.status != 'assigned':
        return jsonify({'error': 'Only assigned orders can be rejected'}), 400
    
    if order.driver_id != user_id:
        return jsonify({'error': 'Order is not assigned to you'}), 403
    
    # Reset order back to pending state
    order.driver_id = None
    order.status = 'pending'
    order.save()
    
    return jsonify({
        'message': 'Order rejected successfully',
        'order': order.to_dict()
    }), 200

@bp.route('/orders/<int:order_id>/complete', methods=['POST'])
@jwt_required()
def complete_order(order_id):
    user_id = int(get_jwt_identity())
    order = Order.get_by_id(order_id)
    
    if not order or order.driver_id != user_id:
        return jsonify({'error': 'Order not found or unauthorized'}), 404
    
    if order.status not in ['accepted', 'in_progress']:
        return jsonify({'error': 'Order cannot be completed'}), 400
    
    order.status = 'completed'
    order.completed_at = datetime.utcnow().isoformat()
    order.save()
    
    return jsonify({
        'message': 'Order completed successfully',
        'order': order.to_dict()
    }), 200


@bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_driver_profile():
    """Update driver profile information"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if not user or user.role != 'driver':
        return jsonify({'error': 'Driver not found'}), 404
    
    data = request.get_json()
    
    # Updatable fields
    if 'phone' in data:
        user.phone = data['phone']
    if 'address' in data:
        user.address = data['address']
    if 'session_preference' in data:
        if data['session_preference'] in ['morning', 'afternoon', 'both']:
            user.session_preference = data['session_preference']
    if 'vehicle_number' in data:
        user.vehicle_number = data['vehicle_number']
    if 'wilayah' in data:
        user.wilayah = data['wilayah']
    
    user.save()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_public_dict()
    }), 200


@bp.route('/profile/picture', methods=['POST'])
@jwt_required()
def update_driver_profile_picture():
    """Update driver profile picture"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if not user or user.role != 'driver':
        return jsonify({'error': 'Driver not found'}), 404
    
    data = request.get_json()
    
    if 'profile_picture' not in data:
        return jsonify({'error': 'Profile picture is required'}), 400
    
    user.profile_picture = data['profile_picture']
    user.save()
    
    return jsonify({
        'message': 'Profile picture updated successfully',
        'user': user.to_public_dict()
    }), 200
