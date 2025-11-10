from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Any, Dict

from utils.tomtom_api import TomTomClient

router = APIRouter()


class LocationPayload(BaseModel):
    lat: float
    lon: float
    radius: int = 1000


@router.post("/fetch_poi")
def fetch_poi(payload: LocationPayload, request: Request):
    lat, lon, radius = payload.lat, payload.lon, payload.radius
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    api_key = request.app.state.TOMTOM_API_KEY
    tomtom = TomTomClient(api_key)
    pois = tomtom.fetch_pois(lat, lon, radius)

    return {
        "lat": lat,
        "lon": lon,
        "radius": radius,
        "count": len(pois),
        "pois": pois,
    }


class TrafficPayload(BaseModel):
    lat: float
    lon: float


@router.post("/fetch_traffic")
def fetch_traffic(payload: TrafficPayload, request: Request):
    lat, lon = payload.lat, payload.lon
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    api_key = request.app.state.TOMTOM_API_KEY
    tomtom = TomTomClient(api_key)
    current_speed, free_flow_speed, confidence = tomtom.fetch_traffic_flow(lat, lon)

    if current_speed is None or free_flow_speed is None:
        traffic_ratio = 0.5
    else:
        traffic_ratio = round(
            min(1.0, current_speed / free_flow_speed if free_flow_speed > 0 else 1.0), 2
        )

    return {
        "lat": lat,
        "lon": lon,
        "current_speed": current_speed,
        "free_flow_speed": free_flow_speed,
        "traffic_ratio": traffic_ratio,
        "confidence": confidence,
    }


@router.post("/map_data")
def map_data(payload: LocationPayload, request: Request):
    lat, lon, radius = payload.lat, payload.lon, payload.radius

    api_key = request.app.state.TOMTOM_API_KEY
    tomtom = TomTomClient(api_key)
    pois = tomtom.fetch_pois(lat, lon, radius)

    features = []
    for poi in pois:
        position = poi.get("position", {})
        poi_info = poi.get("poi", {})
        feature = {
            "type": "Feature",
            "properties": {
                "name": poi.get("address", {}).get("freeformAddress", "Unknown"),
                "type": ", ".join(poi_info.get("categories", [])),
                "poi_id": poi.get("id"),
            },
            "geometry": {
                "type": "Point",
                "coordinates": [position.get("lon", 0), position.get("lat", 0)],
            },
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features,
        "properties": {"center": [lon, lat], "radius": radius, "poi_count": len(features)},
    }


