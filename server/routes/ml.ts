import { RequestHandler } from "express";
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

const forward = async (path: string, method: "get" | "post", payload?: any, params?: any) => {
  const url = `${ML_SERVICE_URL}${path}`;
  if (method === "post") {
    const resp = await axios.post(url, payload, { params, timeout: 20000 });
    return resp.data;
  }
  const resp = await axios.get(url, { params, timeout: 20000 });
  return resp.data;
};

export const mlHealth: RequestHandler = async (_req, res) => {
  try {
    const data = await forward("/health", "get");
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: "ML service unavailable", detail: e?.message });
  }
};

export const mlConfig: RequestHandler = async (_req, res) => {
  try {
    const data = await forward("/api/config", "get");
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: "ML service unavailable", detail: e?.message });
  }
};

export const analyzeZone: RequestHandler = async (req, res) => {
  try {
    const data = await forward("/api/analyze", "post", req.body);
    res.json(data);
  } catch (e: any) {
    const status = e?.response?.status || 502;
    res.status(status).json(e?.response?.data || { error: "Analyze failed" });
  }
};

export const getFeatures: RequestHandler = async (req, res) => {
  try {
    const data = await forward("/api/features", "post", req.body);
    res.json(data);
  } catch (e: any) {
    const status = e?.response?.status || 502;
    res.status(status).json(e?.response?.data || { error: "Features failed" });
  }
};

export const fetchPoi: RequestHandler = async (req, res) => {
  try {
    const data = await forward("/api/fetch_poi", "post", req.body);
    res.json(data);
  } catch (e: any) {
    const status = e?.response?.status || 502;
    res.status(status).json(e?.response?.data || { error: "POI fetch failed" });
  }
};

export const fetchTraffic: RequestHandler = async (req, res) => {
  try {
    const data = await forward("/api/fetch_traffic", "post", req.body);
    res.json(data);
  } catch (e: any) {
    const status = e?.response?.status || 502;
    res.status(status).json(e?.response?.data || { error: "Traffic fetch failed" });
  }
};

export const mapData: RequestHandler = async (req, res) => {
  try {
    const data = await forward("/api/map_data", "post", req.body);
    res.json(data);
  } catch (e: any) {
    const status = e?.response?.status || 502;
    res.status(status).json(e?.response?.data || { error: "Map data failed" });
  }
};

export const modelInsights: RequestHandler = async (_req, res) => {
  try {
    const data = await forward("/api/model_insights", "get");
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: "Insights failed" });
  }
};

export const featureImportance: RequestHandler = async (_req, res) => {
  try {
    const data = await forward("/api/feature_importance", "get");
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: "Feature importance failed" });
  }
};

export const clusteringMetrics: RequestHandler = async (_req, res) => {
  try {
    const data = await forward("/api/clustering_metrics", "get");
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: "Clustering metrics failed" });
  }
};

export const pcaVisualization: RequestHandler = async (_req, res) => {
  try {
    const data = await forward("/api/pca_visualization", "get");
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: "PCA visualization failed" });
  }
};

export const confusionMatrix: RequestHandler = async (_req, res) => {
  try {
    const data = await forward("/api/confusion_matrix", "get");
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: "Confusion matrix failed" });
  }
};

export const modelStatus: RequestHandler = async (_req, res) => {
  try {
    const data = await forward("/api/model_status", "get");
    res.json(data);
  } catch (e: any) {
    res.status(502).json({ error: "Model status failed" });
  }
};


