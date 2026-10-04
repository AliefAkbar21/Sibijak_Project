import json
import os
from datetime import datetime

class JSONStorage:
    def __init__(self, data_dir='data'):
        self.data_dir = data_dir
        self.users_file = os.path.join(data_dir, 'users.json')
        self.orders_file = os.path.join(data_dir, 'orders.json')
        
        # Ensure data directory exists
        os.makedirs(data_dir, exist_ok=True)
        
        # Initialize files if they don't exist
        self._init_file(self.users_file)
        self._init_file(self.orders_file)
    
    def _init_file(self, filepath):
        """Initialize JSON file if it doesn't exist"""
        if not os.path.exists(filepath):
            with open(filepath, 'w') as f:
                json.dump([], f)
    
    def _read_file(self, filepath):
        """Read data from JSON file"""
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def _write_file(self, filepath, data):
        """Write data to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    # User operations
    def get_all_users(self):
        """Get all users"""
        return self._read_file(self.users_file)
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        users = self.get_all_users()
        # Convert user_id to int for comparison
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return None
        for user in users:
            if user['id'] == user_id:
                return user
        return None
    
    def get_user_by_email(self, email):
        """Get user by email"""
        users = self.get_all_users()
        for user in users:
            if user['email'] == email:
                return user
        return None
    
    def create_user(self, user_data):
        """Create new user"""
        users = self.get_all_users()
        
        # Generate new ID
        new_id = max([u['id'] for u in users], default=0) + 1
        user_data['id'] = new_id
        user_data['created_at'] = datetime.utcnow().isoformat()
        user_data['updated_at'] = datetime.utcnow().isoformat()
        
        users.append(user_data)
        self._write_file(self.users_file, users)
        return user_data
    
    def update_user(self, user_id, update_data):
        """Update user"""
        users = self.get_all_users()
        for i, user in enumerate(users):
            if user['id'] == user_id:
                update_data['updated_at'] = datetime.utcnow().isoformat()
                users[i].update(update_data)
                self._write_file(self.users_file, users)
                return users[i]
        return None
    
    def delete_user(self, user_id):
        """Delete user"""
        users = self.get_all_users()
        users = [u for u in users if u['id'] != user_id]
        self._write_file(self.users_file, users)
    
    # Order operations
    def get_all_orders(self):
        """Get all orders"""
        return self._read_file(self.orders_file)
    
    def get_order_by_id(self, order_id):
        """Get order by ID"""
        orders = self.get_all_orders()
        for order in orders:
            if order['id'] == order_id:
                return order
        return None
    
    def get_orders_by_customer(self, customer_id):
        """Get orders by customer ID"""
        orders = self.get_all_orders()
        try:
            customer_id = int(customer_id)
        except (ValueError, TypeError):
            return []
        return [o for o in orders if o.get('customer_id') == customer_id]
    
    def get_orders_by_driver(self, driver_id):
        """Get orders by driver ID"""
        orders = self.get_all_orders()
        try:
            driver_id = int(driver_id)
        except (ValueError, TypeError):
            return []
        return [o for o in orders if o.get('driver_id') == driver_id]
    
    def get_orders_by_status(self, status):
        """Get orders by status"""
        orders = self.get_all_orders()
        return [o for o in orders if o['status'] == status]
    
    def get_orders_by_session(self, session):
        """Get orders by pickup session"""
        orders = self.get_all_orders()
        return [o for o in orders if o['pickup_session'] == session]
    
    def create_order(self, order_data):
        """Create new order"""
        orders = self.get_all_orders()
        
        # Generate new ID
        new_id = max([o['id'] for o in orders], default=0) + 1
        order_data['id'] = new_id
        order_data['created_at'] = datetime.utcnow().isoformat()
        order_data['updated_at'] = datetime.utcnow().isoformat()
        
        orders.append(order_data)
        self._write_file(self.orders_file, orders)
        return order_data
    
    def update_order(self, order_id, update_data):
        """Update order"""
        orders = self.get_all_orders()
        for i, order in enumerate(orders):
            if order['id'] == order_id:
                update_data['updated_at'] = datetime.utcnow().isoformat()
                orders[i].update(update_data)
                self._write_file(self.orders_file, orders)
                return orders[i]
        return None
    
    def delete_order(self, order_id):
        """Delete order"""
        orders = self.get_all_orders()
        orders = [o for o in orders if o['id'] != order_id]
        self._write_file(self.orders_file, orders)

# Global storage instance
storage = None

def init_db(app):
    """Initialize JSON storage"""
    global storage
    data_dir = app.config.get('DATA_DIR', 'data')
    storage = JSONStorage(data_dir)
    return storage

def get_storage():
    """Get storage instance"""
    return storage
