from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Any, Dict
import numpy as np

from utils.tomtom_api import TomTomClient
from utils.features import FeatureEngineer
from utils.ml_models import ZoneClassifier

router = APIRouter()

# Global classifier instance (lazy init)
_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = ZoneClassifier(n_clusters=3)
        _train_with_synthetic()
    return _classifier


def _train_with_synthetic():
    global _classifier
    np.random.seed(42)
    n_samples = 100
    synthetic_features = np.random.randn(n_samples, 7) * 0.3 + np.array(
        [50, 0.3, 0.4, 0.3, 0.6, 2.0, 100]
    )
    fe = FeatureEngineer()
    _classifier.train(synthetic_features, fe.get_feature_names())


class AnalyzePayload(BaseModel):
    lat: float
    lon: float
    radius: int = 1000


@router.post("/analyze")
def analyze(payload: AnalyzePayload, request: Request):
    lat, lon, radius = payload.lat, payload.lon, payload.radius
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    api_key = request.app.state.TOMTOM_API_KEY
    tomtom = TomTomClient(api_key)
    pois = tomtom.fetch_pois(lat, lon, radius)
    current_speed, free_flow_speed, confidence = tomtom.fetch_traffic_flow(lat, lon)

    if current_speed and free_flow_speed and free_flow_speed > 0:
        traffic_ratio = min(1.0, current_speed / free_flow_speed)
    else:
        traffic_ratio = 0.5

    fe = FeatureEngineer(radius)
    features = fe.extract_features(pois, traffic_ratio)
    classifier = _get_classifier()
    prediction = classifier.predict(features)
    feature_importance = classifier.get_feature_importance()

    def _dominant_category(pois_list):
        categories = {}
        for poi in pois_list:
            poi_info = poi.get("poi", {})
            poi_categories = poi_info.get("categories", [])
            for c in poi_categories:
                k = c.lower().strip()
                categories[k] = categories.get(k, 0) + 1
        if not categories:
            return "unknown"
        return max(categories, key=categories.get)

    return {
        "location": {"lat": lat, "lon": lon, "radius": radius},
        "zone_classification": {
            "zone_type": prediction["zone_type"],
            "zone_color": prediction["zone_color"],
            "confidence": prediction["confidence"],
            "probabilities": prediction["probabilities"],
        },
        "features": {
            "values": features,
            "poi_count": int(features.get("total_pois", 0)),
            "dominant_category": _dominant_category(pois),
        },
        "traffic": {
            "current_speed": current_speed,
            "free_flow_speed": free_flow_speed,
            "traffic_ratio": float(traffic_ratio),
            "confidence": confidence,
        },
        "model_insights": {
            "feature_importance": feature_importance,
            "kmeans_cluster": prediction["kmeans_cluster"],
            "kmeans_distance": prediction["kmeans_distance"],
            "pca_coordinates": prediction["pca_coordinates"],
        },
    }


