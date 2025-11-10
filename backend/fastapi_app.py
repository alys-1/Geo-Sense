from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv
from datetime import datetime

from routes_fastapi.analysis import router as analysis_router
from routes_fastapi.data_fetching import router as data_router
from routes_fastapi.model_insights import router as insights_router

load_dotenv()

app = FastAPI(title="GeoSense ML Zone Classification Backend", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY", "X47KFIvPV5LB2FKHlVI7zIdaOU3GoUQ9")

# Attach config to app state
app.state.TOMTOM_API_KEY = TOMTOM_API_KEY


@app.get("/")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "GeoSense ML Zone Classification Backend",
    }


@app.get("/api/config")
def get_config():
    return {
        "api_key_configured": bool(TOMTOM_API_KEY),
        "default_radius": 1000,
        "default_city": "Pune",
        "features": [
            "poi_density",
            "office_ratio",
            "residential_ratio",
            "leisure_ratio",
            "traffic_ratio",
            "diversity_index",
        ],
    }


# Mount routers
app.include_router(data_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(insights_router, prefix="/api")


# Uvicorn entrypoint (optional)
def run():
    import uvicorn

    uvicorn.run("fastapi_app:app", host="127.0.0.1", port=8000, reload=True)


