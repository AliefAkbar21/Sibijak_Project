import re

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    """Validate Indonesian phone number"""
    pattern = r'^(\+62|62|0)[0-9]{9,12}$'
    return re.match(pattern, phone) is not None

def validate_weight(weight):
    """Validate weight (must be positive and reasonable)"""
    try:
        w = float(weight)
        return 0 < w <= 1000  # Max 1000kg
    except (ValueError, TypeError):
        return False
