import requests
import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

TOMTOM_BASE_URL = "https://api.tomtom.com"

class TomTomClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = TOMTOM_BASE_URL

    def fetch_pois(self, lat: float, lon: float, radius: int = 1000, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch Points of Interest near a location."""
        try:
            url = f"{self.base_url}/search/2/nearbySearch/.json"
            params = {
                "key": self.api_key,
                "lat": lat,
                "lon": lon,
                "radius": radius,
                "limit": limit
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            pois = data.get("results", [])
            
            logger.info(f"Fetched {len(pois)} POIs for location ({lat}, {lon})")
            return pois
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching POIs: {e}")
            return []

    def fetch_traffic_flow(self, lat: float, lon: float) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        """
        Fetch traffic flow data for a location.
        Returns: (current_speed, free_flow_speed, confidence)
        """
        try:
            url = f"{self.base_url}/traffic/services/4/flowSegmentData/absolute/10/json"
            params = {
                "key": self.api_key,
                "point": f"{lat},{lon}"
            }
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            flow_data = data.get("flowSegmentData", {})
            
            if not flow_data:
                return None, None, None
            
            current_speed = flow_data.get("currentSpeed")
            free_flow_speed = flow_data.get("freeFlowSpeed")
            confidence = flow_data.get("confidence")
            
            logger.info(f"Fetched traffic data for location ({lat}, {lon})")
            return current_speed, free_flow_speed, confidence
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching traffic flow: {e}")
            return None, None, None

    def fetch_poi_categories(self, lat: float, lon: float, radius: int = 1000) -> Dict[str, int]:
        """Fetch and count POI categories."""
        pois = self.fetch_pois(lat, lon, radius)
        categories = {}
        
        for poi in pois:
            poi_info = poi.get("poi", {})
            poi_categories = poi_info.get("categories", [])
            
            for category in poi_categories:
                cat_lower = category.lower().strip()
                categories[cat_lower] = categories.get(cat_lower, 0) + 1
        
        return categories
