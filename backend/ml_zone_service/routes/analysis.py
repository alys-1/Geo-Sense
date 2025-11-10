from flask import Blueprint, request, jsonify, current_app
import logging
import numpy as np
from utils.tomtom_api import TomTomClient
from utils.features import FeatureEngineer
from utils.ml_models import ZoneClassifier

analysis_bp = Blueprint('analysis', __name__)
logger = logging.getLogger(__name__)

# Global classifier instance (will be trained on first request)
_classifier = None

def get_or_init_classifier():
    """Get or initialize the global classifier."""
    global _classifier
    if _classifier is None:
        _classifier = ZoneClassifier(n_clusters=3)
        # Train with synthetic data initially
        _train_classifier_with_synthetic_data()
    return _classifier

def _train_classifier_with_synthetic_data():
    """Train classifier with synthetic data for MVP."""
    global _classifier
    
    np.random.seed(42)
    n_samples = 100
    
    # Generate synthetic features
    synthetic_features = np.random.randn(n_samples, 7) * 0.3 + np.array([
        50,    # poi_density
        0.3,   # office_ratio
        0.4,   # residential_ratio
        0.3,   # leisure_ratio
        0.6,   # traffic_ratio
        2.0,   # diversity_index
        100    # total_pois
    ])
    
    feature_engineer = FeatureEngineer()
    feature_names = feature_engineer.get_feature_names()
    
    try:
        _classifier.train(synthetic_features, feature_names)
        logger.info("Classifier trained with synthetic data")
    except Exception as e:
        logger.error(f"Error training classifier: {e}")

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_zone():
    """
    Analyze a zone and predict its type using ML models.
    Request body: {"lat": float, "lon": float, "radius": int (optional)}
    Returns: Zone classification with features and confidence
    """
    try:
        data = request.get_json()
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))
        radius = int(data.get('radius', 1000))
        
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            return jsonify({"error": "Invalid coordinates"}), 400
        
        # Fetch data
        tomtom = TomTomClient(current_app.config['TOMTOM_API_KEY'])
        pois = tomtom.fetch_pois(lat, lon, radius)
        current_speed, free_flow_speed, confidence = tomtom.fetch_traffic_flow(lat, lon)
        
        # Calculate traffic ratio
        if current_speed and free_flow_speed and free_flow_speed > 0:
            traffic_ratio = min(1.0, current_speed / free_flow_speed)
        else:
            traffic_ratio = 0.5
        
        # Engineer features
        feature_engineer = FeatureEngineer(radius)
        features = feature_engineer.extract_features(pois, traffic_ratio)
        
        # Get or initialize classifier
        classifier = get_or_init_classifier()
        
        # Make prediction
        prediction = classifier.predict(features)
        
        # Extract feature importance
        feature_importance = classifier.get_feature_importance()
        
        response = {
            "location": {
                "lat": lat,
                "lon": lon,
                "radius": radius
            },
            "zone_classification": {
                "zone_type": prediction["zone_type"],
                "zone_color": prediction["zone_color"],
                "confidence": prediction["confidence"],
                "probabilities": prediction["probabilities"]
            },
            "features": {
                "values": features,
                "poi_count": int(features.get('total_pois', 0)),
                "dominant_category": _get_dominant_category(pois)
            },
            "traffic": {
                "current_speed": current_speed,
                "free_flow_speed": free_flow_speed,
                "traffic_ratio": float(traffic_ratio),
                "confidence": confidence
            },
            "model_insights": {
                "feature_importance": feature_importance,
                "kmeans_cluster": prediction["kmeans_cluster"],
                "kmeans_distance": prediction["kmeans_distance"],
                "pca_coordinates": prediction["pca_coordinates"]
            }
        }
        
        return jsonify(response), 200
    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Error in analyze_zone: {e}")
        return jsonify({"error": "Server error"}), 500

@analysis_bp.route('/features', methods=['POST'])
def get_features():
    """
    Get engineered features for a location.
    Request body: {"lat": float, "lon": float, "radius": int (optional)}
    """
    try:
        data = request.get_json()
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))
        radius = int(data.get('radius', 1000))
        
        # Fetch data
        tomtom = TomTomClient(current_app.config['TOMTOM_API_KEY'])
        pois = tomtom.fetch_pois(lat, lon, radius)
        current_speed, free_flow_speed, _ = tomtom.fetch_traffic_flow(lat, lon)
        
        # Calculate traffic ratio
        traffic_ratio = min(1.0, current_speed / free_flow_speed if (current_speed and free_flow_speed and free_flow_speed > 0) else 1.0)
        
        # Engineer features
        feature_engineer = FeatureEngineer(radius)
        features = feature_engineer.extract_features(pois, traffic_ratio)
        normalized_features = feature_engineer.normalize_features(features)
        
        response = {
            "location": {"lat": lat, "lon": lon, "radius": radius},
            "raw_features": features,
            "normalized_features": normalized_features,
            "feature_names": feature_engineer.get_feature_names()
        }
        
        return jsonify(response), 200
    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Error in get_features: {e}")
        return jsonify({"error": "Server error"}), 500

def _get_dominant_category(pois):
    """Extract dominant POI category."""
    categories = {}
    for poi in pois:
        poi_info = poi.get('poi', {})
        poi_categories = poi_info.get('categories', [])
        for category in poi_categories:
            cat_lower = category.lower().strip()
            categories[cat_lower] = categories.get(cat_lower, 0) + 1
    
    if not categories:
        return "unknown"
    
    return max(categories, key=categories.get)
