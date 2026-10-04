import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
    
    # Data Directory for JSON files
    DATA_DIR = os.getenv('DATA_DIR', 'data')
    
    # Mail
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    
    # App Settings
    ADMIN_FEE_PERCENTAGE = float(os.getenv('ADMIN_FEE_PERCENTAGE', 0.01))
    BASE_PRICE_PER_KG = float(os.getenv('BASE_PRICE_PER_KG', 10000))
    MAX_WEIGHT_NORMAL = float(os.getenv('MAX_WEIGHT_NORMAL', 10))
    ADDITIONAL_FEE_PERCENTAGE = float(os.getenv('ADDITIONAL_FEE_PERCENTAGE', 0.05))
