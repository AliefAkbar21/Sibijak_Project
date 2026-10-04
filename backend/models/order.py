from datetime import datetime
from database.db import get_storage

class Order:
    def __init__(self, data=None):
        """Initialize order from dict data"""
        if data:
            self.id = data.get('id')
            self.customer_id = data.get('customer_id')
            self.driver_id = data.get('driver_id')
            self.name = data.get('name')
            self.address = data.get('address')
            self.latitude = data.get('latitude')
            self.longitude = data.get('longitude')
            self.waste_type = data.get('waste_type')
            self.weight = data.get('weight')
            self.base_price = data.get('base_price')
            self.admin_fee = data.get('admin_fee')
            self.additional_fee = data.get('additional_fee', 0)
            self.total_price = data.get('total_price')
            self.pickup_session = data.get('pickup_session')
            self.pickup_date = data.get('pickup_date')
            self.pickup_time = data.get('pickup_time')
            self.status = data.get('status', 'pending')
            self.notes = data.get('notes')
            self.payment_method = data.get('payment_method', 'cash')
            self.payment_proof = data.get('payment_proof')
            self.payment_verified = data.get('payment_verified', False)
            self.domicile = data.get('domicile', 'Tidak Ditentukan')
            self.is_urgent = data.get('is_urgent', False)
            self.assigned_by_admin_id = data.get('assigned_by_admin_id')
            self.created_at = data.get('created_at')
            self.updated_at = data.get('updated_at')
            self.completed_at = data.get('completed_at')
        else:
            self.id = None
            self.customer_id = None
            self.driver_id = None
            self.name = None
            self.address = None
            self.latitude = None
            self.longitude = None
            self.waste_type = None
            self.weight = None
            self.base_price = None
            self.admin_fee = None
            self.additional_fee = 0
            self.total_price = None
            self.pickup_session = None
            self.pickup_date = None
            self.pickup_time = None
            self.status = 'pending'
            self.notes = None
            self.payment_method = 'cash'
            self.payment_proof = None
            self.payment_verified = False
            self.domicile = 'Tidak Ditentukan'
            self.is_urgent = False
            self.assigned_by_admin_id = None
            self.created_at = None
            self.updated_at = None
            self.completed_at = None
    
    def calculate_price(self, base_price_per_kg, admin_fee_pct, max_weight_normal, additional_fee_pct):
        """Calculate order price"""
        self.base_price = self.weight * base_price_per_kg
        self.admin_fee = self.base_price * admin_fee_pct
        
        if self.weight > max_weight_normal:
            self.additional_fee = self.base_price * additional_fee_pct
        else:
            self.additional_fee = 0
        
        self.total_price = self.base_price + self.admin_fee + self.additional_fee
    
    def to_dict(self):
        """Convert order to dictionary"""
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'driver_id': self.driver_id,
            'name': self.name,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'waste_type': self.waste_type,
            'weight': self.weight,
            'base_price': self.base_price,
            'admin_fee': self.admin_fee,
            'additional_fee': self.additional_fee,
            'total_price': self.total_price,
            'pickup_session': self.pickup_session,
            'pickup_date': self.pickup_date,
            'pickup_time': self.pickup_time,
            'status': self.status,
            'notes': self.notes,
            'payment_method': self.payment_method,
            'payment_proof': self.payment_proof,
            'payment_verified': self.payment_verified,
            'domicile': self.domicile,
            'is_urgent': self.is_urgent,
            'assigned_by_admin_id': self.assigned_by_admin_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'completed_at': self.completed_at
        }
    
    def save(self):
        """Save order to storage"""
        storage = get_storage()
        if self.id:
            # Update existing order
            storage.update_order(self.id, self.to_dict())
        else:
            # Create new order
            order_data = storage.create_order(self.to_dict())
            self.id = order_data['id']
            self.created_at = order_data['created_at']
            self.updated_at = order_data['updated_at']
        return self
    
    @staticmethod
    def get_by_id(order_id):
        """Get order by ID"""
        storage = get_storage()
        order_data = storage.get_order_by_id(order_id)
        return Order(order_data) if order_data else None
    
    @staticmethod
    def get_all():
        """Get all orders"""
        storage = get_storage()
        orders_data = storage.get_all_orders()
        return [Order(data) for data in orders_data]
    
    @staticmethod
    def get_by_customer(customer_id):
        """Get orders by customer ID"""
        storage = get_storage()
        orders_data = storage.get_orders_by_customer(customer_id)
        return [Order(data) for data in orders_data]
    
    @staticmethod
    def get_by_driver(driver_id):
        """Get orders by driver ID"""
        storage = get_storage()
        orders_data = storage.get_orders_by_driver(driver_id)
        return [Order(data) for data in orders_data]
    
    @staticmethod
    def get_by_status(status):
        """Get orders by status"""
        storage = get_storage()
        orders_data = storage.get_orders_by_status(status)
        return [Order(data) for data in orders_data]
    
    @staticmethod
    def get_by_session(session):
        """Get orders by pickup session"""
        storage = get_storage()
        orders_data = storage.get_orders_by_session(session)
        return [Order(data) for data in orders_data]
    
    def delete(self):
        """Delete order"""
        storage = get_storage()
        storage.delete_order(self.id)
