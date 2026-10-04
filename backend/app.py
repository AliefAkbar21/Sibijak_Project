from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config.config import Config
from routes import auth_routes, customer_routes, driver_routes, admin_routes
from database.db import init_db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # JWT error handlers
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({'error': 'Missing or invalid authorization token'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({'error': 'Invalid token'}), 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401
    
    # Initialize JSON storage
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(customer_routes.bp)
    app.register_blueprint(driver_routes.bp)
    app.register_blueprint(admin_routes.bp)
    
    @app.route('/')
    def index():
        return {'message': 'Pengangkut Sampah API', 'status': 'running', 'storage': 'JSON-based'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
