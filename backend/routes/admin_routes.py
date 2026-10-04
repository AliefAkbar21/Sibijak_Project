from flask import Blueprint, request, jsonify
from models.order import Order
from models.user import User
from flask_jwt_extended import jwt_required, get_jwt_identity

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    # Get all data
    all_orders = Order.get_all()
    all_users = User.get_all()
    
    # Calculate statistics
    total_orders = len(all_orders)
    pending_orders = len([o for o in all_orders if o.status == 'pending'])
    completed_orders = len([o for o in all_orders if o.status == 'completed'])
    cancelled_orders = len([o for o in all_orders if o.status == 'cancelled'])
    total_customers = len([u for u in all_users if u.role == 'customer'])
    total_drivers = len([u for u in all_users if u.role == 'driver'])
    
    # Revenue
    completed = [o for o in all_orders if o.status == 'completed']
    total_revenue = sum([o.total_price for o in completed if o.total_price])
    total_admin_fee = sum([o.admin_fee for o in completed if o.admin_fee])
    
    return jsonify({
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        'cancelled_orders': cancelled_orders,
        'total_customers': total_customers,
        'total_drivers': total_drivers,
        'total_revenue': float(total_revenue),
        'total_admin_fee': float(total_admin_fee)
    }), 200

@bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    role = request.args.get('role')
    
    if role:
        users = User.get_by_role(role)
    else:
        users = User.get_all()
    
    return jsonify([u.to_public_dict() for u in users]), 200

@bp.route('/orders', methods=['GET'])
@jwt_required()
def get_all_orders():
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    status = request.args.get('status')
    
    if status:
        orders = Order.get_by_status(status)
    else:
        orders = Order.get_all()
    
    # Sort by created_at descending
    orders.sort(key=lambda x: x.created_at if x.created_at else '', reverse=True)
    
    # Add customer and driver names to orders
    orders_with_details = []
    for order in orders:
        order_dict = order.to_dict()
        
        # Get customer name
        if order.customer_id:
            customer = User.get_by_id(order.customer_id)
            order_dict['customer_name'] = customer.name if customer else None
        else:
            order_dict['customer_name'] = None
        
        # Get driver name
        if order.driver_id:
            driver = User.get_by_id(order.driver_id)
            order_dict['driver_name'] = driver.name if driver else None
        else:
            order_dict['driver_name'] = None
        
        # Add phone from order name field or customer
        if not order_dict.get('phone') and order.customer_id:
            customer = User.get_by_id(order.customer_id)
            order_dict['phone'] = customer.phone if customer else None
        
        orders_with_details.append(order_dict)
    
    return jsonify(orders_with_details), 200

@bp.route('/orders/<int:order_id>/assign', methods=['POST'])
@jwt_required()
def assign_driver_to_order(order_id):
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    driver_id = data.get('driver_id')
    
    if not driver_id:
        return jsonify({'error': 'Driver ID is required'}), 400
    
    # Convert driver_id to int
    try:
        driver_id = int(driver_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid driver ID format'}), 400
    
    order = Order.get_by_id(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    if order.status != 'pending':
        return jsonify({'error': 'Only pending orders can be assigned'}), 400
    
    driver = User.get_by_id(driver_id)
    if not driver or driver.role != 'driver':
        return jsonify({'error': 'Invalid driver'}), 400
    
    if not driver.is_verified:
        return jsonify({'error': 'Driver is not verified'}), 400
    
    # Check if driver session matches order pickup session
    if driver.session_preference != 'both' and driver.session_preference != order.pickup_session:
        return jsonify({'error': 'Driver session does not match order pickup session'}), 400
    
    # Assign driver
    order.driver_id = driver_id
    order.status = 'assigned'
    order.assigned_by_admin_id = user_id

    #Check if cross-region assignment (urgent)
    if driver.wilayah != order.domicile:
        order.is_urgent = True
    order.save()
    
    return jsonify({
        'message': 'Driver assigned successfully',
        'order': order.to_dict()
    }), 200

@bp.route('/orders/<int:order_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(order_id):
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    order = Order.get_by_id(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    if order.status in ['completed', 'cancelled']:
        return jsonify({'error': f'Cannot cancel order with status: {order.status}'}), 400
    
    order.status = 'cancelled'
    order.save()
    
    return jsonify({
        'message': 'Order cancelled successfully',
        'order': order.to_dict()
    }), 200

@bp.route('/orders/<int:order_id>/verify-payment', methods=['POST'])
@jwt_required()
def verify_payment(order_id):
    """Verify QRIS payment proof"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    order = Order.get_by_id(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    if order.payment_method != 'qris':
        return jsonify({'error': 'This order does not use QRIS payment'}), 400
    
    if not order.payment_proof:
        return jsonify({'error': 'No payment proof uploaded'}), 400
    
    if order.payment_verified:
        return jsonify({'error': 'Payment already verified'}), 400
    
    order.payment_verified = True
    order.save()
    
    return jsonify({
        'message': 'Payment verified successfully',
        'order': order.to_dict()
    }), 200

@bp.route('/orders/<int:order_id>/reject-payment', methods=['POST'])
@jwt_required()
def reject_payment(order_id):
    """Reject QRIS payment and cancel order"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    order = Order.get_by_id(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    if order.payment_method != 'qris':
        return jsonify({'error': 'This order does not use QRIS payment'}), 400
    
    if order.payment_verified:
        return jsonify({'error': 'Cannot reject verified payment'}), 400
    
    # Cancel the order - customer needs to re-order
    order.status = 'cancelled'
    order.save()
    
    return jsonify({
        'message': 'Payment rejected and order cancelled',
        'order': order.to_dict()
    }), 200


# Hardcoded regions for Larangan area
REGIONS = [
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

@bp.route('/regional-report', methods=['GET'])
@jwt_required()
def get_regional_report():
    """Get regional assignment report with driver counts per region"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    # Get all verified drivers
    all_drivers = User.get_by_role('driver')
    verified_drivers = [d for d in all_drivers if d.is_verified]
    
    # Get all active orders to check driver availability
    all_orders = Order.get_all()
    active_orders = [o for o in all_orders if o.status in ['assigned', 'in_progress', 'picked_up']]
    busy_driver_ids = set([o.driver_id for o in active_orders if o.driver_id])
    
    regional_data = []
    
    for region_name in REGIONS:
        # Filter drivers by wilayah field
        region_drivers = [
            d for d in verified_drivers 
            if d.wilayah and d.wilayah.lower() == region_name.lower()
        ]
        
        # Build driver list with availability status
        drivers_data = []
        available_count = 0
        
        for driver in region_drivers:
            is_available = driver.id not in busy_driver_ids
            if is_available:
                available_count += 1
            
            drivers_data.append({
                'id': driver.id,
                'name': driver.name,
                'phone': driver.phone,
                'vehicle_number': driver.vehicle_number,
                'driver_session': driver.session_preference,
                'profile_picture': driver.profile_picture,
                'is_available': is_available
            })
        
        regional_data.append({
            'name': region_name,
            'total_drivers': len(region_drivers),
            'available_count': available_count,
            'max_drivers': MAX_DRIVERS_PER_REGION,
            'drivers': drivers_data
        })
    
    return jsonify(regional_data), 200


@bp.route('/drivers', methods=['GET'])
@jwt_required()
def get_all_drivers():
    """Get all drivers for admin management"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    verified = request.args.get('verified')
    
    drivers = User.get_by_role('driver')
    
    if verified == 'true':
        drivers = [d for d in drivers if d.is_verified]
    elif verified == 'false':
        drivers = [d for d in drivers if not d.is_verified]
    
    # Sort by created_at descending (newest first)
    drivers.sort(key=lambda x: x.created_at if x.created_at else '', reverse=True)
    
    return jsonify([d.to_public_dict() for d in drivers]), 200


@bp.route('/drivers/<int:driver_id>/verify', methods=['POST'])
@jwt_required()
def verify_driver(driver_id):
    """Verify/approve a driver"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    driver = User.get_by_id(driver_id)
    if not driver or driver.role != 'driver':
        return jsonify({'error': 'Driver not found'}), 404
    
    if driver.is_verified:
        return jsonify({'error': 'Driver already verified'}), 400
    
    driver.is_verified = True
    driver.save()
    
    return jsonify({
        'message': 'Driver verified successfully',
        'driver': driver.to_public_dict()
    }), 200


@bp.route('/drivers/<int:driver_id>/reject', methods=['POST'])
@jwt_required()
def reject_driver(driver_id):
    """Reject a driver registration"""
    user_id = int(get_jwt_identity())
    user = User.get_by_id(user_id)
    
    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    driver = User.get_by_id(driver_id)
    if not driver or driver.role != 'driver':
        return jsonify({'error': 'Driver not found'}), 404
    
    # Delete the driver account
    driver.delete()
    
    return jsonify({
        'message': 'Driver rejected and account deleted'
    }), 200
