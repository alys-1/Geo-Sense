import math
from typing import Dict, List, Any, Tuple
from collections import Counter
import logging

logger = logging.getLogger(__name__)

class FeatureEngineer:
    """Engineer features from POI and traffic data for zone classification."""
    
    # Category mappings for zone classification
    OFFICE_KEYWORDS = ["office", "company", "bank", "financial", "business", "coworking", "tech", "startup"]
    RESIDENTIAL_KEYWORDS = ["residential", "house", "apartment", "home", "condo", "flat", "dwelling"]
    LEISURE_KEYWORDS = ["restaurant", "cafe", "bar", "hotel", "park", "museum", "cinema", "entertainment", "gym", "sports"]
    
    def __init__(self, radius_meters: int = 1000):
        self.radius = radius_meters
        self.area_km2 = math.pi * (radius_meters / 1000) ** 2

    def extract_features(self, pois: List[Dict[str, Any]], traffic_ratio: float) -> Dict[str, float]:
        """Extract all features from POI and traffic data."""
        features = {}
        
        # Count POIs by category
        poi_count = len(pois)
        categories = self._extract_poi_categories(pois)
        
        # Calculate category ratios
        features['poi_density'] = self._calculate_poi_density(poi_count)
        features['office_ratio'] = self._calculate_category_ratio(categories, self.OFFICE_KEYWORDS, poi_count)
        features['residential_ratio'] = self._calculate_category_ratio(categories, self.RESIDENTIAL_KEYWORDS, poi_count)
        features['leisure_ratio'] = self._calculate_category_ratio(categories, self.LEISURE_KEYWORDS, poi_count)
        
        # Traffic features
        features['traffic_ratio'] = traffic_ratio
        
        # Diversity index (Shannon entropy)
        features['diversity_index'] = self._calculate_diversity_index(categories, poi_count)
        
        # Total POIs
        features['total_pois'] = poi_count
        
        return features

    def _extract_poi_categories(self, pois: List[Dict[str, Any]]) -> Dict[str, int]:
        """Extract and count POI categories."""
        categories = {}
        
        for poi in pois:
            poi_info = poi.get("poi", {})
            poi_categories = poi_info.get("categories", [])
            
            for category in poi_categories:
                cat_lower = category.lower().strip()
                categories[cat_lower] = categories.get(cat_lower, 0) + 1
        
        return categories

    def _calculate_poi_density(self, poi_count: int) -> float:
        """Calculate POI density (POIs per km²)."""
        if self.area_km2 == 0:
            return 0.0
        return round(poi_count / self.area_km2, 2)

    def _calculate_category_ratio(self, categories: Dict[str, int], keywords: List[str], total_pois: int) -> float:
        """Calculate ratio of a category type to total POIs."""
        if total_pois == 0:
            return 0.0
        
        category_count = sum(
            count for category, count in categories.items()
            if any(kw in category.lower() for kw in keywords)
        )
        return round(category_count / total_pois, 3)

    def _calculate_diversity_index(self, categories: Dict[str, int], total_pois: int) -> float:
        """
        Calculate Shannon Diversity Index.
        Higher values indicate more diverse POI mix.
        """
        if total_pois == 0 or not categories:
            return 0.0
        
        diversity = 0.0
        for count in categories.values():
            if count > 0:
                proportion = count / total_pois
                diversity -= proportion * math.log(proportion)
        
        return round(diversity, 3)

    def normalize_features(self, features: Dict[str, float]) -> Dict[str, float]:
        """Normalize features to 0-1 range for consistent ML input."""
        normalized = {}
        
        # Define normalization bounds based on typical ranges
        bounds = {
            'poi_density': (0, 200),  # 0-200 POIs per km²
            'office_ratio': (0, 1),
            'residential_ratio': (0, 1),
            'leisure_ratio': (0, 1),
            'traffic_ratio': (0, 1),
            'diversity_index': (0, 3),  # Max Shannon entropy typically ~2-3
            'total_pois': (0, 500)
        }
        
        for key, value in features.items():
            if key in bounds:
                min_val, max_val = bounds[key]
                range_val = max_val - min_val
                if range_val == 0:
                    normalized[key] = 0.0
                else:
                    normalized[key] = round(max(0, min(1, (value - min_val) / range_val)), 3)
            else:
                normalized[key] = value
        
        return normalized

    def get_feature_names(self) -> List[str]:
        """Get list of feature names."""
        return [
            'poi_density',
            'office_ratio',
            'residential_ratio',
            'leisure_ratio',
            'traffic_ratio',
            'diversity_index',
            'total_pois'
        ]
