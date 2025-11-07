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

  return app;
}
