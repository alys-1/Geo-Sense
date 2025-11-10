from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from datetime import datetime
import logging

# Import route modules
from routes.data_fetching import data_bp
from routes.analysis import analysis_bp
from routes.model_insights import model_insights_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "X47KFIvPV5LB2FKHlVI7zIdaOU3GoUQ9")
app.config['TOMTOM_API_KEY'] = TOMTOM_API_KEY

# Register blueprints
app.register_blueprint(data_bp, url_prefix='/api')
app.register_blueprint(analysis_bp, url_prefix='/api')
app.register_blueprint(model_insights_bp, url_prefix='/api')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "GeoSense ML Zone Classification Backend"
    }), 200

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify({
        "api_key_configured": bool(TOMTOM_API_KEY),
        "default_radius": 1000,
        "default_city": "Pune",
        "features": [
            "poi_density",
            "office_ratio",
            "residential_ratio",
            "leisure_ratio",
            "traffic_ratio",
            "diversity_index"
        ]
    }), 200

@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request", "message": str(error)}), 400

@app.errorhandler(500)
def server_error(error):
    logger.error(f"Server error: {error}")
    return jsonify({"error": "Server error", "message": str(error)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
