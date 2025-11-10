from flask import Blueprint, request, jsonify, current_app
import logging
from utils.tomtom_api import TomTomClient

data_bp = Blueprint('data', __name__)
logger = logging.getLogger(__name__)

@data_bp.route('/fetch_poi', methods=['POST'])
def fetch_poi():
    """
    Fetch POI data for a location.
    Request body: {"lat": float, "lon": float, "radius": int (optional)}
    """
    try:
        data = request.get_json()
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))
        radius = int(data.get('radius', 1000))
        
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            return jsonify({"error": "Invalid coordinates"}), 400
        
        tomtom = TomTomClient(current_app.config['TOMTOM_API_KEY'])
        pois = tomtom.fetch_pois(lat, lon, radius)
        
        return jsonify({
            "lat": lat,
            "lon": lon,
            "radius": radius,
            "count": len(pois),
            "pois": pois
        }), 200
    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Error in fetch_poi: {e}")
        return jsonify({"error": "Server error"}), 500

@data_bp.route('/fetch_traffic', methods=['POST'])
def fetch_traffic():
    """
    Fetch traffic flow data for a location.
    Request body: {"lat": float, "lon": float}
    """
    try:
        data = request.get_json()
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))
        
        if not (-90 <= lat <= 90 and -180 <= lon <= 180):
            return jsonify({"error": "Invalid coordinates"}), 400
        
        tomtom = TomTomClient(current_app.config['TOMTOM_API_KEY'])
        current_speed, free_flow_speed, confidence = tomtom.fetch_traffic_flow(lat, lon)
        
        if current_speed is None or free_flow_speed is None:
            traffic_ratio = 0.5  # Default neutral
        else:
            traffic_ratio = round(min(1.0, current_speed / free_flow_speed if free_flow_speed > 0 else 1.0), 2)
        
        return jsonify({
            "lat": lat,
            "lon": lon,
            "current_speed": current_speed,
            "free_flow_speed": free_flow_speed,
            "traffic_ratio": traffic_ratio,
            "confidence": confidence
        }), 200
    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Error in fetch_traffic: {e}")
        return jsonify({"error": "Server error"}), 500

@data_bp.route('/map_data', methods=['POST'])
def get_map_data():
    """
    Get map-ready GeoJSON data with POIs.
    Request body: {"lat": float, "lon": float, "radius": int (optional)}
    """
    try:
        data = request.get_json()
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))
        radius = int(data.get('radius', 1000))
        
        tomtom = TomTomClient(current_app.config['TOMTOM_API_KEY'])
        pois = tomtom.fetch_pois(lat, lon, radius)
        
        # Convert POIs to GeoJSON format
        features = []
        for poi in pois:
            position = poi.get('position', {})
            poi_info = poi.get('poi', {})
            
            feature = {
                "type": "Feature",
                "properties": {
                    "name": poi.get('address', {}).get('freeformAddress', 'Unknown'),
                    "type": ", ".join(poi_info.get('categories', [])),
                    "poi_id": poi.get('id')
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [position.get('lon', 0), position.get('lat', 0)]
                }
            }
            features.append(feature)
        
        # Create GeoJSON FeatureCollection
        geojson = {
            "type": "FeatureCollection",
            "features": features,
            "properties": {
                "center": [lon, lat],
                "radius": radius,
                "poi_count": len(features)
            }
        }
        
        return jsonify(geojson), 200
    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Error in get_map_data: {e}")
        return jsonify({"error": "Server error"}), 500
