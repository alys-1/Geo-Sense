import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  searchAreas,
  searchPOIs,
  getTrafficFlow,
  calculateRoute,
} from "./routes/tomtom";
import {
  mlHealth,
  mlConfig,
  analyzeZone,
  getFeatures,
  fetchPoi,
  fetchTraffic,
  mapData,
  modelInsights,
  featureImportance,
  clusteringMetrics,
  pcaVisualization,
  confusionMatrix,
  modelStatus,
} from "./routes/ml";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // TomTom API proxy routes
  app.get("/api/tomtom/search-areas", searchAreas);
  app.get("/api/tomtom/search-pois", searchPOIs);
  app.get("/api/tomtom/traffic-flow", getTrafficFlow);
  app.get("/api/tomtom/calculate-route", calculateRoute);

  // ML service proxy routes (FastAPI)
  app.get("/api/ml/health", mlHealth);
  app.get("/api/ml/config", mlConfig);
  app.post("/api/ml/analyze", analyzeZone);
  app.post("/api/ml/features", getFeatures);
  app.post("/api/ml/fetch-poi", fetchPoi);
  app.post("/api/ml/fetch-traffic", fetchTraffic);
  app.post("/api/ml/map-data", mapData);
  app.get("/api/ml/model-insights", modelInsights);
  app.get("/api/ml/feature-importance", featureImportance);
  app.get("/api/ml/clustering-metrics", clusteringMetrics);
  app.get("/api/ml/pca-visualization", pcaVisualization);
  app.get("/api/ml/confusion-matrix", confusionMatrix);
  app.get("/api/ml/status", modelStatus);

  return app;
}
